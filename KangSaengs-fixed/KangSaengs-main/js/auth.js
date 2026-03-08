/* ============================================================
   7DS ORIGIN - AUTH MODULE
   Refactored to use SupaDB exclusively.
   ============================================================ */

var Auth = (function () {
  
  async function login(email, password) {
    const result = await SupaDB.login(email, password);
    if (!result.error) {
      console.log("[Auth] Login successful, redirecting to admin.html");
      window.location.href = 'admin.html';
      return true;
    } else {
      console.error("[Auth] Login failure reason:", result.error.message);
      return result; // Return error for display
    }
  }

  async function logout() {
    await SupaDB.logout();
    window.location.href = 'login.html';
  }

  async function isLoggedIn() {
    return await SupaDB.isLoggedIn();
  }

  async function requireAdmin(redirectUrl = 'login.html') {
    const admin = await isLoggedIn();
    if (!admin) {
      console.warn("[Auth] Admin access required, redirecting to:", redirectUrl);
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  async function updateAdminUI() {
    const admin = await isLoggedIn();
    const adminBar = document.getElementById('adminBar');
    const adminOnlyEls = document.querySelectorAll('.admin-only');

    if (adminBar) {
      adminBar.style.display = admin ? 'flex' : 'none';
    }
    adminOnlyEls.forEach(function (el) {
      el.style.display = admin ? '' : 'none';
    });

    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.style.paddingTop = admin ? '104px' : '64px';
    }
    return admin;
  }

  return {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    requireAdmin: requireAdmin,
    updateAdminUI: updateAdminUI
  };
})();

// Ensure Supabase initializes when the page loads
document.addEventListener("DOMContentLoaded", () => {
  SupaDB.init();
});
