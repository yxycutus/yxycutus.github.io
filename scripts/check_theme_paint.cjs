// Verify colors during loading, not just after load. Uses the same env as other browser checks.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
const colors = { pink: 'rgb(253, 246, 249)', blue: 'rgb(248, 250, 252)', dark: 'rgb(16, 17, 19)', orange: 'rgb(247, 242, 233)', white: 'rgb(255, 255, 255)', yellow: 'rgb(252, 250, 243)' };
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    for (const saved of [null, 'pink', 'blue', 'dark', 'orange', 'white', 'yellow']) {
      const expected = saved || 'orange';
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      await context.addInitScript(saved => {
        if (saved) localStorage.setItem('cutus-theme', saved);
        window.paintSamples = [];
        function sample() {
          const root = document.documentElement;
          if (root) {
            const body = document.body && getComputedStyle(document.body);
            window.paintSamples.push({ theme: root.dataset.theme, canvas: getComputedStyle(root).backgroundColor, body: body?.backgroundColor });
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }, saved);
      // A cold cache and delayed external files cannot delay the theme selection.
      await context.route(/\/assets\/(theme-init\.js|experience\.css)(\?|$)/, async route => {
        await new Promise(resolve => setTimeout(resolve, 450));
        await route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const route of ['', 'knowledge/index.html', 'timeline/index.html', 'knowledge/scholarship-reflection.html']) {
        await page.goto(`${base}/${route}${saved ? '?theme=blue' : ''}`);
        await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-loading'));
        const samples = await page.evaluate(() => window.paintSamples);
        assert.ok(samples.length > 0, 'captured rendered frames');
        for (const sample of samples) {
          assert.equal(sample.theme, expected, `${expected} ${route}: theme during paint`);
          assert.equal(sample.canvas, colors[expected], `${expected} ${route}: canvas during paint`);
          if (expected === 'pink' && sample.body && sample.body !== 'rgba(0, 0, 0, 0)') {
            assert.equal(sample.body, colors.pink, `${route}: body must never paint blue`);
          }
        }
      }
      // Follow real links, then go back; preserve the saved palette throughout.
      await page.locator('.site-destinations a[href*="knowledge"]').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), expected);
      await page.goBack();
      assert.equal(await page.locator('html').getAttribute('data-theme'), expected);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS: cold/slow first paint, saved preferences over stale URLs, all six palettes, navigation and back.');
    const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const page = await noJS.newPage();
    const root = path.resolve(__dirname, '..');
    function pages(dir) {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') ? [] : e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.relative(root, path.join(dir, e.name)).replaceAll('\\', '/')] : []);
    }
    for (const route of pages(root)) {
      await page.goto(`${base}/${route}`);
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'orange', route);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), colors.orange, route);
    }
    console.log('PASS: all HTML pages render warm paper even without JavaScript.');
    await noJS.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
