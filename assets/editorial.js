// Optional motion: the photographs, diagrams and original article work without JS.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.article-content > h2').forEach((heading, index) => {
    if (!/^(?:\d+\s*[./、]|[一二三四五六七八九十]+[、.])/.test(heading.textContent.trim())) {
      heading.dataset.chapter = String(index + 1).padStart(2, '0') + ' /';
    }
  });
  document.querySelectorAll('[data-concept]').forEach(figure => {
    const play = figure.querySelector('.concept-play');
    const buttons = [...figure.querySelectorAll('[data-concept-step]')];
    const description = figure.querySelector('.concept-description');
    let step = 0, timer = null, visible = false, paused = reduced.matches;
    function render() {
      figure.dataset.step = String(step);
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === step)));
      description.textContent = buttons[step].dataset.description;
    }
    function sync() {
      clearInterval(timer); timer = null;
      const running = visible && !paused && !document.hidden;
      figure.classList.toggle('is-playing', running);
      play.textContent = paused ? '播放示意 ↻' : '暂停示意 Ⅱ';
      play.setAttribute('aria-label', (paused ? '播放' : '暂停') + figure.querySelector('.concept-copy > strong').textContent + '动画');
      if (running) timer = setInterval(() => { step = (step + 1) % buttons.length; render(); }, 3600);
    }
    play.addEventListener('click', () => { paused = !paused; sync(); });
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      paused = true; step = index; render(); sync();
    }));
    reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting; sync();
      }, {threshold: .2}).observe(figure);
    } else { visible = true; }
    figure.classList.add('is-ready'); render(); sync();
  });
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const entrance = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('editorial-enter'); entrance.unobserve(entry.target); }
    }), {threshold: .15});
    document.querySelectorAll('.field-cover, .reading-pause, .field-trip-grid figure').forEach(node => entrance.observe(node));
  }
})();
