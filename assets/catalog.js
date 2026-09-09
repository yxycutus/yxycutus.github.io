// Shared progressive enhancement for the public catalog pages.
(function () {
  'use strict';
  const input = document.getElementById('k-search-input');
  if (!input) return;
  const buttons = [...document.querySelectorAll('.cat-btn[data-category]')];
  const cards = [...document.querySelectorAll('.k-card')];
  const empty = document.getElementById('k-empty-msg');
  const count = document.getElementById('filter-count');
  const reset = document.getElementById('filter-reset');
  const categories = new Set(buttons.map(b => b.dataset.category));
  let category = 'all';
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().trim();
  const searchable = cards.map(card => normalize(card.textContent + ' ' + (card.dataset.keywords || '')));

  function render(updateUrl) {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach((card, index) => {
      const matches = (category === 'all' || card.dataset.category === category) && terms.every(term => searchable[index].includes(term));
      card.hidden = !matches;
      if (matches) visible++;
    });
    buttons.forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (empty) { empty.hidden = visible !== 0; empty.style.display = visible === 0 ? 'block' : 'none'; }
    if (count) count.textContent = `显示 ${visible} / ${cards.length} 项内容`;
    if (reset) reset.disabled = category === 'all' && !input.value;
    if (updateUrl) {
      const url = new URL(location.href);
      input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
      category === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
      try { history.replaceState(null, '', url); } catch (_) { /* Filtering also works under file://. */ }
    }
  }
  function restore() {
    const params = new URLSearchParams(location.search);
    input.value = params.get('q') || '';
    category = categories.has(params.get('category')) ? params.get('category') : 'all';
    render(false);
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.category; render(true); }));
  input.addEventListener('input', () => render(true));
  if (reset) reset.addEventListener('click', () => { input.value = ''; category = 'all'; render(true); input.focus(); });
  window.addEventListener('popstate', restore);
  const summary = document.querySelector('.filter-summary');
  if (summary) summary.hidden = false;
  restore();
})();
