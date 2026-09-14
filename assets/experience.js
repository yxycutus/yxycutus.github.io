// Appearance, persistent navigation and article position; all content works without this file.
(() => {
  'use strict';
  const root = document.documentElement;
  const main = document.querySelector('main');
  if (!main) return;
  const assetBase = new URL('.', document.currentScript.src);
  const siteBase = new URL('../', assetBase);
  const siteUrl = path => new URL(path, siteBase).href;
  const svg = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${paths}</svg>`;
  const panelIcon = svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m4-11h4m-4 4h4"/>');
  const closeIcon = svg('<path d="m7 7 10 10M17 7 7 17"/>');
  const collapseIcon = svg('<path d="m11 17-5-5 5-5m7 10-5-5 5-5"/>');
  const searchIcon = svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>');
  const rightArrow = svg('<path d="m9 18 6-6-6-6"/>');
  let storageAvailable = true;
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { storageAvailable = false; }
    const status = document.querySelector('.preference-status');
    const dot = document.querySelector('.status-dot');
    if (status) status.textContent = storageAvailable ? '外观偏好已保存在当前浏览器。' : '当前浏览器无法保存设置，本页仍可正常调节。';
    if (dot) dot.style.background = storageAvailable ? '#10b981' : '#f59e0b';
  }
  const themes = [
    { id: 'dark', name: '夜间黑', en: 'Dark Mode', bg: '#101113', surface: '#191b1f', accent: '#38bdf8', line: '#30343b' },
    { id: 'blue', name: '科大蓝', en: 'USTC Blue', bg: '#edf3f9', surface: '#ffffff', accent: '#004182', line: '#d1e0f0' },
    { id: 'orange', name: 'Claude 橙', en: 'Warm Paper', bg: '#f7f2e9', surface: '#fffaf2', accent: '#9c462b', line: '#e1d6c7' },
    { id: 'white', name: '花嫁白', en: 'Pure White', bg: '#ffffff', surface: '#ffffff', accent: '#93516c', line: '#ebebf0' },
    { id: 'pink', name: 'B站粉', en: 'Bilibili Pink', bg: '#fdf6f9', surface: '#ffffff', accent: '#fb7299', line: '#f4dbe4' },
    { id: 'yellow', name: '美团黄', en: 'Meituan Yellow', bg: '#fcfaf3', surface: '#ffffff', accent: '#ffd000', line: '#f2e8c6' }
  ];
  const settings = document.createElement('dialog');
  settings.className = 'appearance-panel';
  settings.id = 'appearance-panel';
  settings.setAttribute('aria-labelledby', 'appearance-title');
  settings.innerHTML = `<div class="panel-header">
      <div class="panel-header-info">
        <div class="panel-pill-badge">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18V3Z"/>')}<span>APPEARANCE</span></div>
        <h2 id="appearance-title">外观与排版设置</h2>
      </div>
      <button type="button" class="panel-close-btn" aria-label="关闭外观设置" data-close-settings title="关闭">${svg('<path d="M18 6 6 18M6 6l12 12"/>')}</button>
    </div>
    <div class="panel-body">
      <fieldset class="panel-section">
        <legend class="panel-section-title"><span>主题配色</span><small>COLOR SCHEME</small></legend>
        <div class="theme-options">
          ${themes.map(t => `<button type="button" class="theme-option" data-set-theme="${t.id}" aria-pressed="false"><div class="theme-preview-card" style="--card-bg:${t.bg};--card-surface:${t.surface};--card-accent:${t.accent};--card-line:${t.line}"><div class="mini-window"><div class="mini-sidebar"><div class="mini-sidebar-item active"></div><div class="mini-sidebar-item"></div><div class="mini-sidebar-item"></div></div><div class="mini-content"><div class="mini-pill"></div><div class="mini-heading"></div><div class="mini-line mini-line-1"></div><div class="mini-line mini-line-2"></div></div></div><div class="theme-check-badge"><b class="theme-check" aria-hidden="true">✓</b></div></div><div class="theme-option-meta"><div class="theme-color-dot" style="background:${t.accent}"></div><div class="theme-option-names"><span class="theme-name">${t.name}</span><span class="theme-en">${t.en}</span></div></div></button>`).join('')}
        </div>
      </fieldset>
      <div class="panel-section font-setting">
        <div class="font-section-header">
          <label class="panel-section-title" for="site-font-size"><span>正文字号</span><small>FONT SCALE</small></label>
          <output id="font-size-value" for="site-font-size" class="font-size-badge">100%</output>
        </div>
        <div class="font-control-wrap">
          <span class="font-scale-step small" aria-hidden="true">A</span>
          <div class="font-slider-container">
            <input id="site-font-size" type="range" min="14" max="22" step="1" value="16" aria-label="正文字号调节">
          </div>
          <span class="font-scale-step large" aria-hidden="true">A</span>
        </div>
        <div class="font-preview">
          <div class="font-preview-quote">“</div>
          <p class="font-preview-text">从理解原理，到让机器人动起来。<br><span class="font-preview-sub">Read, build, and stay curious.</span></p>
        </div>
        <div class="font-action-row">
          <button type="button" class="reset-font">${svg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>')}<span>恢复默认字号 (16px)</span></button>
        </div>
      </div>
    </div>
    <div class="panel-footer">
      <div class="preference-status-wrap">
        <span class="status-dot"></span>
        <p class="preference-status" role="status">外观偏好保存在当前浏览器。</p>
      </div>
    </div>`;
  document.body.append(settings);
  const utilities = document.createElement('div');
  utilities.className = 'site-utilities';
  utilities.innerHTML = `<button type="button" class="utility-button" data-open-settings aria-haspopup="dialog" aria-controls="appearance-panel" title="Appearance"><span aria-hidden="true">Aa</span></button>`;
  document.body.append(utilities);
  const oldToggle = document.getElementById('theme-toggle');
  if (oldToggle) {
    oldToggle.innerHTML = svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18V3Z"/>');
    oldToggle.setAttribute('aria-label', '外观设置：主题与字号');
    oldToggle.title = '外观设置：主题与字号';
    oldToggle.setAttribute('aria-haspopup', 'dialog');
    oldToggle.setAttribute('aria-controls', settings.id);
    oldToggle.setAttribute('data-open-settings', '');
  }
  const fontInput = settings.querySelector('#site-font-size');
  function syncSettings() {
    settings.querySelectorAll('[data-set-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setTheme === root.dataset.theme)));
    const size = parseFloat(root.style.fontSize) || 16;
    fontInput.value = size;
    fontInput.setAttribute('aria-valuetext', `${Math.round(size / 16 * 100)}%，基准字号 ${size}`);
    const percentEl = settings.querySelector('#font-size-value');
    if (percentEl) percentEl.textContent = `${Math.round(size / 16 * 100)}%`;
    const min = Number(fontInput.min) || 14;
    const max = Number(fontInput.max) || 22;
    const ratio = Math.max(0, Math.min(100, ((size - min) / (max - min)) * 100));
    fontInput.style.setProperty('--slider-fill', `${ratio}%`);
  }
  let settingsOpener;
  document.querySelectorAll('[data-open-settings]').forEach(button => button.addEventListener('click', () => {
    settingsOpener = button;
    syncSettings();
    settings.showModal();
  }));
  settings.querySelector('[data-close-settings]').addEventListener('click', () => settings.close());
  settings.addEventListener('click', event => { if (event.target === settings) { const r = settings.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) settings.close(); } });
  settings.addEventListener('close', () => settingsOpener?.focus({preventScroll: true}));
  settings.querySelectorAll('[data-set-theme]').forEach(button => button.addEventListener('click', () => {
    root.dataset.theme = button.dataset.setTheme;
    save('cutus-theme', root.dataset.theme);
    syncSettings();
  }));
  function setFont(size, persist = true) {
    root.style.fontSize = `${size}px`;
    if (persist) save('cutus-font-size', String(size));
    syncSettings();
  }
  fontInput.addEventListener('input', () => setFont(Number(fontInput.value)));
  settings.querySelector('.reset-font').addEventListener('click', () => setFont(16));
  syncSettings();

  // Keep the navbar across the full viewport while the main/footer share sidebar space.
  const stage = document.createElement('div');
  stage.className = 'site-stage';
  main.before(stage);
  stage.append(main);
  const footer = document.querySelector('.site-footer');
  if (footer) stage.append(footer);
  document.body.classList.add('has-sidebar');
  const article = main.querySelector('.article-content');
  const home = document.body.classList.contains('home-page');
  const headings = article ? [...article.querySelectorAll('h2, h3')] : home ? [...main.querySelectorAll(':scope > section')].map(section => section.querySelector('h1, h2')).filter(Boolean) : [...main.querySelectorAll('h2')].filter(heading => !heading.closest('[data-flight-roadmap]'));
  headings.forEach((heading, index) => {
    if (!heading.id) {
      let id = `reading-section-${index + 1}`;
      while (document.getElementById(id)) id += '-heading';
      heading.id = id;
    }
  });
  const sidebar = document.createElement('aside');
  sidebar.id = 'site-sidebar';
  sidebar.className = 'site-sidebar';
  sidebar.setAttribute('aria-labelledby', 'sidebar-title');
  sidebar.innerHTML = `<div class="sidebar-header"><a href="${siteUrl('index.html')}" class="sidebar-brand-link" title="Cutus · USTC Robotics"><img src="${siteUrl('assets/avatar.jpg')}" alt="Cutus" class="sidebar-avatar" width="36" height="36"><div class="sidebar-brand-text"><span class="sidebar-brand-name">Cutus<span class="sidebar-dot">.</span></span><span class="sidebar-brand-tag">USTC Robotics</span></div></a></div><div class="sidebar-search-box"><a href="${siteUrl('search.html')}" class="sidebar-search-btn" title="Search"><span class="sidebar-search-icon">${searchIcon}</span><span>Search...</span></a></div><div class="sidebar-scroll"><nav aria-label="Main Navigation"><ul class="sidebar-links site-destinations"><li><a href="${siteUrl('index.html')}">${svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')}<span>Home</span></a></li><li><a href="${siteUrl('knowledge/index.html')}">${svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>')}<span>Knowledge</span></a></li><li><a href="${siteUrl('about/index.html')}">${svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')}<span>About</span></a></li><li><a href="${siteUrl('timeline/index.html')}">${svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>')}<span>Timeline</span></a></li></ul></nav>${article ? '<div class="reading-position"><div><span>Progress</span><strong id="reading-percent">0%</strong></div><span class="sidebar-progress-track"><span></span></span></div>' : ''}<p class="sidebar-label" id="sidebar-title">${article ? 'Table of Contents' : 'On this page'}</p><nav aria-label="${article ? 'Table of Contents' : 'Page Navigation'}"><ol class="sidebar-links page-destinations"></ol></nav></div>${article ? '<div class="chapter-navigation"><p class="chapter-count"></p><nav aria-label="Adjacent sections"><a data-chapter-prev>← Prev</a><a data-chapter-next>Next →</a></nav></div>' : ''}<div class="sidebar-footer"><button type="button" class="sidebar-appearance-btn" data-open-settings aria-haspopup="dialog" aria-controls="appearance-panel" title="Appearance Settings">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18V3Z"/>')}<span>Appearance</span></button><p class="sidebar-note">Read, build, and stay curious.<br>Robotics engineering & research.</p></div>`;
  document.body.append(sidebar);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sidebar-toggle sidebar-close';
  toggle.id = 'sidebar-toggle';
  toggle.setAttribute('aria-controls', 'site-sidebar');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Toggle sidebar');
  toggle.title = 'Toggle sidebar';
  toggle.innerHTML = panelIcon;
  document.body.append(toggle);

  sidebar.querySelectorAll('.site-destinations a').forEach(link => {
    if (new URL(link.href).pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  let number = 0;
  const pageLabelMaps = {
    'hero-title': 'Overview',
    'work-title': 'Projects & Research',
    'notebook-title': 'Open Notes',
    'campus-title': 'Campus Life',
    'study-title': 'Flight Control',
    'contact-title': 'Contact',
    'friends-title': 'Links',
    '教育与科研背景': 'Education & Research',
    '技术与工程技能谱系': 'Technical Skills',
    '工程项目与学术研读': 'Projects & Literature',
    'AI 探索历程与现代化生产力工具链': 'AI Workflow & Tools',
    '兴趣爱好与生活态度': 'Hobbies & Life',
    '学术与交流联系': 'Contact & Exchange',
    '2026 秋季 · 大二上学期': 'Fall 2026 (Sophomore)',
    '2026 夏季 · 大一暑假': 'Summer 2026',
    '2026 春季 · 大一下学期': 'Spring 2026 (Freshman)',
    '2026 寒假 · 大一寒假科研实战': 'Winter 2026 Research',
    '2025 年 12 月 · 加入空中机器人课题组': 'Dec 2025 Lab Entry',
    '2025 秋季 · 初入科大 (USTC)': 'Fall 2025 Entering USTC'
  };
  const tocLinks = headings.map(heading => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    if (article && heading.tagName === 'H3') li.className = 'toc-sub';
    else { const marker = document.createElement('span'); marker.className = 'toc-number'; marker.setAttribute('aria-hidden', 'true'); marker.textContent = String(++number).padStart(2, '0'); link.append(marker); }
    const raw = heading.textContent.trim();
    const labelText = (home && pageLabelMaps[heading.id]) || pageLabelMaps[raw] || raw;
    const label = document.createElement('span'); label.textContent = labelText; link.append(label);
    li.append(link); sidebar.querySelector('.page-destinations').append(li);
    return link;
  });
  if (!headings.length) sidebar.querySelector('.sidebar-label').hidden = true;

  const backdrop = document.createElement('button');
  backdrop.className = 'sidebar-backdrop'; backdrop.type = 'button'; backdrop.tabIndex = -1;
  backdrop.setAttribute('aria-label', 'Close sidebar'); backdrop.hidden = true;
  document.body.append(backdrop);
  const desktop = window.matchMedia('(min-width: 1200px)');
  let mobileOpen = false;

  sidebar.querySelector('.sidebar-appearance-btn')?.addEventListener('click', () => {
    settingsOpener = toggle;
    syncSettings();
    settings.showModal();
  });

  function renderSidebar(returnFocus = false) {
    const open = desktop.matches ? root.dataset.sidebar !== 'closed' : mobileOpen;
    const modal = open && !desktop.matches;
    sidebar.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Collapse sidebar' : 'Expand sidebar');
    toggle.title = open ? 'Collapse sidebar' : 'Expand sidebar';
    toggle.classList.toggle('is-active', open);

    backdrop.hidden = !modal;
    document.body.classList.toggle('sidebar-mobile-open', modal);
    stage.inert = modal;
    utilities.inert = modal;
    document.querySelector('.reader-back-top')?.toggleAttribute('inert', modal);
    if (modal) { sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true'); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
    if (returnFocus) toggle.focus({preventScroll: true});
  }
  function closeSidebar(returnFocus = true) {
    if (desktop.matches) { root.dataset.sidebar = 'closed'; save('cutus-sidebar', 'closed'); }
    mobileOpen = false;
    renderSidebar(returnFocus);
  }
  function toggleSidebar() {
    if (desktop.matches) {
      root.dataset.sidebar = root.dataset.sidebar === 'closed' ? 'open' : 'closed';
      save('cutus-sidebar', root.dataset.sidebar);
      renderSidebar();
      toggle.focus({preventScroll: true});
    } else {
      mobileOpen = !mobileOpen;
      renderSidebar();
      if (mobileOpen) {
        const first = sidebar.querySelector('a, button');
        first?.focus({preventScroll: true});
      } else {
        toggle.focus({preventScroll: true});
      }
    }
  }

  toggle.addEventListener('click', toggleSidebar);
  backdrop.addEventListener('click', () => closeSidebar());

  desktop.addEventListener('change', () => {
    mobileOpen = false;
    const wasFocused = sidebar.contains(document.activeElement);
    renderSidebar();
    if (sidebar.hidden && wasFocused) toggle.focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    const target = event.target;
    const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (event.key === 'Escape' && !sidebar.hidden) {
      closeSidebar();
      event.preventDefault();
      return;
    }

    if (event.key === 'Tab' && mobileOpen && !desktop.matches) {
      const focusable = [...sidebar.querySelectorAll('button, a[href]')].filter(el => !el.hidden && el.getAttribute('tabindex') !== '-1');
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!sidebar.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  renderSidebar();

  function navigateToHeading(event, heading) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!desktop.matches) { mobileOpen = false; renderSidebar(); }
    for (let parent = heading.parentElement; parent && parent !== main; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    heading.tabIndex = -1;
    heading.focus({preventScroll: true});
    heading.classList.add('heading-targeted');
    setTimeout(() => heading.classList.remove('heading-targeted'), 1600);
    // Native fragment navigation retains browser history and shareable URLs.
  }
  tocLinks.forEach((link, index) => link.addEventListener('click', event => navigateToHeading(event, headings[index])));
  const chapters = article ? headings.filter(heading => heading.tagName === 'H2') : [];
  let progress, fill;
  if (article) {
    document.body.classList.add('has-reading-sidebar');
    progress = document.createElement('div'); progress.className = 'reading-progress';
    progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', 'Reading progress');
    progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100');
    fill = document.createElement('div'); fill.className = 'reading-progress-fill'; progress.append(fill); document.body.append(progress);
    chapters.slice(1).forEach((heading, index) => {
      const bridge = document.createElement('nav'); bridge.className = 'chapter-bridge'; bridge.setAttribute('aria-label', `Continue to section ${index + 2}`);
      const hint = document.createElement('small'); hint.textContent = `Continue / ${String(index + 2).padStart(2, '0')}`;
      const link = document.createElement('a'); link.href = `#${heading.id}`; link.textContent = `${heading.textContent.trim()} →`;
      link.addEventListener('click', event => navigateToHeading(event, heading)); bridge.append(hint, link); heading.before(bridge);
    });
  }
  let queued = false, activeIndex = -2, currentChapter = -2;
  function updatePosition() {
    queued = false;
    root.style.setProperty('--nav-height', '0px');
    const line = 36;
    const visible = headings.map((heading, index) => ({heading, index})).filter(({heading}) => heading.getClientRects().length);
    let active = visible[0]?.index ?? -1;
    for (const entry of visible) { if (entry.heading.getBoundingClientRect().top <= line) active = entry.index; }
    if (article) {
      const rect = article.getBoundingClientRect();
      const start = rect.top + scrollY - line;
      const end = rect.bottom + scrollY - innerHeight;
      const percent = Math.round(Math.max(0, Math.min(1, end <= start ? (rect.bottom <= innerHeight ? 1 : 0) : (scrollY - start) / (end - start))) * 100);
      progress.setAttribute('aria-valuenow', String(percent));
      fill.style.transform = `scaleX(${percent / 100})`;
      sidebar.querySelector('.sidebar-progress-track span').style.transform = fill.style.transform;
      sidebar.querySelector('#reading-percent').textContent = `${percent}%`;
      if (percent === 100 && visible.length) active = visible[visible.length - 1].index;
    }
    if (active !== activeIndex) {
      tocLinks.forEach((link, index) => { if (index === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      const link = tocLinks[active], scroller = sidebar.querySelector('.sidebar-scroll');
      if (link && !sidebar.hidden) {
        const r = link.getBoundingClientRect(), s = scroller.getBoundingClientRect();
        if (r.top < s.top || r.bottom > s.bottom) scroller.scrollTop += r.top - s.top - scroller.clientHeight / 3;
      }
      activeIndex = active;
    }
    if (chapters.length) {
      const heading = headings[active];
      let chapter = 0;
      chapters.forEach((h, i) => { if (headings.indexOf(h) <= headings.indexOf(heading)) chapter = i; });
      if (chapter !== currentChapter) {
        currentChapter = chapter;
        sidebar.querySelector('.chapter-count').textContent = `Section ${chapter + 1} of ${chapters.length}`;
        for (const [selector, target] of [['[data-chapter-prev]', chapters[chapter - 1]], ['[data-chapter-next]', chapters[chapter + 1]]]) {
          const link = sidebar.querySelector(selector);
          link.setAttribute('aria-disabled', String(!target));
          if (target) { link.href = `#${target.id}`; link.title = target.textContent.trim(); link.removeAttribute('tabindex'); link.onclick = event => navigateToHeading(event, target); }
          else { link.removeAttribute('href'); link.removeAttribute('title'); link.tabIndex = -1; link.onclick = null; }
        }
      }
    } else if (article) sidebar.querySelector('.chapter-navigation').hidden = true;
  }
  function scheduleUpdate() { if (!queued) { queued = true; requestAnimationFrame(updatePosition); } }
  window.addEventListener('scroll', scheduleUpdate, {passive: true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(main); if (navbar) observer.observe(navbar);
  window.addEventListener('storage', event => {
    if (event.key === 'cutus-theme') { const theme = event.newValue === 'light' ? 'blue' : event.newValue; if (themes.some(({ id }) => id === theme)) { root.dataset.theme = theme; syncSettings(); } }
    if (event.key === 'cutus-font-size') { const size = Number(event.newValue); if (Number.isInteger(size) && size >= 14 && size <= 22) setFont(size, false); }
    if (event.key === 'cutus-sidebar' && ['open', 'closed'].includes(event.newValue)) { root.dataset.sidebar = event.newValue; renderSidebar(); }
  });
  // Generated h3 anchors can also be opened directly from another page.
  if (location.hash) { const heading = headings.find(h => `#${h.id}` === location.hash); if (heading) requestAnimationFrame(() => heading.scrollIntoView()); }
  updatePosition();
})();
