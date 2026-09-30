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

test('normalizeCalendar drops pending, rejected, and link-only events even when marked visible', () => {
  const json = JSON.parse(JSON.stringify(fx('calendar-instances')));
  const concert = json.included.find(i => i.type === 'Event' && i.attributes.name === 'Josh Baldwin Concert');
  concert.attributes.approval_status = 'P';
  const sunday = json.included.find(i => i.type === 'Event' && i.attributes.name === 'Sunday Service');
  sunday.attributes.link_only = true;
  const { rhythms, events } = normalizeCalendar(json, NOW);
  assert.ok(!events.some(e => e.title === 'Josh Baldwin Concert'), 'pending event dropped');
  assert.ok(!rhythms.some(r => r.title === 'Sunday Service'), 'link-only event dropped');
});

test('rhythm links are stable across instances (calendar listing, not a dated instance)', () => {
  const { rhythms } = normalizeCalendar(fx('calendar-instances'), NOW);
  rhythms.forEach(r => assert.ok(!/\/calendar\/event\/\d+/.test(r.pcoUrl), r.title + ' must not link to a single instance: ' + r.pcoUrl));
  assert.ok(rhythms[0].pcoUrl.startsWith('https://cornerstonechurchma.churchcenter.com/calendar'));
});

test('groups whose type is hidden in Church Center never leave the server', () => {
  const groups = JSON.parse(JSON.stringify(fx('groups')));
  const types = fx('group-types');
  const hidden = types.data.find(t => !t.attributes.church_center_visible);
  const ya = groups.data.find(g => g.attributes.name === 'Cornerstone Young Adults');
  ya.relationships.group_type.data.id = hidden.id;
  const out = normalizeGroups(groups, types);
  assert.ok(!out.groups.some(g => g.name === 'Cornerstone Young Adults'));
  const visible = new Set(out.groupTypes.map(t => t.id));
  out.groups.forEach(g => assert.ok(visible.has(g.typeId), g.name));
});
