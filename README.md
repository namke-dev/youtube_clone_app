# Dev Tubes

A calm video discovery interface built with React 18, React Router and YouTube embeds. The Quiet Cinema redesign includes responsive discovery, search for videos and creators, video playback, channel pages, browser-local saved videos and watch history.

Design: https://www.figma.com/design/Ek0NyWC7fkcBu8SXUfbRFZ

## Run

```sh
npm ci
npm start
```

`npm start` runs the frontend only. API-backed development requires Vercel's local development server (`vercel dev`) with the project's environment configured. The frontend requests `/api/youtube`; it no longer sends a RapidAPI key to the browser.

## Vercel configuration

Use the existing `namke-youtube` project with the CRA build command (`npm run build`) and output directory (`build`). The root `api/youtube.js` is a Node serverless function. Set `RAPIDAPI_KEY` in the server environment. The existing `REACT_APP_API_KEY` name is accepted by the function for migration compatibility; source code does not reference it in the frontend. Never commit keys.

Verify `/api/youtube?endpoint=search%3Fpart%3Dsnippet%26q%3Ddesign%26maxResults%3D1` returns video metadata in the preview before promoting production. Verify a direct `/video/<id>` page loads and playback works. Vercel team access and the active RapidAPI subscription are required for those live checks.

## API capabilities and limits

- Search, video metadata, channels, related results and read-only comments use the existing `youtube-v31.p.rapidapi.com` service. Endpoint availability depends on the active provider subscription.
- Saved videos and watch history live only in the current browser (100 entries each). They do not sync to a YouTube account. History is recorded when playback starts.
- YouTube like counts are read-only. There is no account login, writable likes, subscriptions or comment posting.
- The player uses YouTube's controls. Embedded advertising, captions, quality and playback availability remain controlled by YouTube; ad-free or guaranteed 4K playback is not promised.
- Search requests up to 50 candidates per provider call (the provider may return fewer). Home/topic/search selects 24 locally using title relevance, provider order, freshness and exploration noise. Discovery excludes browser-local watch history and caps each channel at two results. Related discovery selects 12 from its cached pool; explicit creator pages keep chronological results, including watched videos.
- Normalized keywords (case and extra whitespace ignored) share a 30-minute in-memory candidate pool per browser tab, separated by video-only versus video/channel searches. Refresh and repeated search submissions re-rank that pool without network requests. Explore more uses remaining eligible candidates first; only explicit pagination requests the next provider page. Expired pools restart at page one, including during pagination. Small or channel-heavy pools may produce fewer than 24 results.
- Search reads are cached for 30 minutes in the browser; other reads and Vercel CDN responses retain their five-minute cache. Browser reloads clear in-memory pools, and guest history covers the latest 100 watched videos. This reduces requests but does not enforce a global 500-call daily budget or share personalized selections across users. Check quota and billing limits in RapidAPI before opening to substantial traffic.
- Ranking exposes `personalInterest(item)`, `watchedPenalty(item)` and `repeatedChannelPenalty(item, selectedChannelCount)` hooks; they default to zero until account/progress data is available. Guest history exclusion applies independently of these hooks. Comments and related results continue to load only on demand.
- Provider errors, missing configuration, quota exhaustion, empty results and unavailable thumbnails have explicit UI states. No demo videos are shown as live results.

## Verification

```sh
CI=true npm test -- --watchAll=false --runInBand
npm run test:proxy
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts its own local static server on port 4173. It mocks provider responses and blocks YouTube network access, covering UI behavior without spending API quota. It does not prove live video playback or the current subscription works. Use `CHROMIUM_PATH=/path/to/chromium npm run test:e2e` for a separately installed browser.
