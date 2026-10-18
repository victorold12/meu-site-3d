import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'reference', 'verification');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Users/VTz produti/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  headless: true,
});
const results = [];
const targets = process.argv.slice(2);
const runs = [
  { name: 'local-desktop', url: 'http://127.0.0.1:3077/', width: 1440, height: 900 },
  { name: 'reference-desktop', url: 'https://bruno-simon.com/', width: 1440, height: 900 },
  { name: 'local-mobile', url: 'http://127.0.0.1:3077/', width: 390, height: 844, touch: true },
  { name: 'reference-mobile', url: 'https://bruno-simon.com/', width: 390, height: 844, touch: true },
];
try {
  for (const run of runs.filter(r => !targets.length || targets.includes(r.name))) {
    const context = await browser.newContext({
      viewport: { width: run.width, height: run.height }, deviceScaleFactor: 1,
      hasTouch: !!run.touch, isMobile: !!run.touch, reducedMotion: 'no-preference',
      locale: 'en-US', timezoneId: 'UTC', serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const record = { ...run, pageErrors: [], consoleErrors: [], failedRequests: [], httpErrors: [], checks: [] };
    page.on('pageerror', e => record.pageErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') record.consoleErrors.push(m.text()); });
    page.on('requestfailed', r => record.failedRequests.push({ url: r.url(), error: r.failure()?.errorText }));
    page.on('response', r => { if (r.status() >= 400) record.httpErrors.push({ url: r.url(), status: r.status() }); });
    console.log('START', run.name);
    try {
      const response = await page.goto(run.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      record.status = response.status();
      const frame = run.name.startsWith('local')
        ? await (await page.waitForSelector('iframe')).contentFrame()
        : page.mainFrame();
      // Aguarda o estágio pronto em vez de tratar um sleep como prova de carregamento.
      // Local: instance explicitement exposée par VITE_GAME_PUBLIC. Original: capture console puis interaction.
      await frame.waitForSelector('html.is-started', { timeout: 60000 });
      if (run.name.startsWith('local')) {
        await frame.waitForFunction(() => window.game?.reveal?.step === 0 && !!window.game?.world?.intro?.text, null, { timeout: 120000 });
      } else {
        await page.waitForTimeout(30000);
      }
      await frame.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(out, `${run.name}-intro.png`) });
      await frame.locator('canvas').focus();
      if (run.touch) {
        // Pointer.js amostra upcomingDown no tick. Um tap instantâneo pode nascer e
        // terminar entre frames. Segure o toque real pelo CDP, sem mutar estado do jogo.
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: run.width / 2, y: run.height / 2 }] });
        await page.waitForTimeout(500);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      }
      else await page.keyboard.press('Enter');
      await frame.waitForSelector('html.input-filter-wandering', { timeout: 60000 });
      await page.waitForTimeout(3000);
      record.checks.push('intro-to-world');
      await page.screenshot({ path: path.join(out, `${run.name}-world.png`) });
      if (run.name.startsWith('local') && !run.touch) {
        const before = await frame.evaluate(() => window.game.physicalVehicle?.chassis?.translation?.() ?? window.game.player.position?.toArray?.());
        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(900);
        await page.keyboard.up('ArrowUp');
        const after = await frame.evaluate(() => window.game.physicalVehicle?.chassis?.translation?.() ?? window.game.player.position?.toArray?.());
        record.movement = { before, after };
      }
      await frame.locator('.js-menu-trigger').click();
      await frame.waitForSelector('.js-menu.is-visible');
      await page.waitForTimeout(700);
      record.checks.push('menu-open');
      record.regions = {};
      for (const name of ['home', 'controls', 'options', 'behindTheScene']) {
        await frame.locator(`.js-navigation-item[data-name="${name}"]`).click();
        const content = frame.locator(`.js-menu .${name}-content`);
        await content.waitFor({ state: 'visible' });
        await frame.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await content.screenshot({ path: path.join(out, `${run.name}-${name}-content.png`) });
        record.regions[name] = await content.boundingBox();
        record.checks.push('menu-tab-' + name);
        if (name === 'home') await page.screenshot({ path: path.join(out, `${run.name}-menu.png`) });
      }
      record.computed = await frame.evaluate(() => {
        const props = ['fontFamily','fontSize','fontWeight','lineHeight','padding','color','backgroundImage'];
        return Object.fromEntries(['html','.title','.text','.menu .inner','.menu .home-content','.button'].map(sel => {
          const el = document.querySelector(sel); const s = getComputedStyle(el);
          return [sel, Object.fromEntries(props.map(p => [p,s[p]]))];
        }));
      });
      record.viewport = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, canvas: { width: document.querySelector('canvas').width, height: document.querySelector('canvas').height }, classes: document.documentElement.className }));
      await frame.locator('.js-menu .js-close').first().click();
      await page.waitForTimeout(600);
      record.checks.push('menu-close');
      record.pass = !record.pageErrors.length && !record.consoleErrors.length && !record.httpErrors.length && !record.failedRequests.length;
    } catch (e) {
      record.error = e.message;
      record.pass = false;
      await page.screenshot({ path: path.join(out, `${run.name}-failure.png`) });
    }
    await writeFile(path.join(out, `${run.name}.json`), JSON.stringify(record, null, 2));
    results.push(record);
    console.log('RESULT', run.name, JSON.stringify({ pass: record.pass, checks: record.checks, error: record.error, pageErrors: record.pageErrors, httpErrors: record.httpErrors, consoleErrors: record.consoleErrors.slice(0, 3), failedRequests: record.failedRequests.slice(0,3) }));
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(results, null, 2));
}
if (results.some(r => !r.pass)) process.exitCode = 1;
