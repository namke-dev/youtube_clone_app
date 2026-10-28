const assert = require('node:assert/strict');

// Emulates the browser signals and safe-area dimensions of an installed app.
// Actual iOS system chrome still needs checking on a physical iPhone.
module.exports = async function checkStandalone(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile Safari/604.1' });
    Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/saved');
  await page.locator('.header').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('standalone')), true, 'Home Screen launch uses the standalone appearance');
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#000000');
  await page.evaluate(() => document.documentElement.style.setProperty('--safe-top', '59px'));
  await page.waitForFunction(() => document.querySelector('.header').getBoundingClientRect().y === 59);
  assert.deepEqual(await page.evaluate(() => {
    const bar = getComputedStyle(document.body, '::before');
    return { background: bar.backgroundColor, height: bar.height, page: getComputedStyle(document.getElementById('root')).backgroundColor };
  }), { background: 'rgb(0, 0, 0)', height: '59px', page: 'rgb(251, 251, 253)' });
  await page.screenshot({ path: '/tmp/devtubes-standalone-status.png', fullPage: true });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', '0px');
    root.style.setProperty('--safe-left', '59px');
    root.style.setProperty('--safe-right', '59px');
  });
  await page.waitForFunction(() => document.querySelector('.header').getBoundingClientRect().x === 59);
  const landscapeHeader = await page.locator('.header').boundingBox();
  assert.equal(landscapeHeader.width, 726, 'Landscape header avoids both side safe areas');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', '59px');
    root.style.setProperty('--safe-left', '0px');
    root.style.setProperty('--safe-right', '0px');
    window.scrollTo(0, 0);
  });

  await page.evaluate(require('./youtube-sdk.cjs'));
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Shorts', exact: true }).click();
  await page.locator('.short-card[data-active="true"]').waitFor();
  const feed = await page.locator('.shorts-feed').boundingBox();
  const dock = await page.locator('.bottom-nav').boundingBox();
  assert.ok(feed.y >= 59 && feed.y + feed.height < dock.y, 'Shorts fits between the status area and dock');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  await page.goto('http://127.0.0.1:4173/video/test0');
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).waitFor();
  await page.evaluate(() => document.documentElement.style.setProperty('--safe-top', '59px'));
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains('video-expanded'));
  const player = await page.locator('.player').boundingBox();
  assert.equal(player.y, 59, 'Expanded video stays below the system status area');
  assert.equal(player.height, 785);
  const stageWidth = await page.locator('.player-stage').evaluate(element => element.clientWidth);
  assert.equal(stageWidth, 785, 'Rotated video uses the remaining safe viewport');
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('video-expanded'));
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#000000', 'Standalone theme stays black after leaving fullscreen');
};
