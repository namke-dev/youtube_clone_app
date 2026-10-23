# Dev Tubes — approved Quiet Cinema implementation

Source: https://www.figma.com/design/Ek0NyWC7fkcBu8SXUfbRFZ

User approved implementation and production deployment. Preserve React 18 / CRA / React Router and existing search, video, channel and comment API shapes.

1. Add quota-conscious API access: same-origin Vercel function, allowlisted read endpoints, caching, explicit errors. Keep existing Vercel environment variable as a server-only fallback; no browser credential.
2. Implement responsive discovery, search, watch and channel views in the approved visual language. Use live API thumbnails rather than illustrative Figma video placeholders. Native YouTube controls remain authoritative.
3. Saved videos and watched history are local-device features with clear labels and deletion controls. No fake account, subscriptions, personalized recommendations or writable YouTube likes.
4. Validate API errors/cache, storage corruption/deduplication and routing; production build; browser checks at desktop/mobile widths.
5. Commit to isolated feature branch; inspect Vercel Git linkage before production release. If team access remains blocked, preserve verified work and report exact blocker.

Access findings: Vercel project namke-youtube rejects team-scoped inspection (403). Figma Starter read limit reached after home/mobile retrieval. Watch layout is available in prior conversation render. Static Figma asset downloads return network 'Site Unavailable'; use existing MUI icons and dynamic video imagery.

## Verification outcome

- Four API-cache and browser-storage unit tests passed.
- Three server proxy tests passed (method/route validation, missing configuration, upstream errors/cache headers).
- Optimized CRA production build passed. Existing CRA/Node deprecation and Browserslist database notices remain.
- Headless Chromium checks passed at 1440px and 390px: discovery layout, no horizontal mobile overflow, search, video/channel mixed results and deduplication, saved persistence/removal, comments/related requests on demand, empty/quota states, and channel routes. No uncaught JavaScript errors.
- Browser checks use mock provider data; live RapidAPI responses and actual YouTube playback are not verified.
- Independent review found the video-only creator search regression; fixed mixed results and added browser coverage.
- Manrope is bundled locally. MUI Emotion peer dependencies are explicit for reproducible installs.
- Production release remains blocked by Vercel 403 for namke-devs-projects. The authorization helper suggested by the connector is not exposed in this session.
