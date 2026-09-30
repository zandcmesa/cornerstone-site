import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArchive, pickCandidates, buildEntryLine, insertEntries, artFile, archiveContext } from './sermon-lib.mjs';
import * as vimeo from './vimeo.mjs';
import * as ai from './sermon-ai.mjs';
import * as art from './sermon-art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRANCH = 'sermon-sync';

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: opts.binary ? 'buffer' : 'utf8', stdio: ['ignore', 'pipe', opts.quiet ? 'ignore' : 'inherit'] });
}

export const realGit = {
  fetch() {
    sh('git', ['fetch', 'origin', 'main'], { quiet: true });
    try { sh('git', ['fetch', 'origin', BRANCH], { quiet: true }); } catch {}
  },
  show(ref, file) {
    try { return sh('git', ['show', `${ref}:${file}`], { binary: /\.(jpg|png)$/.test(file), quiet: true }); } catch { return null; }
  },
  exists(ref, file) {
    try { sh('git', ['cat-file', '-e', `${ref}:${file}`], { quiet: true }); return true; } catch { return false; }
  },
  async publish({ files, message, title, body }) {
    sh('git', ['checkout', '-q', '-B', BRANCH, 'origin/main']);
    for (const f of files) {
      fs.mkdirSync(path.dirname(path.join(ROOT, f.path)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, f.path), f.content);
    }
    sh('git', ['add', ...files.map(f => f.path)]);
    sh('git', ['-c', 'user.name=sermon-sync', '-c', 'user.email=sync@users.noreply.github.com', 'commit', '-q', '-m', message]);
    sh('git', ['push', '--force', '-u', 'origin', BRANCH]);
    const open = sh('gh', ['pr', 'list', '--head', BRANCH, '--state', 'open', '--json', 'number', '-q', '.[0].number']).trim();
    if (open) sh('gh', ['pr', 'edit', open, '--title', title, '--body', body]);
    else sh('gh', ['pr', 'create', '--base', 'main', '--head', BRANCH, '--title', title, '--body', body]);
  },
};

const defaultDeps = {
  listVideos: vimeo.listVideos,
  getTranscript: vimeo.getTranscript,
  extractMetadata: ai.extractMetadata,
  generateArt: art.generateArt,
  git: realGit,
  log: (...a) => console.log(...a),
};

export async function syncSermons({ dryRun = false, limit = Infinity, transcriptOverride = {}, metaOverride = {} } = {}, deps = {}) {
  const d = { ...defaultDeps, ...deps };
  d.git.fetch();
  const baseSrc = d.git.show('origin/main', 'js/sermons.js');
  if (!baseSrc) throw new Error('could not read js/sermons.js from origin/main');
  const base = parseArchive(baseSrc);
  const draftSrc = d.git.show(`origin/${BRANCH}`, 'js/sermons.js');
  const drafts = draftSrc ? parseArchive(draftSrc) : { entries: [] };
  const draftById = new Map(drafts.entries.map(e => [e.vimeoId, e]));

  const videos = await d.listVideos();
  const candidates = pickCandidates(videos, base, drafts).slice(0, limit);
  d.log(`${candidates.length} sermon(s) not in the archive`);

  const ctx = archiveContext(base);
  for (const id of Object.keys(metaOverride)) {
    if (!candidates.some(c => c.vimeoId === id)) throw new Error(`metaOverride for ${id} but that video is not among the new Vimeo videos (check VIMEO_USER matches the token's account)`);
  }
  let nextId = Math.max(base.maxId, ...drafts.entries.map(e => e.id)) + 1;
  const entries = [];
  const skipped = [];
  const files = [];

  for (const c of candidates) {
    const draft = draftById.get(c.vimeoId);
    if (draft) {
      const artPath = artFile(draft);
      const jpg = d.git.show(`origin/${BRANCH}`, artPath);
      if (jpg) files.push({ path: artPath, content: jpg });
      entries.push({ ...draft, reused: true, art: jpg ? artPath : null });
      d.log(`reusing draft for ${c.date} (${c.vimeoId})`);
      continue;
    }
    let meta = metaOverride[c.vimeoId];
    try {
      if (!meta) {
        const transcript = transcriptOverride[c.vimeoId] || await d.getTranscript(c.vimeoId);
        if (!transcript) { skipped.push({ vimeoId: c.vimeoId, date: c.date, reason: 'captions not ready' }); d.log(`skipping ${c.date}: captions not ready`); continue; }
        meta = await d.extractMetadata(transcript, { ...ctx, date: c.date });
      }
    } catch (e) {
      skipped.push({ vimeoId: c.vimeoId, date: c.date, reason: e.message });
      d.log(`skipping ${c.date}: ${e.message}`);
      continue;
    }
    const entry = { ...meta, id: nextId++, date: c.date, vimeoId: c.vimeoId, reused: false };
    entry.line = buildEntryLine(entry);
    const artPath = artFile(entry);
    entry.art = null;
    if (!d.git.exists('origin/main', artPath)) {
      const tmp = path.join(os.tmpdir(), 'sermon-art-' + path.basename(artPath));
      try {
        await d.generateArt({ title: entry.series || entry.title, mood: entry.artMood, outJpg: tmp });
        if (fs.existsSync(tmp)) { files.push({ path: artPath, content: fs.readFileSync(tmp) }); fs.unlinkSync(tmp); }
        entry.art = artPath;
      } catch (e) {
        d.log(`art failed for ${c.date}: ${e.message}`);
      }
    } else {
      entry.art = artPath;
    }
    entries.push(entry);
    d.log(`drafted ${c.date}: ${entry.title} — ${entry.speaker}`);
  }

  if (!entries.length) { d.log(skipped.length ? `nothing drafted; skipped: ${skipped.map(s => `${s.date} (${s.reason})`).join(', ')}` : 'Archive is current'); return { entries, skipped }; }

  const newSrc = insertEntries(baseSrc, entries);
  files.unshift({ path: 'js/sermons.js', content: newSrc });
  const rows = entries.map(e => {
    const meta = e.line.match(/title: ("(?:[^"\\]|\\.)*").*?speaker: ("[^"]*")/);
    const title = meta ? JSON.parse(meta[1]) : e.title;
    const speaker = meta ? JSON.parse(meta[2]) : e.speaker;
    return `- **${e.date}** — ${title} (${speaker}) · [vimeo.com/${e.vimeoId}](https://vimeo.com/${e.vimeoId})${e.art ? '' : ' · _art missing_'}`;
  });
  const body = [`${entries.length} new sermon${entries.length === 1 ? '' : 's'} from Vimeo. Review titles, series, and art, then merge.`, '', ...rows,
    ...(skipped.length ? ['', 'Skipped this run:', ...skipped.map(s => `- ${s.date} (vimeo.com/${s.vimeoId}): ${s.reason}`)] : []),
    '', '🤖 Generated with [Claude Code](https://claude.com/claude-code)'].join('\n');
  const title = `Sermon archive: ${entries.length === 1 ? entries[0].date : `${entries.length} new sermons`}`;
  const message = `Add ${entries.length} sermon${entries.length === 1 ? '' : 's'} to the archive\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`;

  if (dryRun) {
    d.log('\n--- dry run: entries ---');
    for (const e of entries) d.log(e.line);
    return { entries, skipped, body };
  }
  await d.git.publish({ files, message, title, body });
  d.log(`pushed ${BRANCH} with ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`);
  return { entries, skipped, body };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  syncSermons({ dryRun: args.includes('--dry-run'), limit: flag('--limit') ? +flag('--limit') : Infinity })
    .catch(e => { console.error(e); process.exit(1); });
}
