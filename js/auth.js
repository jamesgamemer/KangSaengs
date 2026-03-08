/* ============================================================
   7DS ORIGIN - AUTH MODULE
   Supports both Supabase Auth and local localStorage auth.
   Supabase is used when configured; otherwise falls back to local.
   ============================================================ */

var Auth = (function () {
  var STORAGE_KEY = '7ds_admin_session';
  var CRED_KEY = '7ds_admin_credentials';

  // ---- Local Auth (fallback) ----
  function getCredentials() {
    var stored = localStorage.getItem(CRED_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* fall through */ }
    }
    return { username: 'admin', password: 'admin7ds' };
  }

  function setCredentials(username, password) {
    localStorage.setItem(CRED_KEY, JSON.stringify({ username: username, password: password }));
  }

  function login(username, password) {
    var creds = getCredentials();
    if (username === creds.username && password === creds.password) {
      var session = {
        loggedIn: true,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    // Also logout from Supabase if connected
    if (typeof SupaDB !== 'undefined' && SupaDB.isConnected()) {
      SupaDB.logout();
    }
  }

  function isLoggedIn() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    try {
      var session = JSON.parse(stored);
      if (session.loggedIn && session.expires > Date.now()) {
        return true;
      }
      logout();
      return false;
    } catch (e) {
      return false;
    }
  }

  // ---- Combined check (Supabase + local) ----
  async function isAdminAsync() {
    // Check Supabase first
    if (typeof SupaDB !== 'undefined' && SupaDB.isConnected()) {
      var supaAdmin = await SupaDB.isLoggedIn();
      if (supaAdmin) return true;
    }
    // Fallback to local
    return isLoggedIn();
  }

  function requireAdmin(redirectUrl) {
    if (!isLoggedIn()) {
      window.location.href = redirectUrl || 'login.html';
      return false;
    }
    return true;
  }

  async function requireAdminAsync(redirectUrl) {
    var admin = await isAdminAsync();
    if (!admin) {
      window.location.href = redirectUrl || 'login.html';
      return false;
    }
    return true;
  }

  function updateAdminUI() {
    var adminBar = document.getElementById('adminBar');
    var adminOnlyEls = document.querySelectorAll('.admin-only');
    var admin = isLoggedIn();

    if (adminBar) {
      adminBar.style.display = admin ? 'flex' : 'none';
    }
    adminOnlyEls.forEach(function (el) {
      el.style.display = admin ? '' : 'none';
    });

    var pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.style.paddingTop = admin ? '104px' : '64px';
    }
  }

  // Async version that checks Supabase too
  async function updateAdminUIAsync() {
    var admin = await isAdminAsync();
    var adminBar = document.getElementById('adminBar');
    var adminOnlyEls = document.querySelectorAll('.admin-only');

    if (adminBar) {
      adminBar.style.display = admin ? 'flex' : 'none';
    }
    adminOnlyEls.forEach(function (el) {
      el.style.display = admin ? '' : 'none';
    });

    var pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.style.paddingTop = admin ? '104px' : '64px';
    }
    return admin;
  }

  return {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    isAdminAsync: isAdminAsync,
    requireAdmin: requireAdmin,
    requireAdminAsync: requireAdminAsync,
    updateAdminUI: updateAdminUI,
    updateAdminUIAsync: updateAdminUIAsync,
    getCredentials: getCredentials,
    setCredentials: setCredentials
  };
})();
