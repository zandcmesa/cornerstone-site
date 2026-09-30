# Cornerstone Site Decisions

## Planning Center integration (2026-09-29)

### Architecture
- Decision: Truly live data. Pages fetch from a Cloudflare Worker proxy on load; the worker holds the Planning Center secret, filters to public data, and caches responses for a few minutes.
- Why: GitHub Pages is static and the API key can't ship to the browser. Zand wants same-day changes in Planning Center to show without a manual re-run.
- Decision: Keep the nightly GitHub Action writing `js/pco-data.js` as a committed snapshot. Pages render the snapshot instantly, then swap in live data. If the worker is unreachable, the snapshot stays.
- Why: Never a blank list. Worker outage or cold start degrades to "at most a day old", not to nothing.
- Decision: One shared normalization module used by both the worker and the Action so the two never drift.
- Decision: Zand has no Cloudflare account yet. Worker code and a setup/deploy checklist ship with the PR; deployment is Zand's step.

### Groups
- Decision: Groups page is PCO-driven. Categories come from Church Center-visible group types (Ministries, Serve Opportunities at Cornerstone, Serve Opportunities in Our Community, Growth Groups, Unique Groups). Life Groups type is hidden in Church Center and stays hidden.
- Decision: Only groups that are listed and have a public Church Center URL appear. Private groups (Staff, Church Council, Members, etc.) never leave the worker.
- Decision: Cards keep the site's gradient + monogram look. Planning Center header photos are never used. A small hand-written overrides map (keyed by PCO group id) can supply a curated image or copy for specific groups.
- Why: PCO photos are mixed-quality iPhone shots and logos; the site look is the brand.
- Decision: Group modal drops the leader line when Planning Center hides leader names (church setting). Enrollment badge comes from the enrollment status/strategy.
- Decision: Home "Find your people" section shows one category card per visible group type with live counts and PCO type descriptions (hand-written fallback copy when PCO's is blank).

### Events
- Decision: Everything on the events page is PCO-driven: weekly rhythms from recurring Calendar events, dated upcoming events from Calendar plus dated Registrations signups, and a Next Steps section from open Registrations signups with no date.
- Decision: Respect `visible_in_church_center` on Calendar events and `open`/`archived` on signups. Hidden items never render.
- Decision: Registrations use the `/registrations/v2/signups` endpoint (the older `/events` path 404s on this account). Dates come from `signup_times`, location from `signup_location`.
- Decision: URLs inside event descriptions get linkified (e.g. the Josh Baldwin concert ticket link lives only in the description).
- Decision: Home "Upcoming events" widget shows the next 4 dated events, live.

### Rules
- Don't commit the Planning Center key. It lives in `~/Documents/planning-center-api-key-cornerstone.rtf`, in GitHub repo secrets `PCO_APP_ID` / `PCO_SECRET`, and as a Cloudflare Worker secret.
- Timezone for all date formatting is America/New_York.

## Sermon archive automation (2026-09-29)

### Shape
- Decision: Two stages. Stage A (archive sync) watches Vimeo for new "Sunday Sermon" videos, pulls the auto-caption transcript, extracts metadata with the Claude API, generates art, and opens a PR adding the entry to `SERMON_DATA`. Stage B (cut + upload) pulls the Sunday live replay from YouTube, finds the sermon start/end from the transcript, cuts it with ffmpeg, and uploads to Vimeo. A then picks it up like any other video.
- Why: Rose and Gold (the current agency) already cut and upload to Vimeo. The archive gap (Jul–Sep 2026, 11 videos) is purely metadata, so A fixes it today. B replaces the agency's step.
- Decision: Stage B takes over starting with the Oct 4, 2026 service. Before then, A backfills from the agency's Vimeo uploads.
- Decision: Dedupe by sermon date. B skips a Sunday that already has a Vimeo video; A ignores a second Vimeo video for a date already in the archive. Late agency uploads can't double-post.

### Playback and hosting
- Decision: Trimmed sermons are re-uploaded to the church's Vimeo (`vimeo.com/cornerstonechurchma`). The existing token belongs to Josh Eldridge's separate personal Vimeo user (Free plan), so the upload token must be minted as the church account. Site keeps the single Vimeo player.
- Why: Avoids YouTube ads, keeps one source for the archive, and a start-time YouTube embed would still expose the worship set.
- Decision: Vimeo uploads use the extracted sermon title, with scripture and speaker in the description. Privacy/embed settings match the agency's videos (view anybody, embed public).
- Decision: Cut is "everything except the sermon itself": from the preacher stepping up to the end of the message. Announcements, pre-roll, and closing songs are dropped.
- Why: Worship music requires separate licensing to rebroadcast.

### Where it runs
- Decision: GitHub Actions for both stages, same pattern as the Planning Center sync. A runs daily; B runs Monday morning after YouTube auto-captions have had time to generate.
- Decision: Cut points come from the transcript (Claude reads the timed captions), not audio analysis.
- Why: Precise, distinguishes announcements from preaching. Cost is a Monday-morning PR rather than Sunday afternoon.

### Review gate
- Decision: Nothing publishes without Zand. New sermons land in one PR (branch `sermon-sync`) containing the archive entries, the cut timestamps, and the generated art. Vimeo upload is unlisted until the PR merges (so the reviewer can preview it from the PR link), then flipped public.

### Keys and access
- Decision: Claude API (Anthropic key as repo secret) for metadata and cut-point extraction. A few cents per sermon.
- Decision: Sermon art comes from Zand's Artlist plan (Max Pro, Nano Banana Pro model 1042, 160 credits per 16:9 1K image) but not headlessly. Artlist's Auth0 only accepts allow-listed OAuth clients (Claude Code's works; a self-hosted client-id document returns "Unknown client", dynamic registration is disabled). So art is a review-time step: the `/sermon-art` skill runs in Conductor with the Artlist connector, generates the missing images, and pushes them to the PR branch. Gemini remains a fallback inside the workflow if a billed key is ever set. (Decided 2026-09-30.)
- Decision: Art is expected for every entry; the PR gate (and the `/sermon-art` step's image check) is the spelling check.
- Decision: The existing Vimeo token has only `public private` scopes. Zand will regenerate it with `upload` + `edit` (and request Vimeo upload access if the app lacks it), logging in as the church. Token lives at `~/grokbot/oasis-creative-studios/cornerstone-church/vimeo-token.rtf`, never in the repo.
- Resolved: the church account (`/users/15827873`, Cornerstone Church) is on Vimeo Plus, so a ~50-minute weekly upload fits. Josh's personal user (`/users/53345640`) is the Free one.

### YouTube source
- Channel `UCl4J6MR32QrZOfk8M_n7wvA`, replays are public, ~2h15m, titled "Cornerstone Online MM/DD/YYYY" (one stray "Live Stream - [...]" on Aug 30). Match by release date, not title.
- yt-dlp on Actions can hit bot checks; a cookies secret is the fallback, not the default.
