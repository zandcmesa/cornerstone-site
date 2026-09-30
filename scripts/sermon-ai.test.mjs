import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMetadataPrompt, buildBoundsPrompt, METADATA_SCHEMA, BOUNDS_SCHEMA, parseResponse, MAX_TOKENS } from './sermon-ai.mjs';

test('metadata prompt carries the date, known series, speakers and house-style examples', () => {
  const p = buildMetadataPrompt('Good morning church...', { date: '2026-07-05', knownSeries: ['Leadership Lessons'], knownSpeakers: ['Pastor Josh Eldridge'], examples: ['  { id: 1, title: "X" },'] });
  assert.match(p.system, /Leadership Lessons/);
  assert.match(p.system, /Pastor Josh Eldridge/);
  assert.match(p.system, /title: "X"/);
  assert.match(p.user, /2026-07-05/);
  assert.match(p.user, /Good morning church/);
  assert.deepEqual(Object.keys(METADATA_SCHEMA.properties), ['title', 'speaker', 'series', 'scripture', 'scriptureBook', 'topics', 'description', 'artMood']);
});

test('bounds prompt includes the timed transcript and asks for seconds', () => {
  const p = buildBoundsPrompt('[0:31:02] turn with me to Ephesians');
  assert.match(p.user, /\[0:31:02\] turn with me/);
  assert.match(p.system, /seconds/);
  assert.deepEqual(Object.keys(BOUNDS_SCHEMA.properties), ['start', 'end', 'confidence', 'note']);
});

test('series uses anyOf for the nullable type', () => {
  assert.deepEqual(METADATA_SCHEMA.properties.series.anyOf, [{ type: 'string' }, { type: 'null' }]);
  assert.equal(METADATA_SCHEMA.properties.series.type, undefined);
});

test('parseResponse explains truncation and refusal instead of a bare JSON error', () => {
  assert.throws(() => parseResponse({ stop_reason: 'max_tokens', content: [] }), /max_tokens/);
  assert.throws(() => parseResponse({ stop_reason: 'refusal', content: [], stop_details: { explanation: 'nope' } }), /declined.*nope/);
  assert.deepEqual(parseResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"a":1}' }] }), { a: 1 });
  assert.ok(MAX_TOKENS >= 16000);
});
