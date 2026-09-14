// Apply the saved theme before the first stylesheet paints.
(() => {
  let theme, fontSize, sidebar;
  try {
    theme = localStorage.getItem('cutus-theme');
    fontSize = Number(localStorage.getItem('cutus-font-size'));
    sidebar = localStorage.getItem('cutus-sidebar');
  } catch (_) {}
  if (theme === 'light') theme = 'blue'; // Keep existing visitors' light preference.
  if (!['blue', 'dark', 'orange', 'white'].includes(theme)) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'blue';
  }
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.fontSize = `${Number.isInteger(fontSize) && fontSize >= 14 && fontSize <= 22 ? fontSize : 16}px`;
  root.dataset.sidebar = sidebar === 'closed' ? 'closed' : 'open';
})();
