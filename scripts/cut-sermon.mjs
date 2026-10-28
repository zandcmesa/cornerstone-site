import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { json3ToTimed, formatTimed, previousSunday, localDate, validateBounds, sermonDateFromVideo, hms, parseArchive, archiveContext, parseTimestamp } from './sermon-lib.mjs';
import * as vimeo from './vimeo.mjs';
import * as ai from './sermon-ai.mjs';
import { syncSermons } from './sync-sermons.mjs';
import { editSermon } from './sermon-edit.mjs';

const CHANNEL = process.env.YOUTUBE_CHANNEL || 'UCl4J6MR32QrZOfk8M_n7wvA';
const CUT_START = process.env.SERMON_CUT_START || '2026-10-04';
const PAD_BEFORE = 3, PAD_AFTER = 2;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const UPLOAD_PRIVACY = { view: 'unlisted', embed: 'public' };

export function ytBaseArgs(env = process.env) {
  // YouTube signs its media URLs with a JS challenge; solving it needs the EJS
  // components, which yt-dlp will not fetch unless explicitly allowed.
  const args = ['--remote-components', 'ejs:npm'];
  if (!env.YOUTUBE_COOKIES) return args;
  const file = path.join(os.tmpdir(), 'cookies.txt');
  fs.writeFileSync(file, env.YOUTUBE_COOKIES, { mode: 0o600 });
  return [...args, '--cookies', file];
}

export class YouTubeLoginError extends Error {}

export function ytdlpError(stderr) {
  const detail = stderr.split('\n').filter(l => l.startsWith('ERROR:')).join(' ') || stderr.trim() || 'yt-dlp failed';
  if (/Sign in to confirm|cookies are no longer valid/i.test(stderr)) {
    return new YouTubeLoginError(`YouTube blocked yt-dlp and asked it to sign in: the saved login in the YOUTUBE_COOKIES secret has expired or been flagged. Export fresh YouTube cookies and update the secret. (${detail})`);
  }
  return new Error(detail);
}

const ytdlp = (args, opts = {}) => {
  const r = spawnSync('yt-dlp', [...ytBaseArgs(), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  if (!opts.quiet && r.stderr) process.stderr.write(r.stderr);
  if (r.error) throw r.error;
  if (r.status !== 0) throw ytdlpError(r.stderr || '');
  return r.stdout.trim();
};

export function matchReplay(list, date) {
  return list.find(v => v.release_timestamp && localDate(new Date(v.release_timestamp * 1000)) === date) || null;
}

export function sliceSegments(segments, start, end) {
  return segments.filter(s => s.t >= start && s.t <= end);
}

const vttTime = sec => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}.000`;

export function rebaseVtt(segments, start, end, offset = 0) {
  const inside = sliceSegments(segments, start, end);
  const cues = inside.map((s, i) => {
    const from = s.t - start + offset;
    const to = i + 1 < inside.length ? inside[i + 1].t - start + offset : from + 4;
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
    try { return { id, release_timestamp: deps.releaseTs(id) }; } catch (e) { if (e instanceof YouTubeLoginError) throw e; return { id, release_timestamp: 0 }; }
  });
  return matchReplay(list, date);
}

export function fetchTimedCaptions(youtubeId, dir) {
  ytdlp(['--skip-download', '--write-auto-subs', '--sub-lang', 'en-orig,en', '--sub-format', 'json3', '-o', path.join(dir, 'captions'), `https://www.youtube.com/watch?v=${youtubeId}`], { quiet: true });
  const file = fs.readdirSync(dir).find(f => f.startsWith('captions') && f.endsWith('.json3'));
  if (!file) return null;
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

const readArchive = () => parseArchive(fs.readFileSync(path.join(ROOT, 'js/sermons.js'), 'utf8'));

const cutDeps = {
  listVideos: vimeo.listVideos, uploadVideo: vimeo.uploadVideo, uploadTextTrack: vimeo.uploadTextTrack, retireVideo: vimeo.retireVideo, me: vimeo.me,
  getVideo: vimeo.getVideo, sleep: ms => new Promise(r => setTimeout(r, ms)), findReplay, fetchTimedCaptions, downloadSection, editSermon, findSermonBounds: ai.findSermonBounds, extractMetadata: ai.extractMetadata, syncSermons, readArchive, log: console.log,
};

export async function cutSermon({ date, youtubeId, start, end, dryRun = false, skipUpload = false, keep = false } = {}, deps = cutDeps) {
  const d = { ...cutDeps, ...deps }, log = d.log;
  date ||= previousSunday();
  const manual = start != null && end != null;
  if (process.env.VIMEO_USER && process.env.VIMEO_USER !== 'me' && !dryRun) {
    const who = await d.me();
    throw new Error(`VIMEO_USER is set to "${process.env.VIMEO_USER}" but the token belongs to ${who.name} (${who.link}). Uploads go to the token's own library, so the cut workflow needs a token minted as the church account and VIMEO_USER unset.`);
  }
  if (date < CUT_START) { log(`${date} is before the cutover date ${CUT_START}; nothing to do`); return { status: 'before-cutover' }; }
  if (manual && d.readArchive().entries.some(e => e.date === date)) throw new Error(`${date} is already published on the site; a recut only replaces a sermon still waiting in its PR`);
  const videos = await d.listVideos({ perPage: 25, pages: 1 });
  const existing = videos.find(v => sermonDateFromVideo(v) === date);
  if (existing && !manual && !dryRun) { log(`${date} is already on Vimeo (${existing.vimeoId}); nothing to do`); return { status: 'already-on-vimeo', vimeoId: existing.vimeoId }; }

  if (!youtubeId) {
    const replay = d.findReplay(date);
    if (!replay) { log(`no YouTube live replay found for ${date}`); return { status: 'no-replay' }; }
    youtubeId = replay.id;
  }
  log(`replay for ${date}: youtube.com/watch?v=${youtubeId}`);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sermon-'));
  const segments = d.fetchTimedCaptions(youtubeId, dir);
  if (!segments) { fs.rmSync(dir, { recursive: true, force: true }); log(`captions for ${youtubeId} are not ready yet`); return { status: 'captions-not-ready', youtubeId }; }
  log(`${segments.length} caption lines, ${hms(segments.at(-1)?.t || 0)} long`);

  let bounds;
  if (manual) bounds = { start: parseTimestamp(start), end: parseTimestamp(end), confidence: 'manual', note: 'bounds given on the command line' };
  else bounds = await d.findSermonBounds(formatTimed(segments));
  const check = validateBounds(bounds);
  log(`sermon ${hms(bounds.start)} → ${hms(bounds.end)} (${bounds.confidence}): ${bounds.note}`);
  if (!check.ok) throw new Error(`refusing to cut: ${check.reason}`);
  if (dryRun) return { status: 'dry-run', youtubeId, bounds };

  const inside = sliceSegments(segments, bounds.start, bounds.end);
  const transcript = inside.map(s => s.text).join(' ');
  const meta = await d.extractMetadata(transcript, { ...archiveContext(d.readArchive()), date });
  log(`title: ${meta.title} — ${meta.speaker}`);

  const out = path.join(keep ? process.cwd() : dir, `sermon-${date}.mp4`);
  d.downloadSection(youtubeId, bounds.start, bounds.end, out);
  log(`cut saved: ${out} (${Math.round(fs.statSync(out).size / 1048576)} MB)`);
  const edit = await d.editSermon({ input: out, output: path.join(path.dirname(out), `sermon-${date}-edit.mp4`), meta, date, log });
  const file = edit ? edit.output : out, leadIn = edit ? edit.leadIn : 0;
  if (edit) log(`bumper added: ${file} (${Math.round(fs.statSync(file).size / 1048576)} MB)`);
  if (skipUpload) return { status: 'cut-only', youtubeId, bounds, meta, file };

  const description = [
    [meta.speaker, meta.scripture].filter(Boolean).join(' · '), '', meta.description, '',
    `Sermon date: ${date}`, `Source: https://www.youtube.com/watch?v=${youtubeId} (${hms(bounds.start)}–${hms(bounds.end)})`,
  ].join('\n');
  const vimeoId = await d.uploadVideo({ filePath: file, name: meta.title, description, privacy: UPLOAD_PRIVACY });
  log(`uploaded (unlisted) to vimeo.com/${vimeoId}`);
  const uploadedLink = await d.getVideo(vimeoId).then(v => v.link).catch(() => undefined);
  const vtt = rebaseVtt(segments, bounds.start - PAD_BEFORE, bounds.end + PAD_AFTER, leadIn);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { await d.uploadTextTrack(vimeoId, vtt); break; }
    catch (e) { log(`caption upload failed (${attempt}/4): ${e.message}`); if (attempt < 4) await d.sleep(20000); }
  }
  if (!keep) fs.rmSync(dir, { recursive: true, force: true });
  if (manual) for (const v of videos.filter(v => sermonDateFromVideo(v) === date)) { await d.retireVideo(v.vimeoId); log(`retired vimeo.com/${v.vimeoId}`); }

  const startLine = segments.find(s => s.t >= bounds.start)?.text, endLine = segments.findLast(s => s.t <= bounds.end)?.text, cutAt = new Date().toISOString();
  await d.syncSermons({ transcriptOverride: { [vimeoId]: transcript }, metaOverride: { [vimeoId]: meta }, previewOverride: { [vimeoId]: { youtubeId, start: bounds.start, end: bounds.end, startLine, endLine, cutAt } }, knownVideos: [{ vimeoId, name: meta.title, description, link: uploadedLink }] });
  return { status: manual ? 'replaced' : 'uploaded', youtubeId, bounds, meta, vimeoId, startLine, endLine, cutAt };
}

const STRICT_FAILURES = ['captions-not-ready', 'no-replay'];
export const exitCodeFor = (status, strict) => strict && STRICT_FAILURES.includes(status) ? 1 : 0;

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const stamp = n => flag(n) == null ? undefined : parseTimestamp(flag(n));
  Promise.resolve()
    .then(() => cutSermon({ date: flag('--date'), youtubeId: flag('--youtube'), start: stamp('--start'), end: stamp('--end'), dryRun: args.includes('--dry-run'), skipUpload: args.includes('--skip-upload'), keep: args.includes('--keep') }))
    .then(r => { console.log(r.status); if (r.vimeoId) console.log(`vimeo=${r.vimeoId}`); process.exitCode = exitCodeFor(r.status, args.includes('--strict')); })
    .catch(e => { console.error(e.message || e); process.exit(1); });
}
