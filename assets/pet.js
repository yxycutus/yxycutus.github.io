// 科哞哞: local page companion, with one cancellable animation at a time.
(() => {
  'use strict';
  if (document.getElementById('kemoomoo')) return;
  const scriptURL = new URL(document.currentScript.src);
  const assetBase = new URL('pet/', scriptURL), siteBase = new URL('../', scriptURL);
  const asset = path => new URL(path, assetBase).href, site = path => new URL(path, siteBase).href;
  const keys = { hidden:'cutus-pet-dismissed', scale:'cutus-pet-scale', position:'cutus-pet-position', paused:'cutus-pet-paused', gaze:'cutus-pet-gaze', guide:'cutus-pet-guide' };
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key,value) => { try { localStorage.setItem(key,String(value)); } catch { /* Still usable without storage. */ } };
  const clamp = (n,min,max) => Math.max(min,Math.min(n,Math.max(min,max)));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const ANIMS = {
    idle:{label:'安静陪伴',row:0,times:[280,110,110,140,140,320]},
    'running-right':{label:'向右奔跑',row:1,times:[120,120,120,120,120,120,120,220]},
    'running-left':{label:'向左奔跑',row:2,times:[120,120,120,120,120,120,120,220]},
    waving:{label:'打个招呼',row:3,times:[140,140,140,280]},
    jumping:{label:'开心跳跃',row:4,times:[140,140,140,140,280]},
    failed:{label:'委屈大哭',row:5,times:[140,140,140,140,140,140,140,240]},
    waiting:{label:'等你回应',row:6,times:[150,150,150,150,150,260]},
    running:{label:'认真思考',row:7,times:[120,120,120,120,120,220]},
    review:{label:'检查成果',row:8,times:[150,150,150,150,150,280]}
  };
  const SCENES = [
    ['welcome','欢迎探索','好奇心，是出发的第一步。'],
    ['mentor','找导师','带着问题，认识新的研究方向。'],
    ['project','找项目','从一个想法，开始动手实践。'],
    ['resource','找资源','翻开书，让知识多一点连接。'],
    ['achievement','看成果','把进展记录下来，也记住小小的收获。'],
    ['notice','看通知','重要的消息，认真记下来。'],
    ['lecture','听讲座','边听边记，给灵感留个位置。'],
    ['recruit','组队招募','一起探索，走得更远一点。'],
    ['thinking','一起思考','别着急，我们再想一想。']
  ].map(([id,label,note]) => ({id,label,note}));
  const scene = id => SCENES.find(item => item.id === id);
  const $ = (selector,parent=document) => parent.querySelector(selector);
  const make = (tag,cls='',text='') => { const el=document.createElement(tag); el.className=cls; el.textContent=text; return el; };
  const button = (cls,text,label) => { const el=make('button',cls,text); el.type='button'; if(label) el.setAttribute('aria-label',label); return el; };
  const savedScale = Number(read(keys.scale));
  let scale = Number.isFinite(savedScale) && savedScale >= .5 && savedScale <= 1.2 ? savedScale : innerWidth < 600 ? .65 : .85;
  const route = decodeURI(location.pathname.slice(siteBase.pathname.length)).replace(/\/$/,'/index.html') || 'index.html';
  const profile = pageProfile(route);
  let mode = profile.scene;
  let gazeEnabled=read(keys.gaze)!=='0', guideEnabled=read(keys.guide)!=='0';
  let dismissed=read(keys.hidden)==='1', paused=read(keys.paused)==='1', loaded=false, loading=false, destroyed=false;
  let position=null, pointer=null, suppressClickUntil=0, activity='rest', animation=null, gaze=-1, generation=0, sceneRequest=0;
  let animTimer, actionTimer, gazeTimer, toastTimer, scrollTimer, gazeRaf, latestPointer, introTimer;
  let lastContextAt=0, lastErrorAt=0, lastScrollY=scrollY, scrollDirection=1;
  let guideSections=[], activeSection=null;
  const seenSections=new Set(), brokenScenes=new Set(), cleanup=new AbortController();
  const motionCache=new Map();
  let motionManifest;
  const on=(target,event,fn,options={}) => target.addEventListener(event,fn,{...options,signal:cleanup.signal});

  const host=make('div','pet-host'); host.id='kemoomoo'; host.hidden=true;
  const pet=button('desk-pet','','科哞哞：带我逛逛，也可拖动或用方向键移动');
  pet.setAttribute('aria-haspopup','dialog'); pet.setAttribute('aria-controls','pet-panel'); pet.setAttribute('aria-expanded','false');
  const sprite=make('span','pet-sprite'); sprite.setAttribute('aria-hidden','true'); sprite.style.backgroundImage=`url("${asset('spritesheet.webp')}")`;
  const pose=make('img','pet-fallback'); pose.alt=''; pose.hidden=true; pose.draggable=false;
  const sceneCanvas=make('canvas','pet-scene');sceneCanvas.width=sceneCanvas.height=512;sceneCanvas.hidden=true;sceneCanvas.setAttribute('aria-hidden','true');
  const sceneContext=sceneCanvas.getContext('2d');
  const dismiss=button('pet-dismiss','×','收起科哞哞'); dismiss.title='收起，随时可以叫回来';
  pet.append(sprite,pose,sceneCanvas); host.append(pet,dismiss);
  const restore=button('pet-restore','叫回科哞哞','叫回科哞哞'); restore.hidden=true;
  const panel=make('section','pet-bubble'); panel.id='pet-panel'; panel.hidden=true;
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby','pet-title');
  panel.innerHTML=`<header class="pet-panel-header"><div><p class="pet-eyebrow">跟着好奇心，往前一点</p><h2 id="pet-title">科哞哞 <span>带你逛逛</span></h2></div><button type="button" class="pet-panel-close" aria-label="关闭导航面板">×</button></header><div id="pet-content" class="pet-content"></div>`;
  const toast=make('aside','pet-toast'); toast.hidden=true; toast.setAttribute('aria-label','科哞哞的介绍');
  const toastText=make('p','pet-toast-text');toastText.setAttribute('role','status');
  const toastLink=make('a','pet-toast-link'),toastClose=button('pet-toast-close','×','收起这条介绍');
  toast.append(toastClose,toastText,toastLink);
  document.body.append(host,panel,restore,toast);

  // Page identity decides the resting pose; never carry a manually selected pose to another page.
  function pageProfile(path) {
    const entry=(scene,title,intro,recommendation)=>({scene,title,intro,recommendation});
    if(path==='index.html') return entry('auto','从这里认识 Cutus','我是科哞哞，陪你看看机器人项目和公开笔记。往下走，我来给你指路。',['先看机器人项目','knowledge/aloha-mini.html']);
    if(path==='about/index.html') return entry('mentor','认识一下 Cutus','这里是 Cutus 的学习、研究和生活。我们从他现在关注的问题看起。',['沿时间线了解经历','timeline/index.html']);
    if(path==='timeline/index.html') return entry('notice','把经历连成一条线','这条时间线从最近的经历往回走，记录学习、科研与实践的变化。',['再看看当前的方向','about/index.html']);
    if(path==='search.html') return entry('resource','一起找下一条线索','试试输入“微刺”或“力学”，也可以按主题筛选公开笔记。',['还没想好？逛逛知识库','knowledge/index.html']);
    if(path==='knowledge/aloha-mini.html') return entry('project','一起看看真机实践','这个项目记录了 Aloha Mini 的调测、遥操作和数据采集，往下还有真机演示。',['看看另一条研究线索','knowledge/scamp-climbing.html']);
    if(path==='knowledge/scholarship-reflection.html') return entry('achievement','把经历讲清楚','这里整理了答辩准备、项目证据与追问方法。我们一起看看如何讲清自己的贡献。',['继续看学习安排','knowledge/learning-reset.html']);
    if(path==='knowledge/learning-reset.html') return entry('notice','找回自己的学习节奏','课程和科研挤在一起时，这篇笔记用任务取舍和周回顾来理清节奏。',['看看课程笔记','knowledge/courses/index.html']);
    if(path==='knowledge/scamp-climbing.html'||path.endsWith('/connections.html')) return entry('thinking','沿着问题想下去','这里把附着机理和机器人栖息问题连起来。先看问题，再看证据与下一步验证。',['一起读相关论文','knowledge/papers/index.html']);
    if(path==='knowledge/research-workflow.html') return entry('project','让阅读走向验证','我们沿着问题、证据和实验计划，看看一项研究怎样继续往前走。',['打开论文关联地图','knowledge/papers/connections.html']);
    if(path==='knowledge/index.html') return entry('resource','一起翻开知识库','这里收着论文、课程和实践笔记。可以从一个问题出发，找到下一条阅读线索。',['从论文关联地图开始','knowledge/papers/connections.html']);
    if(path==='knowledge/papers/index.html') return entry('resource','寻找有用的论文线索','这些笔记围绕附着、攀爬和飞行栖停。用分类或关键词，挑一个感兴趣的问题。',['先看论文如何连接','knowledge/papers/connections.html']);
    if(path.startsWith('knowledge/papers/')) return entry('resource','陪你慢慢读论文','读论文时，我们先抓住它解决的问题，再看方法、证据和局限。',['回到论文目录','knowledge/papers/index.html']);
    if(path.startsWith('knowledge/')) return entry('lecture','一起学，随手记','这页是学习与实践笔记。我们按章节往下看，把概念和动手验证连起来。',['继续逛课程与知识','knowledge/index.html']);
    return entry('thinking','再找一条路','这个入口暂时没有找到内容，我带你回到熟悉的地方。',['回到首页','index.html']);
  }

  function brief(text,max=72) {
    const clean=text.replace(/\s+/g,' ').trim();
    return clean.length>max ? clean.slice(0,max).replace(/[，、：；,;:]$/,'')+'…' : clean;
  }
  function buildGuide() {
    const curated=[
      ['#sky-title','thinking','先换个视角，看看窗外的天空。再往下，就是正在做的机器人项目。'],
      ['#work-title','project','这里有真机实践和栖息研究。点进项目，可以看具体分工、过程与验证。','看看真机演示','knowledge/aloha-mini.html#demos'],
      ['#notebook-title','resource','这些公开笔记从论文、课程延伸到实践。挑一个问题，我们接着读。','一起翻知识库','knowledge/index.html'],
      ['#study-title','lecture','飞控路线分成十个阶段。展开面板，可以记录你自己的学习进度。','看看完整学习路线','knowledge/crazyflie-learning.html'],
      ['#ai-title','thinking','这里记录了 AI 怎样参与阅读、课程和编程。工具帮忙，理解和验证还要自己来。','看看工具使用记录','about/index.html#ai-workflow'],
      ['.field-trip h2','welcome','读累了，看看沿途的风景。书桌之外，也留一点时间给生活。'],
      ['#contact-title','recruit','想聊机器人、论文或者课程？这里可以联系 Cutus，也可以去看看他的 GitHub。','认识一下 Cutus','about/index.html'],
      ['#friends-title','mentor','这里是朋友们的站点，有空也可以顺着这些链接去逛逛。'],
      ['#personal-now-title','thinking','现在关注的事情，是机构验证、飞控和工程表达。我们看看这些方向怎样落到实践里。'],
      ['#tool-record-title','thinking','这份记录介绍了工具在学习和研究里的用法，也把自己的理解与验证放在前面。'],
      ['#routes-title','resource','还没决定读什么？这三条路线分别从表达、研究和学习节奏切入。']
    ];
    const known=new Map();
    curated.forEach(([selector,scene,text,label,url])=>{const el=$(selector);if(el)known.set(el,{scene,text,label,url});});
    const headings=[...document.querySelectorAll('main h2')].filter(h=>!h.closest('.home-hero,.flight-roadmap,.article-toc,.pet-bubble')&&h.textContent.trim());
    guideSections=headings.map((el,index)=>{
      if(!el.id)el.id=`companion-section-${index+1}`;
      let data=known.get(el),title=brief(el.textContent,35);
      if(!data){
        const semantic=[[/演示|调测|实验|技术|职责|工程项目/,'project'],[/成果|收获|答辩/,'achievement'],[/思考|局限|问题|展望/,'thinking'],[/联系|交流/,'recruit'],[/背景|教育/,'mentor'],[/技能|学习|课程/,'lecture']].find(([pattern])=>pattern.test(title));
        let next=el.nextElementSibling,excerpt='';
        for(let i=0;next&&i<4&&!/^H[12]$/.test(next.tagName);i++,next=next.nextElementSibling){const p=next.matches('p')?next:next.querySelector('p');if(p?.textContent.trim()){excerpt=brief(p.textContent,62);break;}}
        data={scene:semantic?.[1]||profile.scene,text:excerpt ? `${title}：${excerpt}` : `我们来到「${title}」了。可以在这里稍作停留，看看这一部分的记录。`};
      }
      return {el,title,...data};
    });
  }
  function guideAtViewport() {
    const limit=view().height*.48;
    const visible=guideSections.filter(item=>item.el.getClientRects().length&&item.el.getBoundingClientRect().top<limit);
    return visible.at(-1)||null;
  }
  function checkGuide() {
    if(!loaded||dismissed||document.hidden||pointer||!panel.hidden||document.body.classList.contains('sidebar-mobile-open'))return;
    const current=guideAtViewport();
    if(current!==activeSection){toast.hidden=true;clearTimeout(toastTimer);activeSection=current;mode=current?.scene||profile.scene;host.dataset.pagePose=mode;if(activity==='rest')rest();}
    const next=guideSections[guideSections.indexOf(current)+1];
    if(next&&scene(next.scene))loadMotion(next.scene).catch(()=>{});
    if(!guideEnabled||!current||scrollDirection<0||seenSections.has(current.el.id))return;
    const remaining=7000-(Date.now()-lastContextAt);
    if(remaining>0){clearTimeout(scrollTimer);scrollTimer=setTimeout(checkGuide,remaining);return;}
    seenSections.add(current.el.id);lastContextAt=Date.now();say(current.text,current.label,current.url);
  }

  function view() { return {width:document.documentElement.clientWidth,height:window.visualViewport?.height || innerHeight}; }
  function size() { return {width:Math.round(192*scale),height:Math.round(208*scale)}; }
  function place(x,y,persist=false) {
    const v=view(),s=size(),left=clamp(x,8,v.width-s.width-8),top=clamp(y,8,v.height-s.height-8);
    host.style.left=`${left}px`; host.style.top=`${top}px`;
    position={x:left/Math.max(1,v.width-s.width),y:top/Math.max(1,v.height-s.height)};
    if(persist) save(keys.position,JSON.stringify(position));
    placePanels();
  }
  function corner(persist=false) { const v=view(),s=size(); place(v.width-s.width-78,v.height-s.height-22,persist); }
  function relayout() {
    const s=size(),v=view(); host.style.width=`${s.width}px`; pet.style.height=`${s.height}px`;
    // Use the exact displayed cell dimensions for both offsets and sheet size.
    sprite.style.backgroundSize=`${s.width*8}px ${s.height*11}px`;
    if(position) place(position.x*(v.width-s.width),position.y*(v.height-s.height)); else corner();
    renderCurrent(); updateControls();
  }
  function placePanels() {
    if(host.hidden) return;
    const r=host.getBoundingClientRect(),v=view();
    if(!panel.hidden) {
      panel.style.maxHeight=`${Math.max(100,v.height-24)}px`;
      const w=panel.offsetWidth,h=panel.offsetHeight;
      let x=r.right-w,y=r.top-h-12;
      if(y<12) {y=r.top; x=r.left-w-12; if(x<12) x=r.right+12;}
      panel.style.left=`${clamp(x,12,v.width-w-12)}px`; panel.style.top=`${clamp(y,12,v.height-h-12)}px`;
    }
    if(!toast.hidden) { toast.style.left=`${clamp(r.left+r.width/2-toast.offsetWidth/2,12,v.width-toast.offsetWidth-12)}px`; toast.style.top=`${clamp(r.top-toast.offsetHeight-10,12,v.height-toast.offsetHeight-12)}px`; }
  }
  function frame(row,col) { sprite.style.backgroundPosition=`${-col*Math.round(192*scale)}px ${-row*Math.round(208*scale)}px`; pet.dataset.row=row; pet.dataset.frame=col; }
  function renderCurrent() {
    if(gaze>=0) frame(9+Math.floor(gaze/8),gaze%8);
    else if(animation?.kind==='scene'){
      const step=animation.def.timeline[motion.matches?0:animation.frame];
      sceneContext.clearRect(0,0,512,512);
      sceneContext.drawImage(animation.image,step.frame*512,0,512,512,0,0,512,512);
      pet.dataset.sceneFrame=step.sourceFrame;pet.dataset.sceneStep=motion.matches?0:animation.frame;
    } else if(animation) frame(ANIMS[animation.name].row,motion.matches||paused ? 0 : animation.frame);
  }
  function cancelAnimation() {clearTimeout(animTimer);sceneRequest++;animation=null;}
  function stopActivity() {generation++; cancelAnimation(); clearTimeout(actionTimer); clearTimeout(gazeTimer); if(gazeRaf) cancelAnimationFrame(gazeRaf); gazeRaf=null; gaze=-1;}
  function tick() {
    clearTimeout(animTimer);
    if(!animation||dismissed||destroyed||document.hidden||gaze>=0) return;
    const current=animation,def=current.kind==='scene'?current.def:ANIMS[current.name];
    const times=current.kind==='scene'?def.timeline.map(s=>s.durationMs):def.times;
    if(motion.matches||paused) {renderCurrent();if(current.done)animTimer=setTimeout(()=>{if(animation===current)current.done();},1800);return;}
    animTimer=setTimeout(()=>{
      if(animation!==current) return;
      current.frame++;
      if(current.frame===times.length) {current.frame=0; if(current.done) {current.done();return;}}
      renderCurrent(); tick();
    },times[current.frame]);
  }
  function animate(name,done) {
    cancelAnimation(); gaze=-1; sprite.hidden=false; pose.hidden=true;sceneCanvas.hidden=true;pet.classList.remove('pet-show-scene');delete pet.dataset.sceneFrame;delete pet.dataset.sceneStep;
    pet.dataset.state=name; animation={name,frame:0,done}; renderCurrent(); tick();
  }
  function loadMotion(id) {
    if(motionCache.has(id))return motionCache.get(id);
    if(!motionManifest){
      const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),8000);
      motionManifest=fetch(asset(`motions/manifest.json${scriptURL.search}`),{signal:abort.signal}).then(response=>{if(!response.ok)throw Error('Motion manifest unavailable');return response.json();}).finally(()=>clearTimeout(timeout));
    }
    const promise=motionManifest.then(data=>{
      const def=data.motions?.[id];
      if(data.version!==1||!def||def.width!==512||def.height!==512||!Number.isInteger(def.columns)||def.columns<1||def.columns>6||!Array.isArray(def.timeline)||!def.timeline.length||!def.timeline.every(s=>Number.isInteger(s.frame)&&s.frame>=0&&s.frame<def.columns&&Number.isFinite(s.durationMs)&&s.durationMs>=50)||!/^[-a-z0-9]+\.webp$/.test(def.file))throw Error('Invalid motion data');
      return new Promise((resolve,reject)=>{
        const image=new Image(),timeout=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('Motion image timeout'));},8000);
        image.decoding='async';
        image.onerror=()=>{clearTimeout(timeout);reject(Error('Motion image unavailable'));};
        image.onload=async()=>{try{await image.decode();if(image.naturalWidth!==512*def.columns||image.naturalHeight!==512)throw Error('Invalid motion dimensions');clearTimeout(timeout);resolve({def,image});}catch(error){clearTimeout(timeout);reject(error);}};
        image.src=asset(`motions/${def.file}`);
      });
    });
    // Each scene is decoded once; rejection stays cached to avoid retry storms while scrolling.
    motionCache.set(id,promise);return promise;
  }
  function showScene(id,done) {
    const item=scene(id); if(!item) return;
    if(brokenScenes.has(id)){animate('idle');return;}
    cancelAnimation();gaze=-1;const request=sceneRequest;
    // Keep the current frame visible until the replacement has fully decoded.
    loadMotion(id).then(({def,image})=>{
      if(request!==sceneRequest||destroyed||dismissed)return;
      if(!sceneContext)throw Error('Canvas unavailable');
      animation={kind:'scene',name:id,frame:0,def,image,done};renderCurrent();
      sprite.hidden=true;pose.hidden=true;sceneCanvas.hidden=false;pet.classList.add('pet-show-scene');pet.dataset.state=id;tick();
    }).catch(()=>{
      if(request!==sceneRequest||destroyed||dismissed)return;
      // Same transparent stills remain available when a motion cannot be loaded.
      sprite.hidden=true;sceneCanvas.hidden=true;pose.hidden=false;pose.src=asset(`cutouts/${id}.webp`);pet.dataset.state=id;pet.classList.add('pet-show-scene');
      if(done)actionTimer=setTimeout(()=>{if(request===sceneRequest)done();},1800);
    });
  }
  function rest() {stopActivity(); activity='rest'; if(dismissed||!loaded||destroyed) return; if(mode==='auto') animate('idle'); else showScene(mode);updateMotion();}
  function perform(name,kind='manual') {if(!Object.hasOwn(ANIMS,name)||dismissed||!loaded||pointer?.moved) return; stopActivity(); activity=kind; animate(name,rest);}
  function temporaryScene(id,kind,duration) {
    stopActivity(); activity=kind; showScene(id); const token=generation;
    actionTimer=setTimeout(()=>{if(generation===token) rest();},duration);
  }
  function say(text,label,url) {
    if(!guideEnabled||dismissed||!panel.hidden||document.hidden)return;
    clearTimeout(toastTimer);toastText.textContent=text;toastLink.hidden=!url;
    if(url){toastLink.textContent=label||'一起去看看';toastLink.href=site(url);}
    toast.hidden=false;placePanels();toastTimer=setTimeout(()=>{toast.hidden=true;},Math.max(6500,Math.min(13000,text.length*150)));
  }
  function updateMotion(){host.classList.toggle('pet-motion-paused',paused||motion.matches||document.hidden||dismissed);}
  function updateControls() {
    if(!$('.pet-size-value',panel))return;
    $('.pet-size-value',panel).textContent=`${Math.round(scale*100)}%`;
    $('[data-size="-1"]',panel).disabled=scale<=.5; $('[data-size="1"]',panel).disabled=scale>=1.2;
    $('[data-setting="gaze"]',panel).checked=gazeEnabled;$('[data-setting="guide"]',panel).checked=guideEnabled;
    const animate=$('[data-setting="animation"]',panel);animate.checked=!paused&&!motion.matches;animate.disabled=motion.matches;
    $('.pet-motion-note',panel).textContent=motion.matches?'已跟随系统的减少动态设置':'眨眨眼、翻翻书，陪你慢慢看';updateMotion();
  }
  function renderNavigation() {
    const content=$('#pet-content',panel);content.replaceChildren();content.scrollTop=0;
    content.append(make('p','pet-intro',activeSection?`我们正看到「${activeSection.title}」。接下来想去哪儿？`:'想去哪里？我带你找下一条线索。'));
    const [label,url]=profile.recommendation,recommend=make('a','pet-recommend');recommend.href=site(url);recommend.append(make('span','pet-recommend-kicker','接下来，不妨'),make('strong','',label+' →'));content.append(recommend);
    const nav=make('nav','pet-nav');nav.setAttribute('aria-label','科哞哞快速导航');
    [['回到首页','index.html','看看正在做的事'],['知识与论文','knowledge/index.html','从问题出发，一起读'],['学习时间线','timeline/index.html','沿着经历往回走'],['认识 Cutus','about/index.html','研究，也有生活'],['搜索全站','search.html','找一条具体的线索']].forEach(([label,url,note])=>{const a=make('a');a.href=site(url);if(route===url)a.setAttribute('aria-current','page');const text=make('span');text.append(make('strong','',label),make('small','',note));a.append(text,make('span','pet-nav-arrow','↗'));nav.append(a);});
    content.append(nav);
    if(guideSections.length){const map=make('details','pet-page-map');map.append(make('summary','','这一页的路标'));const local=make('nav','pet-local-nav');local.setAttribute('aria-label','当前页面章节');guideSections.forEach(item=>{const a=make('a','',item.title);a.href=`#${encodeURIComponent(item.el.id)}`;local.append(a);});map.append(local);content.append(map);}
    const settings=make('details','pet-settings');settings.innerHTML=`<summary><span aria-hidden="true">⚙</span> 科哞哞设置</summary>
      <div class="pet-settings-body"><div class="pet-size-control"><span>大小</span><button type="button" data-size="-1" aria-label="缩小科哞哞">−</button><output class="pet-size-value"></output><button type="button" data-size="1" aria-label="放大科哞哞">+</button></div>
      <label class="pet-setting"><span><strong>眼睛跟随</strong><small>首页闲置时，看向你的鼠标</small></span><input type="checkbox" data-setting="gaze"></label>
      <label class="pet-setting"><span><strong>沿途介绍</strong><small>下滑时，简短介绍当前内容</small></span><input type="checkbox" data-setting="guide"></label>
      <label class="pet-setting"><span><strong>待机动画</strong><small class="pet-motion-note"></small></span><input type="checkbox" data-setting="animation"></label>
      <div class="pet-options"><button type="button" class="pet-reset">回到角落</button><button type="button" class="pet-hide">暂时收起</button></div><p class="pet-hint">拖动换个位置，方向键也可以移动。</p></div>`;
    content.append(settings);updateControls();placePanels();
  }
  function openPanel() {if(dismissed||!loaded) return;toast.hidden=true;clearTimeout(toastTimer);clearTimeout(introTimer);resetGaze();panel.hidden=false;pet.setAttribute('aria-expanded','true');renderNavigation();$('.pet-recommend',panel).focus({preventScroll:true});}
  function closePanel(focus=false) {panel.hidden=true;pet.setAttribute('aria-expanded','false');if(focus&&!host.hidden) pet.focus({preventScroll:true});}
  function hidePet() {endDrag(true);dismissed=true;save(keys.hidden,'1');stopActivity();clearTimeout(scrollTimer);clearTimeout(toastTimer);clearTimeout(introTimer);toast.hidden=true;closePanel();host.hidden=true;restore.hidden=false;restore.textContent='叫回科哞哞';restore.focus({preventScroll:true});}
  function failedLoad() {loading=false;loaded=false;stopActivity();host.hidden=true;closePanel();restore.hidden=false;restore.textContent='重试科哞哞';restore.setAttribute('aria-label','科哞哞未能加载，点击重试');}
  function loadSprite() {
    if(loading||destroyed) return;loading=true;const image=new Image();
    image.onload=()=>{loading=false;if(destroyed)return;if(image.naturalWidth!==1536||image.naturalHeight!==2288){failedLoad();return;}loaded=true;host.hidden=dismissed;restore.hidden=!dismissed;restore.textContent='叫回科哞哞';restore.setAttribute('aria-label','叫回科哞哞');buildGuide();relayout();rest();if(!dismissed&&!motion.matches&&!paused&&mode==='auto'){activity='welcome';showScene('welcome',rest);}introTimer=setTimeout(()=>{if(scrollY<100){lastContextAt=Date.now();say(profile.intro,...profile.recommendation);}else checkGuide();},1400);};
    image.onerror=failedLoad;image.src=asset('spritesheet.webp');
  }
  function resetGaze() {clearTimeout(gazeTimer);if(gaze<0)return;gaze=-1;renderCurrent();tick();}
  function gazeMove(event) {
    if(!gazeEnabled||event.pointerType==='touch'||dismissed||!loaded||paused||motion.matches||document.hidden||!panel.hidden||pointer||activity!=='rest'||mode!=='auto')return;
    latestPointer={x:event.clientX,y:event.clientY};clearTimeout(gazeTimer);gazeTimer=setTimeout(resetGaze,1500);if(gazeRaf)return;
    gazeRaf=requestAnimationFrame(()=>{
      gazeRaf=null;if(!gazeEnabled||paused||motion.matches||pointer||!panel.hidden||activity!=='rest'||mode!=='auto'||dismissed)return;
      const r=pet.getBoundingClientRect(),dx=latestPointer.x-r.left-r.width/2,dy=latestPointer.y-r.top-r.height*.42,d=Math.hypot(dx,dy);
      if(d<28||d>700){resetGaze();return;}
      // This sheet starts at UP and runs clockwise, unlike atan2(y,x).
      gaze=Math.round(((Math.atan2(dx,-dy)*180/Math.PI+360)%360)/22.5)%16;clearTimeout(animTimer);renderCurrent();
    });
  }
  function endDrag(cancelled=false) {
    if(!pointer)return;const last=pointer;pointer=null;if(pet.hasPointerCapture(last.id))pet.releasePointerCapture(last.id);host.classList.remove('pet-dragging');
    if(!last.moved)return;suppressClickUntil=performance.now()+450;save(keys.position,JSON.stringify(position));if(cancelled)rest();else perform('jumping');
  }
  on(pet,'pointerdown',event=>{if(event.button!==0||!event.isPrimary||pointer)return;const r=host.getBoundingClientRect();resetGaze();pointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:r.left,y:r.top,lastX:event.clientX,moved:false};pet.setPointerCapture(event.pointerId);});
  on(pet,'pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;const dx=event.clientX-pointer.startX,dy=event.clientY-pointer.startY;if(!pointer.moved&&Math.hypot(dx,dy)<6)return;
    if(!pointer.moved){pointer.moved=true;closePanel();toast.hidden=true;stopActivity();activity='drag';host.classList.add('pet-dragging');animate('running-right');}
    const step=event.clientX-pointer.lastX,direction=step<-1?'running-left':step>1?'running-right':animation?.name;
    if(direction&&animation?.name!==direction)animate(direction);pointer.lastX=event.clientX;place(pointer.x+dx,pointer.y+dy);
  });
  on(pet,'pointerup',()=>endDrag());on(pet,'pointercancel',()=>endDrag(true));on(pet,'lostpointercapture',()=>endDrag(true));
  on(pet,'click',event=>{if(event.detail>0&&performance.now()<suppressClickUntil){event.preventDefault();return;}if(panel.hidden)openPanel();else closePanel();});
  on(pet,'keydown',event=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!d)return;event.preventDefault();const r=host.getBoundingClientRect(),step=event.shiftKey?32:12;place(r.left+d[0]*step,r.top+d[1]*step,true);});
  on(dismiss,'click',hidePet);
  on(restore,'click',()=>{dismissed=false;save(keys.hidden,'0');if(!loaded){loadSprite();return;}restore.hidden=true;host.hidden=false;relayout();rest();pet.focus({preventScroll:true});});
  on(panel,'click',event=>{
    const b=event.target.closest('button');
    if(b?.dataset.size){scale=clamp(Math.round((scale+Number(b.dataset.size)*.1)*100)/100,.5,1.2);save(keys.scale,scale);relayout();}
    else if(b?.classList.contains('pet-panel-close'))closePanel(true);
    else if(b?.classList.contains('pet-reset'))corner(true);
    else if(b?.classList.contains('pet-hide'))hidePet();
    if(event.target.closest('a'))closePanel(true);
  });
  on(panel,'toggle',()=>placePanels(),{capture:true});
  on(panel,'change',event=>{
    const setting=event.target.dataset.setting,checked=event.target.checked;
    if(setting==='gaze'){gazeEnabled=checked;save(keys.gaze,checked?'1':'0');resetGaze();}
    if(setting==='guide'){guideEnabled=checked;save(keys.guide,checked?'1':'0');toast.hidden=true;clearTimeout(toastTimer);clearTimeout(introTimer);}
    if(setting==='animation'){paused=!checked;save(keys.paused,paused?'1':'0');resetGaze();renderCurrent();tick();}
    updateControls();
  });
  on(toastClose,'click',()=>{toast.hidden=true;clearTimeout(toastTimer);});
  on(toast,'pointerenter',()=>clearTimeout(toastTimer));on(toast,'focusin',()=>clearTimeout(toastTimer));
  on(toast,'pointerleave',()=>{clearTimeout(toastTimer);toastTimer=setTimeout(()=>{if(!toast.contains(document.activeElement))toast.hidden=true;},4000);});
  on(document,'pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!host.contains(event.target))closePanel();});
  on(document,'keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();closePanel(true);}});
  on(document,'pointermove',gazeMove,{passive:true});on(document.documentElement,'pointerleave',resetGaze);
  on(window,'blur',()=>endDrag(true));on(window,'resize',()=>{endDrag(true);relayout();});if(window.visualViewport)on(visualViewport,'resize',relayout);
  on(document,'visibilitychange',()=>{if(document.hidden){endDrag(true);clearTimeout(animTimer);clearTimeout(gazeTimer);if(gazeRaf)cancelAnimationFrame(gazeRaf);gazeRaf=null;toast.hidden=true;}else{resetGaze();tick();}updateMotion();});
  on(motion,'change',()=>{resetGaze();renderCurrent();tick();updateControls();updateMotion();});
  on(pose,'error',()=>{brokenScenes.add(pet.dataset.state);rest();});
  on(window,'scroll',()=>{
    if(Math.abs(scrollY-lastScrollY)>2){scrollDirection=scrollY>lastScrollY?1:-1;lastScrollY=scrollY;}
    clearTimeout(scrollTimer);scrollTimer=setTimeout(checkGuide,240);
  },{passive:true});
  function reactToError(){if(Date.now()-lastErrorAt<12000||pointer||!panel.hidden||dismissed||document.hidden)return;lastErrorAt=Date.now();perform('failed','error');}
  on(window,'error',event=>{if(event instanceof ErrorEvent)reactToError();});on(window,'unhandledrejection',reactToError);
  // Optional integration point for site features; never starts background API calls.
  on(document,'cutus:pet',event=>{const d=event.detail||{};if(Object.hasOwn(ANIMS,d.state))perform(d.state,'site');else if(scene(d.scene)&&loaded&&!dismissed&&!pointer)temporaryScene(d.scene,'site',clamp(Number(d.duration)||4000,500,10000));});
  on(window,'pagehide',event=>{clearTimeout(animTimer);clearTimeout(actionTimer);clearTimeout(scrollTimer);clearTimeout(toastTimer);clearTimeout(gazeTimer);clearTimeout(introTimer);if(gazeRaf)cancelAnimationFrame(gazeRaf);if(!event.persisted){destroyed=true;cleanup.abort();}});
  on(window,'pageshow',event=>{if(event.persisted){rest();checkGuide();}});
  try{const p=JSON.parse(read(keys.position));if(p&&[p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))position=p;}catch{/* Malformed stored position. */}
  relayout();if(dismissed)restore.hidden=false;else loadMotion(mode==='auto'?'welcome':mode).catch(()=>{});loadSprite();
})();
