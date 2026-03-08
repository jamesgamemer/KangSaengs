/* ============================================================
   Navbar - Hamburger toggle + Active link + Login/Admin button
   ============================================================ */
function initNavbar() {
  /* Prevent double init */
  if (window._navbarInitDone) return;
  window._navbarInitDone = true;

  /* Hamburger toggle */
  var ham = document.getElementById('navHam');
  var links = document.getElementById('navLinks');
  if (ham && links) {
    ham.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  /* Highlight active link */
  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href) {
      var page = href.split('/').pop();
      if (page === current) a.classList.add('active');
    }
  });

  /* Inject Login / Admin button into navbar */
  var navLinks = document.getElementById('navLinks');
  if (navLinks && !navLinks.querySelector('.nav-auth-item')) {
    var li = document.createElement('li');
    li.className = 'nav-auth-item';

    var isAdmin = (typeof Auth !== 'undefined') && Auth.isLoggedIn();

    if (isAdmin) {
      li.innerHTML =
        '<div class="nav-auth-group">' +
          '<a href="admin.html" class="nav-admin-btn" title="Admin Dashboard">' +
            '<span class="nav-admin-icon">\u2699</span> Admin' +
          '</a>' +
          '<button class="nav-logout-btn" title="Logout" id="navLogoutBtn">' +
            '\u2715' +
          '</button>' +
        '</div>';
    } else {
      li.innerHTML =
        '<a href="login.html" class="nav-login-btn" title="Admin Login">' +
          '<span class="nav-login-icon">\uD83D\uDD12</span> Login' +
        '</a>';
    }

    navLinks.appendChild(li);

    var logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (typeof Auth !== 'undefined') Auth.logout();
        window.location.reload();
      });
    }
  }
}

/* Run immediately if DOM is ready, otherwise wait */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavbar);
} else {
  initNavbar();
}
