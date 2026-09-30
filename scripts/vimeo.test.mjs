import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkRanges, pickTrack } from './vimeo.mjs';

test('chunkRanges splits a 150 MB file into three 64 MB chunks', () => {
  const MB = 1024 * 1024;
  assert.deepEqual(chunkRanges(150 * MB, 64 * MB), [[0, 64 * MB], [64 * MB, 128 * MB], [128 * MB, 150 * MB]]);
});

test('pickTrack prefers a human English track over autogen, and only active tracks', () => {
  const auto = { type: 'subtitles', language: 'en-x-autogen', active: true, link: 'a' };
  const human = { type: 'captions', language: 'en', active: true, link: 'h' };
  const off = { type: 'captions', language: 'en', active: false, link: 'o' };
  assert.equal(pickTrack([auto, human]).link, 'h');
  assert.equal(pickTrack([off, auto]).link, 'a');
  assert.equal(pickTrack([off]), null);
  assert.equal(pickTrack([]), null);
});
