import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'out');
const base = '/meu-site-3d';
const reportDirectory = join(root, 'reference', 'pages');
await mkdir(reportDirectory, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
let server;
let url = process.env.PAGES_TEST_URL;
const kind = url ? 'live' : 'local';
if (!url) {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      assert(pathname.startsWith(`${base}/`));
      let path = resolve(output, `.${pathname.slice(base.length)}`);
      assert(path === output || path.startsWith(`${output}/`) || path.startsWith(`${output}\\`));
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
      response.end(await readFile(path));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  url = `http://127.0.0.1:${server.address().port}${base}/`;
}
const browser = await chromium.launch({
  executablePath: process.env.STUDY_CHROME || 'C:/Users/VTz produti/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  headless: true,
});
const report = { date: new Date().toISOString(), url, checks: [], pageErrors: [], httpErrors: [], consoleErrors: [] };
function check(name, pass = true) {
  report.checks.push({ name, pass: !!pass });
  assert(pass, name);
}
try {
  for (const touch of [false, true]) {
    const mode = touch ? 'mobile' : 'desktop';
    console.log(`START ${kind}-${mode}`);
    const width = touch ? 390 : 1440;
    const height = touch ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: 'en-US' });
    const page = await context.newPage();
    page.on('pageerror', e => report.pageErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) report.httpErrors.push({ url: r.url(), status: r.status() }); });
    check(`${mode}:host-http`, (await page.goto(url, { waitUntil: 'domcontentloaded' })).status() === 200);
    check(`${mode}:noindex`, (await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
    const frame = await (await page.waitForSelector('iframe')).contentFrame();
    await frame.waitForURL(new URL('world/index.html', url).href);
    check(`${mode}:runtime-path`, frame.url() === new URL('world/index.html', url).href);
    await frame.waitForFunction(() => window.game?.reveal?.step === 0 && !!window.game.world.intro?.text, null, { timeout: 120000 });
    check(`${mode}:models-and-engine-loaded`);
    check(`${mode}:canvas`, await frame.locator('canvas').evaluate(el => el.width > 0 && el.height > 0));
    await frame.locator('canvas').focus();
    if (touch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: height / 2 }] });
      await page.waitForTimeout(500);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    } else {
      await page.keyboard.press('Enter');
    }
    await frame.waitForFunction(() => window.game?.reveal?.step === 2, null, { timeout: 60000 });
    check(`${mode}:enter-world`);
    if (!touch) {
      const before = await frame.evaluate(() => window.game.player.position.toArray());
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(900);
      await page.keyboard.up('ArrowUp');
      const after = await frame.evaluate(() => window.game.player.position.toArray());
      check('desktop:drive', Math.hypot(...after.map((n, i) => n - before[i])) > 0.5);
    }
    await frame.locator('.js-menu-trigger').click();
    await frame.locator('.js-menu.is-visible').waitFor();
    check(`${mode}:menu`);
    for (const name of ['home', 'controls', 'options', 'behindTheScene']) {
      await frame.locator(`.js-navigation-item[data-name="${name}"]`).click();
      await frame.locator(`.js-menu .${name}-content.is-visible`).waitFor();
      check(`${mode}:tab-${name}`);
    }
    await frame.locator('.js-navigation-item[data-name=options]').click();
    check(`${mode}:backend-offline`, await frame.locator('.js-server span').innerText() === 'Offline');
    await frame.locator('.js-menu .js-close').first().click();
    await frame.waitForSelector('html.input-filter-wandering');
    check(`${mode}:menu-close`);
    await page.screenshot({ path: join(reportDirectory, `${kind}-${mode}.png`) });
    await context.close();
  }
  const request = await browser.newContext();
  check('license', (await (await request.request.get(new URL('world/license.md', url).href)).text()).includes('Copyright (c) 2025 Bruno Simon'));
  check('robots', (await (await request.request.get(new URL('robots.txt', url).href)).text()).includes('Disallow: /'));
  check('no-page-errors', report.pageErrors.length === 0);
  check('no-http-errors', report.httpErrors.length === 0);
  check('no-console-errors', report.consoleErrors.length === 0);
} catch (error) {
  report.fatal = String(error.stack || error);
} finally {
  await browser.close();
  if (server) await new Promise(done => server.close(done));
  await writeFile(join(reportDirectory, `${kind}.json`), JSON.stringify(report, null, 2));
}
const pass = report.checks.filter(c => c.pass).length;
const fail = report.checks.length - pass;
console.log(JSON.stringify({ pass, fail, fatal: report.fatal, pageErrors: report.pageErrors, httpErrors: report.httpErrors, consoleErrors: report.consoleErrors.slice(0, 3) }));
assert(!report.fatal && !fail, 'Pages verification failed');
