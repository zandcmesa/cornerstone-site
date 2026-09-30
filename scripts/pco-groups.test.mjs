import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeGroups } from './pco-lib.mjs';

const fx = name => JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url)));

function render(Blocks) {
  const snap = { syncedAt: 'x', rhythms: [], events: [], nextSteps: [], ...normalizeGroups(fx('groups'), fx('group-types')) };
  const els = { '[data-pco-groups]': { innerHTML: '' }, '[data-pco-group-types]': { innerHTML: '' }, '[data-pco-group-count]': { textContent: '' } };
  const document = { getElementById: () => null, querySelectorAll: sel => (els[sel] ? [els[sel]] : []), addEventListener: () => {} };
  const window = { PCO: { onData: fn => fn(snap) }, Blocks };
  const ctx = { window, document, console };
  vm.runInNewContext(fs.readFileSync(new URL('../js/events.js', import.meta.url), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(new URL('../js/groups.js', import.meta.url), 'utf8') + ';window.__GROUPS_DATA = GROUPS_DATA;', ctx);
  return { snap, els, GROUPS_DATA: window.__GROUPS_DATA };
}

test('groups page renders one section per type with every public group and no Planning Center photos', () => {
  const { snap, els } = render();
  const html = els['[data-pco-groups]'].innerHTML;
  snap.groupTypes.forEach(t => assert.ok(html.includes(`id="${t.slug}"`), t.slug));
  assert.equal((html.match(/data-group-id="/g) || []).length, snap.groups.length);
  assert.ok(!html.includes('s3.amazonaws.com'), 'no PCO header images');
  assert.equal((html.match(/<img /g) || []).length, 3, 'only the three curated override images');
  assert.ok(html.includes('class="group-card-pill pill-full">Full<'), 'full groups get a pill');
  assert.ok(!html.includes('Staff'));
  assert.ok(!/group-card-monogram">[^<]*[—\-|]/.test(html), 'monogram skips punctuation');
  assert.ok(!html.includes('group-card-day">Serve Opportunities at Cornerstone'), 'day line does not repeat the section name');
  assert.ok(html.includes('group-card-day">Request to join'), 'schedule-less open groups show how to join');
});

test('home category cards link to the section slugs with live counts', () => {
  const { snap, els } = render();
  const html = els['[data-pco-group-types]'].innerHTML;
  assert.equal((html.match(/<a class="group-card"/g) || []).length, snap.groupTypes.length);
  snap.groupTypes.forEach(t => {
    assert.ok(html.includes(`href="groups.html#${t.slug}"`));
    assert.ok(html.includes(`${t.count} group`));
  });
  assert.equal(els['[data-pco-group-count]'].textContent, `View all ${snap.groups.length} groups →`);
});

test('modal data uses overrides and strategy-based CTA text', () => {
  const { GROUPS_DATA } = render();
  assert.equal(GROUPS_DATA['807069'].name, 'Kingdom Kids');
  assert.equal(GROUPS_DATA['807069'].image, 'images/kingdom-kids.png');
  assert.equal(GROUPS_DATA['1711298'].ctaText, 'Request to Join');
  assert.equal(GROUPS_DATA['1711298'].category, 'Ministries');
  const full = Object.values(GROUPS_DATA).find(g => g.enrollment === 'full');
  assert.equal(full.ctaText, 'View on Church Center');
});

test('groups render hands new sections to the motion engine so reveal headers become visible', () => {
  const scanned = [];
  render({ scan: el => scanned.push(el) });
  assert.ok(scanned.length >= 1);
});
