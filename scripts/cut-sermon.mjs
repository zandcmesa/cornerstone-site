import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { json3ToTimed, formatTimed, previousSunday, localDate, validateBounds, sermonDateFromVideo, hms, parseArchive, archiveContext } from './sermon-lib.mjs';
import * as vimeo from './vimeo.mjs';
import * as ai from './sermon-ai.mjs';
import { syncSermons } from './sync-sermons.mjs';

const CHANNEL = process.env.YOUTUBE_CHANNEL || 'UCl4J6MR32QrZOfk8M_n7wvA';
const CUT_START = process.env.SERMON_CUT_START || '2026-10-04';
const PAD_BEFORE = 3, PAD_AFTER = 2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const UPLOAD_PRIVACY = { view: 'unlisted', embed: 'public' };

export function ytBaseArgs(env = process.env) {
  if (!env.YOUTUBE_COOKIES) return [];
  const file = path.join(os.tmpdir(), 'cookies.txt');
  fs.writeFileSync(file, env.YOUTUBE_COOKIES, { mode: 0o600 });
  return ['--cookies', file];
}

const ytdlp = (args, opts = {}) => execFileSync('yt-dlp', [...ytBaseArgs(), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', opts.quiet ? 'ignore' : 'inherit'], maxBuffer: 64 * 1024 * 1024 }).trim();

export function matchReplay(list, date) {
  return list.find(v => v.release_timestamp && localDate(new Date(v.release_timestamp * 1000)) === date) || null;
}

export function sliceSegments(segments, start, end) {
  return segments.filter(s => s.t >= start && s.t <= end);
}

const vttTime = sec => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}.000`;

export function rebaseVtt(segments, start, end) {
  const inside = sliceSegments(segments, start, end);
  const cues = inside.map((s, i) => {
    const from = s.t - start;
    const to = i + 1 < inside.length ? inside[i + 1].t - start : from + 4;
    return `${vttTime(from)} --> ${vttTime(Math.max(to, from + 1))}\n${s.text}\n`;
  });
  return 'WEBVTT\n\n' + cues.join('\n');
}

const ytDeps = {
  listIds: () => ytdlp(['--flat-playlist', '--print', 'id', '--playlist-end', '8', `https://www.youtube.com/channel/${CHANNEL}/streams`], { quiet: true }).split('\n').filter(Boolean),
  releaseTs: id => +ytdlp(['--print', 'release_timestamp', `https://www.youtube.com/watch?v=${id}`], { quiet: true }) || 0,
};

export function findReplay(date, deps = ytDeps) {
  const list = deps.listIds().map(id => {
    try { return { id, release_timestamp: deps.releaseTs(id) }; } catch { return { id, release_timestamp: 0 }; }
  });
  return matchReplay(list, date);
}

export function fetchTimedCaptions(youtubeId, dir) {
  ytdlp(['--skip-download', '--write-auto-subs', '--sub-lang', 'en-orig,en', '--sub-format', 'json3', '-o', path.join(dir, 'captions'), `https://www.youtube.com/watch?v=${youtubeId}`], { quiet: true });
  const file = fs.readdirSync(dir).find(f => f.startsWith('captions') && f.endsWith('.json3'));
  if (!file) throw new Error('YouTube auto-captions are not available yet for this replay');
  return json3ToTimed(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
}

export function downloadSection(youtubeId, start, end, out) {
  const full = path.join(path.dirname(out), `full-${youtubeId}.mp4`);
  if (!fs.existsSync(full)) ytdlp(['-f', 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b', '--merge-output-format', 'mp4', '--no-progress', '-o', full, `https://www.youtube.com/watch?v=${youtubeId}`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.max(0, start - PAD_BEFORE)), '-to', String(end + PAD_AFTER), '-i', full, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' });
  fs.unlinkSync(full);
  if (!fs.existsSync(out)) throw new Error('ffmpeg did not produce the cut file');
  return out;
}

export async function cutSermon({ date, youtubeId, start, end, dryRun = false, skipUpload = false, keep = false, log = console.log } = {}) {
  date ||= previousSunday();
  if (process.env.VIMEO_USER && process.env.VIMEO_USER !== 'me' && !dryRun) {
    const who = await vimeo.me();
    throw new Error(`VIMEO_USER is set to "${process.env.VIMEO_USER}" but the token belongs to ${who.name} (${who.link}). Uploads go to the token's own library, so the cut workflow needs a token minted as the church account and VIMEO_USER unset.`);
  }
  if (date < CUT_START) { log(`${date} is before the cutover date ${CUT_START}; nothing to do`); return { status: 'before-cutover' }; }
  const existing = (await vimeo.listVideos({ perPage: 25, pages: 1 })).find(v => sermonDateFromVideo(v) === date);
  if (existing) { log(`${date} is already on Vimeo (${existing.vimeoId}); nothing to do`); return { status: 'already-on-vimeo', vimeoId: existing.vimeoId }; }

  if (!youtubeId) {
    const replay = findReplay(date);
    if (!replay) { log(`no YouTube live replay found for ${date}`); return { status: 'no-replay' }; }
    youtubeId = replay.id;
  }
  log(`replay for ${date}: youtube.com/watch?v=${youtubeId}`);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sermon-'));
  const segments = fetchTimedCaptions(youtubeId, dir);
  log(`${segments.length} caption lines, ${hms(segments.at(-1)?.t || 0)} long`);

  let bounds;
  if (start != null && end != null) bounds = { start: +start, end: +end, confidence: 'manual', note: 'bounds given on the command line' };
  else bounds = await ai.findSermonBounds(formatTimed(segments));
  const check = validateBounds(bounds);
  log(`sermon ${hms(bounds.start)} → ${hms(bounds.end)} (${bounds.confidence}): ${bounds.note}`);
  if (!check.ok) throw new Error(`refusing to cut: ${check.reason}`);
  if (dryRun) return { status: 'dry-run', youtubeId, bounds };

  const inside = sliceSegments(segments, bounds.start, bounds.end);
  const transcript = inside.map(s => s.text).join(' ');
  const meta = await ai.extractMetadata(transcript, { ...archiveContext(parseArchive(fs.readFileSync(path.join(ROOT, 'js/sermons.js'), 'utf8'))), date });
  log(`title: ${meta.title} — ${meta.speaker}`);

  const out = path.join(keep ? process.cwd() : dir, `sermon-${date}.mp4`);
  downloadSection(youtubeId, bounds.start, bounds.end, out);
  log(`cut saved: ${out} (${Math.round(fs.statSync(out).size / 1048576)} MB)`);
  if (skipUpload) return { status: 'cut-only', youtubeId, bounds, meta, file: out };

  const description = [
    [meta.speaker, meta.scripture].filter(Boolean).join(' · '), '', meta.description, '',
    `Sermon date: ${date}`, `Source: https://www.youtube.com/watch?v=${youtubeId} (${hms(bounds.start)}–${hms(bounds.end)})`,
  ].join('\n');
  const vimeoId = await vimeo.uploadVideo({ filePath: out, name: meta.title, description, privacy: UPLOAD_PRIVACY });
  log(`uploaded (unlisted) to vimeo.com/${vimeoId}`);
  try { await vimeo.uploadTextTrack(vimeoId, rebaseVtt(segments, bounds.start - PAD_BEFORE, bounds.end + PAD_AFTER)); } catch (e) { log(`caption upload failed: ${e.message}`); }
  if (!keep) fs.rmSync(dir, { recursive: true, force: true });

  await syncSermons({ transcriptOverride: { [vimeoId]: transcript }, metaOverride: { [vimeoId]: meta } });
  return { status: 'uploaded', youtubeId, bounds, meta, vimeoId };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  cutSermon({ date: flag('--date'), youtubeId: flag('--youtube'), start: flag('--start'), end: flag('--end'), dryRun: args.includes('--dry-run'), skipUpload: args.includes('--skip-upload'), keep: args.includes('--keep') })
    .then(r => console.log(r.status))
    .catch(e => { console.error(e.message || e); process.exit(1); });
}
