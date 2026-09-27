// Inlined into every HTML head by scripts/version_theme_assets.cjs.
// Restore preferences before any stylesheet or network-dependent script runs.
(() => {
  'use strict';
  const root = document.documentElement;
  const aliases = { light: 'blue', bilibili: 'pink', meituan: 'yellow' };
  const themes = ['blue', 'dark', 'orange', 'white', 'pink', 'yellow'];
  const validTheme = value => themes.includes(aliases[value] || value) ? aliases[value] || value : null;
  const validFont = value => Number.isInteger(Number(value)) && Number(value) >= 14 && Number(value) <= 22 ? Number(value) : null;
  function read(key, validate) {
    const sources = [
      () => localStorage.getItem(key),
      () => {
        const cookie = document.cookie.split('; ').find(value => value.startsWith(`${key}=`));
        return cookie ? decodeURIComponent(cookie.slice(key.length + 1)) : null;
      },
      () => sessionStorage.getItem(key)
    ];
    for (const source of sources) {
      try { const value = validate(source()); if (value !== null) return value; } catch (_) {}
    }
    return null;
  }
  const params = new URLSearchParams(location.search);
  const urlTheme = validTheme(params.get('theme'));
  const urlFont = validFont(params.get('font'));
  root.dataset.theme = read('cutus-theme', validTheme) || urlTheme || 'pink';
  root.style.fontSize = `${read('cutus-font-size', validFont) || urlFont || 16}px`;
  root.dataset.sidebar = read('cutus-sidebar', value => ['open', 'closed'].includes(value) ? value : null) || 'open';
  root.setAttribute('data-theme-loading', '');
  window.CutusThemeBootstrap = { read, validTheme, validFont, urlTheme, urlFont };
  // Settle the initial CSS without animating from a fallback palette.
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      getComputedStyle(document.body).backgroundColor;
      requestAnimationFrame(() => root.removeAttribute('data-theme-loading'));
    });
  }, { once: true });
})();
