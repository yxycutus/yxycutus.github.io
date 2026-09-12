// Small, optional reading tools. Article content and section links work without JS.
(() => {
  const article = document.querySelector('.article-content');
  if (!article) return;
  const header = document.querySelector('.article-header');
  if (!header) return;
  const toolbar = document.createElement('div');
  toolbar.className = 'reader-tools';
  const text = article.textContent;
  const minutes = Math.max(1, Math.ceil(((text.match(/[\u3400-\u9fff]/g) || []).length / 400) + ((text.match(/[a-zA-Z]+/g) || []).length / 200)));
  const estimate = document.createElement('span');
  estimate.textContent = `约 ${minutes} 分钟阅读`;
  const copy = document.createElement('button');
  copy.type = 'button'; copy.textContent = '复制文章链接';
  const status = document.createElement('span');
  status.className = 'reader-copy-status'; status.setAttribute('role', 'status');
  const fallback = document.createElement('input');
  fallback.type = 'text'; fallback.readOnly = true; fallback.hidden = true;
  fallback.setAttribute('aria-label', '文章链接，可手动复制');
  copy.addEventListener('click', async () => {
    const url = new URL(location.href); url.search = '';
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = '链接已复制'; fallback.hidden = true;
    } catch (_) {
      fallback.value = url.href; fallback.hidden = false; fallback.focus(); fallback.select();
      status.textContent = '请手动复制下方链接';
    }
  });
  toolbar.append(estimate, copy, status, fallback); header.append(toolbar);
  const top = document.createElement('a');
  top.href = '#main-content'; top.className = 'reader-back-top'; top.textContent = '↑';
  top.setAttribute('aria-label', '回到文章顶部'); top.hidden = true; document.body.append(top);
  let queued = false;
  function update() { top.hidden = window.scrollY < 650; queued = false; }
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
