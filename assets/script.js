// Cutus's Home — Engineering Theme Engine & Interactions
(function () {
  'use strict';

  const root = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');

  // 1. Initial Theme Setup (USTC Blue Dark/Light)
  function getPreferredTheme() {
    let saved;
    try { saved = localStorage.getItem('cutus-theme'); } catch (_) {}
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    if (!toggleBtn) return;
    if (theme === 'dark') {
      // Sun icon
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
      toggleBtn.setAttribute('title', '切换至科大白/浅色模式');
      toggleBtn.setAttribute('aria-label', '切换至浅色模式');
    } else {
      // Moon icon
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
      toggleBtn.setAttribute('title', '切换至深邃夜间模式');
      toggleBtn.setAttribute('aria-label', '切换至深色模式');
    }
  }

  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const nowTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = nowTheme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('cutus-theme', nextTheme); } catch (_) {}
      applyTheme(nextTheme);
    });
  }

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

  // ============================================================
  // 3. Progress Tracker — Draggable Learning Roadmap
  //    Built by Cutus & Opus 4.6
  // ============================================================
  const STORAGE_KEY = 'cutus-cf-progress';
  const PHASE_COUNT = 10; // Phase 0–9

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  }

  function saveProgress(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function updateOverall(data) {
    const fill = document.getElementById('overall-fill');
    const pctEl = document.getElementById('overall-pct');
    if (!fill || !pctEl) return;

    let sum = 0;
    for (let i = 0; i < PHASE_COUNT; i++) {
      sum += (data[i] || 0);
    }
    const avg = Math.round(sum / PHASE_COUNT);
    fill.style.width = avg + '%';
    pctEl.textContent = avg + '%';
  }

  function updatePhaseCard(phaseEl, val) {
    const pctLabel = phaseEl.querySelector('.phase-pct');
    if (pctLabel) pctLabel.textContent = val + '%';

    phaseEl.classList.remove('phase-done', 'phase-active');
    if (val >= 100) {
      phaseEl.classList.add('phase-done');
    } else if (val > 0) {
      phaseEl.classList.add('phase-active');
    }
  }

  function updateSliderTrack(slider) {
    slider.style.setProperty('--val', slider.value + '%');
  }

  // Initialize progress tracker if present on page
  const progressContainer = document.getElementById('progress-phases');
  if (progressContainer) {
    const data = loadProgress();
    const sliders = progressContainer.querySelectorAll('.phase-slider');

    sliders.forEach(slider => {
      const phaseIdx = slider.getAttribute('data-phase');
      const savedVal = data[phaseIdx] || 0;
      slider.value = savedVal;
      updateSliderTrack(slider);

      const phaseEl = slider.closest('.progress-phase');
      if (phaseEl) updatePhaseCard(phaseEl, savedVal);

      // Real-time drag feedback
      slider.addEventListener('input', () => {
        const val = parseInt(slider.value, 10);
        data[phaseIdx] = val;
        updateSliderTrack(slider);
        if (phaseEl) updatePhaseCard(phaseEl, val);
        updateOverall(data);
      });

      // Persist on release
      slider.addEventListener('change', () => {
        data[phaseIdx] = parseInt(slider.value, 10);
        saveProgress(data);
      });
    });

    updateOverall(data);

    // Reset button
    const resetBtn = document.getElementById('progress-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('确认要重置所有阶段进度为 0% 吗？')) return;
        for (let i = 0; i < PHASE_COUNT; i++) {
          data[i] = 0;
        }
        saveProgress(data);
        sliders.forEach(slider => {
          slider.value = 0;
          updateSliderTrack(slider);
          const phaseEl = slider.closest('.progress-phase');
          if (phaseEl) updatePhaseCard(phaseEl, 0);
        });
        updateOverall(data);
      });
    }
  }
})();
