import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artTodo } from './art-todo.mjs';

test('artTodo lists one job per missing art file, series grouped, with the full prompt minus the mood', () => {
  const src = 'const SERMON_DATA = [\n' +
    '  { id: 3, title: "C", date: "2026-09-20", speaker: "P", series: "Seek First", scripture: "", scriptureBook: "", topics: [], description: "Third.", vimeoId: "3" },\n' +
    '  { id: 2, title: "B", date: "2026-09-13", speaker: "P", series: "Seek First", scripture: "", scriptureBook: "", topics: [], description: "Second.", vimeoId: "2" },\n' +
    '  { id: 1, title: "A", date: "2026-09-06", speaker: "P", series: null, scripture: "", scriptureBook: "", topics: [], description: "First.", vimeoId: "1" },\n' +
    '];\n';
  const jobs = artTodo(src, f => f === 'images/sermons/1.jpg');
  assert.deepEqual(jobs.map(j => [j.file, j.title]), [['images/sermons/series-seek-first.jpg', 'Seek First']]);
  assert.match(jobs[0].context, /Third\./);
  assert.match(jobs[0].context, /Second\./);
  assert.match(jobs[0].promptTemplate, /"Seek First"/);
  assert.match(jobs[0].promptTemplate, /\{mood\}/);
});
