/* ============================================================
   7DS ORIGIN - SUPABASE CLIENT MODULE
   Handles all Supabase operations: Auth, CRUD, Storage, Realtime
   
   Dependencies:
   - supabase-config.js (must be loaded first)
   - Supabase JS CDN (loaded via script tag)
   ============================================================ */

var SupaDB = (function () {
  var _client = null;
  var _cache = null;
  var _realtimeChannel = null;

  // ---- Initialize ----
  function init() {
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.warn('[SupaDB] Supabase not configured. Falling back to local JSON.');
      return false;
    }
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('[SupaDB] Supabase JS library not loaded.');
      return false;
    }
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }

  function getClient() {
    return _client;
  }

  function isConnected() {
    return _client !== null;
  }

  // ============================================================
  // AUTH - Login / Logout / Session
  // ============================================================

  async function login(email, password) {
    if (!_client) return { error: { message: 'Supabase not connected' } };
    var result = await _client.auth.signInWithPassword({
      email: email,
      password: password
    });
    return result;
  }

  async function logout() {
    if (!_client) return;
    await _client.auth.signOut();
  }

  async function getSession() {
    if (!_client) return null;
    var result = await _client.auth.getSession();
    return result.data.session;
  }

  async function isLoggedIn() {
    var session = await getSession();
    return session !== null;
  }

  function onAuthChange(callback) {
    if (!_client) return;
    _client.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
  }

  // ============================================================
  // CRUD - Characters
  // ============================================================

  // Fetch all characters (sorted by name)
  async function fetchAll() {
    if (!_client) return [];
    var result = await _client
      .from('characters')
      .select('*')
      .order('name', { ascending: true });

    if (result.error) {
      console.error('[SupaDB] fetchAll error:', result.error);
      return [];
    }
    _cache = result.data;
    return result.data;
  }

  // Fetch single character by slug
  async function fetchBySlug(slug) {
    if (!_client) return null;
    var result = await _client
      .from('characters')
      .select('*')
      .eq('slug', slug)
      .single();

    if (result.error) {
      console.error('[SupaDB] fetchBySlug error:', result.error);
      return null;
    }
    return result.data;
  }

  // Fetch single character by id
  async function fetchById(id) {
    if (!_client) return null;
    var result = await _client
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) {
      console.error('[SupaDB] fetchById error:', result.error);
      return null;
    }
    return result.data;
  }

  // Fetch characters grouped by tier
  async function fetchByTier() {
    var all = await fetchAll();
    var grouped = { S: [], A: [], B: [], C: [] };
    all.forEach(function (c) {
      var t = c.tier || 'B';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(c);
    });
    return grouped;
  }

  // Insert a new character
  async function insertCharacter(charData) {
    if (!_client) return { error: { message: 'Not connected' } };

    // Generate slug from name
    if (!charData.slug) {
      charData.slug = charData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    var result = await _client
      .from('characters')
      .insert([charData])
      .select()
      .single();

    if (result.error) {
      console.error('[SupaDB] insert error:', result.error);
    }
    return result;
  }

  // Update an existing character
  async function updateCharacter(id, updates) {
    if (!_client) return { error: { message: 'Not connected' } };

    var result = await _client
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('[SupaDB] update error:', result.error);
    }
    return result;
  }

  // Upsert - insert or update based on slug
  async function upsertCharacter(charData) {
    if (!_client) return { error: { message: 'Not connected' } };

    if (!charData.slug) {
      charData.slug = charData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    var result = await _client
      .from('characters')
      .upsert([charData], { onConflict: 'slug' })
      .select()
      .single();

    if (result.error) {
      console.error('[SupaDB] upsert error:', result.error);
    }
    return result;
  }

  // Delete a character
  async function deleteCharacter(id) {
    if (!_client) return { error: { message: 'Not connected' } };

    var result = await _client
      .from('characters')
      .delete()
      .eq('id', id);

    if (result.error) {
      console.error('[SupaDB] delete error:', result.error);
    }
    return result;
  }

  // ============================================================
  // STORAGE - Image Upload
  // ============================================================

  // Upload image to Supabase Storage
  async function uploadImage(file, characterSlug) {
    if (!_client) return { error: { message: 'Not connected' } };

    // Create a unique file name
    var ext = file.name.split('.').pop() || 'png';
    var fileName = characterSlug + '.' + ext;
    var filePath = 'characters/' + fileName;

    // Upload file (upsert to overwrite existing)
    var result = await _client.storage
      .from('character-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (result.error) {
      console.error('[SupaDB] upload error:', result.error);
      return { error: result.error, url: null };
    }

    // Get public URL
    var urlResult = _client.storage
      .from('character-images')
      .getPublicUrl(filePath);

    return { error: null, url: urlResult.data.publicUrl };
  }

  // Delete image from Supabase Storage
  async function deleteImage(filePath) {
    if (!_client) return;
    await _client.storage
      .from('character-images')
      .remove([filePath]);
  }

  // ============================================================
  // REALTIME - Subscribe to changes
  // ============================================================

  function subscribeToChanges(callback) {
    if (!_client) return;

    // Unsubscribe from previous channel if exists
    if (_realtimeChannel) {
      _client.removeChannel(_realtimeChannel);
    }

    _realtimeChannel = _client
      .channel('characters-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'characters' },
        function (payload) {
          console.log('[SupaDB] Realtime event:', payload.eventType);
          callback(payload);
        }
      )
      .subscribe();
  }

  function unsubscribe() {
    if (_client && _realtimeChannel) {
      _client.removeChannel(_realtimeChannel);
      _realtimeChannel = null;
    }
  }

  // ============================================================
  // UTILITY - Migration helper
  // ============================================================

  // Bulk import characters from JSON array
  async function bulkImport(characters) {
    if (!_client) return { error: { message: 'Not connected' } };

    // Prepare data with slugs
    var prepared = characters.map(function (c) {
      return {
        name: c.name || '',
        slug: (c.id || c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        rarity: c.rarity || 'SSR',
        description: c.description || '',
        image: c.image || '',
        types: c.types || [],
        skills: c.skills || {},
        potentials: c.potentials || {},
        costumes: c.costumes || [],
        tier: c.tier || 'B'
      };
    });

    var result = await _client
      .from('characters')
      .upsert(prepared, { onConflict: 'slug' })
      .select();

    if (result.error) {
      console.error('[SupaDB] bulkImport error:', result.error);
    }
    return result;
  }

  // Export all data as JSON
  async function exportJSON() {
    var all = await fetchAll();
    var blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'characters_supabase.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // CACHE - Quick access to last fetched data
  // ============================================================

  function getCached() {
    return _cache || [];
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    // Init
    init: init,
    getClient: getClient,
    isConnected: isConnected,

    // Auth
    login: login,
    logout: logout,
    getSession: getSession,
    isLoggedIn: isLoggedIn,
    onAuthChange: onAuthChange,

    // CRUD
    fetchAll: fetchAll,
    fetchBySlug: fetchBySlug,
    fetchById: fetchById,
    fetchByTier: fetchByTier,
    insertCharacter: insertCharacter,
    updateCharacter: updateCharacter,
    upsertCharacter: upsertCharacter,
    deleteCharacter: deleteCharacter,

    // Storage
    uploadImage: uploadImage,
    deleteImage: deleteImage,

    // Realtime
    subscribeToChanges: subscribeToChanges,
    unsubscribe: unsubscribe,

    // Utility
    bulkImport: bulkImport,
    exportJSON: exportJSON,
    getCached: getCached
  };
})();
