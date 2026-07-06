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
    css/style.css
    js/main.js
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

All data is in `js/sermons.js` as `const SERMON_DATA` (60 entries). Fetch is not used — the file:// protocol blocks it.

**Entries 1–25** have real metadata extracted from Vimeo auto-caption transcripts:
- Real titles, scripture references, series names, topics, and descriptions
- Confirmed real series: **Leadership Lessons** (ids 7–11, Apr–May 2026), **Next Level Project** (ids 13–17, Mar 2026)
- `series: null` for sermons without an explicit series name in the transcript

**Entries 26–60** have placeholder metadata (no transcripts available for pre-Dec 2025 videos — Vimeo auto-captions weren't enabled then).

### Vimeo API

- **v2 (public, no auth):** `https://vimeo.com/api/v2/cornerstonechurchma/videos.json?page=N`
- **v3 (requires OAuth):** text tracks at `GET /videos/{id}/texttracks`
- **Token:** stored in `../vimeo-token.rtf` (parent dir, not in site/). Value is a Personal Access Token with Public + Private scopes. Never commit it.
- Transcripts were fetched with `fetch_transcripts.sh` (in scratchpad). The script hits the v3 text tracks endpoint, downloads VTT, and strips it to plain text.

### Adding more sermon data

To extend entries 26–60 with real data:
1. The church needs to enable Vimeo auto-captions on older videos — they don't currently exist
2. Once available, run the transcript fetch script and extract metadata with Claude

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

- `.nav-inner` uses flexbox: logo (`flex-shrink:0`) | links (`flex:1; justify-content:center`) | actions (`flex-shrink:0`)
- Body background: `#f0f0f0`; content in white surface cards with `box-shadow`
- Skeleton shimmer: `@keyframes shimmer` with `background-size: 200% 100%`
- Video modal: `.video-modal-backdrop.open` triggers the overlay; JS clears iframe `src` on close to stop playback

## Speakers

- **Pastor Josh Eldridge** — lead pastor, most sermons
- **Pastor Christine Disibio** — associate pastor, regular preacher
- **Pastor Avi Mizrachi** — guest speaker (May 11, 2025)
- **Bob Hazlett** — guest speaker (Mar 30, 2025)
