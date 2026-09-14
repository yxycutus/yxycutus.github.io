// Cutus's Home — Engineering Theme Engine & Interactions
(function () {
  'use strict';

  // A homepage deep link opens the learning panel before scrolling to it.
  const learningPanel = document.querySelector('details#progress-tracker');
  function revealLearningPanel() {
    if (learningPanel && location.hash === '#progress-tracker') {
      learningPanel.open = true;
      learningPanel.scrollIntoView();
    }
  }
  window.addEventListener('hashchange', revealLearningPanel);
  document.querySelectorAll('a[href="#progress-tracker"]').forEach(link => {
    link.addEventListener('click', () => { if (learningPanel) learningPanel.open = true; });
  });
  revealLearningPanel();

  // 2. Active Nav Link Detection
  const path = window.location.pathname;
  document.querySelectorAll('.nav-menu a, .nav-links a').forEach(a => {
    a.classList.remove('active');
    a.removeAttribute('aria-current');
    const href = a.getAttribute('href');
    if (!href) return;
    if (new URL(href, location.href).pathname === path) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    const segment = href.match(/(about|knowledge|timeline)/);
    if (segment && path.includes('/' + segment[1])) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

})();
