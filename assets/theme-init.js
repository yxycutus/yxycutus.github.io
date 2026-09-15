// Apply the saved theme before the first stylesheet paints.
(() => {
  let theme, fontSize, sidebar;

  // 1. URL search params (instant cross-page & sandbox fallback)
  try {
    const params = new URLSearchParams(location.search);
    theme = params.get('theme');
    const f = Number(params.get('font'));
    if (Number.isInteger(f) && f >= 14 && f <= 22) fontSize = f;
  } catch (_) {}

  // 2. localStorage
  if (!theme) {
    try { theme = localStorage.getItem('cutus-theme'); } catch (_) {}
  }
  if (!fontSize) {
    try { fontSize = Number(localStorage.getItem('cutus-font-size')); } catch (_) {}
  }
  if (!sidebar) {
    try { sidebar = localStorage.getItem('cutus-sidebar'); } catch (_) {}
  }

  // 3. sessionStorage
  if (!theme) {
    try { theme = sessionStorage.getItem('cutus-theme'); } catch (_) {}
  }
  if (!fontSize) {
    try { fontSize = Number(sessionStorage.getItem('cutus-font-size')); } catch (_) {}
  }
  if (!sidebar) {
    try { sidebar = sessionStorage.getItem('cutus-sidebar'); } catch (_) {}
  }

  // 4. document.cookie
  if (!theme) {
    try {
      const match = document.cookie.match(/(?:^|;\s*)cutus-theme=([^;]+)/);
      if (match) theme = decodeURIComponent(match[1]);
    } catch (_) {}
  }

  // Backward-compatible alias mappings
  if (theme === 'light') theme = 'blue';
  if (theme === 'bilibili') theme = 'pink';
  if (theme === 'meituan') theme = 'yellow';

  const validThemes = ['blue', 'dark', 'orange', 'white', 'pink', 'yellow'];
  if (!validThemes.includes(theme)) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'blue';
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.fontSize = `${Number.isInteger(fontSize) && fontSize >= 14 && fontSize <= 22 ? fontSize : 16}px`;
  root.dataset.sidebar = sidebar === 'closed' ? 'closed' : 'open';

  // Sync back across storage layers to keep all future page loads in sync
  try { localStorage.setItem('cutus-theme', theme); } catch (_) {}
  try { sessionStorage.setItem('cutus-theme', theme); } catch (_) {}
  try { document.cookie = `cutus-theme=${encodeURIComponent(theme)};path=/;max-age=31536000;SameSite=Lax`; } catch (_) {}
})();
