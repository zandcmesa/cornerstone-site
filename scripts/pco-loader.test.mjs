import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load(snapshot, fetchImpl) {
  const src = fs.readFileSync(new URL('../js/pco.js', import.meta.url), 'utf8');
  const window = { PCO_WORKER_URL: 'https://example.test' };
  const ctx = { window, PCO_SNAPSHOT: snapshot, fetch: fetchImpl, setTimeout, clearTimeout, AbortController, console };
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
  const PCO = load({ syncedAt: 'a', events: [] }, async () => ({ ok: true, json: async () => live }));
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

test('empty stub snapshot still renders once live data arrives', async () => {
  const live = { syncedAt: 'later', events: [{ id: 'x' }] };
  const PCO = load({ syncedAt: null, events: [] }, async () => ({ ok: true, json: async () => live }));
  const seen = [];
  PCO.onData(d => seen.push(d.syncedAt));
  assert.deepEqual(seen, []);
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(seen, ['later']);
});
