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
- Saved videos and watch history live only in the current browser (100 entries each), separately for guests and each signed-in account. They do not sync across devices or import YouTube history. History is recorded when playback starts.
- Google sign-in identifies a Dev Tubes account and syncs favorite-topic preferences. It does not grant access to a user’s YouTube account. YouTube like counts remain read-only; subscriptions, writable likes and comment posting are not implemented.
- The player uses YouTube's controls. Embedded advertising, captions, quality and playback availability remain controlled by YouTube; ad-free or guaranteed 4K playback is not promised.
- Search requests up to 50 candidates per provider call (the provider may return fewer). Home/topic/search selects 24 locally using title relevance, provider order, freshness and exploration noise. Discovery excludes browser-local watch history and caps each channel at two results. Related discovery selects 12 from its cached pool; explicit creator pages keep chronological results, including watched videos.
- Normalized keywords (case and extra whitespace ignored) share a 30-minute in-memory candidate pool per browser tab, separated by video-only versus video/channel searches. Refresh and repeated search submissions re-rank that pool without network requests. Explore more uses remaining eligible candidates first; only explicit pagination requests the next provider page. Expired pools restart at page one, including during pagination. Small or channel-heavy pools may produce fewer than 24 results.
- Search reads are cached for 30 minutes in the browser; other reads and Vercel CDN responses retain their five-minute cache. Browser reloads clear in-memory pools, and guest history covers the latest 100 watched videos. This reduces requests but does not enforce a global 500-call daily budget or share personalized selections across users. Check quota and billing limits in RapidAPI before opening to substantial traffic.
- Ranking exposes `personalInterest(item)`, `watchedPenalty(item)` and `repeatedChannelPenalty(item, selectedChannelCount)` hooks. For you now boosts favorite-topic matches and channels in the current user’s device-local history; the remaining optional penalties default to zero. Guest history exclusion applies independently of these hooks. Comments and related results continue to load only on demand.
- Provider errors, missing configuration, quota exhaustion, empty results and unavailable thumbnails have explicit UI states. No demo videos are shown as live results.

## Playback and Shorts

Videos request autoplay when opened, while keeping YouTube's playback controls available. Desktop playback requests sound as before. Phones/tablets start muted to allow autoplay, with a **Tap for sound** button that unmutes and requests playback directly during the tap. If YouTube reports autoplay blocked, **Tap to play** provides a manual recovery; browser settings or Low Power Mode can still prevent automatic playback. The watch page includes a device-local **Open videos in fullscreen** preference (off by default) and a manual **Fullscreen** button. Automatic fullscreen is requested from normal video-link clicks, including the featured video and saved/history cards; modified clicks and new-tab links keep normal browser behavior. Unsupported or denied fullscreen requests expand the player to the available viewport instead. This supports iPhone browsers without element fullscreen; browser bars may remain visible. YouTube’s own fullscreen control remains available for native video fullscreen. On mobile, fullscreen requests landscape orientation where supported. In portrait view on iPhone, the inner player rotates to a landscape viewing layout; physically turning the phone to landscape removes that visual rotation. **Rotate view** switches this layout when needed. Explicit portrait dimensions are respected; provider responses usually omit source dimensions, so the default is a wide video view. This cannot override the phone’s orientation lock or guarantee native device rotation. Escape or **Exit fullscreen** returns to the page and releases any requested orientation lock.

Discovery/search and related-video ranking exclude explicit provider Shorts flags, Shorts URLs and `#short`/`#shorts` title/description labels without extra API calls. The current provider's search snippets do not consistently identify Shorts: unlabeled Shorts can still appear. Duration alone is not used to exclude ordinary brief videos. Creator pages and saved/history listings remain intact.

## Google sign-in and favorite topics

The application uses the official Supabase JS SDK with Google OAuth, PKCE, persistent sessions and token refresh. Guests can browse and choose device-local topics without configuring login. The account bubble at the top-right of the header opens `/account` on every page. Signed-in users see their initial; guests see the account icon. On phones, Saved remains in the bottom navigation.

Users can save any number of favorite topics, including their own names (up to 80 characters each). Topic editing is available only in account settings through the top-right account bubble. Preferences are stored in `public.user_preferences` under their authenticated user ID. The glass topic bar shows For you plus those favorites (and the current topic, when different). For you sends one compact query of topic names instead of concatenating every topic’s expanded keywords. Large lists use a rotating group within a 150-character provider query budget; all saved topics remain available for local ranking and in the topic bar. A mounted feed keeps its group stable while the 30-minute pool is valid, and refresh can change groups after expiry. Candidates are re-ranked locally using topic affinity and the current user’s local viewing history. Changing favorites can start a new search; refreshing the same query uses the existing 30-minute pool.

### Setup required before live Google login

1. Create/select the intended Supabase project. Run the migrations in `supabase/migrations/` in timestamp order using its SQL editor or migration pipeline. The `custom_topics` migration removes the old eight-topic/total-size caps and validates individual topic names. This enables row-level security: authenticated users can read/insert/update only their own preferences; guests have no table access.
2. In Google Cloud, create a Web application OAuth client and configure the consent screen. Add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as an authorized redirect URI (use the exact callback shown in Supabase). If the Google app is in testing mode, add the intended testers.
3. In Supabase → Authentication → Providers → Google, enable Google and enter that OAuth client ID and secret. Keep the Google secret in Supabase; it never belongs in the frontend or this repository.
4. In Supabase Authentication URL Configuration, set the production Site URL and allow the exact app callbacks: `http://localhost:3000/account`, the local Vercel development origin if used, and `https://YOUR_PRODUCTION_DOMAIN/account`. Add only the preview callbacks you intend to allow.
5. Copy `.env.example` to `.env.local` and fill `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY` with the project URL and public publishable key. The legacy public anon key is also accepted as `REACT_APP_SUPABASE_ANON_KEY`. **Never use a service-role or `sb_secret_` key in a `REACT_APP_` variable.** Keep `RAPIDAPI_KEY` server-only.
6. Add those two public frontend values to the intended Vercel project environments and rebuild/deploy. CRA reads them at build time. A deployment made before adding them will keep Google login unavailable until rebuilt.
7. Verify live Google sign-in, sign-out and preferences across two browsers. Verify user B cannot see user A’s preferences or local library. Verify guest data returns after sign-out. Local automated tests mock the auth/network boundary; they do not prove the external OAuth console settings or SQL migration have been applied.

The local app is configured for Supabase project `mnzeacalgzwuizoqrqtd`, and the preferences migration has been applied there. Public connection values are in ignored `.env.local`; they must also be configured in the deployment environment. Google is enabled using OAuth client “Dev Tubes web” in Google Cloud project `dev-tubes`. Its Google callback is `https://mnzeacalgzwuizoqrqtd.supabase.co/auth/v1/callback`; Supabase Site URL is `https://dev-tubes.vercel.app`, and its exact allowed callbacks are `http://localhost:3000/account` and `https://dev-tubes.vercel.app/account`. Real Google login, session restoration after reload, favorite-topic writes and reads were verified locally in Brave on October 23, 2026. The temporary test topic was removed afterward. The `namke-youtube` Vercel project owns `dev-tubes.vercel.app`; its Production environment now has `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_PUBLISHABLE_KEY` configured as public Config variables. These values take effect only in a new production build containing the account code. Google’s authorized JavaScript origins are `http://localhost:3000` and `https://dev-tubes.vercel.app`; the saved production origin was verified by reopening the OAuth client. No production deployment was triggered. Cross-device sync has not yet been manually checked in a second browser. Saved videos and history remain device-local per user; favorite topics are the cross-device sync feature in this implementation.

## Verification

```sh
CI=true npm test -- --watchAll=false --runInBand
npm run test:proxy
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts its own local static server on port 4173. It mocks provider responses and blocks YouTube network access, covering UI behavior without spending API quota. It does not prove live video playback or the current subscription works. Use `CHROMIUM_PATH=/path/to/chromium npm run test:e2e` for a separately installed browser.

The custom-topics migration has been applied to the connected project. Its authenticated update path was checked with 40 custom topics inside a rolled-back transaction, preserving the existing preferences. The security advisor reports a pre-existing [disabled leaked-password check](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); Google sign-in does not use app passwords.
