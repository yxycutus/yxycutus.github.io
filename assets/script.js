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

  // 2. Gentle scroll-reveal for homepage sections (skipped for reduced motion).
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll('.home-section, .explore-strip, .campus-banner, .contact-band');
    if (revealTargets.length) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
      revealTargets.forEach(el => { el.classList.add('reveal'); io.observe(el); });
    }
  }

  // 3. Active Nav Link Detection
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
