// Regression: an old navigation URL must never overwrite a newer user choice.
// Run against a static server with BASE_URL, PLAYWRIGHT_MODULE and CHROME_PATH.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
async function theme(page) {
  await page.waitForLoadState('load');
  return page.locator('html').getAttribute('data-theme');
}
async function choose(page, name) {
  await page.locator('.site-utilities [data-open-settings]').click();
  await page.locator(`[data-set-theme="${name}"]`).click();
  await page.locator('[data-close-settings]').click();
}
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, colorScheme: 'light', reducedMotion: 'reduce'});
    // Simulate a browser retaining old, unversioned resources. A fresh HTML page
    // must request the versioned assets and avoid these stale cache entries.
    await context.route(/\/assets\/(theme-init\.js|experience\.js|style\.css|experience\.css|home\.css)$/, route => route.fulfill({status: 200, contentType: 'text/plain', body: '/* stale cached asset */'}));
    const page = await context.newPage();
    const errors = [];
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/?theme=blue`);
    await choose(page, 'orange');
    await page.locator('.site-destinations a[href*="knowledge"]').click();
    assert.equal(await theme(page), 'orange', 'click into knowledge');
    await choose(page, 'pink');
    await page.reload();
    assert.equal(await theme(page), 'pink', 'reload must keep the new theme, despite the old URL');
    await page.goBack();
    assert.equal(await theme(page), 'pink', 'back must keep the latest preference');
    await page.goto(`${base}/knowledge/index.html?theme=blue`);
    assert.equal(await theme(page), 'pink', 'a stale/bookmarked URL must not overwrite saved preferences');
    console.log('PASS: changed theme survives clicked navigation, reload, back and stale URLs.');

    const second = await context.newPage();
    await second.goto(`${base}/?theme=blue`);
    await choose(page, 'yellow');
    await second.waitForFunction(() => document.documentElement.dataset.theme === 'yellow');
    await second.reload();
    assert.equal(await theme(second), 'yellow', 'cross-tab update survives reload');
    await second.close();

    // A browser returning a page from its back/forward cache reruns pageshow,
    // not the head script. Also test this lifecycle explicitly and deterministically.
    await page.evaluate(() => {
      localStorage.setItem('cutus-theme', 'white');
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
    });
    assert.equal(await theme(page), 'white', 'cached page restores latest choice');
    assert.equal(await page.locator('[data-set-theme="white"]').getAttribute('aria-pressed'), 'true');
    console.log('PASS: cross-tab reload and back/forward cache restoration.');

    const colors = {dark: ['rgb(16, 17, 19)', '#38bdf8'], blue: ['rgb(248, 250, 252)', '#004182'], orange: ['rgb(247, 242, 233)', '#9c462b'], white: ['rgb(255, 255, 255)', '#93516c'], pink: ['rgb(253, 246, 249)', '#de4f7c'], yellow: ['rgb(252, 250, 243)', '#9b6500']};
    for (const [name, [background, accent]] of Object.entries(colors)) {
      await page.goto(`${base}/`);
      await choose(page, name);
      await page.locator('.site-destinations a[href*="knowledge"]').click();
      assert.equal(await theme(page), name);
      await page.locator('a[href*="papers/index.html"]').first().click();
      await page.locator('a[href*="asbeck-2006.html"]').first().click();
      assert.equal(await theme(page), name);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), background);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--ustc-blue').trim()), accent);
    }
    console.log('PASS: all six themes retain actual background/accent colors through home → knowledge → papers → article.');

    const siteRoot = path.resolve(__dirname, '..');
    function pages(dir) {
      return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.name.startsWith('.') ? [] : e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.relative(siteRoot, path.join(dir, e.name)).replaceAll('\\', '/')] : []);
    }
    await choose(page, 'orange');
    for (const route of pages(siteRoot)) {
      await page.goto(`${base}/${route}`);
      assert.equal(await theme(page), 'orange', route);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), colors.orange[0], route);
      assert.ok(await page.evaluate(() => [...document.scripts].filter(s => /\/(theme-init|experience)\.js/.test(s.src)).every(s => new URL(s.src).searchParams.has('v'))), `${route} uses versioned scripts`);
    }
    console.log('PASS: all 27 HTML pages render saved orange colors.');

    for (const mode of ['local-blocked', 'all-blocked', 'silent-cookies']) {
      const limited = await browser.newContext({viewport: {width: 1440, height: 1000}, colorScheme: 'dark', reducedMotion: 'reduce'});
      await limited.addInitScript(mode => {
        Object.defineProperty(window, 'localStorage', {get() {throw new Error('blocked');}});
        if (mode !== 'local-blocked') {
          Object.defineProperty(window, 'sessionStorage', {get() {throw new Error('blocked');}});
          Object.defineProperty(Document.prototype, 'cookie', {configurable: true, get() {return '';}, set() {if (mode === 'all-blocked') throw new Error('blocked');}});
        }
      }, mode);
      const tab = await limited.newPage();
      await tab.goto(`${base}/`);
      await choose(tab, 'pink');
      await tab.locator('.site-destinations a[href*="knowledge"]').click();
      assert.equal(await theme(tab), 'pink', mode);
      await choose(tab, 'orange');
      await tab.reload();
      assert.equal(await theme(tab), 'orange', `${mode} reload`);
      const [newTab] = await Promise.all([
        limited.waitForEvent('page'),
        tab.locator('.site-destinations a[href*="about"]').click({button: 'middle'})
      ]);
      await newTab.waitForLoadState();
      assert.equal(await theme(newTab), 'orange', `${mode} middle-click/new tab`);
      await tab.goto(`${base}/?theme=orange`);
      await tab.locator('.site-utilities [data-open-settings]').click();
      await tab.locator('#site-font-size').fill('20');
      await tab.locator('[data-close-settings]').click();
      await tab.locator('.site-search-form input[name="q"]').fill('SMA');
      await tab.locator('.site-search-form button[type="submit"]').click();
      assert.equal(await theme(tab), 'orange', `${mode} search form`);
      assert.equal(new URL(tab.url()).searchParams.get('q'), 'SMA');
      assert.equal(await tab.evaluate(() => getComputedStyle(document.documentElement).fontSize), '20px');
      await limited.close();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: blocked storage, silently rejected cookies, middle-click/new tab; zero script errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
