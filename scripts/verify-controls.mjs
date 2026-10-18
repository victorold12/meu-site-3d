import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({
  executablePath: 'C:/Users/VTz produti/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  headless: true,
});
const result = { checks: [], pageErrors: [], pass: false };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => result.pageErrors.push(e.message));
  const response = await page.goto('http://127.0.0.1:3077/');
  assert.match(response.headers()['x-robots-tag'], /noindex/);
  assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/);
  result.checks.push('host-noindex');
  const frame = await (await page.waitForSelector('iframe')).contentFrame();
  await frame.waitForFunction(() => window.game?.reveal?.step === 0 && !!window.game.world.intro?.text, null, { timeout: 120000 });
  await frame.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await frame.locator('canvas').focus();
  await page.keyboard.press('Enter');
  await frame.waitForFunction(() => window.game?.reveal?.step === 2);
  const before = await frame.evaluate(() => window.game.player.position.toArray());
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowUp');
  const after = await frame.evaluate(() => window.game.player.position.toArray());
  assert(Math.hypot(...after.map((n,i) => n - before[i])) > 0.5);
  result.movement = { before, after };
  result.checks.push('keyboard-physical-movement');
  await frame.locator('.js-menu-trigger').click();
  await frame.locator('.js-menu.is-visible').waitFor();
  for (const name of ['home', 'options', 'controls', 'achievements', 'circuit', 'whispers', 'behindTheScene']) {
    await frame.locator(`.js-navigation-item[data-name="${name}"]`).click();
    await frame.locator(`.js-menu .${name}-content.is-visible`).waitFor();
    result.checks.push('navigation-' + name);
  }
  await frame.locator('.js-navigation-item[data-name=options]').click();
  await page.waitForTimeout(500);
  const quality = await frame.evaluate(() => window.game.quality.level);
  await frame.locator('.js-quality-toggle').click();
  assert.notEqual(await frame.evaluate(() => window.game.quality.level), quality);
  await frame.locator('.js-quality-toggle').click();
  assert.equal(await frame.evaluate(() => window.game.quality.level), quality);
  result.checks.push('quality-toggle-and-restore');
  const mute = await frame.evaluate(() => window.game.audio.mute.active);
  await frame.locator('.js-audio-toggle').click();
  assert.notEqual(await frame.evaluate(() => window.game.audio.mute.active), mute);
  await frame.locator('.js-audio-toggle').click();
  assert.equal(await frame.evaluate(() => window.game.audio.mute.active), mute);
  result.checks.push('audio-mute-toggle-and-restore');
  assert.equal(await frame.locator('.js-server span').innerText(), 'Offline');
  result.checks.push('server-offline-truthful');
  await frame.locator('.js-menu .js-close').first().click();
  await frame.waitForSelector('html.input-filter-wandering');
  result.checks.push('close-restores-driving');
  assert.equal(result.pageErrors.length, 0);
  result.pass = true;
} catch (error) {
  result.error = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(new URL('../reference/verification/controls-checks.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
