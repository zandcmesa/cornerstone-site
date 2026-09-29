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
