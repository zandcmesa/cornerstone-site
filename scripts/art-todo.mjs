import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArchive, artFile } from './sermon-lib.mjs';
import { buildArtPrompt } from './sermon-art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FULL = /^ {2}\{ id: (\d+), title: ("(?:[^"\\]|\\.)*"), .*?series: (null|"(?:[^"\\]|\\.)*"), .*?description: ("(?:[^"\\]|\\.)*"), vimeoId/;

export function artTodo(src, exists = f => fs.existsSync(path.join(ROOT, f))) {
  const jobs = new Map();
  for (const e of parseArchive(src).entries) {
    const file = artFile(e);
    if (exists(file)) continue;
    const m = e.line.match(FULL);
    const title = m ? JSON.parse(m[2]) : String(e.id);
    const description = m ? JSON.parse(m[4]) : '';
    const name = e.series || title;
    const job = jobs.get(file) || { file, title: name, series: e.series, sermons: [] };
    job.sermons.push({ id: e.id, date: e.date, title, description });
    jobs.set(file, job);
  }
  return [...jobs.values()].map(j => ({
    ...j,
    context: j.sermons.map(s => `${s.date} — ${s.title}: ${s.description}`).join('\n'),
    promptTemplate: buildArtPrompt(j.title, '{mood}'),
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const src = fs.readFileSync(path.join(ROOT, 'js/sermons.js'), 'utf8');
  console.log(JSON.stringify(artTodo(src), null, 2));
}
