import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseArchive, sermonDateFromVideo, vttToText, json3ToTimed, formatTimed,
  buildEntryLine, insertEntries, pickCandidates, previousSunday, artFile, validateBounds, archiveContext,
} from './sermon-lib.mjs';

const fx = name => fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const SRC = fs.readFileSync(new URL('../js/sermons.js', import.meta.url), 'utf8');

test('parseArchive reads every row of the real archive', () => {
  const a = parseArchive(SRC);
  assert.equal(a.entries.length, 128);
  assert.equal(a.maxId, 128);
  assert.deepEqual({ ...a.entries[0], line: undefined }, { id: 1, date: '2026-06-28', vimeoId: '1205525119', series: null, speaker: 'Pastor Christine Disibio', line: undefined });
  assert.equal(a.entries[6].series, 'Leadership Lessons');
  assert.ok(a.entries[0].line.startsWith('  { id: 1,'));
  assert.equal(SRC.slice(0, a.insertAt).trimEnd().endsWith('const SERMON_DATA = ['), true);
});

test('sermonDateFromVideo reads the agency title, then the description marker, else null', () => {
  assert.equal(sermonDateFromVideo({ name: 'Sunday Sermon 09-27-2026', description: null }), '2026-09-27');
  assert.equal(sermonDateFromVideo({ name: 'The Dynamite Power You Keep Quenching', description: 'Pastor Christine\n\nSermon date: 2026-10-04' }), '2026-10-04');
  assert.equal(sermonDateFromVideo({ name: 'Christmas Eve 2026', description: '' }), null);
});

test('vttToText strips headers, timings, tags and repeated cues', () => {
  assert.equal(vttToText(fx('vimeo-captions.vtt')), 'Good morning, church. Open your Bibles to Ephesians three.');
});

test('json3ToTimed drops empty events and joins segments', () => {
  assert.deepEqual(json3ToTimed(JSON.parse(fx('youtube-captions.json3'))), [
    { t: 1, text: 'Welcome everyone' }, { t: 16, text: "let's worship" }, { t: 3661, text: 'turn to Ephesians' },
  ]);
});

test('formatTimed merges into 15-second chunks with H:MM:SS stamps', () => {
  const out = formatTimed([{ t: 1, text: 'a' }, { t: 5, text: 'b' }, { t: 16, text: 'c' }, { t: 3661, text: 'd' }]);
  assert.equal(out, '[0:00:01] a b\n[0:00:16] c\n[1:01:01] d');
});

test('buildEntryLine matches the archive row shape and escapes quotes', () => {
  const line = buildEntryLine({ id: 130, title: 'He Said "Go"', date: '2026-07-05', speaker: 'Pastor Josh Eldridge', series: null, scripture: 'John 3:16', scriptureBook: 'John', topics: ['Faith', 'Mission'], description: 'A call to go.', vimeoId: '1207816941' });
  assert.equal(line, '  { id: 130, title: "He Said \\"Go\\"", date: "2026-07-05", speaker: "Pastor Josh Eldridge", series: null, scripture: "John 3:16", scriptureBook: "John", topics: ["Faith", "Mission"], description: "A call to go.", vimeoId: "1207816941" },');
  assert.equal(new Function(`return [${line}][0]`)().title, 'He Said "Go"');
});

test('insertEntries puts new rows at the top, newest first', () => {
  const src = 'const SERMON_DATA = [\n  { id: 1, date: "2026-06-28" },\n];\n';
  const out = insertEntries(src, [{ date: '2026-07-05', line: '  { id: 130, date: "2026-07-05" },' }, { date: '2026-07-12', line: '  { id: 131, date: "2026-07-12" },' }]);
  assert.equal(out, 'const SERMON_DATA = [\n  { id: 131, date: "2026-07-12" },\n  { id: 130, date: "2026-07-05" },\n  { id: 1, date: "2026-06-28" },\n];\n');
});

test('pickCandidates skips archived, dateless and duplicate-date videos, oldest first', () => {
  const videos = [
    { vimeoId: 'v4', name: 'Sunday Sermon 10-04-2026', description: null },
    { vimeoId: 'v4b', name: 'Known in Heaven', description: 'Sermon date: 2026-10-04' },
    { vimeoId: 'v3', name: 'Christmas Eve 2026', description: null },
    { vimeoId: 'v2', name: 'Sunday Sermon 07-05-2026', description: null },
    { vimeoId: '1205525119', name: 'Sunday Sermon 06-28-2026', description: null },
  ];
  const archive = { entries: [{ vimeoId: '1205525119', date: '2026-06-28' }] };
  const drafts = { entries: [{ vimeoId: 'v4b', date: '2026-10-04' }] };
  assert.deepEqual(pickCandidates(videos, archive, drafts).map(c => [c.vimeoId, c.date]), [['v2', '2026-07-05'], ['v4b', '2026-10-04']]);
});

test('previousSunday works in New York time', () => {
  assert.equal(previousSunday(new Date('2026-10-05T10:00:00Z')), '2026-10-04');
  assert.equal(previousSunday(new Date('2026-10-04T14:00:00Z')), '2026-10-04');
  assert.equal(previousSunday(new Date('2026-10-05T02:00:00Z')), '2026-10-04');
  assert.equal(previousSunday(new Date('2026-10-10T12:00:00Z')), '2026-10-04');
});

test('artFile mirrors sermonArt', () => {
  assert.equal(artFile({ id: 7, series: 'Leadership Lessons' }), 'images/sermons/series-leadership-lessons.jpg');
  assert.equal(artFile({ id: 130, series: null }), 'images/sermons/130.jpg');
});

test('validateBounds rejects short, long and inverted spans', () => {
  assert.equal(validateBounds({ start: 1800, end: 4500 }).ok, true);
  assert.equal(validateBounds({ start: 1800, end: 2000 }).ok, false);
  assert.equal(validateBounds({ start: 1800, end: 8000 }).ok, false);
  assert.equal(validateBounds({ start: 4500, end: 1800 }).ok, false);
});

test('parseArchive round-trips a row whose series and speaker contain escaped quotes', () => {
  const line = buildEntryLine({ id: 200, title: 'T', date: '2026-11-01', speaker: 'Dr. "Doc" Lucas', series: 'The "I Am" Sayings', scripture: '', scriptureBook: '', topics: [], description: '', vimeoId: '1' });
  const a = parseArchive('const SERMON_DATA = [\n' + line + '\n];\n');
  assert.equal(a.entries.length, 1);
  assert.equal(a.entries[0].series, 'The "I Am" Sayings');
  assert.equal(a.entries[0].speaker, 'Dr. "Doc" Lucas');
});

test('archiveContext gives Claude the known series, speakers and three example rows', () => {
  const a = parseArchive(SRC);
  const ctx = archiveContext(a);
  assert.ok(ctx.knownSeries.includes('Leadership Lessons'));
  assert.ok(ctx.knownSpeakers.includes('Pastor Christine Disibio'));
  assert.equal(ctx.examples.length, 3);
  assert.ok(ctx.examples[0].startsWith('  { id: 1,'));
});
