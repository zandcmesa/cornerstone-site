import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkRanges, pickTrack, sendChunk } from './vimeo.mjs';

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

test('sendChunk retries a dropped connection and resumes from the offset Vimeo reports', async () => {
  const calls = [];
  const origFetch = globalThis.fetch;
  let patches = 0;
  globalThis.fetch = async (url, opts = {}) => {
    calls.push(`${opts.method} ${opts.headers?.['Upload-Offset'] ?? ''}`.trim());
    if (opts.method === 'HEAD') return { headers: { get: () => '30' } };
    if (++patches === 1) throw new TypeError('fetch failed');
    return { ok: true, headers: { get: () => '100' } };
  };
  try {
    await sendChunk('u', 0, 100, Buffer.alloc(100), 3, async () => {});
    assert.deepEqual(calls, ['PATCH 0', 'HEAD', 'PATCH 30']);
  } finally { globalThis.fetch = origFetch; }
});

test('sendChunk gives up after the attempt limit with a clear message', async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => { if (opts.method === 'HEAD') return null; throw new TypeError('fetch failed'); };
  try {
    await assert.rejects(() => sendChunk('u', 0, 10, Buffer.alloc(10), 2, async () => {}), /failed after 2 attempts: fetch failed/);
  } finally { globalThis.fetch = origFetch; }
});
