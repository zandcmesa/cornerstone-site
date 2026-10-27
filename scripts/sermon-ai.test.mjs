import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTimed } from './sermon-lib.mjs';
import { buildMetadataPrompt, buildBoundsPrompt, METADATA_SCHEMA, BOUNDS_SCHEMA, parseResponse, MAX_TOKENS, resolveBounds } from './sermon-ai.mjs';

test('metadata prompt carries the date, known series, speakers and house-style examples', () => {
  const p = buildMetadataPrompt('Good morning church...', { date: '2026-07-05', knownSeries: ['Leadership Lessons'], knownSpeakers: ['Pastor Josh Eldridge'], examples: ['  { id: 1, title: "X" },'] });
  assert.match(p.system, /Leadership Lessons/);
  assert.match(p.system, /Pastor Josh Eldridge/);
  assert.match(p.system, /title: "X"/);
  assert.match(p.user, /2026-07-05/);
  assert.match(p.user, /Good morning church/);
  assert.deepEqual(Object.keys(METADATA_SCHEMA.properties), ['title', 'speaker', 'series', 'scripture', 'scriptureBook', 'topics', 'description', 'artMood']);
});

test('bounds prompt includes the timed transcript and asks for the line tags copied exactly', () => {
  const p = buildBoundsPrompt('[0:31:02] turn with me to Ephesians');
  assert.match(p.user, /\[0:31:02\] turn with me/);
  assert.match(p.system, /copy the tag/);
  assert.match(p.system, /exactly as written/);
  assert.deepEqual(Object.keys(BOUNDS_SCHEMA.properties), ['start', 'end', 'confidence', 'note']);
  assert.equal(BOUNDS_SCHEMA.properties.start.type, 'string');
  assert.equal(BOUNDS_SCHEMA.properties.end.type, 'string');
});

test('resolveBounds turns tags found in the transcript into seconds and rejects invented ones', () => {
  const t = formatTimed([{ t: 0, text: 'pre' }, { t: 4037, text: 'Open your Bibles' }, { t: 7149, text: 'amen' }]);
  assert.match(t, /\[1:07:17\] Open your Bibles/);
  assert.match(t, /\[1:59:09\] amen/);
  assert.deepEqual(resolveBounds({ start: '1:07:17', end: '1:59:09', confidence: 'high', note: 'x' }, t), { start: 4037, end: 7149, confidence: 'high', note: 'x' });
  assert.throws(() => resolveBounds({ start: '1:07:17', end: '1:39:09', confidence: 'high', note: 'x' }, t), /not in the transcript/);
});

test('bounds prompt warns that the welcome before worship is not the sermon', () => {
  const { system } = buildBoundsPrompt('[0:00:00] hi');
  assert.match(system, /second appearance/i);
  assert.match(system, /second half/i);
  assert.match(system, /30 to 50 minutes/);
  assert.match(system, /singing or an offering/i);
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
