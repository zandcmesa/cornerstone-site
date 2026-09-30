import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncSermons } from './sync-sermons.mjs';

const BASE = 'const SERMON_DATA = [\n  { id: 1, title: "Old", date: "2026-06-28", speaker: "Pastor Josh Eldridge", series: null, scripture: "", scriptureBook: "", topics: [], description: "", vimeoId: "A" },\n];\n';
const DRAFT_LINE = '  { id: 2, title: "Hand Edited Title", date: "2026-07-12", speaker: "Pastor Josh Eldridge", series: null, scripture: "", scriptureBook: "", topics: [], description: "", vimeoId: "D" },';
const DRAFTS = BASE.replace('[\n', '[\n' + DRAFT_LINE + '\n');

function fakes(overrides = {}) {
  const calls = { extract: 0, art: [], published: null };
  const deps = {
    listVideos: async () => [
      { vimeoId: 'M', name: 'Sunday Sermon 07-26-2026', description: null },
      { vimeoId: 'N', name: 'Sunday Sermon 07-19-2026', description: null },
      { vimeoId: 'D', name: 'Sunday Sermon 07-12-2026', description: null },
      { vimeoId: 'X', name: 'Christmas Eve 2026', description: null },
      { vimeoId: 'A', name: 'Sunday Sermon 06-28-2026', description: null },
    ],
    getTranscript: async id => (id === 'M' ? null : `transcript of ${id}`),
    extractMetadata: async () => { calls.extract++; return { title: 'New One', speaker: 'Pastor Josh Eldridge', series: null, scripture: 'John 1:1', scriptureBook: 'John', topics: ['Word'], description: 'About the Word.', artMood: 'ink and light' }; },
    generateArt: async ({ outJpg }) => { calls.art.push(outJpg); return outJpg; },
    git: {
      fetch: () => {},
      exists: () => false,
      show: (ref, path) => ref === 'origin/main' && path === 'js/sermons.js' ? BASE : ref === 'origin/sermon-sync' && path === 'js/sermons.js' ? DRAFTS : ref === 'origin/sermon-sync' && path === 'images/sermons/2.jpg' ? Buffer.from('jpg') : null,
      publish: async p => { calls.published = p; },
    },
    log: () => {},
    ...overrides,
  };
  return { deps, calls };
}

test('sync reuses drafts, adds new videos, skips missing captions and non-sermons', async () => {
  const { deps, calls } = fakes();
  const r = await syncSermons({}, deps);
  assert.deepEqual(r.entries.map(e => [e.vimeoId, e.id, e.reused]), [['D', 2, true], ['N', 3, false]]);
  assert.equal(r.entries[0].line, DRAFT_LINE);
  assert.equal(calls.extract, 1);
  assert.equal(calls.art.length, 1);
  assert.equal(r.entries[1].art, 'images/sermons/3.jpg');
  assert.deepEqual(r.skipped, [{ vimeoId: 'M', date: '2026-07-26', reason: 'captions not ready' }]);
  const src = calls.published.files.find(f => f.path === 'js/sermons.js').content;
  assert.ok(src.indexOf('vimeoId: "N"') < src.indexOf('vimeoId: "D"') && src.indexOf('vimeoId: "D"') < src.indexOf('vimeoId: "A"'));
  assert.ok(calls.published.files.some(f => f.path === 'images/sermons/2.jpg' && Buffer.isBuffer(f.content)));
  assert.match(calls.published.body, /2026-07-19/);
});

test('dry run never publishes', async () => {
  const { deps, calls } = fakes();
  const r = await syncSermons({ dryRun: true }, deps);
  assert.equal(r.entries.length, 2);
  assert.equal(calls.published, null);
});

test('art failure is logged, not fatal', async () => {
  const { deps, calls } = fakes({ generateArt: async () => { throw new Error('quota'); } });
  const r = await syncSermons({}, deps);
  assert.equal(r.entries[1].art, null);
  assert.match(calls.published.body, /art missing/i);
});

test('nothing pending publishes nothing', async () => {
  const { deps, calls } = fakes({ listVideos: async () => [{ vimeoId: 'A', name: 'Sunday Sermon 06-28-2026' }] });
  const r = await syncSermons({}, deps);
  assert.equal(r.entries.length, 0);
  assert.equal(calls.published, null);
});

test('overrides supply transcript and metadata for a just-uploaded video', async () => {
  const { deps, calls } = fakes({ getTranscript: async () => null });
  const meta = { title: 'Cut One', speaker: 'Pastor Josh Eldridge', series: null, scripture: '', scriptureBook: '', topics: [], description: '', artMood: 'x' };
  const r = await syncSermons({ metaOverride: { N: meta } }, deps);
  assert.deepEqual(r.entries.map(e => e.vimeoId), ['D', 'N']);
  assert.equal(calls.extract, 0);
});

test('a failing sermon is skipped with its error and the rest still publish', async () => {
  const { deps, calls } = fakes({ extractMetadata: async () => { throw new Error('Claude 529 overloaded'); } });
  const r = await syncSermons({}, deps);
  assert.deepEqual(r.entries.map(e => e.vimeoId), ['D']);
  assert.ok(r.skipped.some(s => s.vimeoId === 'N' && /overloaded/.test(s.reason)));
  assert.ok(calls.published);
  assert.match(calls.published.body, /overloaded/);
});

test('a metaOverride for a video the sync cannot see is an error, not a silent no-op', async () => {
  const { deps } = fakes();
  await assert.rejects(syncSermons({ metaOverride: { ZZZ: { title: 'x' } } }, deps), /ZZZ/);
});

test('a series drafted earlier in the run is offered to later sermons as a known series', async () => {
  const seen = [];
  const { deps } = fakes({
    getTranscript: async id => `transcript of ${id}`,
    extractMetadata: async (t, ctx) => { seen.push([...ctx.knownSeries]); return { title: 'T', speaker: 'Pastor Josh Eldridge', series: 'Seek First the Kingdom', scripture: '', scriptureBook: '', topics: [], description: '', artMood: 'x' }; },
  });
  await syncSermons({ dryRun: true }, deps);
  assert.equal(seen.length, 2);
  assert.ok(!seen[0].includes('Seek First the Kingdom'));
  assert.ok(seen[1].includes('Seek First the Kingdom'));
});
