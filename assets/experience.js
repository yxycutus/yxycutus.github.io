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
    if (status) status.textContent = storageAvailable ? '已记住你的选择，切换页面后依然生效。' : '当前浏览器无法保存设置，本页仍可正常调节。';
  }
  const themes = [
    ['dark', '夜间黑', '#101113', '#38bdf8'],
    ['blue', '科大蓝', '#edf3f9', '#004182'],
    ['orange', 'Claude 橙', '#f7f2e9', '#9c462b'],
    ['white', '花嫁白', '#fffefd', '#805364']
  ];
  const settings = document.createElement('dialog');
  settings.className = 'appearance-panel';
  settings.id = 'appearance-panel';
  settings.setAttribute('aria-labelledby', 'appearance-title');
  settings.innerHTML = `<div class="panel-heading"><h2 id="appearance-title">让阅读更合心意</h2><button type="button" aria-label="关闭外观设置" data-close-settings>×</button></div>
    <fieldset><legend>选择主题</legend><div class="theme-options">${themes.map(([id, name, bg, accent]) => `<button type="button" class="theme-option" data-set-theme="${id}" aria-pressed="false"><span class="theme-swatch" style="--swatch-bg:${bg};--swatch-accent:${accent}" aria-hidden="true"></span><span>${name}<b class="theme-check" aria-hidden="true">✓</b></span></button>`).join('')}</div></fieldset>
    <div class="font-setting"><label class="font-label" for="site-font-size"><span>字体大小</span><output id="font-size-value" for="site-font-size"></output></label><div class="font-control"><span aria-hidden="true">A</span><input id="site-font-size" type="range" min="14" max="22" step="1" value="16"><span aria-hidden="true">A</span></div><p class="font-preview">从理解原理，到让机器人动起来。<br>Read, build, and stay curious.</p><button type="button" class="reset-font">恢复默认字号</button></div><p class="preference-status" role="status">外观偏好保存在当前浏览器。</p>`;
  document.body.append(settings);
  const utilities = document.createElement('div');
  utilities.className = 'site-utilities';
  utilities.innerHTML = `<button type="button" class="utility-button" id="sidebar-toggle" aria-controls="site-sidebar" aria-expanded="false">${panelIcon}<span>目录</span></button><button type="button" class="utility-button" data-open-settings aria-haspopup="dialog" aria-controls="appearance-panel"><span aria-hidden="true">Aa</span><span>外观</span></button>`;
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
    settings.querySelector('#font-size-value').textContent = `${Math.round(size / 16 * 100)}%`;
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
  sidebar.innerHTML = `<div class="sidebar-heading"><div><small>${article ? 'READING NOTES' : 'CUTUS / EXPLORE'}</small><h2 id="sidebar-title">${article ? '本文目录' : '随处看看'}</h2></div><button type="button" class="sidebar-close" aria-label="收起侧边栏" title="收起侧边栏 (快捷键: [ 或 Esc)"><span class="sidebar-close-icon">${collapseIcon}</span><span class="sidebar-close-text">收起</span><kbd class="sidebar-close-kbd" aria-hidden="true">[</kbd></button></div>${article ? '<div class="reading-position"><div><span>阅读位置</span><strong id="reading-percent">0%</strong></div><span class="sidebar-progress-track"><span></span></span></div>' : ''}<div class="sidebar-search-box"><a href="${siteUrl('search.html')}" class="sidebar-search-btn" title="快速全站搜索 (快捷键: /)"><span class="sidebar-search-icon">${searchIcon}</span><span>全站内容快速搜索...</span><kbd aria-hidden="true">/</kbd></a></div><div class="sidebar-scroll"><nav aria-label="站点导航"><ul class="sidebar-links site-destinations"></ul></nav><p class="sidebar-label">${article ? '章节与小标题' : '本页导航'}</p><nav aria-label="${article ? '文章章节' : '本页内容'}"><ol class="sidebar-links page-destinations"></ol></nav></div>${article ? '<div class="chapter-navigation"><p class="chapter-count"></p><nav aria-label="相邻章节"><a data-chapter-prev>← 上一节</a><a data-chapter-next>下一节 →</a></nav></div>' : '<p class="sidebar-note">学习 · 制作 · 求证<br>在真实问题里，学习机器人。</p>'}<div class="sidebar-bottom-bar"><button type="button" class="sidebar-bottom-collapse" aria-label="收起侧边栏" title="收起侧边栏 (快捷键: [ )"><span class="sidebar-bottom-icon">${collapseIcon}</span><span>收起侧边栏</span><kbd class="sidebar-close-kbd" aria-hidden="true">[</kbd></button></div>`;
  document.body.append(sidebar);
  const destinations = sidebar.querySelector('.site-destinations');
  for (const [path, label] of [['index.html', '首页'], ['knowledge/index.html', '知识库'], ['about/index.html', '关于我'], ['timeline/index.html', '时间线']]) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = siteUrl(path); link.textContent = label;
    if (new URL(link.href).pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) link.setAttribute('aria-current', 'page');
    li.append(link); destinations.append(li);
  }
  let number = 0;
  const tocLinks = headings.map(heading => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    if (article && heading.tagName === 'H3') li.className = 'toc-sub';
    else { const marker = document.createElement('span'); marker.className = 'toc-number'; marker.setAttribute('aria-hidden', 'true'); marker.textContent = String(++number).padStart(2, '0'); link.append(marker); }
    const homeLabels = {'hero-title': '首页概览', 'work-title': '工程与研究', 'notebook-title': '开放笔记', 'campus-title': '校园生活', 'study-title': '飞控学习', 'contact-title': '交流联系', 'friends-title': '友情链接'};
    const label = document.createElement('span'); label.textContent = (home && homeLabels[heading.id]) || heading.textContent.trim(); link.append(label);
    li.append(link); sidebar.querySelector('.page-destinations').append(li);
    return link;
  });
  if (!headings.length) sidebar.querySelector('.sidebar-label').hidden = true;

  const toggle = utilities.querySelector('#sidebar-toggle');
  toggle.title = `切换${article ? '文章目录' : '侧边栏'} (快捷键: [ )`;
  const toggleSpan = toggle.querySelector('span');
  if (toggleSpan) toggleSpan.textContent = article ? '目录' : '侧栏';

  const edgeToggle = document.createElement('button');
  edgeToggle.type = 'button';
  edgeToggle.className = 'sidebar-edge-toggle';
  edgeToggle.id = 'sidebar-edge-toggle';
  edgeToggle.setAttribute('aria-controls', 'site-sidebar');
  edgeToggle.setAttribute('aria-label', `展开${article ? '文章目录' : '侧边栏'}`);
  edgeToggle.title = `展开${article ? '文章目录' : '侧边栏'} (快捷键: [ )`;
  edgeToggle.innerHTML = `<span class="edge-toggle-icon">${panelIcon}</span><span class="edge-toggle-text">${article ? '展开目录' : '展开侧栏'}</span><span class="edge-toggle-arrow">${rightArrow}</span>`;
  edgeToggle.hidden = true;
  document.body.append(edgeToggle);

  const backdrop = document.createElement('button');
  backdrop.className = 'sidebar-backdrop'; backdrop.type = 'button'; backdrop.tabIndex = -1;
  backdrop.setAttribute('aria-label', '关闭侧边栏'); backdrop.hidden = true;
  document.body.append(backdrop);
  const desktop = window.matchMedia('(min-width: 1200px)');
  let mobileOpen = false;

  const navbar = document.querySelector('.navbar');
  const navContainer = navbar ? navbar.querySelector('.nav-container') : null;
  const navBrand = navContainer ? navContainer.querySelector('.nav-brand') : null;
  let navToggle = null;
  if (navContainer && navBrand) {
    navToggle = document.createElement('button');
    navToggle.type = 'button';
    navToggle.className = 'nav-sidebar-toggle';
    navToggle.id = 'nav-sidebar-toggle';
    navToggle.setAttribute('aria-controls', 'site-sidebar');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.title = `切换${article ? '文章目录' : '侧边栏'} (快捷键: [ )`;
    navToggle.innerHTML = `<span class="nav-sidebar-icon">${panelIcon}</span><span class="nav-sidebar-label">${article ? '目录' : '侧栏'}</span>`;
    navBrand.before(navToggle);
  }

  function renderSidebar(returnFocus = false) {
    const open = desktop.matches ? root.dataset.sidebar !== 'closed' : mobileOpen;
    const modal = open && !desktop.matches;
    sidebar.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? '收起' : '展开'}${article ? '文章目录' : '侧边栏'}`);
    toggle.classList.toggle('is-active', open);
    const span = toggle.querySelector('span');
    if (span) span.textContent = open ? `收起${article ? '目录' : '侧栏'}` : `${article ? '目录' : '侧栏'}`;

    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', `${open ? '收起' : '展开'}${article ? '文章目录' : '侧边栏'}`);
      navToggle.classList.toggle('is-active', open);
      const navSpan = navToggle.querySelector('.nav-sidebar-label');
      if (navSpan) navSpan.textContent = open ? `收起` : (article ? '目录' : '侧栏');
    }
    edgeToggle.hidden = open || !desktop.matches;

    backdrop.hidden = !modal;
    document.body.classList.toggle('sidebar-mobile-open', modal);
    stage.inert = modal;
    if (navbar) navbar.inert = modal;
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
    } else {
      mobileOpen = !mobileOpen;
    }
    renderSidebar();
    if (!sidebar.hidden) {
      sidebar.querySelector('.sidebar-close')?.focus({preventScroll: true});
    } else {
      toggle.focus({preventScroll: true});
    }
  }

  toggle.addEventListener('click', toggleSidebar);
  if (navToggle) navToggle.addEventListener('click', toggleSidebar);
  edgeToggle.addEventListener('click', toggleSidebar);
  sidebar.querySelector('.sidebar-close').addEventListener('click', () => closeSidebar());
  sidebar.querySelector('.sidebar-bottom-collapse')?.addEventListener('click', () => closeSidebar());
  backdrop.addEventListener('click', () => closeSidebar());

  desktop.addEventListener('change', () => { mobileOpen = false; const wasFocused = sidebar.contains(document.activeElement); renderSidebar(); if (sidebar.hidden && wasFocused) toggle.focus({preventScroll: true}); });
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]')) return;
    const target = event.target;
    const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (event.key === 'Escape' && !sidebar.hidden) {
      closeSidebar();
      event.preventDefault();
      return;
    }

    if (!inInput && (event.key === '[' || (event.key === 'b' && (event.metaKey || event.ctrlKey)))) {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    if (event.key === 'Tab' && mobileOpen && !desktop.matches) {
      const focusable = [...sidebar.querySelectorAll('button, a[href]')].filter(el => !el.hidden && el.getAttribute('tabindex') !== '-1');
      const first = focusable[0], last = focusable[focusable.length - 1];
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
    progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', '文章阅读位置');
    progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', '100');
    fill = document.createElement('div'); fill.className = 'reading-progress-fill'; progress.append(fill); document.body.append(progress);
    chapters.slice(1).forEach((heading, index) => {
      const bridge = document.createElement('nav'); bridge.className = 'chapter-bridge'; bridge.setAttribute('aria-label', `继续阅读第 ${index + 2} 节`);
      const hint = document.createElement('small'); hint.textContent = `接着阅读 / ${String(index + 2).padStart(2, '0')}`;
      const link = document.createElement('a'); link.href = `#${heading.id}`; link.textContent = `${heading.textContent.trim()} →`;
      link.addEventListener('click', event => navigateToHeading(event, heading)); bridge.append(hint, link); heading.before(bridge);
    });
  }
  let queued = false, activeIndex = -2, currentChapter = -2;
  function updatePosition() {
    queued = false;
    const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
    root.style.setProperty('--nav-height', `${navHeight}px`);
    const line = navHeight + 48;
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
        sidebar.querySelector('.chapter-count').textContent = `第 ${chapter + 1} / ${chapters.length} 节`;
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
    if (event.key === 'cutus-theme') { const theme = event.newValue === 'light' ? 'blue' : event.newValue; if (themes.some(([id]) => id === theme)) { root.dataset.theme = theme; syncSettings(); } }
    if (event.key === 'cutus-font-size') { const size = Number(event.newValue); if (Number.isInteger(size) && size >= 14 && size <= 22) setFont(size, false); }
    if (event.key === 'cutus-sidebar' && ['open', 'closed'].includes(event.newValue)) { root.dataset.sidebar = event.newValue; renderSidebar(); }
  });
  // Generated h3 anchors can also be opened directly from another page.
  if (location.hash) { const heading = headings.find(h => `#${h.id}` === location.hash); if (heading) requestAnimationFrame(() => heading.scrollIntoView()); }
  updatePosition();
})();
