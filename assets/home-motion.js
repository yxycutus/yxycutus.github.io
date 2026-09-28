// A small reversible wordmark change and one-time entrance cues for the homepage.
(() => {
  'use strict';
  const home = document.querySelector('[data-home-motion]');
  if (!home) return;
  const masthead = home.querySelector('.journal-masthead');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...home.querySelectorAll('.explore-strip > a, .home-section-head, .work-card, .notebook-intro, .notebook-list > a, .paper-preview-head, .paper-preview, .life-heading, .life-photo, .life-postscript, .learning-disclosure, .recent-note, .ai-card, .contact-band, .friend-card')];
  let frame = 0;
  let growObserver;

  function draw() {
    frame = 0;
    const progress = reduce.matches ? 0 : Math.min(1, Math.max(0, (scrollY - 40) / 280));
    masthead.style.setProperty('--brand-progress', progress.toFixed(4));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function configureMotion() {
    growObserver?.disconnect();
    home.classList.toggle('motion-enabled', !reduce.matches);
    targets.forEach(el => { el.classList.remove('grow-item'); el.style.removeProperty('--grow-delay'); });
    if (!reduce.matches && 'IntersectionObserver' in window) {
      growObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('has-grown');
            growObserver.unobserve(entry.target);
          }
        });
      }, {threshold: 0, rootMargin: '0px 0px -40px 0px'});
      targets.forEach(el => {
        const bounds = el.getBoundingClientRect();
        if ((bounds.top < innerHeight && bounds.bottom > 0) || bounds.bottom <= 0) el.classList.add('has-grown');
        el.classList.add('grow-item');
        const siblings = [...el.parentElement.children].filter(node => targets.includes(node));
        el.style.setProperty('--grow-delay', `${Math.min(siblings.indexOf(el), 3) * 75}ms`);
        growObserver.observe(el);
      });
    }
    schedule();
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', schedule);
  addEventListener('hashchange', () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) {
      target.closest('.grow-item')?.classList.add('has-grown');
      target.querySelectorAll('.grow-item').forEach(el => el.classList.add('has-grown'));
    }
    schedule();
  });
  reduce.addEventListener('change', configureMotion);
  configureMotion();
})();
