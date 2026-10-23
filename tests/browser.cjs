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
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains("video-expanded"));
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("video-expanded"));
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => !document.documentElement.classList.contains("video-expanded"));
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
    assert.equal(await dock.getByRole('link').count(),4);
    assert.ok(await page.locator('#main').evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom)) >= 112);
    const dockBox=await dock.boundingBox();
    assert.ok(dockBox.x > 0 && dockBox.x+dockBox.width < 390 && dockBox.y+dockBox.height < 844);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    if(path==='/video/test0') await page.screenshot({path:'/tmp/devtubes-watch-navigation-phone.png',fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1100});
  assert.equal(await page.locator('.bottom-nav').isVisible(),false);
  assert.deepEqual(errors, []);
  console.log(
    "PASS guest topic selection/persistence/personalized refresh without extra requests, desktop/mobile layout, Shorts filtering, unsupported fullscreen viewport fallback, manual/automatic fullscreen including related-video navigation, search, pagination deduplication, video actions, comments on demand, related videos, saved persistence/removal, quota/empty states, channel routing; no uncaught browser errors.",
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
