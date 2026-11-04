# Dev Tubes · Phase 0: a personal daily edition

Prepared November 4, 2026. This is a reviewable concept; the production application has not been changed.

November 5 follow-up: the [working UI implementation](superpowers/plans/2026-11-05-personal-home-ui.md) brings the editorial layout into the application with live video discovery. The isolated preview below remains a fixed concept, including its sample journeys and notes; those features are not part of this UI release.

## Try it

The [Today preview](http://127.0.0.1:4188/docs/previews/personal-edition/) offers three fixed English-language editions. It adapts to a phone, tablet, or desktop. The source files are in [the preview folder](/Users/namnguyenke/Desktop/dotnet/youtube_clone_app/docs/previews/personal-edition/index.html).

You can switch editions, swap the lead without reshuffling other picks, search and filter the 12 selected pieces, inspect their sources, keep/remove an item, skip/restore journey steps, and keep an optional thought. Publisher links open the real source. Keeps and thoughts live only in the open preview page and reset on reload.

This does not connect a new discovery engine, change your account, play videos in a custom player, or simulate learning progress. It makes no requests to the application's paid discovery service. Remote photographs and publisher artwork load from their original hosts, so images require an internet connection.

If the local preview server has stopped, run the following from the repository and reopen the preview link:

```sh
python3 -m http.server 4188 --bind 127.0.0.1
```

## The three sample editions

| Edition | Selection | Verified video time | Estimated reading | Approximate total |
| --- | --- | --- | --- | --- |
| A little of everything | Icelandic bread; Google's AI recap; Andrew Ng on smaller AI problems; David Gallo's ocean talk | 16:24 | 8 minutes | 24:24 |
| World & science | Pacific storms; forest mapping; November skywatching; ocean life | 5:08 | 16 minutes | 21:08 |
| Culture & food | Icelandic bread; Washoku; food and cities; cultural assumptions | 17:48 | 7 minutes | 24:48 |

Totals include every selected piece, including optional pieces. Video lengths are publisher metadata, not rounded guesses. Reading times are editorial estimates and marked with `~`; opening a full source can take longer. An individual lead swap updates the total.

The samples are alternatives for reviewing the product's rhythm, not three scheduled dates or a live personalized briefing.

## What to judge

1. Is there a first choice you actually want to open within about 30 seconds?
2. Does a session offer both relevance and an opening beyond your normal interests?
3. Does the amount feel comfortable for 20–30 minutes?
4. Does the UI help you decide through its subject, image, source, date, and time?
5. Is a small journey inviting, or does it feel like an assignment?

The key content choice still to calibrate is depth. Andrew Ng's 2022 talk is deliberately labeled background and may be too introductory for you; a current technical demonstration could replace it in the eventual product. The mixed reading/video format is also a proposal to test. These samples emphasize science and environment; a complete world desk would need additional sources for consequential social, economic, and international developments.

## Content inventory and source checks

All 12 destinations were checked on November 4, 2026. Source identity, available date metadata, and media duration were checked; this is not independent verification of every claim in every piece.

| Piece / source | Date basis | Format / time | Editorial role |
| --- | --- | --- | --- |
| [Icelandic geothermal baking · Great Big Story](https://greatbigstory.com/would-you-try-the-icelandic-bread-baked-with-lava/) | Published Oct 29, 2024 | Read, ~4 min | Place, food, and everyday life |
| [October AI recap · Google](https://blog.google/innovation-and-ai/technology/ai/google-ai-updates-october-2026/) | Published Nov 2, 2026; events span October | Read, ~4 min | Recent company recap; distinguish announcements from available releases |
| [Smaller business AI · Andrew Ng / TED](https://www.ted.com/talks/andrew_ng_how_ai_could_empower_any_business) | Published Sep 27, 2022 | Watch, 11:16 | Evergreen practical framing |
| [Ocean life · David Gallo / TED](https://www.ted.com/talks/david_gallo_underwater_astonishments) | Published Jan 11, 2008 | Watch, 5:08 | Visual wonder |
| [Pacific storm context · NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/the-pacifics-busy-storm-season/) | Published Nov 3, 2026; lead observation Oct 29 | Read, ~5 min | Current observation with geographical context |
| [Forest types · Google DeepMind](https://deepmind.google/blog/beyond-tree-cover-mapping-the-worlds-forest-types/) | Published Oct 22, 2026 | Read, ~7 min | Technology connected to landscapes; outside the seven-day window |
| [November skywatching · NASA](https://science.nasa.gov/solar-system/skywatching/whats-up-november-2026-skywatching-tips-from-nasa/) | Published Nov 2, 2026 | Read, ~4 min | A discovery to take outside |
| [Food and cities · Carolyn Steel / TED](https://www.ted.com/talks/carolyn_steel_how_food_shapes_our_cities) | Published Oct 5, 2009 | Watch, 15:23 | Connect food, history, and urban life |
| [Cultural assumptions · Derek Sivers / TED](https://www.ted.com/talks/derek_sivers_weird_or_just_different) | Published Jan 29, 2010 | Watch, 2:25 | A short perspective shift |
| [Washoku · UNESCO / Japanese nomination](https://ich.unesco.org/en/RL/washoku-traditional-dietary-culture-of-the-japanese-notably-for-the-celebration-of-new-year-00869) | Inscribed 2013; page publication date unverified | Read, ~3 min | Food as a shared cultural practice |
| [Open weights · Mistral](https://mistral.ai/news/mistral-large-4-oss/) | Published Oct 29, 2026 | Read, ~5 min | Another provider's announcement; independent evaluation still needed |
| [Dwarf galaxies · NASA Hubble team](https://science.nasa.gov/missions/hubble/nasas-hubble-uncovers-case-of-missing-oxygen-in-nearby-dwarf-galaxies/) | Published Nov 2, 2026 | Read, ~5 min | Recent science; alternative to the default lead |

Exact TED durations came from each talk's `VideoObject` metadata. Names and dates are displayed from these fixed records. No popularity, credibility score, learning score, or progress was invented.

## The visual direction

The interface uses the Editorial greeting direction, seed `386475640`, adapted to a personal media home. Its core is a calm frame, changing content spans, real subject imagery, and a visible time budget. The existing Manrope face and Material UI icon language are retained. Four destination labels make the next action clear: Today, Explore, Journeys, Library.

The prominent image belongs to its linked piece. Original titles, source context, and image credits remain accessible from the story details and Sources view. The preview links publisher-hosted images; their rights remain with their owners. A public release needs an appropriate image-reuse policy rather than assuming that a source link grants a republication license.

Google DeepMind's forest cover is labeled an illustration. NASA's skywatching cover is identified as a 2021 archive photograph by NASA/Preston Dyches, CC BY-NC 2.0. A 2013 UNESCO inscription is not shown as a page publication date. A recent roundup is not presented as if every event happened on its publication day.

## Checks performed

- JavaScript syntax checks passed for both preview scripts.
- Data checks passed for 12 unique IDs, HTTPS source links, non-future publication dates where known, valid durations, unique items within each edition, valid references, and 20–30 minute sample budgets.
- Live browser checks covered the three editions, a lead swap preserving other picks, keep/remove and empty library, source details, search results and empty search, topic filters, journey skip/restore, and a saved thought visible in the preview library.
- Phone checks at 390 × 844 showed the lead action above the persistent navigation. A narrow 320-pixel check had a two-line lead heading and no horizontal overflow. Tablet navigation collapsed at 768 pixels; desktop was reviewed at 1440 pixels. The final tablet composition uses a full-width lead and paired context items to avoid a large empty column.
- Representative publisher images loaded, including the NASA satellite image. No browser console errors were captured in the checked session.

The application unit tests and production build were not rerun because the live application's source, dependencies, and configuration are untouched. Physical iPhone behavior, external playback, API retrieval, personalization, and cross-device continuity remain outside this concept preview.

## Recommended next step

Use the preview to settle the editorial balance and first-screen composition. Then implement the small Today experience inside the existing application, preserving search, guest behavior, saved data, and the recent playback work. The [full review and roadmap](/Users/namnguyenke/Desktop/dotnet/youtube_clone_app/docs/2026-11-04-personal-discovery-review-and-refinement-plan.md) describes the later stages.
