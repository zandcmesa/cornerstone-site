import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchReplay, sliceSegments, rebaseVtt, ytBaseArgs, findReplay, ytdlpError, YouTubeLoginError, UPLOAD_PRIVACY } from './cut-sermon.mjs';

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
