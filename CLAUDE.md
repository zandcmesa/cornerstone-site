# CLAUDE.md — Cornerstone Church Demo Site

## What this is

A pitch demo site for Cornerstone Church MA (East Longmeadow, MA). Built to support a digital agency pitch covering three products: new website, monthly retainer, email campaign solution. Not a real product — standalone HTML files, no build step, no backend.

**GitHub:** `zandcmesa/cornerstone-site` (personal account, not HubSpot)

## Project structure

```
cornerstone-site-upgrade/
  site/                  ← the demo site (this repo)
    index.html
    sermons.html         ← AI-powered sermon archive (main technical showpiece)
    about.html
    groups.html
    events.html
    announcements.html
    give.html
    watch.html
    accessibility.html   ← accessibility statement (footer link only)
    privacy.html         ← privacy policy (footer link only)
    styleguide.html      ← client-facing design system page (not in nav)
    DESIGN.md            ← design system working docs
    css/theme-cornerstone.css  ← tokens only (colors/fonts/spacing/motion) — per-client file
    css/blocks.css       ← generic building blocks (reusable across client sites)
    css/style.css        ← Cornerstone page-specific styles
    js/main.js
    js/pco.js            ← loader: snapshot first, then live worker fetch
    js/pco-data.js       ← generated nightly snapshot (PCO_SNAPSHOT)
    js/events.js         ← event/rhythm/next-step rendering + modal
    js/groups.js         ← group rendering, overrides, modal
    scripts/             ← pco-lib.mjs, sync-pco.mjs, tests, fixtures
    worker/              ← Cloudflare Worker (live proxy)
    js/blocks.js         ← motion engine (reveals, dividers, hero choreography, parallax)
    js/sermons.js        ← all sermon data + filter/modal logic
    images/
      cornerstone-logo.png   ← real church logo (RGBA, 1158×240px)
      cornerstone-mark.svg
    data/
      sermons.json       ← not used (fetch blocked on file://); data is inlined in sermons.js
  transcripts/           ← Vimeo auto-caption text files, one per sermon
    {vimeoId}.txt        ← 25 files for sermons 1–25 (Jun 2026 → Dec 2025)
  vimeo-token.rtf        ← Vimeo Personal Access Token (DO NOT COMMIT)
```

## Brand

- **Brand color:** `#3689C5`
- **Logo:** `images/cornerstone-logo.png` — use at `height="36"` in nav, `height="30"` in footer
- **Tagline:** "To see our region forever transformed by the Gospel"
- **Address:** 15 Kibbe Rd, East Longmeadow, MA · Sundays 10:00am · Foursquare Church
- **Vimeo:** vimeo.com/cornerstonechurchma

## Sermon data

All data is in `js/sermons.js` as `const SERMON_DATA` (currently ~129 entries). Fetch is not used — the file:// protocol blocks it.

All entries 1–129 have real metadata extracted from Vimeo auto-caption transcripts (titles, scripture, series, topics, descriptions). Vimeo retroactively generated auto-captions for all videos going back to 2023.

- Confirmed real series: **Leadership Lessons** (ids 7–11), **Next Level Project** (ids 13–17), **Dependent on the Holy Spirit** (ids 47–53), **Why Our Values Matter** (ids 40–46)
- `series: null` for sermons without an explicit series name in the transcript

Transcripts live in `../transcripts/{vimeoId}.txt` (one file per sermon, VTT stripped to plain text).

### Vimeo API

- **v2 (public, no auth):** `https://vimeo.com/api/v2/cornerstonechurchma/videos.json?page=N`
- **v3 (requires OAuth):** text tracks at `GET /videos/{id}/texttracks`
- **Token:** stored in `../vimeo-token.rtf` (parent dir, not in site/). Value is a Personal Access Token with Public + Private scopes. Never commit it.
- Transcripts were fetched with a bash script hitting the v3 text tracks endpoint, downloading VTT, and stripping it to plain text.

### Adding more sermon data

Automated. `.github/workflows/sync-sermons.yml` runs `scripts/sync-sermons.mjs` (Mon–Wed) which lists the church's Vimeo videos, pulls auto-caption transcripts, extracts metadata with the Claude API (`scripts/sermon-ai.mjs`), flags missing art (art is added at review time with the `/sermon-art` skill through the Artlist connector; `scripts/sermon-art.mjs` is a Gemini path used only if a billed `GEMINI_API_KEY` exists), and force-pushes one `sermon-sync` branch with an open PR. From Oct 4, 2026 `.github/workflows/cut-sermon.yml` runs `scripts/cut-sermon.mjs` on Mondays: finds the Sunday live replay on YouTube (channel `UCl4J6MR32QrZOfk8M_n7wvA`), finds the sermon start/end from timed captions with Claude, downloads and cuts it, uploads privately to Vimeo with captions, then runs the sync. `publish-sermons.yml` flips those uploads public on merge. Setup and secrets: `docs/sermon-automation-setup.md`. Pure helpers live in `scripts/sermon-lib.mjs`; tests run with `npm test`. New entries get `id = maxId + 1` and `loadSermons()` sorts by date, so ids no longer encode order.

Vimeo token lives at `~/grokbot/oasis-creative-studios/cornerstone-church/vimeo-token.rtf` (the `../vimeo-token.rtf` path above is historical). It belongs to Josh Eldridge's personal Vimeo user, not the `cornerstonechurchma` account that holds the videos; Stage B needs an upload-scoped token minted as the church account.

## Sermon art

`images/sermons/` holds one generated typographic graphic per series (`series-<slug>.jpg`) and per standalone sermon (`<id>.jpg`). `sermonArt(s)` in `js/sermons.js` derives the filename; cards use `onerror="this.remove()"` so a missing file degrades to the gradient. Generated with Artlist (Nano Banana Pro, 16:9, 1K); prompts live in `scripts/sermon-art-jobs.json`, download helper is `scripts/dl-art.sh`. For a new sermon: add a row to the jobs file, generate, drop the JPEG in. Check spelling on every render — the model duplicates words or hides letters behind objects about a third of the time.

## Contact form

`js/main.js` posts the contact modal to Formspree (`FORMSPREE_ENDPOINT` at the top of the modal IIFE). Includes a `_gotcha` honeypot. The live form ID is set (`mnpnwblr`); the endpoint is also recorded in the Planning Center Key Google Doc.

## Google Analytics

`js/analytics.js` loads GA4 property `G-B1VETEFTP4` (the same property the old WordPress site used via Site Kit) on every page except `proposal.html`. It only fires when the hostname ends in `cornerstonechurchma.com`, so the GitHub Pages preview and local files stay out of the data. Pastor Josh is Admin on the property, Zand is Editor. The ad agency's Google Ads tag can share this loader later. No cookie banner: the privacy page discloses analytics and there is no legal trigger for a local MA church site.

## Planning Center (live)

`scripts/pco-lib.mjs` normalizes Calendar, Registrations signups, and Groups into one snapshot shape. Two consumers: `.github/workflows/sync-planning-center.yml` runs `scripts/sync-pco.mjs` nightly and commits `js/pco-data.js` (`PCO_SNAPSHOT`); `worker/` is a Cloudflare Worker serving the same shape live with a 5-minute cache. `js/pco.js` renders the snapshot on load, then fetches `PCO_WORKER_URL` and re-renders only if the data differs. `js/events.js` fills `[data-pco-rhythms]`, `[data-pco-events]`, `[data-pco-next-steps]`; `js/groups.js` fills `[data-pco-groups]` and `[data-pco-group-types]`. Curated images/copy for specific groups live in `GROUP_OVERRIDES` keyed by PCO group id. Planning Center photos are never rendered. Tests: `node --test 'scripts/*.test.mjs'` (fixtures in `scripts/fixtures/`, refresh with `scripts/capture-fixtures.mjs`). Deploy steps: `docs/planning-center-setup.md`. Repo secrets `PCO_APP_ID` / `PCO_SECRET` are set; the worker URL still needs pasting into `js/pco.js` after Zand deploys.

## Sermons page (main showpiece)

`sermons.html` + `js/sermons.js`

- **Skeleton loaders** shown on initial load (6 static skeleton cards in HTML, replaced by JS)
- **Filter bar:** search, series, speaker, topic, scripture book — all client-side
- **Video modal:** Vimeo iframe embed, opens on card click, closes on backdrop click / Escape
- **Null-safe series:** `series: null` for unaffiliated sermons; `populateFilters` uses `.filter(Boolean)` so null doesn't appear in the dropdown; search uses `(s.series || '')`

## Nav pattern (all 8 pages)

```html
<nav class="nav scrolled">
  <div class="container">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <img src="images/cornerstone-logo.png" alt="Cornerstone Church" height="36">
      </a>
      <ul class="nav-links">
        <!-- 6 items: Sermons, About, Groups, Events, Announcements, Give (Staff lives on the About page) -->
      </ul>
      <div class="nav-actions">
        <a href="watch.html" class="btn btn-primary btn-sm">Watch Online</a>
      </div>
    </div>
  </div>
</nav>
```

Nav CSS key: `.nav .container { max-width: none; width: 100%; }` — both properties required; `.nav` is `display: flex` which prevents auto-stretch without `width: 100%`.

## Key CSS decisions

- **Design system:** see `DESIGN.md`. CSS loads in three layers — `theme-cornerstone.css` (tokens) → `blocks.css` (generic blocks) → `style.css` (page-specific). `js/blocks.js` drives all scroll motion; load it last.
- Dark theme: `--bg-base: #0d0f14`, warm ivory text. Brand blue tokens are `--brand*` (the legacy `--gold*` names were renamed).
- Motion is authored via `data-reveal` / `data-reveal-stagger` / `.divider-top` / `.divider-bottom` attributes in HTML; no reveal attrs on the sermon archive grid (it re-renders on filter).
- `.nav-inner` uses flexbox: logo (`flex-shrink:0`) | links (`flex:1; justify-content:center`) | actions (`flex-shrink:0`)
- Skeleton shimmer: `@keyframes shimmer` with `background-size: 200% 100%`
- Video modal: `.video-modal-backdrop.open` triggers the overlay; JS clears iframe `src` on close to stop playback

## Accessibility

Audited Oct 2026 (axe-core clean, keyboard-tested). Conventions live in `DESIGN.md` → "Accessibility primitives": landmarks per page, `.sr-only`, `.card-btn` card pattern, `.plain-list` grids, and the shared `window.A11yModal` helper in `js/main.js` that every modal opens/closes through (focus trap, `inert`, focus return). Keep modals outside `<main>`, give every dialog `role="dialog" aria-modal="true" aria-labelledby`, put `aria-hidden="true" focusable="false"` on decorative SVGs, and use `--brand-text` (not `--brand`) for any blue text.

## Speakers

- **Pastor Josh Eldridge** — lead pastor, most sermons
- **Pastor Christine Disibio** — associate pastor, regular preacher
- **Pastor Avi Mizrachi** — guest speaker (May 11, 2025)
- **Bob Hazlett** — guest speaker (Mar 30, 2025)
