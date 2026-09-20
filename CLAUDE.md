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
    staff.html
    groups.html
    events.html
    announcements.html
    give.html
    watch.html
    styleguide.html      ← client-facing design system page (not in nav)
    DESIGN.md            ← design system working docs
    css/theme-cornerstone.css  ← tokens only (colors/fonts/spacing/motion) — per-client file
    css/blocks.css       ← generic building blocks (reusable across client sites)
    css/style.css        ← Cornerstone page-specific styles
    js/main.js
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

To add more entries beyond ~129:
1. Fetch more Sunday Sermon videos via the Vimeo v2 API (currently goes back to May 2023)
2. Download transcripts for new vimeoIds to `../transcripts/`
3. Use Claude to extract metadata and append entries to `SERMON_DATA` in sermons.js

## Sermons page (main showpiece)

`sermons.html` + `js/sermons.js`

- **Skeleton loaders** shown on initial load (6 static skeleton cards in HTML, replaced by JS)
- **Filter bar:** search, series, speaker, topic, scripture book — all client-side
- **Video modal:** Vimeo iframe embed, opens on card click, closes on backdrop click / Escape
- **Null-safe series:** `series: null` for unaffiliated sermons; `populateFilters` uses `.filter(Boolean)` so null doesn't appear in the dropdown; search uses `(s.series || '')`

## Nav pattern (all 9 pages)

```html
<nav class="nav scrolled">
  <div class="container">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <img src="images/cornerstone-logo.png" alt="Cornerstone Church" height="36">
      </a>
      <ul class="nav-links">
        <!-- 7 items: Sermons, About, Staff, Groups, Events, Announcements, Give -->
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

## Speakers

- **Pastor Josh Eldridge** — lead pastor, most sermons
- **Pastor Christine Disibio** — associate pastor, regular preacher
- **Pastor Avi Mizrachi** — guest speaker (May 11, 2025)
- **Bob Hazlett** — guest speaker (Mar 30, 2025)
