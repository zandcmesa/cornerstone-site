import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildArtPrompt } from './sermon-art.mjs';

test('art prompt quotes the exact title and includes the mood', () => {
  const p = buildArtPrompt('Known in Heaven, Feared in Hell', 'a split sky, pale gold above crimson-black');
  assert.match(p, /"Known in Heaven, Feared in Hell"/);
  assert.match(p, /a split sky, pale gold above crimson-black/);
  assert.match(p, /16:9/);
});
