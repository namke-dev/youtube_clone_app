const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const express = require("express");
  const app = express();
  app.use(express.static("build"));
  app.get("*", (req, res) => res.sendFile(process.cwd() + "/build/index.html"));
  const server = await new Promise((resolve) => {
    const s = app.listen(4173, "127.0.0.1", () => resolve(s));
  });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requests = [];
  const img =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#244852"/><circle cx="600" cy="130" r="80" fill="#96c3c4"/><path d="M0 450L240 60L550 450Z" fill="#3b747a"/></svg>',
    );
  const item = (n) => ({
    id: { videoId: "test" + n },
    snippet: {
      title: [
        "The beauty of making less",
        "Inside the next creative frontier",
        "A place to clear your mind",
      ][n % 3],
      channelId: `channel${Math.floor(n / 2) + 1}`,
      channelTitle: "Field Journal",
      thumbnails: { high: { url: img } },
      description: "A slower perspective on a world in motion.",
      publishedAt: "2025-01-01T00:00:00Z",
    },
  });
  await page.route("**/api/youtube?**", async (route) => {
    const endpoint = new URL(route.request().url()).searchParams.get(
      "endpoint",
    );
    requests.push(endpoint);
    const path = endpoint.split("?")[0];
    if (new URLSearchParams(endpoint.split('?')[1]).get('q')?.includes('#shorts')) {
      const start = endpoint.includes('pageToken') ? 106 : 100;
      return route.fulfill({json: {
        items: Array.from({length: 6}, (_, i) => ({...item(start + i), id: {videoId: `short${String(start + i).padStart(6,'0')}`}, isShort: true,
          snippet: {...item(start + i).snippet, title: `An idea in a minute #shorts ${start + i}`}})),
        ...(!endpoint.includes('pageToken') ? {nextPageToken: 'shorts-next'} : {})
      }});
    }
    if (endpoint.includes("q=quota"))
      return route.fulfill({ status: 429, json: { error: "limit" } });
    if (endpoint.includes("q=creators"))
      return route.fulfill({
        json: {
          items: [
            {
              id: { channelId: "creator-result" },
              snippet: {
                title: "Creator result",
                thumbnails: { high: { url: img } },
              },
            },
            item(0),
          ],
          ...(!endpoint.includes("pageToken") ? { nextPageToken: "next" } : {}),
        },
      });
    if (endpoint.includes("q=empty"))
      return route.fulfill({ json: { items: [] } });
    if (path === "videos")
      return route.fulfill({
        json: {
          items: [
            {
              ...item(0),
              id: "test0",
              statistics: { viewCount: "12000", likeCount: "250" },
            },
          ],
        },
      });
    if (path === "channels")
      return route.fulfill({
        json: { items: [{ ...item(0), id: "channel1" }] },
      });
    if (path === "commentThreads")
      return route.fulfill({
        json: {
          items: [
            {
              id: "comment",
              snippet: {
                topLevelComment: {
                  snippet: {
                    authorDisplayName: "Reader",
                    textOriginal: "A thoughtful film.",
                  },
                },
              },
            },
          ],
        },
      });
    return route.fulfill({
      json: {
        items: [
          ...Array.from({ length: 6 }, (_, n) => item(n)),
          { ...item(99), id: { videoId: "short-result" }, isShort: true },
        ],
        ...(!endpoint.includes("pageToken") ? { nextPageToken: "second" } : {}),
      },
    });
  });
  await page.route("**/youtube.com/**", (route) => route.abort());
  await page.goto("http://127.0.0.1:4173");
  await page.getByRole("heading", { name: "Worth your time" }).waitFor();
  await page.locator(".video-card").first().waitFor();
  assert.equal(await page.locator(".video-card").count(), 6);
  assert.equal(await page.locator('a[href="/video/short-result"]').count(), 0);
  assert.equal(await page.locator('.header a[href="/account"]').count(), 1);
  assert.equal(await page.locator('.chips a[href="/account"], .sidebar a[href="/account"]').count(), 0);
  const desktopAccount = await page.locator('.header a[href="/account"]').boundingBox();
  assert.ok(Math.abs(desktopAccount.x + desktopAccount.width - (1440 - 24)) < 1);
  const initialCalls = requests.length;
  await page.getByRole("button", { name: "Refresh videos" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".video-card").length === 6);
  assert.equal(requests.length, initialCalls);
  await page.screenshot({ path: "/tmp/devtubes-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Explore more videos" }).click();
  await page.waitForFunction(() => !document.querySelector(".load-more"));
  assert.equal(await page.locator(".video-card").count(), 6);
  await page.locator(".video-card .thumbnail").first().click();
  await page.getByRole("button", { name: "Save", exact: true }).waitFor();
  await page.getByRole("checkbox", { name: "Open videos in fullscreen" }).check();
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await page.waitForFunction(() => document.fullscreenElement?.classList.contains("player"));
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.getByRole("link", { name: "Dev Tubes home" }).click();
  await page.locator(".video-card .thumbnail").first().click();
  await page.waitForFunction(() => document.fullscreenElement === document.documentElement);
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => {
    const rect = document.querySelector(".player").getBoundingClientRect();
    return Math.abs(rect.width - innerWidth) < 2 && Math.abs(rect.height - innerHeight) < 2;
  }), true);
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Saved on this device.", { exact: true }).waitFor();
  assert.equal(
    requests.filter((s) => s.startsWith("commentThreads")).length,
    0,
  );
  await page.getByRole("button", { name: "Load comments" }).click();
  await page.getByText("A thoughtful film.").waitFor();
  await page.getByRole("button", { name: "Find related videos" }).click();
  await page.locator(".watch-next .video-card").first().waitFor();
  await page.locator(".watch-next .video-card .thumbnail").first().click();
  await page.waitForFunction(() => document.fullscreenElement === document.documentElement);
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => {
    const rect = document.querySelector(".player").getBoundingClientRect();
    return document.documentElement.classList.contains("video-fullscreen") &&
      Math.abs(rect.width - innerWidth) < 2 && Math.abs(rect.height - innerHeight) < 2;
  }), true);
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.screenshot({ path: "/tmp/devtubes-watch.png", fullPage: true });
  await page.getByRole("link", { name: "Open saved videos" }).click();
  await page.locator(".video-card").first().waitFor();
  assert.equal(await page.locator(".video-card").count(), 1);
  await page.reload();
  await page.locator(".video-card").first().waitFor();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("heading", { name: "Something worth coming back to." })
    .waitFor();
  await page.goto("http://127.0.0.1:4173/search/quota");
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /request limit/);
  await page.goto("http://127.0.0.1:4173/search/empty");
  await page.getByRole("heading", { name: "Nothing here yet." }).waitFor();
  await page.goto("http://127.0.0.1:4173/search/creators");
  await page.locator(".channel-result").waitFor();
  assert.equal(await page.locator(".channel-result").count(), 1);
  await page.getByRole("button", { name: "Explore more videos" }).click();
  await page.waitForFunction(() => !document.querySelector(".load-more"));
  assert.equal(await page.locator(".channel-result").count(), 1);
  assert.ok(
    requests.some(
      (s) => s.includes("type=video,channel") && s.includes("q=creators"),
    ),
  );
  await page.goto("http://127.0.0.1:4173/channel/channel1");
  await page.locator(".channel-heading").waitFor();
  await page.locator(".video-card").first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173");
  await page.locator(".hero").waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const phoneAccount = await page.locator('.header a[href="/account"]').boundingBox();
  assert.ok(Math.abs(phoneAccount.x + phoneAccount.width - (390 - 14)) < 1);
  assert.equal(phoneAccount.height, 28);
  assert.equal((await page.locator(".header").boundingBox()).height, 32);
  assert.equal(await page.locator(".header .header-saved").isVisible(), false);
  await page.screenshot({ path: "/tmp/devtubes-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open search" }).click();
  await page
    .getByRole("searchbox")
    .count()
    .then(async (n) => {
      const input = page.getByRole("textbox", { name: "Search videos" });
      await input.fill("architecture");
      await input.press("Enter");
    });
  await page
    .getByRole("heading", { name: "Results for “architecture”" })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  // Simulate iPhone's missing element Fullscreen API, rather than only resizing Chrome.
  await page.evaluate(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: undefined });
    document.documentElement.requestFullscreen = undefined;
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1" });
  });
  await page.locator(".video-card .thumbnail").first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains("video-expanded"));
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => {
    const rect = document.querySelector(".player").getBoundingClientRect();
    const stage = document.querySelector(".player-stage");
    return !document.fullscreenElement && Math.abs(rect.width - innerWidth) < 2 && Math.abs(rect.height - innerHeight) < 2 &&
      getComputedStyle(stage).transform !== "none" && Math.abs(stage.clientWidth - innerHeight) < 2 && Math.abs(stage.clientHeight - innerWidth) < 2;
  }), true);
  await page.getByRole("button", { name: "Rotate view", exact: true }).click();
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".player-stage")).transform), "none");
  await page.getByRole("button", { name: "Rotate view", exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".player-stage")).transform), "none");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#000000');
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'black-translucent');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.fullscreen-exit')).opacity==='0');
  // Invisible corner buttons first wake the controls; a second tap activates them.
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('video-expanded')),true);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.fullscreen-exit')).opacity==='1');
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains("video-expanded"));
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#fbfbfd');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(251, 251, 253)');
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("video-expanded"));
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => !document.documentElement.classList.contains("video-expanded"));
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#fbfbfd');
  // Guest favorites persist, shape For you, and refresh without provider calls.
  await page.goto("http://127.0.0.1:4173/account");
  await page.getByRole("heading", {name:"Your favorite topics",exact:true}).waitFor();
  assert.equal(await page.getByRole("button", {name:"Continue with Google",exact:true}).isVisible(), true);
  await page.getByRole("button", {name:"AI",exact:true}).click();
  await page.getByRole("button", {name:"Save topics",exact:true}).click();
  await page.locator(".video-card").first().waitFor();
  assert.equal(await page.locator(".chips .chip").count(), 2);
  assert.equal(await page.locator(".chips .chip").last().textContent(), "AI");
  const personalizedCalls = requests.length;
  await page.getByRole("button", {name:"Refresh videos",exact:true}).click();
  await page.waitForTimeout(100);
  assert.equal(requests.length, personalizedCalls);
  await page.reload();
  await page.locator(".video-card").first().waitFor();
  assert.equal(await page.locator(".chips .chip").last().textContent(), "AI");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
  await page.screenshot({path:"/tmp/devtubes-personalized-phone.png",fullPage:true});
  await page.locator('.header a[href="/account"]').click();
  assert.equal(await page.getByRole("button", {name:"AI",exact:true}).getAttribute("aria-pressed"),"true");
  await page.screenshot({path:"/tmp/devtubes-account-phone.png",fullPage:true});
  const presets = await page.locator('.favorite-option').all();
  let extraSelections = 0;
  for (const preset of presets) {
    if (await preset.textContent() !== 'AI' && extraSelections < 9) {
      await preset.click(); extraSelections++;
    }
  }
  await page.getByRole('textbox', {name:'New topic',exact:true}).fill('C++ / .NET');
  await page.getByRole('button', {name:'Add topic',exact:true}).click();
  assert.equal(await page.getByRole('button', {name:'C++ / .NET',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('textbox', {name:'New topic',exact:true}).fill('W'.repeat(80));
  await page.getByRole('button', {name:'Add topic',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
  await page.screenshot({path:'/tmp/devtubes-custom-topics-phone.png',fullPage:true});
  await page.getByRole('button', {name:'Save topics',exact:true}).click();
  await page.locator('.video-card').first().waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('devtubes:favorites')).length),12);
  assert.equal(await page.locator('.chips a[href="/account"]').count(),0);
  const customTopic = page.locator('.chips a').filter({hasText:'C++ / .NET'});
  await customTopic.click();
  await page.getByRole('heading',{name:'C++ / .NET',exact:true}).waitFor();
  assert.equal(await page.locator('.chips .selected').textContent(),'C++ / .NET');
  assert.ok(requests.some(endpoint=>endpoint.includes('q=c%2B%2B%20%2F%20.net')));
  // The same phone dock belongs to the app shell, including standalone pages.
  for (const path of ['/video/test0', '/channel/channel1', '/account', '/not-a-page']) {
    await page.goto('http://127.0.0.1:4173' + path);
    const dock = page.getByRole('navigation', {name:'Mobile navigation'});
    await dock.waitFor();
    assert.equal(await page.locator('.bottom-nav').count(),1);
    assert.equal(await dock.getByRole('link').count(),5);
    assert.ok(await page.locator('#main').evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom)) >= 112);
    const dockBox=await dock.boundingBox();
    assert.ok(dockBox.x > 0 && dockBox.x+dockBox.width < 390 && dockBox.y+dockBox.height < 844);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    if(path==='/video/test0') await page.screenshot({path:'/tmp/devtubes-watch-navigation-phone.png',fullPage:true});
  }
  // Keep ReactPlayer real, replacing only the remote YouTube SDK boundary.
  await page.evaluate(require('./youtube-sdk.cjs'));
  // Shorts has its own phone navigation destination and snap-scrolling feed.
  await page.getByRole('navigation', {name:'Mobile navigation'}).getByRole('link', {name:'Shorts',exact:true}).click();
  await page.locator('.short-card[data-active="true"]').waitFor();
  const assertPortraitFrames = async () => {
    await page.waitForFunction(() => {
      const live = document.querySelector('.short-live-slot .short-player')?.getBoundingClientRect();
      const slot = document.querySelector('.short-card[data-active="true"] .short-poster')?.getBoundingClientRect();
      return live && slot && ['x','y','width','height'].every(key=>Math.abs(live[key]-slot[key])<1);
    });
    const frames = await page.locator('.short-player, .short-poster').evaluateAll(elements => elements.map(el => {
      const {width,height} = el.getBoundingClientRect();
      const media = el.closest('.short-media').getBoundingClientRect();
      return {width,height,availableWidth:media.width,availableHeight:media.height,controlsBelow:innerWidth<=640 ? 0 : 52};
    }));
    for (const frame of frames) {
      assert.ok(Math.abs(frame.width / frame.height - 9 / 16) < 0.005,'Shorts players and posters keep a 9:16 ratio');
      assert.ok(frame.width <= frame.availableWidth && frame.height + frame.controlsBelow <= frame.availableHeight + 1,'Portrait video and controls fit in the available space');
    }
  };
  const shortsCalls = requests.length;
  await page.getByRole('button',{name:'Play Short',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Play Short',exact:true}).textContent(),'Play with sound');
  await page.getByRole('button',{name:'Play Short',exact:true}).click();
  await page.getByRole('button',{name:'Pause Short',exact:true}).waitFor();
  const persistentIframe=await page.locator('.short-live-slot iframe').elementHandle();
  assert.equal(await page.evaluate(()=>window.__shortsPlayerInstances.at(-1).isMuted()),false);
  // Sound enabled with YouTube's own control must update our setting as well.
  await page.getByRole('button',{name:'Mute Short',exact:true}).click();
  await page.getByRole('button',{name:'Turn sound on',exact:true}).waitFor();
  await page.evaluate(()=>window.__shortsPlayerInstances.at(-1).unMute());
  await page.getByRole('button',{name:'Mute Short',exact:true}).waitFor();
  const firstShort = await page.locator('.short-card[data-active="true"]').getAttribute('data-video-id');
  await page.locator('.short-card[data-active="true"] .short-scroll-rail').hover();
  await page.mouse.wheel(0, await page.locator('.shorts-feed').evaluate(el => el.clientHeight));
  await page.waitForFunction(id => document.querySelector('.short-card[data-active="true"]')?.dataset.videoId !== id, firstShort);
  assert.equal(requests.length,shortsCalls);
  assert.equal(await persistentIframe.evaluate(el=>el===document.querySelector('.short-live-slot iframe')),true,'Swiping reuses the unlocked iframe');
  await page.waitForFunction(()=>window.__shortsPlayerInstances.at(-1).state===1);
  assert.equal(await page.evaluate(()=>window.__shortsPlayerInstances.at(-1).isMuted()),false);
  assert.equal(await page.evaluate(()=>window.__shortsPlayerInstances.length),1);
  await page.getByRole('button',{name:'Refresh Shorts',exact:true}).click();
  await page.locator('.short-card[data-active="true"]').waitFor();
  assert.equal(requests.length,shortsCalls);
  for (const width of [320,390,430]) {
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const dock=page.getByRole('navigation',{name:'Mobile navigation'});
    for(const link of await dock.getByRole('link').all()) assert.ok((await link.boundingBox()).width>=44);
    const feedBox=await page.locator('.shorts-feed').boundingBox();
    const dockBox=await dock.boundingBox();
    assert.ok(feedBox.y+feedBox.height<dockBox.y);
    const playerBox=await page.locator('.short-live-slot .short-player').boundingBox();
    assert.ok(playerBox.height >= (width===320 ? 440 : 540),'Phone Shorts gives the portrait video most of the available screen');
    assert.ok(playerBox.y <= 125,'Compact phone controls leave space above the video');
    const actions=await page.locator('.short-actions').boundingBox();
    assert.ok(actions.x >= playerBox.x+playerBox.width,'Phone playback controls sit beside the video');
    assert.ok(actions.y+actions.height < feedBox.y+feedBox.height,'Playback controls stay in the visible feed');
    await assertPortraitFrames();
  }
  await page.setViewportSize({width:1440,height:1100});
  await assertPortraitFrames();
  const desktopPlayer=await page.locator('.short-player').boundingBox();
  const desktopActions=await page.locator('.short-actions').boundingBox();
  assert.ok(desktopActions.y >= desktopPlayer.y+desktopPlayer.height,'Desktop playback controls remain below the video');
  await page.setViewportSize({width:320,height:568});
  await assertPortraitFrames();
  const smallFeedBox=await page.locator('.shorts-feed').boundingBox();
  const smallDockBox=await page.locator('.bottom-nav').boundingBox();
  assert.ok(smallFeedBox.y+smallFeedBox.height<smallDockBox.y,'Shorts stays above the dock on a small phone');
  assert.ok((await page.locator('.short-live-slot .short-player').boundingBox()).height>=200,'The embedded player has enough height on a small phone');
  await page.setViewportSize({width:390,height:667});
  await assertPortraitFrames();
  const compactActions=await page.locator('.short-actions').boundingBox();
  const nextArrow=await page.locator('.short-card[data-active="true"] button[aria-label="Previous Short"]').boundingBox();
  assert.ok(compactActions.y+compactActions.height <= nextArrow.y,'Compact phone actions and navigation do not overlap');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/devtubes-shorts-phone.png',fullPage:true});
  const loadedShorts=await page.locator('.short-card').count();
  await page.locator('.shorts-feed').evaluate(el => el.scrollTo({top:el.clientHeight*4,behavior:'instant'}));
  await page.waitForFunction(count=>document.querySelectorAll('.short-card').length===count+6,loadedShorts);
  assert.equal(requests.length,shortsCalls+1);
  await page.waitForTimeout(100);
  assert.equal(requests.length,shortsCalls+1);
  await page.locator('.shorts-feed').evaluate(el => el.scrollTo({top:el.scrollHeight,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelectorAll('.short-card[data-active="true"]').length===0);
  await page.waitForFunction(()=>window.__shortsPlayerInstances.at(-1).state!==1);
  await page.locator('nav[aria-label="Content type"]').getByRole('link',{name:'Videos',exact:true}).click();
  await page.locator('.video-card').first().waitFor();
  assert.equal(await page.locator('.shorts-feed').count(),0);
  await page.setViewportSize({width:1440,height:1100});
  assert.equal(await page.locator('.bottom-nav').isVisible(),false);
  await require('./standalone.cjs')(page);
  assert.deepEqual(errors, []);
  console.log(
    "PASS simulated Home Screen status-area layout; fullscreen button auto-hide/wake and black theme restoration; maximized mobile Shorts area and side controls; persistent Shorts iframe/sound choice and blocked-autoplay recovery; 9:16 Shorts player/poster sizing on desktop and phones; Shorts navigation, snap scrolling, cached refresh and bounded pagination; guest topic selection/persistence/personalized refresh without extra requests, desktop/mobile layout, Shorts filtering, unsupported fullscreen viewport fallback, manual/automatic fullscreen including related-video navigation, search, pagination deduplication, video actions, comments on demand, related videos, saved persistence/removal, quota/empty states, channel routing; no uncaught browser errors.",
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
