import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchReplay, sliceSegments, rebaseVtt, ytBaseArgs } from './cut-sermon.mjs';

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

test('ytBaseArgs adds a cookies file only when YOUTUBE_COOKIES is set', () => {
  assert.deepEqual(ytBaseArgs({}), []);
  const args = ytBaseArgs({ YOUTUBE_COOKIES: '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc\n' });
  assert.equal(args[0], '--cookies');
  assert.match(args[1], /cookies\.txt$/);
});
