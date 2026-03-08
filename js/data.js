/* ============================================================
   7DS ORIGIN - DATA MODULE
   Character data management using localStorage + JSON
   ============================================================ */

var CharDB = (function () {
  var STORAGE_KEY = '7ds_characters_data';
  var JSON_URL = 'data/characters.json';
  var _cache = null;

  // Load characters: localStorage first, then fallback to JSON file
  function loadAll(callback) {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        _cache = JSON.parse(stored);
        callback(_cache);
        return;
      } catch (e) { /* fall through to fetch */ }
    }
    // Fetch from JSON file
    fetch(JSON_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _cache = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        callback(data);
      })
      .catch(function (err) {
        console.error('Failed to load characters:', err);
        _cache = [];
        callback([]);
      });
  }

  function saveAll(data) {
    _cache = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getAll() {
    return _cache || [];
  }

  function getById(id) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function getByName(name) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].name === name) return all[i];
    }
    return null;
  }

  function add(character) {
    var all = getAll();
    character.id = character.name.toLowerCase().replace(/\s+/g, '-');
    if (!character.image) {
      character.image = 'images/' + character.name + '.png';
    }
    all.push(character);
    saveAll(all);
    return character;
  }

  function update(id, updates) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        for (var key in updates) {
          if (updates.hasOwnProperty(key)) {
            all[i][key] = updates[key];
          }
        }
        saveAll(all);
        return all[i];
      }
    }
    return null;
  }

  function remove(id) {
    var all = getAll();
    var filtered = all.filter(function (c) { return c.id !== id; });
    if (filtered.length < all.length) {
      saveAll(filtered);
      return true;
    }
    return false;
  }

  // Export all data as downloadable JSON
  function exportJSON() {
    var all = getAll();
    var blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'characters.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import JSON data
  function importJSON(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          saveAll(data);
          _cache = data;
          callback(true, data.length + ' characters imported');
        } else {
          callback(false, 'Invalid format: expected array');
        }
      } catch (err) {
        callback(false, 'Invalid JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Reset to original JSON file
  function resetToDefault(callback) {
    localStorage.removeItem(STORAGE_KEY);
    _cache = null;
    fetch(JSON_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _cache = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        callback(true);
      })
      .catch(function () {
        callback(false);
      });
  }

  // Get all unique weapon types across all characters
  function getAllWeaponTypes() {
    var all = getAll();
    var types = {};
    all.forEach(function (c) {
      (c.types || []).forEach(function (t) { types[t] = true; });
    });
    return Object.keys(types).sort();
  }

  return {
    loadAll: loadAll,
    getAll: getAll,
    getById: getById,
    getByName: getByName,
    add: add,
    update: update,
    remove: remove,
    exportJSON: exportJSON,
    importJSON: importJSON,
    resetToDefault: resetToDefault,
    getAllWeaponTypes: getAllWeaponTypes
  };
})();
