// Browser regression checks. Requires Playwright and a local static server.
// BASE_URL, PLAYWRIGHT_MODULE and CHROME_PATH may override the local environment.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.preview');
fs.mkdirSync(artifacts, {recursive: true});
function pages(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.name.startsWith('.') ? [] : e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.relative(root, path.join(dir, e.name)).replaceAll('\\', '/')] : []);
}
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, colorScheme: 'light', reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const goto = async route => { await page.goto(`${base}/${route}`); await page.waitForSelector('#sidebar-toggle'); };
    const openSettings = () => page.locator('.site-utilities [data-open-settings]').click();
    const closeSettings = () => page.locator('[data-close-settings]').click();
    const font = async size => { await page.locator('#site-font-size').fill(String(size)); };
    const noOverflow = async label => {
      const dimensions = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth}));
      assert.ok(dimensions.scroll <= dimensions.width + 1, `${label}: ${JSON.stringify(dimensions)}`);
    };
    await goto('');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'blue');
    assert.ok(await page.locator('#site-sidebar').isVisible());
    await page.locator('.sidebar-close').click();
    assert.ok(await page.locator('#site-sidebar').isHidden());
    await page.reload();
    assert.ok(await page.locator('#site-sidebar').isHidden());
    await page.locator('#sidebar-toggle').click();
    await openSettings();
    for (const theme of ['dark', 'blue', 'orange', 'white', 'pink', 'yellow']) {
      await page.locator(`[data-set-theme="${theme}"]`).click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert.equal(await page.locator('.theme-option[aria-pressed="true"]').count(), 1);
      await closeSettings();
      await page.screenshot({path: path.join(artifacts, `experience-${theme}.png`)});
      await openSettings();
    }
    await page.locator('[data-set-theme="orange"]').click();
    await font(22);
    await closeSettings();
    await goto('knowledge/agent-tutorial.html');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'orange');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), '22px');
    const largeText = await page.locator('.article-content').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    await openSettings(); await font(16); await closeSettings();
    const normalText = await page.locator('.article-content').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(Math.abs(largeText / normalText - 22 / 16) < .01);
    assert.equal(await page.locator('.page-destinations a').count(), await page.locator('.article-content h2, .article-content h3').count());
    assert.equal(await page.locator('.chapter-bridge').count(), 6);
    assert.equal(await page.locator('.reading-progress').getAttribute('aria-valuenow'), '0');
    await page.locator('.page-destinations a[href="#section-3"]').click();
    await page.waitForFunction(() => document.querySelector('.page-destinations [aria-current="location"]')?.hash === '#section-3');
    assert.equal(new URL(page.url()).hash, '#section-3');
    assert.ok(await page.locator('#section-3').evaluate(el => el.getBoundingClientRect().top >= document.querySelector('.navbar').getBoundingClientRect().bottom));
    assert.ok(Number(await page.locator('.reading-progress').getAttribute('aria-valuenow')) > 0);
    await page.locator('[data-chapter-next]').click();
    await page.waitForFunction(() => location.hash === '#section-4');
    await page.locator('[data-chapter-prev]').click();
    await page.waitForFunction(() => location.hash === '#section-3');
    const subLink = page.locator('.toc-sub a').first();
    const subHash = await subLink.getAttribute('href');
    await subLink.click();
    await page.waitForFunction(hash => location.hash === hash, subHash);
    await page.reload();
    await page.waitForFunction(hash => document.querySelector('.page-destinations [aria-current="location"]')?.hash === hash, subHash);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => document.querySelector('.reading-progress').getAttribute('aria-valuenow') === '100');
    assert.equal(await page.locator('[data-chapter-next]').getAttribute('aria-disabled'), 'true');
    console.log('PASS: six themes, font scaling, persistence, sidebar collapse, h2/h3 links, deep links, adjacent chapters, reading progress.');

    const second = await context.newPage(); await second.goto(base);
    await openSettings(); await page.locator('[data-set-theme="white"]').click(); await font(18);
    await second.waitForFunction(() => document.documentElement.dataset.theme === 'white' && document.documentElement.style.fontSize === '18px');
    await closeSettings(); await second.close();
    await page.setViewportSize({width: 390, height: 844});
    await goto('knowledge/agent-tutorial.html');
    assert.ok(await page.locator('#site-sidebar').isHidden());
    await page.locator('#sidebar-toggle').click();
    assert.equal(await page.locator('#site-sidebar').getAttribute('aria-modal'), 'true');
    await page.keyboard.press('Shift+Tab');
    assert.ok(await page.evaluate(() => document.querySelector('#site-sidebar').contains(document.activeElement)));
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#site-sidebar').isHidden());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'sidebar-toggle');
    await page.locator('#sidebar-toggle').click();
    await page.locator('.page-destinations a[href="#section-5"]').click();
    assert.ok(await page.locator('#site-sidebar').isHidden());
    await page.waitForFunction(() => document.activeElement.id === 'section-5');
    await openSettings();
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('dialog.appearance-panel').isHidden());
    assert.ok(await page.evaluate(() => document.activeElement.hasAttribute('data-open-settings')));
    console.log('PASS: cross-tab preferences, mobile drawer focus trap, Escape/focus return and chapter navigation.');

    // Existing homepage interactions must remain usable with the shared controls.
    await page.setViewportSize({width: 1440, height: 1000});
    await goto('');
    await page.locator('.concept-cover').click();
    assert.ok(await page.locator('dialog.image-viewer').isVisible());
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('dialog.image-viewer').isHidden());
    assert.ok(await page.locator('#site-sidebar').isVisible());
    await page.locator('.hero-study-link').click();
    assert.ok(await page.locator('#flight-slider-0').isVisible());
    await page.locator('#flight-slider-0').fill('37');
    await page.locator('#flight-slider-0').dispatchEvent('change');
    await page.reload();
    assert.equal(await page.locator('#flight-slider-0').inputValue(), '37');
    await goto('knowledge/papers/index.html');
    await page.locator('#k-search-input').fill('Asbeck');
    assert.equal(await page.locator('.k-card:visible').count(), 1);
    await page.locator('#filter-reset').click();
    assert.equal(await page.locator('.k-card:visible').count(), 13);
    console.log('PASS: image viewer Escape, homepage deep link, learning slider persistence and paper filtering.');

    // Every page at the narrowest supported viewport and largest font.
    await openSettings(); await font(22); await closeSettings();
    await page.setViewportSize({width: 320, height: 844});
    const overflow = [];
    for (const route of pages(root)) {
      await goto(route);
      const result = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth}));
      if (result.scroll > result.width + 1) overflow.push({route, ...result});
    }
    assert.deepEqual(overflow, [], 'All pages at 320px / 137.5% font');
    for (const width of [320, 390, 768, 1199, 1200, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const route of ['', 'knowledge/agent-tutorial.html']) {
        await goto(route); await noOverflow(`${route || 'home'} @ ${width}, 22px`);
        await openSettings(); await noOverflow(`appearance @ ${width}`); await closeSettings();
      }
    }
    await page.setViewportSize({width: 390, height: 844});
    await goto('knowledge/agent-tutorial.html');
    await page.screenshot({path: path.join(artifacts, 'experience-mobile-large.png')});
    await page.locator('#sidebar-toggle').click();
    await page.screenshot({path: path.join(artifacts, 'experience-mobile-toc.png')});
    await page.keyboard.press('Escape');
    await openSettings();
    await page.screenshot({path: path.join(artifacts, 'experience-settings.png')});
    await closeSettings();
    await page.setViewportSize({width: 1440, height: 1000});
    await openSettings(); await font(16); await page.locator('[data-set-theme="orange"]').click(); await closeSettings();
    await page.locator('.page-destinations a[href="#section-3"]').click();
    await page.screenshot({path: path.join(artifacts, 'experience-reading.png')});
    console.log('PASS: all pages at 320px with maximum font; home/article/settings at six responsive widths.');

    const blocked = await browser.newContext({viewport: {width: 390, height: 844}});
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', {get() {throw new Error('storage unavailable');}}); });
    const blockedPage = await blocked.newPage(); await blockedPage.goto(base);
    await blockedPage.locator('.site-utilities [data-open-settings]').click();
    await blockedPage.locator('[data-set-theme="orange"]').click();
    assert.equal(await blockedPage.locator('html').getAttribute('data-theme'), 'orange');
    assert.ok((await blockedPage.locator('.preference-status').textContent()).includes('无法保存'));
    const noJS = await browser.newContext({javaScriptEnabled: false});
    const plain = await noJS.newPage(); await plain.goto(`${base}/knowledge/agent-tutorial.html`);
    assert.ok(await plain.locator('.article-content').isVisible());
    assert.ok(await plain.locator('.article-toc').isVisible());
    await plain.locator('.article-toc summary').click();
    await plain.locator('.article-toc a[href="#section-3"]').click();
    assert.equal(new URL(plain.url()).hash, '#section-3');
    assert.deepEqual(errors, []);
    console.log('PASS: storage failure fallback, no-JavaScript reading/TOC, zero local missing resources or script errors.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
