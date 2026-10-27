import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TIMING = { intro: 8.0, outro: 7.0, xfade: 1.0, outroPlateOffset: 2, bedOutroOffset: 12, bedGain: '-9dB' };
export const leadIn = () => TIMING.intro - TIMING.xfade;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function cardSpecs({ title, speaker, date, series }) {
  const sub = [speaker, longDate(date)].filter(Boolean).join('   ·   ').toUpperCase();
  const intro = [
    series ? { text: series.toUpperCase(), size: 26, weight: 600, color: '7FB2E0', tracking: 7, y: 398 } : null,
    { text: title, size: 78, weight: 600, color: 'FFFFFF', tracking: 0, y: 455 },
    { text: sub, size: 22, weight: 500, color: 'C9D3DD', tracking: 5, y: 585 },
  ].filter(Boolean);
  const outro = [
    { text: 'cornerstonechurchma.com', size: 40, weight: 500, color: 'FFFFFF', tracking: 1, y: 700 },
    { text: 'SUNDAYS 10:00AM   ·   15 KIBBE RD, EAST LONGMEADOW', size: 21, weight: 500, color: '7FB2E0', tracking: 5, y: 770 },
  ];
  return { intro: { width: 1920, height: 1080, lines: intro }, outro: { width: 1920, height: 1080, lines: outro } };
}

const VIDEO = ['-c:v', 'h264_videotoolbox', '-b:v', '8M', '-profile:v', 'high', '-pix_fmt', 'yuv420p'];
const AUDIO = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];

export function buildBumperArgs({ kind, output, assets, card }) {
  const { intro, outro, outroPlateOffset, bedOutroOffset, bedGain } = TIMING;
  const len = kind === 'intro' ? intro : outro;
  const plateIn = kind === 'intro' ? ['-t', String(intro), '-i', assets.plate] : ['-ss', String(outroPlateOffset), '-t', String(outro), '-i', assets.plate];
  const bedIn = kind === 'intro' ? ['-t', String(intro), '-i', assets.bed] : ['-ss', String(bedOutroOffset), '-t', String(outro), '-i', assets.bed];
  const video = kind === 'intro' ? [
    `[0:v]fps=30,scale=1920:1080,setpts=PTS-STARTPTS,fade=t=in:st=0:d=1.2,format=yuv420p[p]`,
    `[1:v]scale=1460:-1,format=rgba,fade=t=in:st=0.7:d=1.0:alpha=1,fade=t=out:st=3.9:d=0.6:alpha=1[lg]`,
    `[p][lg]overlay=(W-w)/2:(H-h)/2-30:format=auto[pl]`,
    `[2:v]format=rgba,fade=t=in:st=4.4:d=0.7:alpha=1,fade=t=out:st=${intro - 1.6}:d=0.6:alpha=1[c]`,
    `[pl][c]overlay=0:0:format=auto,trim=0:${intro}[v]`,
    `[3:a]afade=t=in:st=0:d=2,afade=t=out:st=${intro - 1.8}:d=1.8,volume=${bedGain},atrim=0:${intro}[a]`,
  ] : [
    `[0:v]fps=30,scale=1920:1080,setpts=PTS-STARTPTS,format=yuv420p[p]`,
    `[1:v]scale=1300:-1,format=rgba,fade=t=in:st=0.4:d=0.9:alpha=1[lg]`,
    `[p][lg]overlay=(W-w)/2:(H-h)/2-90:format=auto[pl]`,
    `[2:v]format=rgba,fade=t=in:st=1.2:d=0.7:alpha=1[c]`,
    `[pl][c]overlay=0:0:format=auto,fade=t=out:st=${outro - 1.2}:d=1.2,trim=0:${outro}[v]`,
    `[3:a]afade=t=in:st=0:d=1.2,afade=t=out:st=${outro - 2}:d=2,volume=${bedGain},atrim=0:${outro}[a]`,
  ];
  return ['-y', '-v', 'error', ...plateIn, '-loop', '1', '-t', String(len), '-i', assets.logo, '-loop', '1', '-t', String(len), '-i', card, ...bedIn,
    '-filter_complex', video.join(';\n'), '-map', '[v]', '-map', '[a]', ...VIDEO, ...AUDIO, '-t', String(len), output];
}

export function buildAssembleArgs({ intro, input, outro, output, duration }) {
  const { xfade } = TIMING;
  const off1 = +(TIMING.intro - xfade).toFixed(3);
  const off2 = +(off1 + duration - xfade).toFixed(3);
  const ms = sec => Math.round(sec * 1000);
  const filter = [
    `[0:v]fps=30,settb=1/30,format=yuv420p[iv]`,
    `[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1,fps=30,settb=1/30,format=yuv420p[sv]`,
    `[2:v]fps=30,settb=1/30,format=yuv420p[ov]`,
    `[iv][sv]xfade=transition=fade:duration=${xfade}:offset=${off1}[v1]`,
    `[v1][ov]xfade=transition=fade:duration=${xfade}:offset=${off2}[v]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 1).toFixed(3)}:d=1,adelay=${ms(off1)}|${ms(off1)}[sa]`,
    `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms(off2)}|${ms(off2)}[oa]`,
    `[0:a][sa][oa]amix=inputs=3:normalize=0:dropout_transition=0[a]`,
  ].join(';\n');
  const args = ['-y', '-v', 'error', '-i', intro, '-i', input, '-i', outro, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', ...VIDEO, ...AUDIO, '-movflags', '+faststart', output];
  return { args, leadIn: off1, total: +(off2 + TIMING.outro).toFixed(3) };
}

export function findAssets(dir = process.env.SERMON_BUMPER_DIR || path.join(os.homedir(), 'sermon-bumper')) {
  const assets = { plate: path.join(dir, 'plate.mp4'), logo: path.join(dir, 'logo.png'), bed: path.join(dir, 'bed.wav'), font: path.join(dir, 'font.ttf'), dir };
  const missing = ['plate', 'logo', 'bed', 'font'].filter(k => !fs.existsSync(assets[k]));
  return missing.length ? { missing, dir } : { assets };
}

function textcardBin(dir) {
  const bin = path.join(dir, 'textcard');
  const src = path.join(ROOT, 'scripts/textcard.swift');
  if (!fs.existsSync(bin) || fs.statSync(bin).mtimeMs < fs.statSync(src).mtimeMs) execFileSync('swiftc', ['-O', '-o', bin, src], { stdio: 'inherit' });
  return bin;
}

export function renderCard(spec, font, out, dir) {
  const json = out + '.json';
  fs.writeFileSync(json, JSON.stringify(spec));
  execFileSync(textcardBin(dir), [json, font, out], { stdio: 'inherit' });
  fs.unlinkSync(json);
  return out;
}

export const probeDuration = file => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim();

export async function editSermon({ input, output, meta, date, log = console.log }) {
  const found = findAssets();
  if (found.missing) { log(`bumper skipped: ${found.missing.join(', ')} missing in ${found.dir}`); return null; }
  const { assets } = found;
  const specs = cardSpecs({ ...meta, date });
  const work = path.dirname(output);
  const cards = {
    intro: renderCard(specs.intro, assets.font, path.join(work, 'card-intro.png'), assets.dir),
    outro: renderCard(specs.outro, assets.font, path.join(work, 'card-outro.png'), assets.dir),
  };
  const clips = { intro: path.join(work, 'bumper-intro.mp4'), outro: path.join(work, 'bumper-outro.mp4') };
  execFileSync('ffmpeg', buildBumperArgs({ kind: 'intro', output: clips.intro, assets, card: cards.intro }), { stdio: 'inherit' });
  execFileSync('ffmpeg', buildBumperArgs({ kind: 'outro', output: clips.outro, assets, card: cards.outro }), { stdio: 'inherit' });
  const duration = probeDuration(input);
  const plan = buildAssembleArgs({ intro: clips.intro, input, outro: clips.outro, output, duration });
  log(`bumper: rendering ${Math.round(plan.total / 60)} min edit`);
  execFileSync('ffmpeg', plan.args, { stdio: 'inherit' });
  if (!fs.existsSync(output)) throw new Error('ffmpeg did not produce the edited file');
  return { output, leadIn: plan.leadIn };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  editSermon({ input: flag('--in'), output: flag('--out'), date: flag('--date') || '2026-01-01', meta: { title: flag('--title') || 'Sunday Sermon', speaker: flag('--speaker') || 'Pastor Josh Eldridge', series: flag('--series') || null } })
    .then(r => console.log(r ? `edited: ${r.output} (lead-in ${r.leadIn}s)` : 'skipped'))
    .catch(e => { console.error(e.message || e); process.exit(1); });
}
