// Scroll-linked editorial motion. No scroll interception; layout stays in normal flow.
(() => {
  'use strict';
  const home = document.querySelector('[data-home-motion]');
  if (!home) return;
  const film = home.querySelector('.motion-film');
  const masthead = home.querySelector('.journal-masthead');
  const video = home.querySelector('#field-film');
  const toggle = home.querySelector('.film-toggle');
  const status = home.querySelector('.film-status');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1, Math.max(0, n));
  let frame = 0;
  let inView = false;
  let userPaused = false;
  let manualPlay = false;
  let failed = false;
  let pendingPlay = false;
  let loadWatch = 0;
  let growObserver;
  const saveData = navigator.connection?.saveData;
  const targets = [...home.querySelectorAll('.explore-strip > a, .home-section-head, .work-card, .notebook-intro, .notebook-list > a, .paper-preview-head, .paper-preview, .life-heading, .life-photo, .life-postscript, .learning-disclosure, .recent-note, .ai-card, .contact-band, .friend-card')];

  function draw() {
    frame = 0;
    const height = innerHeight;
    const rect = film.getBoundingClientRect();
    const progress = clamp((height * .82 - rect.top) / (height * .82 + film.offsetHeight - height));
    // A direct, reversible mapping keeps the video tied to the user's own scroll.
    masthead.style.setProperty('--brand-progress', reduce.matches ? '0' : clamp((scrollY - 40) / 280).toFixed(4));
    film.style.setProperty('--film-scale', (.84 + progress * .16).toFixed(4));
    film.style.setProperty('--film-radius', `${28 - progress * 24}px`);
    film.style.setProperty('--film-copy-y', `${(1 - progress) * 20}px`);
    film.style.setProperty('--film-note-opacity', (.45 + progress * .55).toFixed(3));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function shouldPlay() {
    return inView && !document.hidden && !userPaused && !failed && (manualPlay || (!reduce.matches && !saveData));
  }
  function watchLoad(start = performance.now()) {
    clearTimeout(loadWatch);
    if (failed || video.readyState >= 2) return;
    // Chromium can leave play() pending with NETWORK_NO_SOURCE and no error event.
    if (video.networkState === video.NETWORK_NO_SOURCE || performance.now() - start > 15000) {
      onVideoError();
      return;
    }
    loadWatch = setTimeout(() => watchLoad(start), 750);
  }
  function syncPlayback() {
    if (!shouldPlay()) { video.pause(); return; }
    if (!video.paused || pendingPlay) return;
    pendingPlay = true;
    loadWatch = setTimeout(() => watchLoad(), 750);
    video.play().then(() => {
      pendingPlay = false;
      if (!shouldPlay()) video.pause();
    }).catch(() => {
      pendingPlay = false;
      clearTimeout(loadWatch);
      toggle.textContent = '播放影像';
      status.textContent = failed ? '影像暂不可用 · 可进入项目页' : '点击播放 · 静音';
    });
  }
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
        // Anchor navigation and history restoration must never land on hidden text.
        if (bounds.top < innerHeight && bounds.bottom > 0 || bounds.bottom <= 0) el.classList.add('has-grown');
        el.classList.add('grow-item');
        const siblings = [...el.parentElement.children].filter(node => targets.includes(node));
        el.style.setProperty('--grow-delay', `${Math.min(siblings.indexOf(el), 3) * 85}ms`);
        growObserver.observe(el);
      });
    }
    if (reduce.matches) manualPlay = false;
    syncPlayback();
    schedule();
  }
  if ('IntersectionObserver' in window) {
    video.controls = false;
    toggle.hidden = false;
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, {threshold: .12}).observe(video);
  }
  toggle.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      manualPlay = true;
      syncPlayback();
    } else {
      userPaused = true;
      manualPlay = false;
      video.pause();
    }
  });
  video.addEventListener('loadstart', () => { clearTimeout(loadWatch); if (!failed) loadWatch = setTimeout(() => watchLoad(), 750); });
  video.addEventListener('play', () => { if (failed) return; toggle.textContent = '暂停影像'; status.textContent = '正在加载影像…'; });
  video.addEventListener('playing', () => { if (failed) return; clearTimeout(loadWatch); status.textContent = '静音循环 · 真机演示'; });
  video.addEventListener('pause', () => { if (failed) return; toggle.textContent = '播放影像'; status.textContent = '已暂停 · 真机演示'; });
  function onVideoError() {
    if (failed) return;
    failed = true;
    pendingPlay = false;
    clearTimeout(loadWatch);
    video.pause();
    toggle.hidden = true;
    video.controls = true;
    status.textContent = '影像暂不可用 · 可进入项目页';
  }
  video.addEventListener('error', onVideoError);
  video.querySelector('source')?.addEventListener('error', onVideoError);
  document.addEventListener('visibilitychange', syncPlayback);
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', schedule);
  addEventListener('cutus:preferences', schedule);
  addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) {
      target.closest('.grow-item')?.classList.add('has-grown');
      target.querySelectorAll('.grow-item').forEach(el => el.classList.add('has-grown'));
    }
    schedule();
  });
  reduce.addEventListener('change', configureMotion);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(home.querySelector('main'));
  configureMotion();
})();
