// Homepage scroll and image regression. Run with BASE_URL, PLAYWRIGHT_MODULE, CHROME_PATH.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
const artifacts = path.resolve(__dirname, '../.preview');
fs.mkdirSync(artifacts, {recursive: true});
(async()=>{
 const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const errors=[]; const media=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/\.mp4(?:\?|$)/i.test(r.url()))media.push(r.url())});
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  assert.equal(await page.locator('.sky-feature video').count(),0);
  assert.equal(await page.locator('.sky-photo').count(),1);
  assert.ok(await page.locator('.sky-photo').evaluate(img=>img.complete&&img.naturalWidth>0));
  const scroll=async y=>{await page.evaluate(y=>scrollTo(0,y),y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))};
  const progress=()=>page.locator('.journal-masthead').evaluate(el=>Number(el.style.getPropertyValue('--brand-progress')));
  await scroll(0);assert.equal(await progress(),0);
  await page.screenshot({path:path.join(artifacts,'sky-home-top.png')});
  const skyTop=await page.locator('.sky-feature').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await scroll(skyTop-100);assert.equal(await progress(),1);
  assert.equal(await page.locator('.wordmark-scrolled').textContent(),'USTC Robotics');
  assert.ok(Math.abs(await page.locator('.journal-masthead').evaluate(el=>el.getBoundingClientRect().top))<2);
  await page.screenshot({path:path.join(artifacts,'sky-home-desktop.png')});
  await scroll(0);assert.equal(await progress(),0);
  const card=page.locator('.ai-card').first();assert.equal(await card.evaluate(el=>getComputedStyle(el).opacity),'0');
  await card.scrollIntoViewIfNeeded();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.ai-card')).opacity==='1');
  for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:900});await scroll(skyTop+110);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow at ${width}`);
   if(width===390)await page.screenshot({path:path.join(artifacts,'sky-home-mobile.png')});
  }
  await page.setViewportSize({width:320,height:900});await page.evaluate(()=>window.CutusPreferences.setFont(22));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'large font overflow');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.body.classList.contains('motion-enabled'));
  assert.equal(await progress(),0);
  assert.equal(await card.evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.deepEqual(media,[],'homepage must not fetch video');
  assert.deepEqual(errors,[]);
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
  const staticPage=await noJS.newPage();await staticPage.goto(base);
  assert.equal(await staticPage.locator('.sky-photo').count(),1);
  assert.equal(await staticPage.locator('.motion-enabled').count(),0);
  assert.equal(await staticPage.locator('.ai-card').first().evaluate(el=>getComputedStyle(el).opacity),'1');
  await noJS.close();
  console.log('PASS: sky photograph, no homepage video requests, reversible USTC Robotics wordmark, content reveal, 5 viewport widths, large font, reduced motion, no-JavaScript content, no browser errors.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
