// Preference controls and navigation; the inline bootstrap owns the first paint.
(() => {
  'use strict';
  const root = document.documentElement;
  const revision = new URL(document.currentScript.src).searchParams.get('v');
  const { read, validTheme, validFont, urlTheme, urlFont } = window.CutusThemeBootstrap;
  function write(key, value, shared = true) {
    let saved = false;
    const stores = shared ? ['localStorage', 'sessionStorage'] : ['sessionStorage'];
    for (const store of stores) {
      try { window[store].setItem(key, value); saved = window[store].getItem(key) === String(value) || saved; } catch (_) {}
    }
    try {
      document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`;
      saved = document.cookie.split('; ').includes(`${key}=${encodeURIComponent(value)}`) || saved;
    } catch (_) {}
    return saved;
  }
  function syncUrl(force = false) {
    const url = new URL(location.href);
    if (!force && !url.searchParams.has('theme') && !url.searchParams.has('font')) return;
    url.searchParams.set('theme', root.dataset.theme);
    url.searchParams.set('font', parseFloat(root.style.fontSize));
    // Preserve query, fragment and the current history entry, including reader state.
    try { if (url.href !== location.href) history.replaceState(history.state, '', url.href); } catch (_) {}
  }
  function syncLink(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.hasAttribute('download')) return;
    try {
      const url = new URL(href, location.href);
      const internal = location.protocol === 'file:' ? url.protocol === 'file:' : url.origin === location.origin && /^https?:$/.test(url.protocol);
      if (!internal || !(/\.html$/i.test(url.pathname) || url.pathname.endsWith('/'))) return;
      if (url.pathname === location.pathname && url.hash) return;
      url.searchParams.set('theme', root.dataset.theme);
      url.searchParams.set('font', parseFloat(root.style.fontSize));
      if (revision) url.searchParams.set('v', revision);
      if (link.href !== url.href) link.href = url.href;
    } catch (_) {}
  }
  function syncLinks() { document.querySelectorAll('a[href]').forEach(syncLink); }
  function changed(saved = true) {
    syncUrl(!saved);
    syncLinks();
    window.dispatchEvent(new Event('cutus:preferences'));
  }
  window.CutusPreferences = {
    save: write,
    setTheme(value) {
      const theme = validTheme(value);
      if (!theme) return false;
      root.dataset.theme = theme;
      const saved = write('cutus-theme', theme);
      changed(saved);
      return saved;
    },
    setFont(value) {
      const font = validFont(value);
      if (!font) return false;
      root.style.fontSize = `${font}px`;
      const saved = write('cutus-font-size', font);
      changed(saved);
      return saved;
    }
  };
  function restore() {
    const theme = read('cutus-theme', validTheme);
    const font = read('cutus-font-size', validFont);
    if (theme) { root.dataset.theme = theme; write('cutus-theme', theme, false); }
    if (font) { root.style.fontSize = `${font}px`; write('cutus-font-size', font, false); }
    changed();
  }
  // Import URL fallbacks only without saved preferences. Do not persist the site
  // default or let an old URL overwrite a user's choice.
  if (urlTheme && !read('cutus-theme', validTheme)) write('cutus-theme', urlTheme);
  if (urlFont && !read('cutus-font-size', validFont)) write('cutus-font-size', urlFont);
  syncUrl();
  window.addEventListener('pageshow', restore); // Includes Edge's back/forward cache.
  window.addEventListener('storage', event => {
    if (event.key === 'cutus-theme' || event.key === 'cutus-font-size') restore();
  });
  document.addEventListener('DOMContentLoaded', () => {
    syncLinks();
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') syncLink(record.target);
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches('a[href]')) syncLink(node);
          node.querySelectorAll('a[href]').forEach(syncLink);
        }
      }
    }).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['href']});
  });
  // Support native ordinary/middle/modified clicks and opening links in new tabs.
  for (const type of ['click', 'auxclick', 'contextmenu']) {
    document.addEventListener(type, event => {
      const link = event.target.closest?.('a[href]');
      if (link) syncLink(link);
    }, true);
  }
  document.addEventListener('submit', event => {
    const form = event.target;
    const url = new URL(form.action, location.href);
    if (form.method !== 'get' || url.origin !== location.origin) return;
    const values = [['theme', root.dataset.theme], ['font', parseFloat(root.style.fontSize)]];
    if (revision) values.push(['v', revision]);
    for (const [name, value] of values) {
      let input = form.querySelector(`input[name="${name}"]`);
      if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.append(input); }
      input.value = value;
    }
  }, true);
})();
