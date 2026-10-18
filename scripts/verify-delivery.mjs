import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const state = JSON.parse(await readFile(new URL('../runtime/servidor-local.json', import.meta.url), 'utf8'));
const result = { url: state.url, root: state.root, checks: [], errors: [], consoleErrors: [], failedRequests: [], httpErrors: [], pass: false };
const browser = await chromium.launch({ executablePath: 'C:/Users/VTz produti/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => result.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  page.on('requestfailed', request => result.failedRequests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) result.httpErrors.push({ url: response.url(), status: response.status() }); });
  assert.equal((await page.goto(state.url)).status(), 200);
  result.checks.push('host-http-200');
  const frame = await (await page.waitForSelector('iframe')).contentFrame();
  assert.equal(new URL(frame.url()).port, String(state.port));
  result.checks.push('runtime-served-from-delivery-port');
  await frame.waitForFunction(() => window.game?.reveal?.step === 0 && !!window.game.world.intro?.text, null, { timeout: 120000 });
  result.checks.push('local-models-and-engine-loaded');
  await frame.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await frame.locator('canvas').focus();
  await page.keyboard.press('Enter');
  await frame.waitForFunction(() => window.game?.reveal?.step === 2);
  result.checks.push('intro-to-world');
  await frame.locator('.js-menu-trigger').click();
  await frame.waitForSelector('.js-menu.is-visible');
  await page.waitForTimeout(700);
  assert.equal(await frame.locator('.home-content .title').innerText(), "Bruno's Home");
  result.checks.push('home-menu');
  await page.screenshot({ path: fileURLToPath(new URL('../reference/entrega-local.png', import.meta.url)) });
  assert.equal(result.errors.length + result.consoleErrors.length + result.failedRequests.length + result.httpErrors.length, 0);
  result.checks.push('no-console-network-or-page-errors');
  result.pass = true;
} catch(error) { result.error = error.stack; process.exitCode = 1; }
finally {
  await browser.close();
  await writeFile(new URL('../reference/entrega-teste.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
