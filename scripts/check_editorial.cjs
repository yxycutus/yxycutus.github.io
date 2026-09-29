// Reading design regression: motion controls, progressive enhancement and photos.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
const artifacts = require('node:path').resolve(__dirname, '../.preview');
fs.mkdirSync(artifacts, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000}});
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    async function photos(selector) {
      for (const img of await page.locator(selector+' img').all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(img=>img.decode());
        assert.ok(await img.evaluate(img=>img.naturalWidth>0));
      }
    }
    for(const [route,kind] of [['knowledge/research-workflow.html','loop'],['knowledge/aloha-mini.html','arms'],['knowledge/scamp-climbing.html','perch'],['knowledge/papers/kim-2023.html','contact']]) {
      await page.goto(base+'/'+route);
      const figure=page.locator('[data-concept="'+kind+'"]');
      await figure.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('.concept-note').classList.contains('is-playing'));
      const original=await figure.getAttribute('data-step');
      await page.waitForFunction(step=>document.querySelector('.concept-note').dataset.step!==step,original);
      await figure.locator('.concept-play').click();
      assert.ok(!(await figure.getAttribute('class')).includes('is-playing'));
      for (let step=0;step<3;step++) {
        const button=figure.locator('[data-concept-step="'+step+'"]');
        await button.focus(); await page.keyboard.press('Enter');
        assert.equal(await figure.getAttribute('data-step'),String(step));
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        assert.equal(await figure.locator('.concept-description').textContent(),await button.getAttribute('data-description'));
      }
      await figure.locator('.concept-play').click();
      await page.evaluate(()=>scrollTo(0,0));
      await page.waitForFunction(()=>!document.querySelector('.concept-note').classList.contains('is-playing'));
      await page.emulateMedia({reducedMotion:'reduce'});
      await figure.scrollIntoViewIfNeeded();
      assert.ok(!(await figure.getAttribute('class')).includes('is-playing'));
      await figure.screenshot({path:artifacts+'/reading-'+kind+'.png'});
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    console.log('PASS: four illustrations auto-advance only in view; pause, keyboard steps and reduced motion work.');
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const theme of ['orange','dark','blue','white','pink','yellow']) {
      await page.goto(base+'/knowledge/research-workflow.html');
      await page.evaluate(theme=>window.CutusPreferences.setTheme(theme),theme);
      await photos('.field-cover');
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:artifacts+'/reading-'+theme+'.png'});
      await page.locator('.field-cover > a').click();
      assert.ok(await page.locator('.image-viewer').evaluate(el=>el.open));
      await page.keyboard.press('Escape');
      assert.ok(await page.locator('.field-cover > a').evaluate(el=>el===document.activeElement));
    }
    await page.evaluate(()=>window.CutusPreferences.setTheme('orange'));
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/knowledge/research-workflow.html');
    await photos('.field-cover'); await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:artifacts+'/reading-mobile.png'});
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'/'); await photos('.field-trip');
    await page.locator('.field-trip').screenshot({path:artifacts+'/reading-travel.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS: six themes, responsive photos, image viewer and focus return; no browser errors.');
    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const staticPage=await noJS.newPage();
    await staticPage.goto(base+'/knowledge/scamp-climbing.html');
    assert.ok(await staticPage.locator('.concept-art').isVisible());
    assert.ok(!(await staticPage.locator('.concept-play').isVisible()));
    assert.ok(await staticPage.locator('.field-cover img').isVisible());
    assert.ok(await staticPage.locator('.reading-toc').isVisible());
    await staticPage.locator('.reading-toc a[href="#next"]').click();
    assert.equal(new URL(staticPage.url()).hash, '#next');
    assert.ok(await staticPage.locator('.article-content').isVisible());
    console.log('PASS: photographs, static diagrams, article and original TOC remain usable without JavaScript.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
