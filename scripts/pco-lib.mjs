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
    const timeRefs = (rel.signup_times && rel.signup_times.data) || [];
    const ts = timeRefs.map(t => times[t.id]).filter(Boolean).map(t => t.attributes)
      .filter(t => new Date(t.starts_at) >= now).sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    const common = { title: a.name.trim(), kind: 'signup', location, description: stripHtml(a.description), pcoUrl: a.new_registration_url };
    if (ts.length) {
      const t = ts[0];
      events.push({ id: 'reg-' + s.id, ...common, startsAt: t.starts_at,
        dateMonth: fmtMonth(t.starts_at), dateDay: fmtDay(t.starts_at),
        time: t.all_day ? 'All Day' : timeRange(t.starts_at, t.ends_at), ctaText: 'Register' });
    } else if (!timeRefs.length) {
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
