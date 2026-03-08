/* ============================================================
   7DS ORIGIN - AUTH MODULE
   Simple admin authentication using localStorage
   ============================================================ */

var Auth = (function () {
  var STORAGE_KEY = '7ds_admin_session';
  // Default admin credentials (can be changed via admin panel)
  var CRED_KEY = '7ds_admin_credentials';

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
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
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

  function requireAdmin(redirectUrl) {
    if (!isLoggedIn()) {
      window.location.href = redirectUrl || 'login.html';
      return false;
    }
    return true;
  }

  // Update admin bar visibility on any page
  function updateAdminUI() {
    var adminBar = document.getElementById('adminBar');
    var adminOnlyEls = document.querySelectorAll('.admin-only');
    var isAdmin = isLoggedIn();

    if (adminBar) {
      adminBar.style.display = isAdmin ? 'flex' : 'none';
    }
    adminOnlyEls.forEach(function (el) {
      el.style.display = isAdmin ? '' : 'none';
    });

    // Adjust page content padding when admin bar is visible
    var pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.style.paddingTop = isAdmin ? '104px' : '64px';
    }
  }

  return {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    requireAdmin: requireAdmin,
    updateAdminUI: updateAdminUI,
    getCredentials: getCredentials,
    setCredentials: setCredentials
  };
})();
