// A normal image link remains usable if scripting or dialog support is unavailable.
(() => {
  if (!document.querySelector('[data-image-viewer]') || typeof HTMLDialogElement === 'undefined') return;
  const dialog=document.createElement('dialog');dialog.className='image-viewer';dialog.setAttribute('aria-labelledby','viewer-title');
  dialog.innerHTML='<div class="viewer-toolbar"><h2 id="viewer-title"></h2><div class="viewer-actions"><button type="button" data-zoom aria-pressed="false">放大细节</button><a data-original target="_blank" rel="noopener">新窗口查看 ↗</a><button type="button" data-close autofocus>关闭 ×</button></div></div><div class="viewer-stage" tabindex="0" aria-label="图片，可在放大后滚动查看"><img alt=""></div><p class="viewer-caption" role="status"></p>';
  document.body.append(dialog);
  const stage=dialog.querySelector('.viewer-stage'),img=stage.querySelector('img'),caption=dialog.querySelector('.viewer-caption'),zoom=dialog.querySelector('[data-zoom]');
  let opener;
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[data-image-viewer]');
    if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0) return;
    e.preventDefault();opener=link;
    const preview=link.querySelector('img');
    dialog.querySelector('#viewer-title').textContent=link.dataset.title||preview?.alt||'查看图片';
    img.alt=preview?.alt||link.dataset.title||'研究配图';
    caption.textContent='正在加载图片…';
    img.onload=()=>{caption.textContent=link.dataset.caption||'点击“放大细节”查看原始尺寸；按 Esc 关闭。';};
    img.onerror=()=>{caption.textContent='图片加载失败，可在新窗口查看或关闭后重试。';};
    img.src=link.href;dialog.querySelector('[data-original]').href=link.href;
    stage.classList.remove('is-zoomed');zoom.textContent='放大细节';zoom.setAttribute('aria-pressed','false');
    dialog.showModal();stage.scrollTo(0,0);document.documentElement.classList.add('viewer-open');
  });
  zoom.addEventListener('click',()=>{const active=stage.classList.toggle('is-zoomed');zoom.textContent=active?'适应窗口':'放大细节';zoom.setAttribute('aria-pressed',String(active));stage.scrollTo(0,0);});
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('viewer-open');opener?.focus({preventScroll:true});});
})();
