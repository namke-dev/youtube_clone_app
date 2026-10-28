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

  await page.addInitScript(require('./youtube-sdk.cjs'));
  await page.goto('http://127.0.0.1:4173/video/abcdefghijk');
  await page.locator('.player iframe').waitFor();
  await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
  await page.waitForFunction(() => window.__shortsPlayerInstances.at(-1).getPlayerState() === 1);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).waitFor();
  await page.evaluate(() => document.documentElement.style.setProperty('--safe-top', '59px'));
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains('video-expanded'));
  const player = await page.locator('.player').boundingBox();
  assert.equal(player.y, 0);
  assert.equal(player.height, 844);
  const portraitViewport = await page.locator('.player-viewport').boundingBox();
  assert.equal(portraitViewport.y, 59);
  assert.equal(portraitViewport.height, 726);
  const stageWidth = await page.locator('.player-stage').evaluate(element => element.clientWidth);
  assert.equal(stageWidth, 726, 'Rotated video uses balanced safe gutters');
  const portraitStage = await page.locator('.player-stage').boundingBox();
  assert.ok(Math.abs(portraitStage.y + portraitStage.height / 2 - 422) < 1, 'Rotated portrait playback stays centered on screen');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', '0px');
    root.style.setProperty('--safe-left', '59px');
    root.style.setProperty('--safe-right', '21px');
    root.style.setProperty('--safe-bottom', '21px');
  });
  const landscapeStage = await page.locator('.player-stage').boundingBox();
  assert.equal(landscapeStage.x, 59, 'Landscape video honors the side safe area');
  assert.equal(landscapeStage.width, 726);
  assert.equal(landscapeStage.height, 348);
  assert.equal(landscapeStage.y, 21);
  assert.equal(landscapeStage.x + landscapeStage.width / 2, 422, 'Unequal side insets cannot shift video left or right');
  assert.equal(landscapeStage.y + landscapeStage.height / 2, 195);
  await page.waitForFunction(() => document.querySelector('.player').classList.contains('fullscreen-controls-hidden'));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.landscape-toggle')).opacity === '0');
  const exitButton = page.getByRole('button', { name: 'Exit fullscreen', exact: true });
  assert.ok(await exitButton.evaluate(element => Number(getComputedStyle(element).opacity)) > 0, 'Exit stays visible after controls fade');
  const exitBox = await exitButton.boundingBox();
  assert.ok(exitBox.width >= 44 && exitBox.height >= 44, 'The compact exit has a phone-sized tap target');
  assert.ok(exitBox.x >= 59 && exitBox.x + exitBox.width <= 823, 'Exit stays within the safe screen area');
  assert.equal(await exitButton.evaluate(element => {
    const rect=element.getBoundingClientRect();
    return document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button')===element;
  }), true, 'The exit is tappable above the embedded iframe');
  await page.screenshot({ path: '/tmp/devtubes-fullscreen-centered-landscape.png' });
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: exitBox.x + exitBox.width / 2, y: exitBox.y + exitBox.height / 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await page.waitForFunction(() => !document.documentElement.classList.contains('video-expanded'));
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#000000', 'Standalone theme stays black after leaving fullscreen');
};
