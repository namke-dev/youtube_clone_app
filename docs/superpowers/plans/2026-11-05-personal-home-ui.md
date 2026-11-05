# Personal home UI implementation plan

**Goal:** Bring the editorial direction from the reviewed preview into the working app for a 20–30 minute personal discovery routine.

**Spec:** [Product review](../../2026-11-04-personal-discovery-review-and-refinement-plan.md), [interactive direction](../../2026-11-04-phase-0-edition-preview.md).

**Scope:** A working Today screen with one large story and three complementary picks; distinct Explore topic browsing; original creator, publication date and duration when supplied. Use live provider results, existing React/CSS, Manrope and existing icons. Keep search, favorites, library ownership, Shorts and fullscreen behavior. The user requested implementation and push directly to main; no deployment commands.

**Design decision:** Continue the preview's editorial greeting direction (seed 386475640). Landscape, technology and culture become three discovery lanes. Today makes a small selection from those lanes rather than repeating an endless grid. Existing custom interests remain available in Explore and topic settings. No static example content is copied into the production feed. “Today” means today's selection, not a claim that each video was published today. A 25-minute target is only shown as an actual total when every duration is known.

**Review focus:** Duplicate results across lanes; partial provider failure; absent/malformed metadata; account changes during requests; phone/tablet navigation and fullscreen compatibility.

- [x] Add selection and metadata tests, observe failures, implement deterministic selection and honest formatting.
- [x] Add Today integration tests for partial failure, local shuffle, distinct picks and account boundaries; implement using the existing cached discovery engine.
- [x] Integrate the route and topic browser; apply responsive editorial layout and readable metadata.
- [x] Run unit/proxy tests, production build, browser regressions and visual checks at desktop/tablet/phone widths. Review the final diff, commit and push main.

No new dependencies, provider parameters, cloud storage, synthetic summaries or forced learning paths in this release. Duration targeting is best effort and cannot guarantee a 20–30 minute selection when the provider omits durations or only returns long videos.

## Implementation review

- Today requests three topic pools through the existing discovery engine, rather than the previous single mixed query. Repeated searches reuse its 30-minute cache. Shuffle changes the selection locally and makes no request. This costs up to three initial search requests per cold session/cache window; no automatic pagination or duration-enrichment requests were added.
- Original publisher titles are shown in full. The design inspector's `headline-lines` check is allowed for these externally supplied titles: shortening a documentary's name to fit two lines would hide useful selection context. The app's own title is one line at all inspected widths.
- First visual pass: the desktop watch action sat at the viewport's lower edge. The lead image now uses a 2:1 desktop crop to bring it into view. Phone headers have an opaque background so scrolling titles do not run behind the controls. Tablet navigation folds into a labelled bar, returning the sidebar width to the stories.
- The home is an editorial greeting (continued seed 386475640): the question is “What should I spend a little time with today?” The signature is a large landscape-led story beside a finite cross-topic selection. Manrope and the existing brand mark remain. Creator-provided video thumbnails are loaded through the existing API; no new stock images or licence assumptions were introduced.
- Real-content review confirmed the provider omits durations in these search responses and may return full documentaries or broad AI commentary. The UI therefore shows unknown lengths explicitly and does not advertise a measured 25-minute edition or a verified current-affairs briefing. Better source selection and metadata enrichment remain product follow-ups.
- Existing fullscreen, Shorts, saved/history ownership, guest favorites, custom topics and search flows are covered by the regression suite. Browser phone checks simulate viewport and unsupported-fullscreen behavior; physical iPhone behavior is unverified.

## Verification

- 123 unit tests across 18 suites passed; three API proxy tests passed.
- Optimized production build compiled successfully. Existing Browserslist data and Node deprecation notices remain; no new dependencies were installed.
- Browser regression suite passed with stubbed provider/YouTube SDK boundaries, including the new Today selection and distinct Explore destinations. Real discovery results were reviewed separately through the existing public application API, cached by the local review server.
- Final design inspector: zero failures and zero warnings at 1440, 768 and 390 pixels, with the original-title wrapping exception described above. All final fold and page screenshots reviewed. Additional 320px checks found no horizontal overflow; the lead watch action was above the phone navigation.
- App-screen critique: the lead answers the selection question first; both columns use the available frame; accent is reserved for topic context and actions; counts and known-duration totals come from displayed picks; no synthetic charts or progress; full names and missing data stay legible; tablet and phone navigation preserve all five destinations. Source quality and missing duration metadata remain the material limits described above.

## Approved iPhone Home Screen follow-up

The installed-app screenshot showed a floating tab bar lifted by `12px + safe-area-inset-bottom` and a blurred dark status-area transition. The follow-up replaces it with a full-width bottom tab bar whose Home-indicator inset is internal padding; the header becomes 48px with 44px actions and a continuous light background. Normal launch no longer forces black/translucent status chrome. Fullscreen hides the app header/tabs, paints the surrounding surfaces black, requests a black system theme/status style, and restores the prior appearance on exit.

Two-finger document gestures and interface text selection are suppressed. Single-finger scrolling, taps and text editing in search/input fields remain available. The YouTube player is an external iframe: its internal controls remain owned by YouTube. iOS can override viewport/gesture and system-chrome behavior, so a physical-device check remains necessary. [WebKit's status-bar guidance](https://bugs.webkit.org/show_bug.cgi?id=317153#c2) supports letting normal status appearance follow the page; no claim is made that desktop emulation proves the iPhone system status bar disappears.

Follow-up verification: 128 unit tests in 19 suites passed, production build compiled, and the browser regression suite passed. Added checks cover the 34px Home-indicator inset inside the tab bar, its full viewport width, light safe-area surface, input-selection exception, installed gesture handlers, hidden app chrome/black surfaces during fullscreen, and restoration after exit. Responsive inspector passed with the same original-title wrapping exception; all final screenshots were reviewed. The Shorts top-offset bound increased by 16px to account for the approved header height while retaining the existing player-size and control-overlap assertions.
