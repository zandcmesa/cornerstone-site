import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { matchReplay, sliceSegments, rebaseVtt, ytBaseArgs, findReplay, ytdlpError, YouTubeLoginError, UPLOAD_PRIVACY, cutSermon, exitCodeFor } from './cut-sermon.mjs';

test('matchReplay picks the stream released on the target Sunday in New York time', () => {
  const list = [
    { id: 'late', release_timestamp: 1788099878 },
    { id: 'aug16', release_timestamp: 1786887996 },
    { id: 'aug30-early-utc', release_timestamp: Date.UTC(2026, 7, 30, 13, 0) / 1000 },
  ];
  assert.equal(matchReplay(list, '2026-08-16').id, 'aug16');
  assert.equal(matchReplay(list, '2026-08-30').id, 'late');
  assert.equal(matchReplay(list, '2026-08-23'), null);
});

test('sliceSegments keeps only lines inside the sermon window', () => {
  const segs = [{ t: 10, text: 'a' }, { t: 100, text: 'b' }, { t: 200, text: 'c' }, { t: 300, text: 'd' }];
  assert.deepEqual(sliceSegments(segs, 100, 250).map(s => s.text), ['b', 'c']);
});

test('rebaseVtt produces a VTT starting at zero', () => {
  const segs = [{ t: 100, text: 'b' }, { t: 104, text: 'c' }];
  const vtt = rebaseVtt(segs, 100, 250);
  assert.equal(vtt, 'WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nb\n\n00:00:04.000 --> 00:00:08.000\nc\n');
});

test('ytBaseArgs always allows the EJS solver and adds cookies only when set', () => {
  assert.deepEqual(ytBaseArgs({}), ['--remote-components', 'ejs:npm']);
  const args = ytBaseArgs({ YOUTUBE_COOKIES: '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc\n' });
  assert.deepEqual(args.slice(0, 2), ['--remote-components', 'ejs:npm']);
  assert.equal(args[2], '--cookies');
  assert.match(args[3], /cookies\.txt$/);
});

test('findReplay skips streams whose timestamp lookup fails (upcoming scheduled streams)', () => {
  const r = findReplay('2026-08-16', {
    listIds: () => ['upcoming', 'aug16'],
    releaseTs: id => { if (id === 'upcoming') throw new Error('This live event will begin in 3 days'); return 1786887996; },
  });
  assert.equal(r.id, 'aug16');
});

const BOT_BLOCK = 'ERROR: [youtube] IPTGFqIqXFI: Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the authentication.';

test('ytdlpError names the expired YouTube login instead of a generic failure', () => {
  const e = ytdlpError(`WARNING: something minor\n${BOT_BLOCK}\n`);
  assert.ok(e instanceof YouTubeLoginError);
  assert.match(e.message, /YOUTUBE_COOKIES/);
  assert.match(e.message, /IPTGFqIqXFI/);
  assert.doesNotMatch(e.message, /WARNING/);
  const other = ytdlpError('ERROR: [youtube] abc: Video unavailable\n');
  assert.ok(!(other instanceof YouTubeLoginError));
  assert.equal(other.message, 'ERROR: [youtube] abc: Video unavailable');
});

test('findReplay reports a login block instead of "no replay found"', () => {
  assert.throws(() => findReplay('2026-10-11', {
    listIds: () => ['oct11'],
    releaseTs: () => { throw ytdlpError(BOT_BLOCK); },
  }), YouTubeLoginError);
});

test('uploads are unlisted so the reviewer can preview them', () => {
  assert.equal(UPLOAD_PRIVACY.view, 'unlisted');
});

function fakeDeps(over = {}) {
  const calls = [], dirs = new Set(), seen = {};
  const rec = (name, fn) => (...a) => { calls.push(name); return fn(...a); };
  const deps = {
    me: rec('me', async () => ({ name: 'x', link: 'y' })),
    listVideos: rec('listVideos', async () => [{ vimeoId: '123', name: 'Old', description: 'Sermon date: 2026-10-25' }]),
    findReplay: rec('findReplay', () => ({ id: 'yt1' })),
    fetchTimedCaptions: (id, dir) => { calls.push('fetchTimedCaptions'); dirs.add(dir); return [{ t: 0, text: 'pre' }, { t: 2528, text: 'Let us welcome Pastor Josh' }, { t: 2540, text: 'Open your Bibles' }, { t: 4700, text: 'amen' }, { t: 4745, text: 'Amen. God bless you' }, { t: 4800, text: 'closing song' }]; },
    findSermonBounds: rec('findSermonBounds', async () => ({ start: 2500, end: 4800, confidence: 'high', note: 'ai' })),
    extractMetadata: rec('extractMetadata', async () => ({ title: 'T', speaker: 'Pastor Josh Eldridge', scripture: 'John 3', description: 'd' })),
    readArchive: rec('readArchive', () => ({ entries: [{ date: '2026-10-18', vimeoId: 'X' }], maxId: 1 })),
    downloadSection: (id, start, end, out) => { calls.push('downloadSection'); dirs.add(path.dirname(out)); fs.writeFileSync(out, 'x'); return out; },
    editSermon: rec('editSermon', async () => null),
    uploadVideo: rec('uploadVideo', async a => { seen.upload = a; return '999'; }),
    uploadTextTrack: async (id, vtt) => { calls.push('uploadTextTrack'); seen.vtt = vtt; },
    retireVideo: async id => { calls.push(`retireVideo:${id}`); },
    syncSermons: async arg => { calls.push('syncSermons'); seen.sync = arg; },
    log: () => {},
    ...over,
  };
  const cleanup = () => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); };
  return { deps, calls, seen, cleanup };
}

test('without bounds, a Sunday already on Vimeo exits before any download or sync', async () => {
  const { deps, calls, cleanup } = fakeDeps();
  try {
    const r = await cutSermon({ date: '2026-10-25' }, deps);
    assert.equal(r.status, 'already-on-vimeo');
    assert.ok(!calls.includes('downloadSection'));
    assert.ok(!calls.includes('syncSermons'));
  } finally { cleanup(); }
});

test('captions not ready is a quiet status, not an error', async () => {
  const f = fakeDeps({ listVideos: async () => [] });
  f.deps.fetchTimedCaptions = (id, dir) => { f.calls.push('fetchTimedCaptions'); return null; };
  try {
    const r = await cutSermon({ date: '2026-10-25' }, f.deps);
    assert.equal(r.status, 'captions-not-ready');
    assert.ok(!f.calls.includes('findSermonBounds'));
    assert.ok(!f.calls.includes('syncSermons'));
  } finally { f.cleanup(); }
});

test('explicit bounds replace: upload first, then retire the old video, then sync', async () => {
  const { deps, calls, seen, cleanup } = fakeDeps();
  try {
    const r = await cutSermon({ date: '2026-10-25', start: '42:10', end: '1:19:00' }, deps);
    assert.equal(r.status, 'replaced');
    assert.equal(r.vimeoId, '999');
    const up = calls.indexOf('uploadVideo'), retire = calls.indexOf('retireVideo:123'), sync = calls.indexOf('syncSermons');
    assert.ok(up >= 0 && up < retire && retire < sync, calls.join(' '));
    const p = seen.sync.previewOverride['999'];
    assert.equal(p.start, 2530);
    assert.equal(p.end, 4740);
    assert.equal(p.startLine, 'Open your Bibles');
    assert.equal(p.endLine, 'amen');
  } finally { cleanup(); }
});

test('explicit bounds for a date already on main are refused before touching Vimeo', async () => {
  const { deps, calls, cleanup } = fakeDeps();
  try {
    await assert.rejects(cutSermon({ date: '2026-10-18', start: '42:10', end: '1:19:00' }, deps), /already published/);
    assert.ok(!calls.some(c => c.startsWith('retireVideo')));
    assert.ok(!calls.includes('uploadVideo'));
  } finally { cleanup(); }
});

test('bounds accept H:MM:SS on the CLI path', async () => {
  const { deps, cleanup } = fakeDeps();
  try {
    const r = await cutSermon({ date: '2026-10-25', start: '42:10', end: '1:19:00', dryRun: true }, deps);
    assert.equal(r.bounds.start, 2530);
  } finally { cleanup(); }
});

test('--strict turns a missing replay or missing captions into a failure', () => {
  assert.equal(exitCodeFor('captions-not-ready', true), 1);
  assert.equal(exitCodeFor('no-replay', true), 1);
  assert.equal(exitCodeFor('captions-not-ready', false), 0);
  assert.equal(exitCodeFor('no-replay', false), 0);
  assert.equal(exitCodeFor('already-on-vimeo', true), 0);
  assert.equal(exitCodeFor('uploaded', true), 0);
});

test('rebaseVtt shifts every cue by the offset', () => {
  const segs = [{ t: 100, text: 'b' }, { t: 104, text: 'c' }];
  assert.equal(rebaseVtt(segs, 100, 250, 7), 'WEBVTT\n\n00:00:07.000 --> 00:00:11.000\nb\n\n00:00:11.000 --> 00:00:15.000\nc\n');
});

test('the bumper edit is uploaded instead of the raw cut and captions move by the lead-in', async () => {
  const { deps, calls, seen, cleanup } = fakeDeps({
    editSermon: async ({ input, output }) => { calls.push('editSermon'); fs.writeFileSync(output, 'xx'); return { output, leadIn: 7 }; },
  });
  try {
    const r = await cutSermon({ date: '2026-10-25', start: '42:10', end: '1:19:00' }, deps);
    assert.equal(r.status, 'replaced');
    assert.ok(calls.indexOf('downloadSection') < calls.indexOf('editSermon') && calls.indexOf('editSermon') < calls.indexOf('uploadVideo'));
    assert.match(seen.upload.filePath, /sermon-2026-10-25-edit\.mp4$/);
    assert.match(seen.vtt, /^WEBVTT\n\n00:00:(0[7-9]|1[0-9])/);
  } finally { cleanup(); }
});

test('without bumper assets the raw cut is uploaded and captions start at zero', async () => {
  const { deps, seen, cleanup } = fakeDeps();
  try {
    await cutSermon({ date: '2026-10-25', start: '42:10', end: '1:19:00' }, deps);
    assert.match(seen.upload.filePath, /sermon-2026-10-25\.mp4$/);
    assert.match(seen.vtt, /^WEBVTT\n\n00:00:0[0-9]\.000/);
  } finally { cleanup(); }
});
