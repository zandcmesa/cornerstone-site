import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseArchive, sermonDateFromVideo, vttToText, json3ToTimed, formatTimed,
  buildEntryLine, insertEntries, pickCandidates, previousSunday, artFile, validateBounds, archiveContext,
  parseTimestamp, parseRecutComment, retireVideoFields, buildPrBody, titleLines, titleSize, sermonJson } from './sermon-lib.mjs';

const fx = name => fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const SRC = fs.readFileSync(new URL('../js/sermons.js', import.meta.url), 'utf8');

test('parseArchive reads every row of the real archive', () => {
  const a = parseArchive(SRC);
  const ids = a.entries.map(e => e.id);
  assert.equal(a.entries.length, SRC.match(/^\s*\{ id: \d+,/gm).length);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(a.maxId, a.entries.length);
  const first = a.entries.find(e => e.id === 1);
  assert.deepEqual({ ...first, line: undefined }, { id: 1, date: '2026-06-28', vimeoId: '1205525119', series: null, speaker: 'Pastor Christine Disibio', line: undefined });
  assert.equal(a.entries.find(e => e.id === 7).series, 'Leadership Lessons');
  assert.ok(first.line.startsWith('  { id: 1,'));
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
  assert.ok(ctx.examples.every(l => /^\s*\{ id: \d+,/.test(l)));
});

test('parseTimestamp reads seconds, MM:SS and H:MM:SS', () => {
  assert.equal(parseTimestamp('2530'), 2530);
  assert.equal(parseTimestamp(2530), 2530);
  assert.equal(parseTimestamp('42:10'), 2530);
  assert.equal(parseTimestamp('1:19:00'), 4740);
  assert.throws(() => parseTimestamp('42m'), /bad timestamp/);
});

test('parseRecutComment reads the grammar and resolves the date', () => {
  const now = new Date('2026-10-27T15:00:00Z');
  assert.deepEqual(parseRecutComment('recut 2026-10-25 start 42:10 end 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('Recut Oct 25, start at 42:10, end at 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut 10/25 from 42:10 to 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut start 42:10 end 1:19:00', 'Sermon archive: 2026-10-18', now), { date: '2026-10-18', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut start 42:10 end 1:19:00', 'Sermon archive: 3 new sermons', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.match(parseRecutComment('recut start 42:10', '', now).error, /end/);
  assert.match(parseRecutComment('looks good, merging', '', now).error, /recut/);
  assert.match(parseRecutComment('recut start 42:1 end 1:19:00', '', now).error, /start/);
  assert.match(parseRecutComment('recut start 42m10 end 1:19:00', '', now).error, /start/);
  assert.deepEqual(parseRecutComment('recut Dec 28 start 42:10 end 1:19:00', '', new Date('2027-01-02T15:00:00Z')), { date: '2026-12-28', start: 2530, end: 4740 });
});

test('retireVideoFields makes a video invisible to sermonDateFromVideo', () => {
  const agency = retireVideoFields({ name: 'Sunday Sermon 10-25-2026', description: null });
  assert.equal(sermonDateFromVideo(agency), null);
  assert.match(agency.name, /Superseded/);
  const cutter = retireVideoFields({ name: 'Wonderful, Beautiful', description: 'Josh \u00b7 John 15\n\nSermon date: 2026-10-25\nSource: x' });
  assert.equal(sermonDateFromVideo(cutter), null);
  assert.equal(cutter.name, 'Superseded: Wonderful, Beautiful');
  assert.match(cutter.description, /Superseded sermon date: 2026-10-25/);
});

test('buildPrBody leads with the Vimeo link and shows the cut edges', () => {
  const body = buildPrBody([{ date: '2026-10-25', title: 'T', speaker: 'Pastor Josh Eldridge', series: 'Seek First the Kingdom', scripture: 'John 15', description: 'D.', vimeoId: '999', art: 'images/sermons/series-seek-first-the-kingdom.jpg' }], [],
    { '999': { youtubeId: 'abc', start: 2530, end: 4740, startLine: 'Open your Bibles', endLine: 'amen', cutAt: '2026-10-26T15:12:00Z' } });
  assert.ok(body.startsWith('**Watch the cut:** https://vimeo.com/999  (unlisted until merge)'));
  assert.match(body, /\*\*T\*\* — Pastor Josh Eldridge · Seek First the Kingdom/);
  assert.match(body, /John 15 · 42:10–1:19:00 of the YouTube replay/);
  assert.match(body, /Starts: "Open your Bibles" · Ends: "amen"/);
  assert.match(body, /Cut at 11:12am ET Mon Oct 26/);
  assert.match(body, /To fix the cut, comment: `recut start 42:10 end 1:19:00`/);
  assert.match(body, /Merging publishes the video and the site\./);
  assert.doesNotMatch(body, /\bart\b/i);
});

test('buildPrBody names the missing art by series or by its absence', () => {
  const withSeries = buildPrBody([{ date: '2026-11-01', title: 'T', speaker: 'S', series: 'New Series', scripture: '', description: '', vimeoId: '1', art: null }]);
  assert.match(withSeries, /Art missing for the series "New Series": run \/sermon-art\./);
  const noSeries = buildPrBody([{ date: '2026-11-01', title: 'T', speaker: 'S', series: null, scripture: '', description: '', vimeoId: '1', art: null }]);
  assert.match(noSeries, /No series and no art: if this belongs to an existing series, fix the series name here; otherwise run \/sermon-art\./);
});

test('buildPrBody uses the private review link when Vimeo gives one', () => {
  const entry = { date: '2026-10-25', title: 'T', speaker: 'S', series: null, scripture: '', description: '', vimeoId: '999', art: 'x.jpg' };
  assert.ok(buildPrBody([{ ...entry, link: 'https://vimeo.com/999/abc123' }]).startsWith('**Watch the cut:** https://vimeo.com/999/abc123  (unlisted until merge)'));
  assert.ok(buildPrBody([entry]).startsWith('**Watch the cut:** https://vimeo.com/999  (unlisted until merge)'));
});

test('titleLines balances a title across up to four lines without splitting words', () => {
  assert.deepEqual(titleLines('Get Out of the Tube'), ['Get Out', 'of the', 'Tube']);
  assert.deepEqual(titleLines('Wonderful, Beautiful, Glorious, Matchless'), ['Wonderful,', 'Beautiful,', 'Glorious,', 'Matchless']);
  assert.deepEqual(titleLines('Jubilee'), ['Jubilee']);
  assert.deepEqual(titleLines('A Kingdom Algorithm'), ['A Kingdom', 'Algorithm']);
});

test('titleSize steps down with the longest line', () => {
  assert.equal(titleSize(['Jubilee']), 143);
  assert.equal(titleSize(titleLines('Wonderful, Beautiful, Glorious, Matchless')), 143);
  assert.equal(titleSize(['Because of Jesus,']), 96);
});

test('sermonJson is the shape the After Effects project reads', () => {
  const j = sermonJson({ title: 'Get Out of the Tube', speaker: 'Pastor Josh Eldridge', date: '2026-10-25', series: 'Seek First the Kingdom' });
  assert.deepEqual(j, { lines: ['Get Out', 'of the', 'Tube'], size: 143, series: 'Seek First the Kingdom', subtitle: 'PASTOR JOSH ELDRIDGE   ·   OCTOBER 25, 2026', title: 'Get Out of the Tube' });
  assert.equal(sermonJson({ title: 'T', speaker: 'S', date: '2026-01-04', series: null }).series, '');
});
