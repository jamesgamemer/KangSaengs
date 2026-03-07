/* Navbar hamburger toggle */
(function () {
  const ham = document.getElementById('navHam');
  const links = document.getElementById('navLinks');
  if (ham && links) {
    ham.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  /* Highlight active link */
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(function (a) {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('active');
  });
})();
