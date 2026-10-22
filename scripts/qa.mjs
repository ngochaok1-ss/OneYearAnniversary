// Browser QA uses the caller's Playwright installation, never a production dependency.
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const argument = name => { const index=process.argv.indexOf(name); return index === -1 ? undefined : process.argv[index + 1]; };
const { chromium } = require(argument('--playwright') || process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const baseURL = process.env.QA_URL || 'http://127.0.0.1:5173';
const output = new URL('../qa-artifacts/', import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
const errors = [];

async function bounds(page, phase) {
  const result = await page.evaluate(() => {
    const book = document.querySelector('#album').getBoundingClientRect();
    const cover = document.querySelector('.front-cover').getBoundingClientRect();
    const button = document.querySelector('#open-button').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, book: book.toJSON(), cover: cover.toJSON(), button: button.toJSON() };
  });
  if (result.scrollHeight > result.height + 1) console.log('Overflow details:', await page.evaluate(() => Object.fromEntries(['.opening-scene','.scene-header','.scene-content','.scene-eyebrow','.album-stage','.invitation-block','.scene-footer'].map(selector => [selector, { rect:document.querySelector(selector).getBoundingClientRect().toJSON(), css:getComputedStyle(document.querySelector(selector)).height }]))));
  assert.ok(result.scrollWidth <= result.width, `${phase}: horizontal overflow`);
  assert.ok(result.scrollHeight <= result.height + 1, `${phase}: vertical overflow`);
  assert.ok(result.cover.left >= -1 && result.cover.right <= result.width + 1, `${phase}: cover outside viewport ${JSON.stringify(result.cover)}`);
  assert.ok(result.book.top >= 0 && result.book.bottom <= result.height, `${phase}: book outside viewport`);
  assert.ok(result.button.bottom <= result.height && result.button.left >= 0, `${phase}: CTA outside viewport`);
  return result;
}

try {
  for (const [name, width, height] of [['desktop',1440,1000],['laptop',1280,720],['mobile',375,812],['small-mobile',320,568],['tablet',768,1024],['landscape',812,375]]) {
    if ((argument('--only') || process.env.QA_ONLY) && (argument('--only') || process.env.QA_ONLY) !== name) continue;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 768 });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${name}: ${response.status()} ${response.url()}`); });
    await page.goto(baseURL);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1950);
    const closed = await bounds(page, `${name}/closed`);
    assert.equal(await page.locator('#album').getAttribute('aria-expanded'), 'false');
    await page.screenshot({ path: new URL(`${name}-closed.png`, output).pathname, fullPage: true });
    await page.evaluate(() => {
      window.callbackCount = 0;
      document.addEventListener('album:opened', () => window.callbackCount++);
    });
    // Both triggers hit the same guard: additional programmatic opens are ignored.
    if (name === 'mobile') await page.locator('#album').tap({ force: true });
    else await page.locator('#open-button').click();
    assert.equal(await page.evaluate(() => window.anniversaryOpening.open()), false);
    assert.equal(await page.locator('#open-button').isDisabled(), true);
    await page.waitForTimeout(1000);
    await bounds(page, `${name}/opening`);
    await page.waitForFunction(() => document.querySelector('#opening-scene').dataset.state === 'opened');
    const opened = await bounds(page, `${name}/opened`);
    assert.equal(await page.evaluate(() => window.callbackCount), 1);
    assert.equal(await page.locator('#album').getAttribute('aria-expanded'), 'true');
    await page.waitForTimeout(300);
    await page.screenshot({ path: new URL(`${name}-opened.png`, output).pathname, fullPage: true });
    results.push({ name, closed, opened });
    await context.close();
  }

  const reduced = await browser.newContext({ viewport:{width:375,height:812}, reducedMotion:'reduce' });
  const page = await reduced.newPage();
  await page.goto(baseURL);
  assert.equal(await page.locator('#motion-toggle').isDisabled(), true);
  assert.equal(await page.locator('.book-float').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.locator('#open-button').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#opening-scene').getAttribute('data-state'), 'opened');
  await bounds(page, 'reduced/opened');
  await page.screenshot({ path:new URL('reduced-opened.png',output).pathname });
  results.push({name:'reduced-motion keyboard',passed:true});
  await reduced.close();

  const context = await browser.newContext({ viewport:{width:1440,height:900} });
  const control = await context.newPage();
  await control.goto(baseURL);
  await control.locator('#motion-toggle').click();
  assert.equal(await control.locator('#motion-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await control.locator('.petal').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
  await control.locator('#motion-toggle').click();
  await control.locator('#album').focus();
  await control.keyboard.press('Space');
  await control.waitForTimeout(500);
  await control.evaluate(() => {
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await control.waitForTimeout(2800);
  assert.equal(await control.locator('#opening-scene').getAttribute('data-state'),'opening');
  await control.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await control.waitForFunction(()=>document.querySelector('#opening-scene').dataset.state==='opened');
  results.push({name:'pause, Space key, hidden-tab suspension',passed:true});
  await context.close();
  assert.deepEqual(errors, []);
  await writeFile(new URL('report.json',output),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({passed:results.map(result=>result.name),errors,screenshots:output.pathname},null,2));
} finally { await browser.close(); }
