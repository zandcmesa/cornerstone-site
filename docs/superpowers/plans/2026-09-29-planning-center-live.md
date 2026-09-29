# Planning Center Live Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Events, weekly gatherings, next steps, and groups on the Cornerstone site render live from Planning Center, with a committed nightly snapshot as the fallback.

**Architecture:** One shared normalization module (`scripts/pco-lib.mjs`) turns raw Planning Center JSON into a single `snapshot` object. Two runtimes call it: a nightly GitHub Action that commits the snapshot to `js/pco-data.js`, and a Cloudflare Worker that serves the same shape live with a 5-minute in-memory cache. In the browser, `js/pco.js` renders the committed snapshot synchronously, then fetches the worker and re-renders only if the live data differs.

**Tech Stack:** Vanilla JS (no build step for the site), Node 20+ built-in test runner (`node --test`), Cloudflare Workers via wrangler, GitHub Actions.

**Spec:** `docs/decisions.md` → "Planning Center integration (2026-09-29)"

## Global Constraints

- No build step for the site. Pages load plain `<script>` files; the only bundler is wrangler for the worker.
- The Planning Center key never appears in any committed file. Locally it lives in `~/Documents/planning-center-api-key-cornerstone.rtf`. Read it with `textutil -convert txt -stdout`.
- Timezone for every formatted date/time is `America/New_York`.
- Only Church Center-visible data leaves the server side: Calendar events with `visible_in_church_center: true`, signups with `archived: false` and `open: true`, groups with `listed: true` and a `public_church_center_web_url`, group types with `church_center_visible: true`.
- Planning Center header photos are never rendered. Cards use the site's gradient + monogram; the only images are the three hand-written overrides.
- Existing CSS class names (`event-row`, `group-card`, modal ids) stay; renderers emit the same markup the hand-written HTML used.
- Rate limit is 100 requests per 20 s. The full snapshot must take at most ~6 requests.
- Comments in code: none unless the reason is genuinely non-obvious (user's global rule).

## Review Focus

1. **Worker down or slow** → page shows the committed snapshot and never a blank list. Fetch aborts after 8 s. (Test: Task 6 `pco.js` timeout test in browser check; Task 3 stub-snapshot render.)
2. **Live data identical to snapshot** → no re-render, so the reveal animation isn't interrupted by a flash. (Test: Task 6 `sameData` unit test.)
3. **Description contains HTML and a raw URL** (Josh Baldwin concert) → HTML stripped, URL becomes a clickable link, nothing is injected. (Test: Task 2 `stripHtml`, Task 5 `linkify` test with `<script>` payload.)
4. **Signup with a past `signup_time`** (e.g. High Praise Camp Aug 2026 still open) → it does not appear as an upcoming event and is not a Next Step either; a dated signup whose dates have all passed disappears. (Test: Task 2 signups test.)
5. **Group type with zero public groups** (Life Groups hidden; Unique Groups may end up with 1) → type card and section omitted when count is 0. (Test: Task 2 group types test.)

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/pco-lib.mjs` (new) | Pure normalization + a paginating getter factory. Exports `fetchSnapshot(get)`, `makeGetter(auth, fetchImpl)`, and the small helpers under test. |
| `scripts/pco-lib.test.mjs` (new) | `node --test` suite using fixtures. |
| `scripts/fixtures/*.json` (new) | Sanitized real API responses captured once. |
| `scripts/sync-pco.mjs` (replaces `scripts/sync-pco.js`) | Node entry: reads env, calls `fetchSnapshot`, writes `js/pco-data.js`. |
| `.github/workflows/sync-planning-center.yml` (modify) | Runs the `.mjs` script. |
| `worker/wrangler.toml`, `worker/src/index.js` (new) | Cloudflare Worker serving the snapshot JSON with CORS + 5 min memory cache. |
| `js/pco-data.js` (regenerated) | `const PCO_SNAPSHOT = {...}` |
| `js/pco.js` (new) | Browser loader: `PCO.onData(fn)`. Snapshot first, live second. |
| `js/events.js` (modify) | Renders rhythms / events / next steps into `[data-pco-rhythms]`, `[data-pco-events]`, `[data-pco-next-steps]`; event modal reads from a runtime map. |
| `js/groups.js` (modify) | Renders group type sections and cards into `[data-pco-groups]`, category cards into `[data-pco-group-types]`; group modal; overrides map. |
| `events.html`, `groups.html`, `index.html` (modify) | Replace hand-written rows with skeleton rows; add data hooks; add script tags. |
| `css/style.css` (modify) | Skeleton row/card shimmer, enrollment pill on cards. |
| `docs/planning-center-setup.md` (new) | Cloudflare account + deploy checklist for Zand. |
| `CLAUDE.md` (modify) | Replace the "Planning Center sync" section. |

## Snapshot shape (contract between every task)

```js
{
  syncedAt: '2026-09-29T20:00:00.000Z',
  rhythms: [{ id, title, dateMonth, dateDay, time, location, description, pcoUrl, ctaText, kind: 'rhythm', weekday, sortKey }],
  events:  [{ id, title, startsAt, dateMonth, dateDay, time, location, description, pcoUrl, ctaText, kind: 'event' | 'signup' }],
  nextSteps: [{ id, title, dateMonth: 'Open', dateDay: '', time: 'Registration open', location, description, pcoUrl, ctaText: 'Sign Up', kind: 'signup' }],
  groupTypes: [{ id, name, slug, description, count }],
  groups: [{ id, name, typeId, schedule, location, description, enrollment: 'open' | 'full' | 'closed', strategy, pcoUrl, membersCount }],
}
```

---

### Task 1: Capture sanitized fixtures from the real API

**Files:**
- Create: `scripts/capture-fixtures.mjs`
- Create: `scripts/fixtures/calendar-instances.json`, `scripts/fixtures/signups.json`, `scripts/fixtures/groups.json`, `scripts/fixtures/group-types.json`

**Interfaces:**
- Produces: four JSON files, each the raw `{ data, included }` shape after pagination, with `contact_email` removed from groups and `description` blanked on groups that have no `public_church_center_web_url`.

- [ ] **Step 1: Write the capture script**

```js
// scripts/capture-fixtures.mjs
import fs from 'node:fs';
import path from 'node:path';

const { PCO_APP_ID, PCO_SECRET } = process.env;
if (!PCO_APP_ID || !PCO_SECRET) { console.error('Missing PCO_APP_ID / PCO_SECRET'); process.exit(1); }
const AUTH = 'Basic ' + Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString('base64');
const BASE = 'https://api.planningcenteronline.com';

async function getAll(url) {
  const data = [], included = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers: { Authorization: AUTH } });
    if (!res.ok) throw new Error(`${res.status} for ${next}`);
    const json = await res.json();
    data.push(...json.data);
    if (json.included) included.push(...json.included);
    next = json.links && json.links.next;
  }
  return { data, included };
}

const until = new Date(Date.now() + 120 * 86400000).toISOString();
const jobs = {
  'calendar-instances': `${BASE}/calendar/v2/event_instances?filter=future&include=event&order=starts_at&per_page=100&where[starts_at][lte]=${until}`,
  'signups': `${BASE}/registrations/v2/signups?where[archived]=false&include=signup_times,signup_location&per_page=100`,
  'groups': `${BASE}/groups/v2/groups?include=group_type,location,enrollment&order=name&per_page=100`,
  'group-types': `${BASE}/groups/v2/group_types?per_page=100`,
};

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');
fs.mkdirSync(dir, { recursive: true });
for (const [name, url] of Object.entries(jobs)) {
  const out = await getAll(url);
  if (name === 'groups') {
    for (const g of out.data) {
      delete g.attributes.contact_email;
      if (!g.attributes.public_church_center_web_url) { g.attributes.description = ''; g.attributes.description_as_plain_text = ''; }
    }
  }
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(out, null, 1));
  console.log(name, out.data.length, 'records');
}
```

- [ ] **Step 2: Run it with the key from Documents**

```bash
cd /Users/mesa/conductor/workspaces/cornerstone-site/rio-de-janeiro
textutil -convert txt -stdout ~/Documents/planning-center-api-key-cornerstone.rtf > /tmp/pco-key.txt
export PCO_APP_ID=$(grep -A1 -i "app id" /tmp/pco-key.txt | tail -1 | tr -d ' \r')
export PCO_SECRET=$(grep -A1 -i "secret" /tmp/pco-key.txt | tail -1 | tr -d ' \r')
node scripts/capture-fixtures.mjs
```

Expected: four lines like `calendar-instances 60 records`, `signups 81 records`, `groups 52 records`, `group-types 6 records`.

- [ ] **Step 3: Verify no secrets or emails in fixtures**

```bash
grep -l "pco_pat\|contact_email\|@cornerstonechurchma" scripts/fixtures/*.json || echo clean
```

Expected: `clean`

- [ ] **Step 4: Commit**

```bash
git add scripts/capture-fixtures.mjs scripts/fixtures/
git commit -m "Capture sanitized Planning Center fixtures for tests"
```

---

### Task 2: Normalization library with tests

**Files:**
- Create: `scripts/pco-lib.mjs`
- Create: `scripts/pco-lib.test.mjs`

**Interfaces:**
- Produces:
  - `makeGetter(auth, fetchImpl = fetch)` → `async (url) => { data, included }` (follows `links.next`)
  - `fetchSnapshot(get, now = new Date())` → snapshot object (shape above). Makes exactly 4 `get` calls.
  - Helpers exported for tests: `stripHtml(s)`, `slug(s)`, `recurrenceBlock(compact, start)`, `normalizeCalendar(json, now)`, `normalizeSignups(json, now)`, `normalizeGroups(groupsJson, typesJson)`.
- Consumed by: Task 3 (sync script), Task 4 (worker).

- [ ] **Step 1: Write the failing tests**

```js
// scripts/pco-lib.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripHtml, slug, recurrenceBlock, normalizeCalendar, normalizeSignups, normalizeGroups, fetchSnapshot } from './pco-lib.mjs';

const fx = name => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url)));
const NOW = new Date('2026-09-29T12:00:00Z');

test('stripHtml removes tags, keeps paragraph breaks, decodes basic entities', () => {
  assert.equal(stripHtml('<div><p>Hi<br><br>there &amp; you</p></div>'), 'Hi\n\nthere & you');
  assert.equal(stripHtml(null), '');
});

test('slug', () => {
  assert.equal(slug('Serve Opportunities at Cornerstone'), 'serve-opportunities-at-cornerstone');
  assert.equal(slug("Mom’s Group"), 'mom-s-group');
});

test('recurrenceBlock maps compact descriptions to date block text', () => {
  const wed = new Date('2026-09-30T23:00:00Z');
  assert.deepEqual(recurrenceBlock('Every Wednesday', wed), { dateMonth: 'Every', dateDay: 'Wed' });
  assert.deepEqual(recurrenceBlock('The second Friday of every month', new Date('2026-11-14T00:00:00Z')), { dateMonth: '2nd', dateDay: 'Fri' });
  assert.deepEqual(recurrenceBlock('Something odd', new Date('2026-10-04T14:00:00Z')), { dateMonth: 'Every', dateDay: 'Sun' });
});

test('normalizeCalendar splits recurring rhythms from one-off events and hides invisible ones', () => {
  const { rhythms, events } = normalizeCalendar(fx('calendar-instances'), NOW);
  const titles = rhythms.map(r => r.title);
  assert.ok(titles.includes('Sunday Service'));
  assert.equal(titles.filter(t => t === 'Prayer').length, 2, 'two distinct Prayer calendar events');
  assert.ok(!titles.includes('Baptisms'), 'hidden events never appear');
  assert.equal(rhythms[0].title, 'Sunday Service', 'sorted Sunday first');
  assert.equal(events.length, 1);
  assert.equal(events[0].title, 'Josh Baldwin Concert');
  assert.equal(events[0].dateMonth, 'Nov');
  assert.equal(events[0].dateDay, '8');
  assert.equal(events[0].time, '7:00 PM – 9:00 PM');
  assert.equal(events[0].kind, 'event');
  assert.ok(events[0].pcoUrl.includes('churchcenter.com/calendar/event/'));
  assert.ok(!events[0].description.includes('<'), 'html stripped');
  assert.ok(events[0].description.includes('https://events.humanitix.com'), 'url text preserved');
});

test('normalizeSignups: dated open signups become events, undated become next steps, past dates and closed ones drop', () => {
  const { events, nextSteps } = normalizeSignups(fx('signups'), NOW);
  const ev = events.find(e => e.title.startsWith('High Praise Dance: Fall'));
  assert.ok(ev);
  assert.equal(ev.kind, 'signup');
  assert.equal(ev.dateMonth, 'Oct');
  assert.equal(ev.dateDay, '8');
  assert.equal(ev.ctaText, 'Register');
  assert.ok(ev.pcoUrl.endsWith('/reservations/new'));
  assert.equal(ev.location, 'East Longmeadow Campus');
  const names = nextSteps.map(n => n.title);
  assert.ok(names.includes('Water Baptism'));
  assert.ok(names.includes("Kingdom Kid's Church Volunteer Opportunity"));
  assert.ok(!names.some(n => n.startsWith('High Praise Camp')), 'past-dated signup is not a next step');
  assert.ok(!events.some(e => e.title.startsWith('High Praise Camp')), 'past-dated signup is not an event');
  assert.ok(!names.includes('Church Membership'), 'closed signup dropped');
  nextSteps.forEach(n => { assert.equal(n.dateMonth, 'Open'); assert.equal(n.ctaText, 'Sign Up'); });
});

test('normalizeGroups: only listed public groups, visible types, counts, enrollment', () => {
  const { groups, groupTypes } = normalizeGroups(fx('groups'), fx('group-types'));
  assert.ok(!groups.some(g => g.name === 'Staff'));
  assert.ok(!groups.some(g => g.name === 'Church Council'));
  assert.ok(!groupTypes.some(t => t.name === 'Life Groups'), 'not church-center visible');
  assert.deepEqual(groupTypes.map(t => t.name).slice(0, 3), ['Ministries', 'Serve Opportunities at Cornerstone', 'Serve Opportunities in Our Community']);
  groupTypes.forEach(t => assert.ok(t.count > 0, `type ${t.name} has groups`));
  const ya = groups.find(g => g.name === 'Cornerstone Young Adults');
  assert.equal(ya.enrollment, 'open');
  assert.equal(ya.strategy, 'request_to_join');
  assert.equal(ya.location, 'Cornerstone Church');
  assert.equal(ya.schedule, '4th Friday of the Month');
  assert.equal(ya.typeId, groupTypes.find(t => t.name === 'Ministries').id);
  assert.ok(!('imageUrl' in ya), 'no photos in snapshot');
  const min = groupTypes.find(t => t.name === 'Ministries');
  assert.equal(min.count, groups.filter(g => g.typeId === min.id).length);
});

test('fetchSnapshot makes 4 calls and assembles the shape', async () => {
  const calls = [];
  const get = async url => {
    calls.push(url);
    if (url.includes('/calendar/')) return fx('calendar-instances');
    if (url.includes('/registrations/')) return fx('signups');
    if (url.includes('/group_types')) return fx('group-types');
    if (url.includes('/groups?')) return fx('groups');
    throw new Error('unexpected ' + url);
  };
  const snap = await fetchSnapshot(get, NOW);
  assert.equal(calls.length, 4);
  assert.ok(snap.syncedAt);
  assert.deepEqual(Object.keys(snap).sort(), ['events', 'groupTypes', 'groups', 'nextSteps', 'rhythms', 'syncedAt']);
  assert.ok(snap.events.length >= 2);
  const starts = snap.events.map(e => e.startsAt);
  assert.deepEqual(starts, [...starts].sort(), 'events sorted by start');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/pco-lib.test.mjs`
Expected: FAIL, module `./pco-lib.mjs` not found.

- [ ] **Step 3: Write the library**

```js
// scripts/pco-lib.mjs
const TZ = 'America/New_York';
const BASE = 'https://api.planningcenteronline.com';
const HORIZON_DAYS = 120;
const ORDINALS = { first: '1st', second: '2nd', third: '3rd', fourth: '4th', last: 'Last' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function makeGetter(auth, fetchImpl = fetch) {
  return async function get(url) {
    const data = [], included = [];
    let next = url;
    while (next) {
      const res = await fetchImpl(next, { headers: { Authorization: auth } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${next}`);
      const json = await res.json();
      data.push(...json.data);
      if (json.included) included.push(...json.included);
      next = json.links && json.links.next;
    }
    return { data, included };
  };
}

export function stripHtml(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n').map(l => l.trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const fmt = (d, opts) => new Date(d).toLocaleString('en-US', { timeZone: TZ, ...opts });
const fmtMonth = d => fmt(d, { month: 'short' });
const fmtDay = d => fmt(d, { day: 'numeric' });
const fmtTime = d => fmt(d, { hour: 'numeric', minute: '2-digit' });
const fmtWeekday = d => fmt(d, { weekday: 'short' });
const timeRange = (start, end) => end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);

export function recurrenceBlock(compact, start) {
  const day = fmtWeekday(start);
  const m = /^The (\w+) \w+ of every month/i.exec(compact || '');
  if (m && ORDINALS[m[1].toLowerCase()]) return { dateMonth: ORDINALS[m[1].toLowerCase()], dateDay: day };
  return { dateMonth: 'Every', dateDay: day };
}

const index = (included, type) => Object.fromEntries((included || []).filter(i => i.type === type).map(i => [i.id, i]));

export function normalizeCalendar(json, now = new Date()) {
  const events = index(json.included, 'Event');
  const seenRhythm = new Set(), seenEvent = new Set();
  const rhythms = [], out = [];
  for (const inst of json.data) {
    const a = inst.attributes;
    const ev = events[inst.relationships.event.data.id];
    if (!ev || !ev.attributes.visible_in_church_center) continue;
    if (new Date(a.starts_at) < now) continue;
    const base = {
      title: ev.attributes.name,
      location: (a.location || '').split(' - ')[0] || 'Cornerstone Church',
      description: stripHtml(ev.attributes.description || ev.attributes.summary),
      pcoUrl: ev.attributes.registration_url || a.church_center_url,
    };
    if (a.recurrence && a.recurrence !== 'None') {
      if (seenRhythm.has(ev.id)) continue;
      seenRhythm.add(ev.id);
      const wd = WEEKDAYS.indexOf(fmtWeekday(a.starts_at));
      rhythms.push({
        id: 'cal-' + ev.id, kind: 'rhythm', ...base,
        ...recurrenceBlock(a.compact_recurrence_description, a.starts_at),
        time: `${a.compact_recurrence_description} · ${timeRange(a.starts_at, a.ends_at)}`,
        ctaText: 'Details',
        weekday: wd,
        sortKey: wd + fmt(a.starts_at, { hour12: false, hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      if (seenEvent.has(ev.id)) continue;
      seenEvent.add(ev.id);
      out.push({
        id: 'cal-' + ev.id, kind: 'event', ...base,
        startsAt: a.starts_at,
        dateMonth: fmtMonth(a.starts_at), dateDay: fmtDay(a.starts_at),
        time: a.all_day_event ? 'All Day' : timeRange(a.starts_at, a.ends_at),
        ctaText: ev.attributes.registration_url ? 'Register' : 'Details',
      });
    }
  }
  rhythms.sort((x, y) => x.sortKey.localeCompare(y.sortKey));
  return { rhythms, events: out };
}

export function normalizeSignups(json, now = new Date()) {
  const times = index(json.included, 'SignupTime');
  const locs = index(json.included, 'SignupLocation');
  const events = [], nextSteps = [];
  for (const s of json.data) {
    const a = s.attributes;
    if (a.archived || !a.open || a.closed) continue;
    const rel = s.relationships || {};
    const locRel = rel.signup_location && rel.signup_location.data;
    const loc = locRel && locs[locRel.id];
    const location = (loc && loc.attributes.name) || 'Cornerstone Church';
    const ts = ((rel.signup_times && rel.signup_times.data) || []).map(t => times[t.id]).filter(Boolean)
      .map(t => t.attributes).filter(t => new Date(t.starts_at) >= now).sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    const hasAnyTime = ((rel.signup_times && rel.signup_times.data) || []).length > 0;
    const common = { title: a.name, kind: 'signup', location, description: stripHtml(a.description), pcoUrl: a.new_registration_url };
    if (ts.length) {
      const t = ts[0];
      events.push({ id: 'reg-' + s.id, ...common, startsAt: t.starts_at,
        dateMonth: fmtMonth(t.starts_at), dateDay: fmtDay(t.starts_at),
        time: t.all_day ? 'All Day' : timeRange(t.starts_at, t.ends_at), ctaText: 'Register' });
    } else if (!hasAnyTime) {
      nextSteps.push({ id: 'reg-' + s.id, ...common, dateMonth: 'Open', dateDay: '', time: 'Registration open', ctaText: 'Sign Up' });
    }
  }
  return { events, nextSteps };
}

export function normalizeGroups(groupsJson, typesJson) {
  const enroll = index(groupsJson.included, 'Enrollment');
  const locs = index(groupsJson.included, 'Location');
  const groups = groupsJson.data
    .filter(g => g.attributes.listed && g.attributes.public_church_center_web_url)
    .map(g => {
      const a = g.attributes, rel = g.relationships || {};
      const e = rel.enrollment && rel.enrollment.data && enroll[rel.enrollment.data.id];
      const l = rel.location && rel.location.data && locs[rel.location.data.id];
      const status = e ? e.attributes.status : 'open';
      return {
        id: g.id, name: a.name.trim(),
        typeId: rel.group_type && rel.group_type.data ? rel.group_type.data.id : null,
        schedule: (a.schedule || '').trim() || null,
        location: l ? l.attributes.name : null,
        description: a.description_as_plain_text ? a.description_as_plain_text.trim() : stripHtml(a.description),
        enrollment: status === 'full' ? 'full' : status === 'open' ? 'open' : 'closed',
        strategy: e ? e.attributes.strategy : null,
        pcoUrl: a.public_church_center_web_url,
        membersCount: a.memberships_count || 0,
      };
    });
  const groupTypes = typesJson.data
    .filter(t => t.attributes.church_center_visible)
    .sort((x, y) => x.attributes.position - y.attributes.position)
    .map(t => ({ id: t.id, name: t.attributes.name, slug: slug(t.attributes.name), description: stripHtml(t.attributes.description), count: groups.filter(g => g.typeId === t.id).length }))
    .filter(t => t.count > 0);
  return { groups, groupTypes };
}

export async function fetchSnapshot(get, now = new Date()) {
  const until = new Date(now.getTime() + HORIZON_DAYS * 86400000).toISOString();
  const [cal, reg, grp, typ] = await Promise.all([
    get(`${BASE}/calendar/v2/event_instances?filter=future&include=event&order=starts_at&per_page=100&where[starts_at][lte]=${until}`),
    get(`${BASE}/registrations/v2/signups?where[archived]=false&include=signup_times,signup_location&per_page=100`),
    get(`${BASE}/groups/v2/groups?include=group_type,location,enrollment&order=name&per_page=100`),
    get(`${BASE}/groups/v2/group_types?per_page=100`),
  ]);
  const c = normalizeCalendar(cal, now);
  const s = normalizeSignups(reg, now);
  const g = normalizeGroups(grp, typ);
  const events = [...c.events, ...s.events].sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  return { syncedAt: now.toISOString(), rhythms: c.rhythms, events, nextSteps: s.nextSteps, groupTypes: g.groupTypes, groups: g.groups };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/pco-lib.test.mjs`
Expected: all 7 tests pass. If `recurrenceBlock` or time assertions fail on exact strings, inspect the fixture values and fix the library, not the test, unless the fixture proves the expected string wrong (e.g. the concert's `ends_at`).

- [ ] **Step 5: Commit**

```bash
git add scripts/pco-lib.mjs scripts/pco-lib.test.mjs
git commit -m "Add Planning Center normalization library with tests"
```

---

### Task 3: Sync script, workflow, and a real committed snapshot

**Files:**
- Create: `scripts/sync-pco.mjs`
- Delete: `scripts/sync-pco.js`
- Modify: `.github/workflows/sync-planning-center.yml:20`
- Regenerate: `js/pco-data.js`

**Interfaces:**
- Consumes: `makeGetter`, `fetchSnapshot` from Task 2.
- Produces: `js/pco-data.js` declaring `const PCO_SNAPSHOT = {...}`. Task 6's loader reads this global.

- [ ] **Step 1: Write the sync script**

```js
// scripts/sync-pco.mjs
import fs from 'node:fs';
import path from 'node:path';
import { makeGetter, fetchSnapshot } from './pco-lib.mjs';

const { PCO_APP_ID, PCO_SECRET } = process.env;
if (!PCO_APP_ID || !PCO_SECRET) { console.error('Missing PCO_APP_ID / PCO_SECRET'); process.exit(1); }

const auth = 'Basic ' + Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString('base64');
const snap = await fetchSnapshot(makeGetter(auth));
const out = `// Generated by scripts/sync-pco.mjs — do not edit by hand.\nconst PCO_SNAPSHOT = ${JSON.stringify(snap, null, 2)};\n`;
const dest = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'js', 'pco-data.js');
fs.writeFileSync(dest, out);
console.log(`rhythms: ${snap.rhythms.length}, events: ${snap.events.length}, nextSteps: ${snap.nextSteps.length}, groups: ${snap.groups.length} in ${snap.groupTypes.length} types`);
```

- [ ] **Step 2: Delete the old script and point the workflow at the new one**

```bash
git rm scripts/sync-pco.js
```

In `.github/workflows/sync-planning-center.yml` change `- run: node scripts/sync-pco.js` to `- run: node scripts/sync-pco.mjs`.

- [ ] **Step 3: Generate the snapshot locally with the key**

```bash
export PCO_APP_ID=$(grep -A1 -i "app id" /tmp/pco-key.txt | tail -1 | tr -d ' \r')
export PCO_SECRET=$(grep -A1 -i "secret" /tmp/pco-key.txt | tail -1 | tr -d ' \r')
node scripts/sync-pco.mjs
head -c 400 js/pco-data.js
node -e "eval(require('fs').readFileSync('js/pco-data.js','utf8')); console.log(PCO_SNAPSHOT.groupTypes.map(t=>t.name+':'+t.count).join(', '))"
```

Expected: a count line like `rhythms: 4, events: 2, nextSteps: 2, groups: 36 in 5 types`, and type counts printed. Confirm `grep -c "pco_pat\|Ca01c" js/pco-data.js` prints `0`.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-pco.mjs .github/workflows/sync-planning-center.yml js/pco-data.js
git commit -m "Sync script writes a single PCO_SNAPSHOT; commit first real snapshot"
```

---

### Task 4: Cloudflare Worker

**Files:**
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.js`
- Create: `worker/.gitignore` (contents: `node_modules\n.wrangler\n`)

**Interfaces:**
- Consumes: `makeGetter`, `fetchSnapshot` from Task 2 via relative import `../../scripts/pco-lib.mjs`.
- Produces: `GET /` → JSON snapshot, `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=300`. Task 6 fetches this URL.

- [ ] **Step 1: Write wrangler.toml**

```toml
name = "cornerstone-pco"
main = "src/index.js"
compatibility_date = "2026-09-01"
workers_dev = true
```

- [ ] **Step 2: Write the worker**

```js
// worker/src/index.js
import { makeGetter, fetchSnapshot } from '../../scripts/pco-lib.mjs';

const TTL_MS = 5 * 60 * 1000;
let cached = null;

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=300',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: HEADERS });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
    if (!cached || Date.now() - cached.at > TTL_MS) {
      try {
        const auth = 'Basic ' + btoa(`${env.PCO_APP_ID}:${env.PCO_SECRET}`);
        const snap = await fetchSnapshot(makeGetter(auth));
        cached = { at: Date.now(), body: JSON.stringify(snap) };
      } catch (err) {
        if (!cached) return new Response(JSON.stringify({ error: String(err.message || err) }), { status: 502, headers: HEADERS });
      }
    }
    return new Response(cached.body, { headers: HEADERS });
  },
};
```

- [ ] **Step 3: Smoke-test locally with wrangler dev (no account needed)**

```bash
cd worker
printf 'PCO_APP_ID=%s\nPCO_SECRET=%s\n' "$PCO_APP_ID" "$PCO_SECRET" > .dev.vars
echo ".dev.vars" >> .gitignore
npx --yes wrangler@latest dev --port 8787 &
sleep 8
curl -s localhost:8787 | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(Object.keys(j), j.groups.length, j.events.length)})"
curl -sI localhost:8787 | grep -i "access-control\|cache-control"
kill %1
cd ..
```

Expected: keys `syncedAt, rhythms, events, nextSteps, groupTypes, groups`, non-zero counts, and both headers present. If `wrangler dev` needs a login even for local mode, note it in the setup doc and skip; the library is already covered by tests.

- [ ] **Step 4: Verify .dev.vars is ignored and commit**

```bash
git status --short worker/
git add worker/wrangler.toml worker/src/index.js worker/.gitignore
git commit -m "Add Cloudflare Worker that serves the Planning Center snapshot live"
```

Expected: `worker/.dev.vars` does not appear in `git status`.

---

### Task 5: Shared render helpers and events rendering

**Files:**
- Modify: `js/events.js` (replace lines 1–116: `EVENTS_DATA` literal and the PCO IIFE; keep the modal code from `const eventBackdrop` onward, with one change noted below)
- Modify: `events.html:66-260` (three lists), `events.html:60` (month label)
- Modify: `index.html:220-278` (events list)
- Modify: `css/style.css` after `.event-row` rules

**Interfaces:**
- Consumes: `PCO.onData(fn)` from Task 6 (written next, but the hook is a one-liner; write events.js to call it if defined).
- Produces: `window.PCO_UI = { esc, linkify, paragraphs, CLOCK, PIN }` for groups.js; `EVENTS_DATA` runtime map keyed by item id.

- [ ] **Step 1: Write the render layer at the top of js/events.js**

Replace everything before `const eventBackdrop = ...` with:

```js
const EVENTS_DATA = {};

window.PCO_UI = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = text => esc(text).replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const paragraphs = text => String(text || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${linkify(p).replace(/\n/g, '<br>')}</p>`).join('');
  return {
    esc, linkify, paragraphs,
    CLOCK: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    PIN: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };
}());

(function () {
  const { esc, CLOCK, PIN } = window.PCO_UI;
  const LABELS = { rhythm: 'Weekly Gathering', event: 'Upcoming Event', signup: 'Registration Open' };

  function row(e) {
    EVENTS_DATA[e.id] = {
      title: e.title, dateMonth: e.dateMonth, dateDay: e.dateDay, time: e.time, location: e.location,
      label: e.kind === 'signup' && !e.startsAt ? 'Next Step' : LABELS[e.kind],
      description: e.description || 'See Church Center for full details.',
      ctaText: e.pcoUrl ? (e.kind === 'rhythm' ? 'View on Church Center' : e.ctaText === 'Sign Up' ? 'Sign Up on Church Center' : 'Register on Church Center') : null,
      pcoUrl: e.pcoUrl || null,
    };
    const primary = e.kind === 'signup' || e.ctaText === 'Register';
    const dayStyle = e.dateDay.length > 2 ? ' style="font-size:18px;line-height:1.4;"' : '';
    return '<div class="event-row">' +
      '<div class="event-date-block"><div class="event-date-month">' + esc(e.dateMonth) + '</div><div class="event-date-day"' + dayStyle + '>' + esc(e.dateDay) + '</div></div>' +
      '<div class="event-info"><div class="event-info-title">' + esc(e.title) + '</div>' +
      '<div class="event-info-meta"><span>' + CLOCK + ' ' + esc(e.time) + '</span><span>' + PIN + ' ' + esc(e.location) + '</span></div></div>' +
      '<button class="btn ' + (primary ? 'btn-primary' : 'btn-outline') + ' btn-sm" data-event-id="' + esc(e.id) + '">' + esc(e.ctaText || 'Details') + '</button></div>';
  }

  function fill(selector, items, emptyText) {
    document.querySelectorAll(selector).forEach(list => {
      const limit = parseInt(list.dataset.pcoLimit) || items.length;
      const slice = items.slice(0, limit);
      list.innerHTML = slice.length ? slice.map(row).join('') : '<p class="body-text" style="color:var(--text-muted);">' + esc(emptyText) + '</p>';
    });
  }

  function render(snap) {
    fill('[data-pco-rhythms]', snap.rhythms, 'Weekly gatherings will appear here.');
    fill('[data-pco-events]', snap.events, 'No upcoming events yet. Check back soon.');
    fill('[data-pco-next-steps]', snap.nextSteps, 'Nothing open right now.');
    document.querySelectorAll('[data-pco-month]').forEach(el => {
      el.textContent = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
    });
  }

  if (window.PCO) window.PCO.onData(render);
}());
```

Then in the modal block, replace the per-element binding at the end:

```js
  document.querySelectorAll('[data-event-id]').forEach(el => {
    el.addEventListener('click', () => openEventModal(el.dataset.eventId));
  });
```

with delegation, so re-rendered rows keep working:

```js
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-event-id]');
    if (btn) openEventModal(btn.dataset.eventId);
  });
```

And change `eventDescription.innerHTML = e.description.split('\n\n').map(p => \`<p>${p}</p>\`).join('');` to `eventDescription.innerHTML = window.PCO_UI.paragraphs(e.description);`.

- [ ] **Step 2: Add skeleton CSS**

Append to `css/style.css` after the `.event-date-day` rule block:

```css
.event-row.skeleton { pointer-events: none; }
.event-row.skeleton .event-date-block,
.event-row.skeleton .event-info-title,
.event-row.skeleton .event-info-meta,
.event-row.skeleton .btn {
  color: transparent;
  background: linear-gradient(90deg, var(--bg-highlight) 25%, var(--bg-elevated) 50%, var(--bg-highlight) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
  border-color: transparent;
}
.event-row.skeleton .event-info-title { height: 16px; width: 60%; margin-bottom: 8px; }
.event-row.skeleton .event-info-meta { height: 12px; width: 40%; }
```

Confirm `@keyframes shimmer` already exists in `css/style.css` (grep `shimmer`); if it lives in `blocks.css`, that's fine too.

- [ ] **Step 3: Replace the hand-written lists in events.html**

Line 60: `<p class="label mb-16" data-reveal>July 2026</p>` → `<p class="label mb-16" data-reveal data-pco-month>Events</p>`.

Replace the Weekly Gatherings list (`<div class="events-list mb-48" data-reveal-stagger>` through its closing `</div>` before `<!-- Upcoming special events -->`) with:

```html
    <div class="events-list mb-48" data-reveal-stagger data-pco-rhythms>
      <div class="event-row skeleton"><div class="event-date-block"><div class="event-date-month">&nbsp;</div><div class="event-date-day">&nbsp;</div></div><div class="event-info"><div class="event-info-title">&nbsp;</div><div class="event-info-meta">&nbsp;</div></div><span class="btn btn-sm">&nbsp;</span></div>
      <div class="event-row skeleton"><div class="event-date-block"><div class="event-date-month">&nbsp;</div><div class="event-date-day">&nbsp;</div></div><div class="event-info"><div class="event-info-title">&nbsp;</div><div class="event-info-meta">&nbsp;</div></div><span class="btn btn-sm">&nbsp;</span></div>
      <div class="event-row skeleton"><div class="event-date-block"><div class="event-date-month">&nbsp;</div><div class="event-date-day">&nbsp;</div></div><div class="event-info"><div class="event-info-title">&nbsp;</div><div class="event-info-meta">&nbsp;</div></div><span class="btn btn-sm">&nbsp;</span></div>
    </div>
```

Replace the Upcoming Events list (`<div class="events-list" data-reveal-stagger data-pco-events>` through its closing) with the same three skeleton rows inside `<div class="events-list" data-reveal-stagger data-pco-events>`.

Replace the Get Involved heading + list with `<p class="label mb-24" data-reveal style="margin-top:48px;">Next Steps</p>` and the same skeleton rows inside `<div class="events-list" data-reveal-stagger data-pco-next-steps>`.

Add `<script src="js/pco.js"></script>` between `js/pco-data.js` and `js/events.js` (line 402–403).

- [ ] **Step 4: Replace the home page events list**

In `index.html`, replace the children of `<div class="events-list" data-reveal-stagger data-pco-events data-pco-limit="4">` (lines 221–278) with four skeleton rows (same markup as above). Add `<script src="js/pco.js"></script>` right after `<script src="js/pco-data.js"></script>` (line 430).

- [ ] **Step 5: Check in a browser**

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,2400 --screenshot=.context/events.png http://localhost:8000/events.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,2400 --screenshot=.context/index-events.png http://localhost:8000/index.html
```

Open both PNGs (Read tool). Expected: weekly gatherings show Sunday Service, Prayer ×2, Worshipers and Warriors; Upcoming shows High Praise Dance Fall 2026 and Josh Baldwin Concert; Next Steps shows Water Baptism and Kingdom Kids volunteer; home page shows up to 4 events. No skeleton rows visible. Note: pco.js doesn't exist yet, so this is snapshot-only; `window.PCO` undefined means render never runs. To check before Task 6, temporarily verify by running Task 6 Step 1 first, or accept that this screenshot happens at the end of Task 6.

- [ ] **Step 6: Commit**

```bash
git add js/events.js events.html index.html css/style.css
git commit -m "Render events, weekly gatherings, and next steps from the Planning Center snapshot"
```

---

### Task 6: Browser loader (snapshot first, live second)

**Files:**
- Create: `js/pco.js`
- Create: `scripts/pco-loader.test.mjs`

**Interfaces:**
- Consumes: global `PCO_SNAPSHOT` from `js/pco-data.js`.
- Produces: `window.PCO = { onData(fn), sameData(a, b) }`. `PCO_WORKER_URL` constant at the top of the file, empty until deployed.

- [ ] **Step 1: Write the failing test for sameData**

`js/pco.js` is a browser script, so the test evaluates it with a fake `window`:

```js
// scripts/pco-loader.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load(snapshot, fetchImpl) {
  const src = fs.readFileSync(new URL('../js/pco.js', import.meta.url), 'utf8');
  const window = {};
  const ctx = { window, PCO_SNAPSHOT: snapshot, fetch: fetchImpl, setTimeout, AbortController, console };
  vm.runInNewContext(src, ctx);
  return window.PCO;
}

test('sameData ignores syncedAt', () => {
  const PCO = load({ syncedAt: 'a', events: [] }, () => new Promise(() => {}));
  assert.equal(PCO.sameData({ syncedAt: 'a', events: [1] }, { syncedAt: 'b', events: [1] }), true);
  assert.equal(PCO.sameData({ syncedAt: 'a', events: [1] }, { syncedAt: 'a', events: [2] }), false);
});

test('onData fires with snapshot immediately, then with live data only if different', async () => {
  const live = { syncedAt: 'later', events: [{ id: 'x' }] };
  const PCO = load({ syncedAt: 'a', events: [] }, async () => ({ ok: true, json: async () => live }), 'https://example.test');
  const seen = [];
  PCO.onData(d => seen.push(d.syncedAt));
  assert.deepEqual(seen, ['a']);
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(seen, ['a', 'later']);
});

test('onData does not re-fire when live equals snapshot', async () => {
  const snap = { syncedAt: 'a', events: [{ id: 'x' }] };
  const PCO = load(snap, async () => ({ ok: true, json: async () => ({ ...snap, syncedAt: 'later' }) }));
  const seen = [];
  PCO.onData(d => seen.push(d.syncedAt));
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(seen, ['a']);
});

test('fetch failure leaves snapshot in place', async () => {
  const PCO = load({ syncedAt: 'a', events: [] }, async () => { throw new Error('down'); });
  const seen = [];
  PCO.onData(d => seen.push(d.syncedAt));
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(seen, ['a']);
});
```

For the tests to exercise fetching, `pco.js` must read the worker URL from `window.PCO_WORKER_URL` if set, else its own constant. The `load` helper sets `window.PCO_WORKER_URL = 'https://example.test'` before running (add `window.PCO_WORKER_URL = 'https://example.test';` as the first line of `load`, and drop the stray third argument in the second test).

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/pco-loader.test.mjs`
Expected: FAIL, `../js/pco.js` not found.

- [ ] **Step 3: Write js/pco.js**

```js
const PCO_WORKER_URL = '';

window.PCO = (function () {
  const url = window.PCO_WORKER_URL || PCO_WORKER_URL;
  const listeners = [];
  let data = typeof PCO_SNAPSHOT !== 'undefined' && PCO_SNAPSHOT && PCO_SNAPSHOT.syncedAt ? PCO_SNAPSHOT : null;

  function sameData(a, b) {
    const strip = o => JSON.stringify({ ...o, syncedAt: null });
    return strip(a) === strip(b);
  }

  function onData(fn) {
    listeners.push(fn);
    if (data) fn(data);
  }

  if (url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(url, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(live => {
        if (!live || !live.syncedAt) return;
        if (data && sameData(data, live)) return;
        data = live;
        listeners.forEach(fn => fn(data));
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }

  return { onData, sameData };
}());
```

- [ ] **Step 4: Run both test files**

Run: `node --test scripts/`
Expected: all tests in both files pass.

- [ ] **Step 5: Now run the Task 5 Step 5 browser check** and view the screenshots. Fix rendering issues in `js/events.js` if any.

- [ ] **Step 6: Commit**

```bash
git add js/pco.js scripts/pco-loader.test.mjs
git commit -m "Add browser loader: render snapshot, then swap in live worker data"
```

---

### Task 7: Groups page and home category cards

**Files:**
- Modify: `js/groups.js` (replace `GROUPS_DATA` literal, lines 1–159, with overrides + renderer; adjust modal)
- Modify: `groups.html:68-262` (categories container), `groups.html:266-271` (callout), script tags at 407
- Modify: `index.html:157-205` (category cards), add `groups.js` script tag
- Modify: `css/style.css` (card enrollment pill, group skeleton)

**Interfaces:**
- Consumes: `window.PCO.onData`, `window.PCO_UI` (Task 5), snapshot `groups` / `groupTypes`.
- Produces: `[data-pco-groups]` sections with ids equal to each type's `slug`; `[data-pco-group-types]` cards linking to `groups.html#<slug>`; `[data-pco-group-count]` text.

- [ ] **Step 1: Write the overrides and renderer at the top of js/groups.js**

Replace lines 1–159 (the `GROUPS_DATA` literal) with:

```js
const GROUPS_DATA = {};

const GROUP_OVERRIDES = {
  '807069':  { name: 'Kingdom Kids', image: 'images/kingdom-kids.png', description: "Kingdom Kids is Cornerstone's children's ministry for kids from birth through 5th grade. Each Sunday, kids experience age-appropriate worship, Bible teaching, and community during the main service.\n\nNo registration is required for Sunday attendance — just check in at the kids wing when you arrive. Join the parents group on Church Center to stay connected." },
  '1711298': { image: 'images/cornerstone-young-adults.png' },
  '1896063': { image: 'images/high-praise-dance.png' },
};

const TYPE_FALLBACK_DESC = {
  'Ministries': "Kids, youth, worship, and more — find where you're called to serve within the church.",
  'Growth Groups': 'Small groups meeting in homes and at the church to grow together in Scripture and friendship.',
  'Unique Groups': 'Specialty gatherings for specific seasons of life, interests, or growth goals.',
};

const GRADIENTS = [
  'linear-gradient(135deg,#1a1d2c,#2a2040)', 'linear-gradient(135deg,#0f1a1a,#1a3030)', 'linear-gradient(135deg,#1a0a1a,#2a1030)',
  'linear-gradient(135deg,#1a160a,#332a10)', 'linear-gradient(135deg,#1a0f0f,#2a1818)', 'linear-gradient(135deg,#0a1a1a,#103028)',
  'linear-gradient(135deg,#0a1a2a,#102840)',
];

(function () {
  const { esc } = window.PCO_UI;
  const gradientFor = id => GRADIENTS[String(id).split('').reduce((n, c) => n + c.charCodeAt(0), 0) % GRADIENTS.length];
  const monogram = name => name.split(/[\s|]+/).filter(w => w && !/^(and|&|of|the|at|in|our|for)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const PILL = { open: 'Open', full: 'Full', closed: 'Closed' };

  function card(g, typeName) {
    const o = GROUP_OVERRIDES[g.id] || {};
    const name = o.name || g.name;
    GROUPS_DATA[g.id] = {
      name, category: typeName,
      schedule: g.schedule || 'See Church Center for schedule',
      location: g.location || 'Cornerstone Church',
      enrollment: g.enrollment, strategy: g.strategy,
      ctaText: g.enrollment === 'open' ? (g.strategy === 'open_signup' ? 'Join This Group' : 'Request to Join') : 'View on Church Center',
      description: o.description || g.description || 'See Church Center for details.',
      pcoUrl: g.pcoUrl, gradient: gradientFor(g.id), image: o.image || null,
    };
    const img = o.image
      ? '<div class="group-card-image has-logo" style="background:' + gradientFor(g.id) + ';"><img src="' + esc(o.image) + '" alt="' + esc(name) + '"></div>'
      : '<div class="group-card-image" style="background:' + gradientFor(g.id) + ';"><div class="group-card-monogram">' + esc(monogram(name)) + '</div></div>';
    const pill = g.enrollment !== 'open' ? '<span class="group-card-pill pill-' + g.enrollment + '">' + PILL[g.enrollment] + '</span>' : '';
    return '<div class="group-card" tabindex="0" role="button" data-group-id="' + esc(g.id) + '">' + img +
      '<div class="group-card-body"><div class="group-card-day">' + esc(g.schedule || typeName) + pill + '</div>' +
      '<div class="group-card-name">' + esc(name) + '</div>' +
      '<div class="group-card-desc">' + esc(o.description || g.description || '') + '</div></div></div>';
  }

  function renderPage(snap) {
    document.querySelectorAll('[data-pco-groups]').forEach(root => {
      root.innerHTML = snap.groupTypes.map(t => {
        const groups = snap.groups.filter(g => g.typeId === t.id);
        const desc = t.description || TYPE_FALLBACK_DESC[t.name] || '';
        return '<div id="' + esc(t.slug) + '">' +
          '<div class="group-category-header" data-reveal><h2 class="group-category-title">' + esc(t.name) + '</h2>' +
          '<span class="group-count-badge">' + groups.length + (groups.length === 1 ? ' group' : ' groups') + '</span></div>' +
          (desc ? '<p class="group-category-desc">' + esc(desc) + '</p>' : '') +
          '<div class="groups-grid" data-reveal-stagger>' + groups.map(g => card(g, t.name)).join('') + '</div></div>';
      }).join('');
    });
    document.querySelectorAll('[data-pco-group-count]').forEach(el => { el.textContent = 'View all ' + snap.groups.length + ' groups →'; });
  }

  const ICON = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3689C5" stroke-width="1.5" opacity="0.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  function renderTypeCards(snap) {
    document.querySelectorAll('[data-pco-group-types]').forEach(root => {
      root.innerHTML = snap.groupTypes.map((t, i) =>
        '<a class="group-card" href="groups.html#' + esc(t.slug) + '">' +
        '<div class="group-card-image"><div style="width:100%;height:100%;background:' + GRADIENTS[i % GRADIENTS.length] + ';display:flex;align-items:center;justify-content:center;">' + ICON + '</div></div>' +
        '<div class="group-card-body"><div class="group-card-day">' + t.count + (t.count === 1 ? ' group' : ' groups') + '</div>' +
        '<div class="group-card-name">' + esc(t.name) + '</div>' +
        '<div class="group-card-desc">' + esc(t.description || TYPE_FALLBACK_DESC[t.name] || '') + '</div></div></a>'
      ).join('');
    });
  }

  if (window.PCO) window.PCO.onData(snap => { renderPage(snap); renderTypeCards(snap); });
}());
```

- [ ] **Step 2: Adjust the modal code**

In `openGroupModal`, replace the leader line `groupLeader.textContent = g.leader;` with:

```js
    groupLeader.parentElement.style.display = 'none';
```

Replace the description assignment with `groupDescription.innerHTML = window.PCO_UI.paragraphs(g.description);`.

Replace the per-element click/keydown binding on `[data-group-id]` at the bottom with delegation:

```js
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-group-id]');
    if (card) openGroupModal(card.dataset.groupId);
  });
  document.addEventListener('keydown', e => {
    const card = e.target.closest('[data-group-id]');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openGroupModal(card.dataset.groupId); }
  });
```

(Read the existing binding first; if it already handles keyboard, mirror exactly what it does.)

- [ ] **Step 3: groups.html**

Replace the whole `<div class="groups-categories">` … `</div>` block (lines 70–262) with:

```html
    <div class="groups-categories" data-pco-groups>
      <div>
        <div class="group-category-header"><h2 class="group-category-title">&nbsp;</h2></div>
        <div class="groups-grid">
          <div class="group-card skeleton"><div class="group-card-image"></div><div class="group-card-body"><div class="group-card-day">&nbsp;</div><div class="group-card-name">&nbsp;</div><div class="group-card-desc">&nbsp;</div></div></div>
          <div class="group-card skeleton"><div class="group-card-image"></div><div class="group-card-body"><div class="group-card-day">&nbsp;</div><div class="group-card-name">&nbsp;</div><div class="group-card-desc">&nbsp;</div></div></div>
          <div class="group-card skeleton"><div class="group-card-image"></div><div class="group-card-body"><div class="group-card-day">&nbsp;</div><div class="group-card-name">&nbsp;</div><div class="group-card-desc">&nbsp;</div></div></div>
          <div class="group-card skeleton"><div class="group-card-image"></div><div class="group-card-body"><div class="group-card-day">&nbsp;</div><div class="group-card-name">&nbsp;</div><div class="group-card-desc">&nbsp;</div></div></div>
        </div>
      </div>
    </div>
```

Callout button: `View all 31 groups →` → `<button ... data-pco-group-count>View all groups →</button>`.

Scripts (line 407): insert `<script src="js/pco-data.js"></script>`, `<script src="js/pco.js"></script>`, `<script src="js/events.js"></script>` before `js/groups.js` (events.js provides `PCO_UI`; its modal code is guarded by `if (eventBackdrop)` so it is inert here).

- [ ] **Step 4: index.html**

Replace the four `<a class="group-card" ...>` cards inside `<div class="groups-grid" data-reveal-stagger>` (lines 158–204) with four `group-card skeleton` divs (same markup as Step 3) and add `data-pco-group-types` to that grid div. Add `<script src="js/groups.js"></script>` after `js/events.js` (line 431).

- [ ] **Step 5: CSS**

Append to `css/style.css` after `.group-card-monogram`:

```css
.group-card-pill {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}
.group-card-pill.pill-full { color: #d9a441; border-color: rgba(217,164,65,0.4); }
.group-card.skeleton { pointer-events: none; }
.group-card.skeleton .group-card-image,
.group-card.skeleton .group-card-day,
.group-card.skeleton .group-card-name,
.group-card.skeleton .group-card-desc {
  color: transparent;
  background: linear-gradient(90deg, var(--bg-highlight) 25%, var(--bg-elevated) 50%, var(--bg-highlight) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
.group-card.skeleton .group-card-day { width: 40%; height: 12px; }
.group-card.skeleton .group-card-name { width: 70%; height: 18px; }
.group-card.skeleton .group-card-desc { width: 90%; height: 28px; }
```

- [ ] **Step 6: Browser check**

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,4200 --screenshot=.context/groups.png http://localhost:8000/groups.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --window-size=1440,2400 --screenshot=.context/index-groups.png http://localhost:8000/index.html
```

Expected: five sections in PCO order (Ministries, Serve Opportunities at Cornerstone, Serve Opportunities in Our Community, Growth Groups, Unique Groups), cards with gradients + monograms, the three override images intact, "Full" pill on any full group, no photos. Home page shows five category cards with live counts. Also run a quick DOM check of the modal:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --dump-dom http://localhost:8000/groups.html | grep -c 'data-group-id='
```

Expected: a number equal to the snapshot's `groups.length`.

- [ ] **Step 7: Commit**

```bash
git add js/groups.js groups.html index.html css/style.css
git commit -m "Render groups and category cards from Planning Center"
```

---

### Task 8: Secrets, workflow run, docs

**Files:**
- Create: `docs/planning-center-setup.md`
- Modify: `CLAUDE.md` ("Planning Center sync" section)
- Delete: `scripts/capture-fixtures.mjs`? No, keep it; it's how fixtures get refreshed.

- [ ] **Step 1: Set GitHub repo secrets (Zand approved)**

```bash
gh secret set PCO_APP_ID --repo zandcmesa/cornerstone-site --body "$PCO_APP_ID"
gh secret set PCO_SECRET --repo zandcmesa/cornerstone-site --body "$PCO_SECRET"
gh secret list --repo zandcmesa/cornerstone-site
```

Expected: both names listed.

- [ ] **Step 2: Write the setup doc**

```markdown
# Planning Center: live data setup

The site reads Planning Center two ways. A nightly GitHub Action commits a snapshot to `js/pco-data.js`
(already wired; secrets `PCO_APP_ID` / `PCO_SECRET` are set on the repo). A Cloudflare Worker serves the
same data live so same-day changes show within 5 minutes. Pages render the snapshot instantly and
then swap in the live copy.

## One-time: deploy the worker

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up (no domain needed).
2. In a terminal, from the repo root:

   ```bash
   cd worker
   npx wrangler@latest login        # opens the browser once
   npx wrangler@latest deploy       # prints a URL like https://cornerstone-pco.<you>.workers.dev
   npx wrangler@latest secret put PCO_APP_ID     # paste the App ID from the key file
   npx wrangler@latest secret put PCO_SECRET     # paste the Secret
   ```

3. Open the printed URL in a browser. You should see JSON starting with `{"syncedAt":`.
4. Paste that URL into `js/pco.js` as the value of `PCO_WORKER_URL`, commit, push.

## Re-deploying after a code change

```bash
cd worker && npx wrangler@latest deploy
```

## How data is filtered

Only Church Center-visible items ever leave the worker: visible Calendar events, open non-archived
Registrations signups, listed groups with a public Church Center URL, and Church Center-visible group
types. Photos from Planning Center are not used; cards use the site's gradients.

## Refreshing the test fixtures

```bash
PCO_APP_ID=… PCO_SECRET=… node scripts/capture-fixtures.mjs && node --test scripts/
```
```

- [ ] **Step 3: Update CLAUDE.md**

Replace the "Planning Center sync" section with:

```markdown
## Planning Center (live)

`scripts/pco-lib.mjs` normalizes Calendar, Registrations signups, and Groups into one snapshot shape. Two consumers: `.github/workflows/sync-planning-center.yml` runs `scripts/sync-pco.mjs` nightly and commits `js/pco-data.js` (`PCO_SNAPSHOT`); `worker/` is a Cloudflare Worker serving the same shape live with a 5-minute cache. `js/pco.js` renders the snapshot on load, then fetches `PCO_WORKER_URL` and re-renders only if the data differs. `js/events.js` fills `[data-pco-rhythms]`, `[data-pco-events]`, `[data-pco-next-steps]`; `js/groups.js` fills `[data-pco-groups]` and `[data-pco-group-types]`. Curated images/copy for specific groups live in `GROUP_OVERRIDES` keyed by PCO group id. Tests: `node --test scripts/`. Deploy steps: `docs/planning-center-setup.md`. Repo secrets `PCO_APP_ID` / `PCO_SECRET` are set.
```

Also update the project structure tree entries for `js/pco-data.js`, `js/pco.js`, `scripts/`, `worker/`.

- [ ] **Step 4: Commit, push, trigger the workflow once**

```bash
git add docs/planning-center-setup.md CLAUDE.md
git commit -m "Document Planning Center live setup"
git push -u origin HEAD
gh workflow run sync-planning-center.yml --ref $(git branch --show-current)
sleep 60
gh run list --workflow=sync-planning-center.yml --limit 1
```

Expected: run status `completed` / `success`. If the Action commits a refreshed snapshot to the branch, `git pull` before opening the PR.

- [ ] **Step 5: Open the PR**

```bash
gh pr create --base main --title "Planning Center live integration: events, groups, home widgets" --body "$(cat <<'EOF'
## Summary
- Shared normalizer (`scripts/pco-lib.mjs`) with tests; nightly Action commits `PCO_SNAPSHOT`
- Cloudflare Worker (`worker/`) serves the same data live; `js/pco.js` renders snapshot then live
- Events page fully PCO-driven (weekly gatherings, upcoming, next steps); groups page and home widgets too
- Deploy checklist in `docs/planning-center-setup.md`; worker URL still to be pasted into `js/pco.js`

## Test plan
- `node --test scripts/` passes
- Screenshots of events, groups, and home pages attached in the PR comments

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

- Spec coverage: architecture (Tasks 2–4, 6), groups rules (2, 7), events rules (2, 5), home widgets (5, 7), no-photos rule (2 drops `imageUrl`; 7 never renders one), secrets (8), setup doc (8). Covered.
- Type consistency: `snapshot.groupTypes[].slug` produced in Task 2, consumed as `t.slug` in Task 7. `e.kind` values `'rhythm' | 'event' | 'signup'` produced in Task 2, consumed in Task 5 `LABELS`. `PCO_UI.paragraphs` produced in Task 5, consumed in Task 7. `PCO.onData` produced in Task 6, consumed in 5 and 7 (guarded by `if (window.PCO)`).
- Script order on every page: `pco-data.js` → `pco.js` → `events.js` → `groups.js` (when used) → `main.js` → `blocks.js`. Snapshot render happens synchronously before `blocks.js` observes reveals, so reveal animation applies to real rows.
