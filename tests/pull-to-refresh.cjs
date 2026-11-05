const assert = require('node:assert/strict');

module.exports = async function checkPullToRefresh(page) {
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('[data-edition-pick]').first().waitFor();
  const touch = await page.context().newCDPSession(page);
  const title = await page.locator('h1').boundingBox();
  const y = title.y + title.height / 2;
  const send = (type, top) => touch.send('Input.dispatchTouchEvent',{
    type, touchPoints:type === 'touchEnd' ? [] : [{x:195,y:top}],
  });
  try {
    await page.evaluate(()=>{window.__pullDocument='before-reload';});
    await send('touchStart',y);
    await send('touchMove',y+45);
    await page.getByText('Pull to reload',{exact:true}).waitFor();
    await send('touchEnd');
    await page.locator('.pull-refresh').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>window.__pullDocument),'before-reload','Short pulls leave the document intact');

    await send('touchStart',y);
    await send('touchMove',y+125);
    await page.getByText('Release to reload',{exact:true}).waitFor();
    await page.screenshot({path:'/tmp/devtubes-pull-to-refresh.png'});
    assert.equal(await page.evaluate(()=>window.__pullDocument),'before-reload','Arming does not reload before release');
    const navigation=page.waitForNavigation({waitUntil:'domcontentloaded'});
    await send('touchEnd');
    await navigation;
    await page.locator('[data-edition-pick]').first().waitFor();
    assert.equal(await page.evaluate(()=>window.__pullDocument),undefined,'Releasing a full pull reloads the real document');

    await page.evaluate(()=>{window.__pullDocument='scrolled';window.scrollTo(0,180);});
    await send('touchStart',300);
    await send('touchMove',425);
    await send('touchEnd');
    assert.equal(await page.evaluate(()=>window.__pullDocument),'scrolled','Pulls starting below the top do not reload');
    assert.equal(await page.locator('.pull-refresh').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  } finally {await touch.detach();}
};
