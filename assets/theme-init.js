// Apply the saved theme before the first stylesheet paints.
(() => {
  let theme;
  try { theme = localStorage.getItem('cutus-theme'); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
