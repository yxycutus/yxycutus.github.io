// End-to-end checks for the page-aware companion. Run against a local HTTP server.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8000';
const root=path.resolve(__dirname,'..'),artifacts=path.join(root,'.preview','pet');
fs.mkdirSync(artifacts,{recursive:true});
const report={checks:[],errors:[]};
const pass=name=>{report.checks.push(name);console.log('PASS:',name);};
const pages=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')||e.name==='node_modules'?[]:e.isDirectory()?pages(path.join(dir,e.name)):e.name.endsWith('.html')?[path.relative(root,path.join(dir,e.name)).replaceAll('\\','/')]:[]);

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const state=name=>page.waitForFunction(name=>document.querySelector('.desk-pet')?.dataset.state===name,name);
  const goto=async route=>{await page.goto(`${base}/${route}`,{waitUntil:'domcontentloaded'});await page.waitForSelector('#kemoomoo:not([hidden])');};
  const open=async()=>{if(await page.locator('#pet-panel').isHidden()){await page.locator('.desk-pet').focus();await page.keyboard.press('Enter');}await page.waitForSelector('#pet-panel:not([hidden])');};
  const settings=async()=>{await open();if(!await page.locator('.pet-settings').evaluate(e=>e.open))await page.locator('.pet-settings summary').click();};
  const bounds=async selector=>{const r=await page.locator(selector).boundingBox(),v=page.viewportSize();assert.ok(r);assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,selector+' on screen '+JSON.stringify(r));};
  const section=async id=>page.locator(id).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight*.3,behavior:'instant'}));
  await goto('');await state('welcome');await state('idle');await page.waitForSelector('.pet-toast:not([hidden])');
  assert.match(await page.locator('.pet-toast-text').textContent(),/我是科哞哞/);await page.screenshot({path:path.join(artifacts,'companion-welcome.png')});
  await open();assert.equal(await page.locator('.pet-nav').isVisible(),true);assert.equal(await page.locator('.pet-settings').evaluate(e=>e.open),false);assert.equal(await page.locator('[data-action],[data-scene],[role="tablist"]').count(),0);
  const links=await page.locator('.pet-nav a,.pet-recommend').evaluateAll(as=>as.map(a=>a.href));for(const url of links)assert.equal((await page.request.get(url)).status(),200);
  await page.screenshot({path:path.join(artifacts,'navigation.png')});
  await settings();await page.screenshot({path:path.join(artifacts,'settings.png')});await page.keyboard.press('Escape');await open();assert.equal(await page.locator('.pet-settings').evaluate(e=>e.open),false);await page.keyboard.press('Escape');
  pass('welcome introduction, immediate navigation, real links, collapsed settings and no manual action chooser');

  let r=await page.locator('.desk-pet').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2-70,r.y+r.height/2-40,{steps:6});await state('running-left');
  let moved=await page.locator('.desk-pet').boundingBox();assert.ok(Math.abs(moved.x-r.x+70)<2&&Math.abs(moved.y-r.y+40)<2);await page.mouse.up();assert.equal(await page.locator('#pet-panel').isHidden(),true);await state('idle');
  r=await page.locator('.desk-pet').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(640,440,{steps:8});await page.mouse.up();await state('idle');
  r=await page.locator('.desk-pet').boundingBox();const cx=r.x+r.width/2,cy=r.y+r.height*.42;
  for(const [dx,dy,row,col] of [[0,-170,9,0],[170,0,9,4],[0,170,10,0],[-170,0,10,4]]){await page.mouse.move(cx+dx,cy+dy);await page.waitForFunction(({row,col})=>{const d=document.querySelector('.desk-pet').dataset;return Number(d.row)===row&&Number(d.frame)===col;},{row,col});}
  await settings();await page.locator('[data-setting="gaze"]').uncheck();await page.keyboard.press('Escape');await page.mouse.move(cx+190,cy);await page.waitForTimeout(250);assert.equal(await page.locator('.desk-pet').getAttribute('data-row'),'0');
  await page.reload({waitUntil:'domcontentloaded'});await settings();assert.equal(await page.locator('[data-setting="gaze"]').isChecked(),false);await page.locator('[data-setting="gaze"]').check();await page.locator('[data-size="1"]').click();assert.equal(await page.locator('.pet-size-value').textContent(),'95%');
  const sheet=await page.locator('.pet-sprite').evaluate(e=>({w:e.parentElement.clientWidth,h:e.parentElement.clientHeight,size:e.style.backgroundSize}));assert.equal(sheet.size,`${sheet.w*8}px ${sheet.h*11}px`);
  await page.locator('[data-setting="animation"]').uncheck();const frozen=await page.locator('.pet-sprite').evaluate(e=>e.style.backgroundPosition);await page.waitForTimeout(400);assert.equal(await page.locator('.pet-sprite').evaluate(e=>e.style.backgroundPosition),frozen);
  await page.locator('[data-setting="animation"]').check();await page.locator('.pet-reset').click();await page.keyboard.press('Escape');await bounds('#kemoomoo');
  pass('directional drag, no jump or accidental menu, sixteen-direction gaze, eye toggle persistence and exact fractional scaling');

  await goto('');await state('welcome');await state('idle');await section('#work-title');await state('project');await page.waitForFunction(()=>!document.querySelector('.pet-toast').hidden&&document.querySelector('.pet-toast-text').textContent.includes('真机实践'));
  await page.waitForFunction(()=>!document.querySelector('.pet-scene').hidden&&document.querySelector('.pet-scene').width===512);await page.screenshot({path:path.join(artifacts,'scroll-project.png')});
  await section('#notebook-title');await state('resource');await page.waitForFunction(()=>!document.querySelector('.pet-toast').hidden&&document.querySelector('.pet-toast-text').textContent.includes('公开笔记'));await page.locator('.pet-toast-close').click();
  await section('#work-title');await state('project');await section('#notebook-title');await state('resource');await page.waitForTimeout(400);assert.equal(await page.locator('.pet-toast').isHidden(),true,'already introduced section remains quiet');
  await settings();await page.locator('[data-setting="guide"]').uncheck();await page.keyboard.press('Escape');await section('#study-title');await state('lecture');await page.waitForTimeout(400);assert.equal(await page.locator('.pet-toast').isHidden(),true);
  await goto('knowledge/index.html');await state('resource');await page.waitForTimeout(1600);assert.equal(await page.locator('.pet-toast').isHidden(),true);await settings();assert.equal(await page.locator('[data-setting="guide"]').isChecked(),false);await page.keyboard.press('Escape');
  pass('scroll-triggered introductions, matching poses and links, no repetition, quiet preference persists across pages');

  for(const [route,pose] of [['knowledge/index.html','resource'],['about/index.html','mentor'],['timeline/index.html','notice'],['knowledge/aloha-mini.html','project'],['knowledge/crazyflie-learning.html','lecture'],['knowledge/scholarship-reflection.html','achievement'],['knowledge/scamp-climbing.html','thinking'],['search.html','resource']]){
   await goto(route);await state(pose);await page.waitForFunction(()=>!document.querySelector('.pet-scene').hidden&&document.querySelector('.pet-scene').width===512);
   const image=await page.locator('.pet-scene').evaluate(el=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.drawImage(el,0,0);const a=x.getImageData(0,0,512,512).data;let clear=0;for(let i=3;i<a.length;i+=4)if(!a[i])clear++;return {corners:[a[3],a[511*4+3],a[511*512*4+3],a[a.length-1]],clear,bg:getComputedStyle(el).backgroundColor,animation:getComputedStyle(el).animationName};});
   assert.deepEqual(image.corners,[0,0,0,0]);assert.ok(image.clear>512*512*.2);assert.equal(image.bg,'rgba(0, 0, 0, 0)');assert.equal(image.animation,'none');
  }
  await goto('knowledge/aloha-mini.html');await state('project');await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.waitForTimeout(400);await page.screenshot({path:path.join(artifacts,'transparent-dark.png')});
  await settings();await page.locator('[data-setting="animation"]').uncheck();assert.equal(await page.locator('#kemoomoo').evaluate(e=>e.classList.contains('pet-motion-paused')),true);await page.locator('[data-setting="animation"]').check();await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.pet-scene').evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  pass('automatic per-page resting poses, real RGBA transparency on dark theme, frame animation and pause/reduced-motion support');

  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{state:'failed'}})));await state('failed');await state('project');await page.evaluate(()=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{state:'constructor'}})));await state('project');
  await page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'Controlled check'})));await state('failed');await state('project');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('#kemoomoo').evaluate(e=>e.classList.contains('pet-motion-paused')),true);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await open();await page.locator('.pet-page-map summary').click();for(const hash of await page.locator('.pet-local-nav a').evaluateAll(as=>as.map(a=>a.hash)))assert.equal(await page.evaluate(hash=>!!document.getElementById(decodeURIComponent(hash.slice(1))),hash),true);
  await page.keyboard.press('Escape');await page.locator('.pet-dismiss').click();await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.pet-restore:not([hidden])');await page.locator('.pet-restore').click();await state('project');
  pass('error reaction returns to page pose, invalid event ignored, background pause, valid section links and hide/restore');

  for(const route of pages(root)){await goto(route);assert.equal(await page.locator('#kemoomoo').count(),1);assert.equal(await page.locator('script[src*="assets/pet.js"]').count(),1);}
  await goto('knowledge/papers/');await state('resource');await open();assert.equal(new URL(await page.locator('.pet-nav a').first().getAttribute('href')).pathname,new URL(`${base}/index.html`).pathname);
  await page.route('**/preview-base/**',async route=>{const response=await route.fetch({url:route.request().url().replace('/preview-base/','/')});await route.fulfill({response});});await goto('preview-base/knowledge/papers/index.html');await state('resource');await open();assert.equal(new URL(await page.locator('.pet-nav a').first().getAttribute('href')).pathname,new URL(`${base}/preview-base/index.html`).pathname);
  pass(`companion loads once on ${pages(root).length} pages, directory URLs and subdirectory hosting`);
  for(const width of [320,390,768,1366]){await page.setViewportSize({width,height:640});await bounds('#kemoomoo');await bounds('#pet-panel');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.setViewportSize({width:390,height:360});await settings();await bounds('#pet-panel');await page.screenshot({path:path.join(artifacts,'short-screen.png')});
  pass('four responsive widths, short screens and no horizontal overflow');

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),touch=await mobile.newPage();touch.on('pageerror',e=>report.errors.push(e.message));await touch.goto(`${base}/knowledge/index.html`,{waitUntil:'domcontentloaded'});await touch.waitForSelector('#kemoomoo:not([hidden])');
  await touch.locator('.desk-pet').tap();assert.equal(await touch.locator('.pet-nav').isVisible(),true);await touch.screenshot({path:path.join(artifacts,'mobile-navigation.png')});await touch.locator('.pet-panel-close').tap();
  await touch.locator('#sidebar-toggle').tap();await touch.waitForFunction(()=>document.body.classList.contains('sidebar-mobile-open'));assert.equal(await touch.locator('#kemoomoo').isVisible(),false);await touch.keyboard.press('Escape');await touch.waitForSelector('#kemoomoo:not([hidden])');
  const tr=await touch.locator('.desk-pet').boundingBox(),x=tr.x+tr.width/2,y=tr.y+tr.height/2,cdp=await mobile.newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y:y-90}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await touch.locator('.desk-pet').boundingBox();assert.ok(Math.abs(after.x-tr.x-35)<2&&Math.abs(after.y-tr.y+90)<2);assert.equal(await touch.locator('#pet-panel').isHidden(),true);await touch.waitForFunction(()=>document.querySelector('.desk-pet').dataset.state==='resource');
  pass('real touch navigation and drag, returns to page pose, yields to mobile sidebar');

  const blocked=await browser.newContext();await blocked.addInitScript(()=>{for(const method of ['getItem','setItem','removeItem'])Storage.prototype[method]=()=>{throw new DOMException('Storage disabled','SecurityError');};});const restricted=await blocked.newPage();restricted.on('pageerror',e=>report.errors.push(e.message));await restricted.goto(base);await restricted.locator('.desk-pet').click();await restricted.locator('.pet-settings summary').click();await restricted.locator('[data-size="1"]').click();await restricted.locator('[data-setting="gaze"]').uncheck();await restricted.locator('.pet-hide').click();await restricted.locator('.pet-restore').click();
  const missing=await browser.newContext(),retry=await missing.newPage();await retry.route('**/assets/pet/spritesheet.webp',r=>r.abort());await retry.goto(base);await retry.getByRole('button',{name:'科哞哞未能加载，点击重试'}).waitFor();await retry.unroute('**/assets/pet/spritesheet.webp');await retry.locator('.pet-restore').click();await retry.waitForSelector('#kemoomoo:not([hidden])');
  await retry.route('**/assets/pet/motions/project-*.webp',r=>r.abort());await retry.route('**/assets/pet/cutouts/project.webp',r=>r.abort());await retry.goto(`${base}/knowledge/aloha-mini.html`);await retry.waitForFunction(()=>document.querySelector('.desk-pet')?.dataset.state==='idle');
  pass('storage-denied controls, atlas retry and failed cutout fallback');
  assert.deepEqual(report.errors,[]);pass('no unexpected script errors or local HTTP failures');
 }catch(error){report.failure=error.stack;throw error;}finally{await browser.close();fs.writeFileSync(path.join(artifacts,'verification.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
