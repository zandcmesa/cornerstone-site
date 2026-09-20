// Pulls upcoming events and open groups from Planning Center and writes js/pco-data.js.
// Auth: Personal Access Token (app id + secret) via PCO_APP_ID / PCO_SECRET env vars.
// Run locally: PCO_APP_ID=... PCO_SECRET=... node scripts/sync-pco.js

const fs = require('fs');
const path = require('path');

const { PCO_APP_ID, PCO_SECRET } = process.env;
if (!PCO_APP_ID || !PCO_SECRET) {
  console.error('Missing PCO_APP_ID / PCO_SECRET');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${PCO_APP_ID}:${PCO_SECRET}`).toString('base64');
const BASE = 'https://api.planningcenteronline.com';
const HORIZON_DAYS = 120;

async function getAll(url) {
  const data = [], included = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers: { Authorization: AUTH } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${next}`);
    const json = await res.json();
    data.push(...json.data);
    if (json.included) included.push(...json.included);
    next = json.links && json.links.next;
  }
  return { data, included };
}

function fmtMonth(d) { return d.toLocaleString('en-US', { month: 'short', timeZone: 'America/New_York' }); }
function fmtDay(d)   { return d.toLocaleString('en-US', { day: 'numeric', timeZone: 'America/New_York' }); }
function fmtTime(d)  { return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }); }
function slug(s)     { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function stripHtml(s){ return (s || '').replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim(); }

async function fetchCalendarEvents() {
  const now = new Date();
  const until = new Date(now.getTime() + HORIZON_DAYS * 86400000);
  const url = `${BASE}/calendar/v2/event_instances?include=event` +
    `&where[starts_at][gte]=${now.toISOString()}&where[starts_at][lte]=${until.toISOString()}` +
    `&order=starts_at&per_page=100`;
  const { data, included } = await getAll(url);
  const events = Object.fromEntries(included.filter(i => i.type === 'Event').map(e => [e.id, e]));
  const seen = new Set();
  const out = [];
  for (const inst of data) {
    const ev = events[inst.relationships.event.data.id];
    if (!ev || !ev.attributes.visible_in_church_center) continue;
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);
    const start = new Date(inst.attributes.starts_at);
    const end = inst.attributes.ends_at ? new Date(inst.attributes.ends_at) : null;
    out.push({
      id: slug(ev.attributes.name) + '-' + ev.id,
      title: ev.attributes.name,
      startsAt: inst.attributes.starts_at,
      dateMonth: fmtMonth(start),
      dateDay: fmtDay(start),
      time: inst.attributes.all_day_event ? 'All Day' : fmtTime(start) + (end ? ' – ' + fmtTime(end) : ''),
      location: inst.attributes.location || 'Cornerstone Church',
      description: stripHtml(ev.attributes.description),
      imageUrl: ev.attributes.image_url || null,
      pcoUrl: ev.attributes.registration_url || null,
      source: 'calendar',
    });
  }
  return out;
}

async function fetchRegistrations() {
  const url = `${BASE}/registrations/v2/events?filter=published&order=starts_at&per_page=100`;
  const { data } = await getAll(url);
  return data
    .filter(e => e.attributes.visible_in_church_center !== false)
    .filter(e => !e.attributes.starts_at || new Date(e.attributes.starts_at) >= new Date())
    .map(e => {
      const start = e.attributes.starts_at ? new Date(e.attributes.starts_at) : null;
      return {
        id: slug(e.attributes.name) + '-reg-' + e.id,
        title: e.attributes.name,
        startsAt: e.attributes.starts_at,
        dateMonth: start ? fmtMonth(start) : 'Open',
        dateDay: start ? fmtDay(start) : '',
        time: start ? fmtTime(start) : 'Registration open',
        location: e.attributes.location_name || 'Cornerstone Church',
        description: stripHtml(e.attributes.description),
        imageUrl: e.attributes.logo_url || null,
        pcoUrl: e.attributes.new_registration_url || e.attributes.church_center_url || null,
        source: 'registrations',
      };
    });
}

async function fetchGroups() {
  const url = `${BASE}/groups/v2/groups?where[enrollment_open]=true&order=name&per_page=100&include=group_type`;
  const { data, included } = await getAll(url);
  const types = Object.fromEntries(included.filter(i => i.type === 'GroupType').map(t => [t.id, t.attributes.name]));
  return data
    .filter(g => g.attributes.public_church_center_web_url)
    .map(g => ({
      id: g.id,
      name: g.attributes.name,
      type: types[(g.relationships.group_type.data || {}).id] || null,
      schedule: g.attributes.schedule || null,
      description: stripHtml(g.attributes.description),
      imageUrl: (g.attributes.header_image || {}).medium || null,
      pcoUrl: g.attributes.public_church_center_web_url,
    }));
}

(async () => {
  let failures = 0;
  const soft = (label, p) => p.catch(e => { failures++; console.warn(label + ':', e.message); return []; });
  const [calendar, registrations, groups] = await Promise.all([
    soft('calendar', fetchCalendarEvents()),
    soft('registrations', fetchRegistrations()),
    soft('groups', fetchGroups()),
  ]);
  if (failures === 3) { console.error('All Planning Center requests failed; leaving js/pco-data.js untouched.'); process.exit(1); }

  // Calendar wins when the same event exists in both; registrations fill in the signup link.
  const byTitle = new Map(calendar.map(e => [e.title.toLowerCase(), e]));
  for (const r of registrations) {
    const match = byTitle.get(r.title.toLowerCase());
    if (match) { if (!match.pcoUrl) match.pcoUrl = r.pcoUrl; }
    else calendar.push(r);
  }
  calendar.sort((a, b) => (a.startsAt || '9999').localeCompare(b.startsAt || '9999'));

  const out = `// Generated by scripts/sync-pco.js — do not edit by hand.
// Last sync: ${new Date().toISOString()}
const PCO_EVENTS = ${JSON.stringify(calendar, null, 2)};
const PCO_GROUPS = ${JSON.stringify(groups, null, 2)};
`;
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'pco-data.js'), out);
  console.log(`events: ${calendar.length}, groups: ${groups.length}`);
})().catch(e => { console.error(e); process.exit(1); });
