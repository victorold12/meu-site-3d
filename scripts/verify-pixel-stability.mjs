import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ executablePath: 'C:/Users/VTz produti/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe', headless: true });
const records = [];
try {
  for (const target of ['local', 'reference']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(target === 'local' ? 'http://127.0.0.1:3077/' : 'https://bruno-simon.com/');
    const frame = target === 'local' ? await (await page.waitForSelector('iframe')).contentFrame() : page.mainFrame();
    if (target === 'local') await frame.waitForFunction(() => window.game?.reveal?.step === 0 && !!window.game.world.intro?.text, null, { timeout: 120000 });
    else await page.waitForTimeout(30000);
    await frame.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 422 }] });
    await page.waitForTimeout(500);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await frame.waitForSelector('html.input-filter-wandering');
    await page.waitForTimeout(2500);
    await frame.locator('.js-menu-trigger').click();
    await frame.waitForSelector('.js-menu.is-visible');
    await page.waitForTimeout(700);
    await frame.locator('.js-navigation-item[data-name=controls]').click();
    // Aguardar a propriedade real, não supor que 400ms após click é o fim do fade.
    await frame.waitForFunction(() => getComputedStyle(document.querySelector('.controls-content')).opacity === '1');
    await frame.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const state = await frame.evaluate(() => {
      const e = document.querySelector('.controls-content');
      return { opacity: getComputedStyle(e).opacity, rootClasses: document.documentElement.className, selectedTab: e.querySelector('.js-tabs-trigger.is-active')?.dataset, font: getComputedStyle(e).fontFamily };
    });
    await frame.locator('.controls-content').screenshot({ path: fileURLToPath(new URL(`../reference/verification/${target}-mobile-controls-stable-content.png`, import.meta.url)) });
    records.push({ target, ...state });
    console.log(target, JSON.stringify(state));
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(new URL('../reference/verification/pixel-stability.json', import.meta.url), JSON.stringify(records, null, 2));
}
