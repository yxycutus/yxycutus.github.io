// Verify real frame playback, transitions, alpha and lifecycle, not only filenames.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8000';
const manifest=require('../assets/pet/motions/manifest.json');
const out=path.resolve(__dirname,'../.preview/pet');fs.mkdirSync(out,{recursive:true});
const report={checks:[],scenes:[],errors:[]};
const pass=name=>{report.checks.push(name);console.log('PASS:',name);};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:860}});
  await context.addInitScript(()=>{localStorage.setItem('cutus-pet-guide','0');localStorage.setItem('cutus-pet-gaze','0');});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(`${base}/knowledge/aloha-mini.html`);await page.waitForFunction(()=>document.querySelector('.desk-pet')?.dataset.state==='project');
  for(const [id,def] of Object.entries(manifest.motions)){
   await page.evaluate(id=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{scene:id,duration:9000}})),id);
   await page.waitForFunction(id=>document.querySelector('.desk-pet').dataset.state===id&&!document.querySelector('.pet-scene').hidden,id);
   const result=await page.evaluate(async duration=>{
    const pet=document.querySelector('.desk-pet'),canvas=document.querySelector('.pet-scene'),ctx=canvas.getContext('2d');
    let steps=[],frames=new Set(),fingerprints=new Set(),last=-1,blank=false,badCorner=false;const start=performance.now();
    while(performance.now()-start<duration+450){
     const step=Number(pet.dataset.sceneStep);
     if(step!==last){last=step;const px=ctx.getImageData(0,0,512,512).data;let visible=0,hash=0;for(let i=3;i<px.length;i+=4)if(px[i]>200)visible++;for(let i=0;i<px.length;i+=61)hash=(Math.imul(hash,31)+px[i])|0;
      blank ||= visible<1000;badCorner ||= [3,511*4+3,511*512*4+3,px.length-1].some(i=>px[i]!==0);
      steps.push({step,at:Math.round(performance.now()-start)});frames.add(Number(pet.dataset.sceneFrame));fingerprints.add(hash);
     }
     await new Promise(resolve=>setTimeout(resolve,20));
    }
    return {steps,frames:[...frames],uniqueImages:fingerprints.size,blank,badCorner,cssAnimation:getComputedStyle(canvas).animationName};
   },def.durationMs);
   assert.equal(result.blank,false,id+' has no empty rendered frame');assert.equal(result.badCorner,false,id+' corners remain transparent');assert.ok(result.uniqueImages>=4,id+' actually changes pose');assert.equal(result.cssAnimation,'none');
   assert.deepEqual(result.frames.sort(),[...new Set(def.timeline.map(s=>s.sourceFrame))].sort(),id+' approved frame sequence');
   assert.ok(!result.frames.some(f=>def.excludedSourceFrames.includes(f)),id+' excludes known bad source frames');
   // Observe a full hold interval rather than merely checking the manifest.
   const lastStep=def.timeline.length-1,hold=result.steps.findIndex(s=>s.step===lastStep);
   assert.ok(hold>=0&&result.steps[hold+1],id+' returns from final hold');
   const actual=result.steps[hold+1].at-result.steps[hold].at;
   assert.ok(Math.abs(actual-def.timeline[lastStep].durationMs)<180,id+' preserves authored rest timing: '+actual);
   report.scenes.push({id,...result});await page.screenshot({path:path.join(out,`motion-${id}.png`)});
  }
  pass('all nine motions visibly animate, preserve timing/loop holds and transparency, exclude the duplicate mitten frame');
  await page.locator('.desk-pet').click();await page.locator('.pet-settings summary').click();await page.locator('[data-setting="animation"]').uncheck();
  const frozen=await page.locator('.pet-scene').evaluate(e=>e.toDataURL());await page.waitForTimeout(750);assert.equal(await page.locator('.pet-scene').evaluate(e=>e.toDataURL()),frozen);
  await page.locator('[data-setting="animation"]').check();await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.desk-pet').dataset.sceneStep==='0');const still=await page.locator('.pet-scene').evaluate(e=>e.toDataURL());await page.waitForTimeout(350);assert.equal(await page.locator('.pet-scene').evaluate(e=>e.toDataURL()),still);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await page.locator('.pet-scene').evaluate(e=>e.toDataURL());await page.waitForTimeout(450);assert.equal(await page.locator('.pet-scene').evaluate(e=>e.toDataURL()),hidden);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  pass('pause freezes pixels; reduced-motion uses first frame; background tabs stop playback');

  // A slow old load must not replace a newer pose, nor interrupt a drag.
  const race=await context.newPage();race.on('pageerror',e=>report.errors.push(e.message));
  await race.route('**/motions/mentor-*.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,900));await r.continue();});
  await race.goto(`${base}/knowledge/aloha-mini.html`);await race.waitForFunction(()=>document.querySelector('.desk-pet')?.dataset.state==='project');
  const original=await race.locator('.pet-scene').evaluate(e=>e.toDataURL());
  await race.evaluate(()=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{scene:'mentor',duration:8000}})));
  await race.waitForTimeout(120);assert.equal(await race.locator('.pet-scene').evaluate(e=>e.toDataURL()),original,'previous frame remains visible during decode');
  await race.evaluate(()=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{scene:'lecture',duration:8000}})));await race.waitForFunction(()=>document.querySelector('.desk-pet').dataset.state==='lecture');await race.waitForTimeout(1100);assert.equal(await race.locator('.desk-pet').getAttribute('data-state'),'lecture');
  await race.route('**/motions/recruit-*.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,750));await r.continue();});
  await race.evaluate(()=>document.dispatchEvent(new CustomEvent('cutus:pet',{detail:{scene:'recruit',duration:8000}})));const r=await race.locator('.desk-pet').boundingBox();await race.mouse.move(r.x+r.width/2,r.y+r.height/2);await race.mouse.down();await race.mouse.move(r.x+r.width/2-40,r.y+r.height/2-40,{steps:5});await race.waitForTimeout(1000);assert.equal(await race.locator('.desk-pet').getAttribute('data-state'),'running-left');await race.mouse.up();await race.waitForFunction(()=>document.querySelector('.desk-pet').dataset.state==='project');
  pass('slow loading keeps previous frame; stale scene loads cannot override a newer pose or drag');
  const broken=await context.newPage();await broken.route('**/motions/project-*.webp',r=>r.abort());await broken.goto(`${base}/knowledge/aloha-mini.html`);await broken.waitForSelector('.pet-fallback:not([hidden])');await broken.waitForFunction(()=>document.querySelector('.pet-fallback').complete&&document.querySelector('.pet-fallback').naturalWidth===512);assert.equal(await broken.locator('.desk-pet').getAttribute('data-state'),'project');
  pass('unavailable motion falls back to the transparent still');
  assert.deepEqual(report.errors,[]);
 }catch(error){report.failure=error.stack;throw error;}finally{await browser.close();fs.writeFileSync(path.join(out,'motion-verification.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
