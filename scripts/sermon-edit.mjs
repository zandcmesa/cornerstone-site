import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { sermonJson } from './sermon-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TIMING = { intro: 8.0, outro: 7.0, xfade: 1.0, outroPlateOffset: 2, bedOutroOffset: 12, bedGain: '-9dB' };
export const leadIn = () => TIMING.intro - TIMING.xfade;
export const AE = { app: 'Adobe After Effects 2026', bundle: '/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app', font: 'DegularDisplay-Bold', renderTimeoutMs: 20 * 60 * 1000, launchTimeoutMs: 120 * 1000 };
export const MUSIC = { duck: 0.126, preRoll: 3, tail: 6, rise: 3, outroFade: 1.5 };

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

const VIDEO = ['-c:v', 'h264_videotoolbox', '-b:v', '5M', '-profile:v', 'high', '-pix_fmt', 'yuv420p'];
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

export function musicEnvelope({ off1, off2, xfade, outroLen }) {
  const { duck, preRoll, tail, rise, outroFade } = MUSIC;
  const a = off1, b = off1 + xfade, c = b + preRoll, d = c + tail;
  const head = `if(lt(t,${a}),1,if(lt(t,${b}),1-(1-${duck})*(t-${a})/${xfade},if(lt(t,${c}),${duck},if(lt(t,${d}),${duck}*(1-(t-${c})/${tail}),0))))`;
  const t0 = off2 - rise, t1 = off2, t2 = off2 + xfade, end = off2 + outroLen, f = end - outroFade;
  const tailExpr = `if(lt(t,${t0}),0,if(lt(t,${t1}),${duck}*(t-${t0})/${rise},if(lt(t,${t2}),${duck}+(1-${duck})*(t-${t1})/${xfade},if(lt(t,${f}),1,if(lt(t,${end}),1-(t-${f})/${outroFade},0)))))`;
  return { head, tail: tailExpr, headLen: +(d + 0.5).toFixed(3), tailStart: +t0.toFixed(3), tailLen: +(end - t0).toFixed(3) };
}

export function buildAssembleArgs({ intro, input, outro, output, duration, introLen = TIMING.intro, outroLen = TIMING.outro, loop }) {
  const { xfade } = TIMING;
  const off1 = +(introLen - xfade).toFixed(3);
  const off2 = +(off1 + duration - xfade).toFixed(3);
  const ms = sec => Math.round(sec * 1000);
  const env = musicEnvelope({ off1, off2, xfade, outroLen });
  const filter = [
    `[0:v]fps=30,settb=1/30,format=yuv420p[iv]`,
    `[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1,fps=30,settb=1/30,format=yuv420p[sv]`,
    `[2:v]fps=30,settb=1/30,format=yuv420p,fade=t=out:st=${(outroLen - 1.2).toFixed(3)}:d=1.2[ov]`,
    `[iv][sv]xfade=transition=fade:duration=${xfade}:offset=${off1}[v1]`,
    `[v1][ov]xfade=transition=fade:duration=${xfade}:offset=${off2}[v]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 1).toFixed(3)}:d=1,adelay=${ms(off1)}|${ms(off1)}[sa]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${env.headLen},asetpts=PTS-STARTPTS,volume='${env.head}':eval=frame,volume=-6dB[mh]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${env.tailLen},asetpts=PTS-STARTPTS,volume='${env.tail.replace(/\bt\b/g, `(t+${env.tailStart})`)}':eval=frame,volume=-6dB,adelay=${ms(env.tailStart)}|${ms(env.tailStart)}[mt]`,
    `[sa][mh][mt]amix=inputs=3:normalize=0:dropout_transition=0[a]`,
  ].join(';\n');
  const args = ['-y', '-v', 'error', '-i', intro, '-i', input, '-i', outro, '-i', loop, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', ...VIDEO, ...AUDIO, '-movflags', '+faststart', output];
  return { args, leadIn: off1, total: +(off2 + outroLen).toFixed(3) };
}

export function aeGuards({ installed, ccRunning, hasFont }) {
  if (!installed) return { ok: false, reason: 'After Effects is not installed' };
  if (!ccRunning) return { ok: false, reason: 'Creative Cloud is not running, so Adobe Fonts are unavailable' };
  if (!hasFont) return { ok: false, reason: `the ${AE.font} font is not active` };
  return { ok: true };
}

export function waitFor(check, { timeoutMs, intervalMs = 1000 }) {
  return new Promise(resolve => {
    const started = Date.now();
    const tick = () => { if (check()) return resolve(true); if (Date.now() - started > timeoutMs) return resolve(false); setTimeout(tick, intervalMs); };
    tick();
  });
}

export function runJsx(script, { timeoutMs = AE.renderTimeoutMs } = {}) {
  return new Promise(resolve => {
    const body = `tell application "${AE.app}" to DoScript "$.evalFile(\\"${script}\\");"`;
    const child = spawn('osascript', ['-e', body], { stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ ok: false, timedOut: true }); }, timeoutMs);
    child.on('exit', code => { clearTimeout(timer); resolve({ ok: code === 0, timedOut: false }); });
    child.on('error', () => { clearTimeout(timer); resolve({ ok: false, timedOut: false }); });
  });
}

const pgrep = pattern => { try { execFileSync('pgrep', ['-f', pattern], { stdio: 'ignore' }); return true; } catch { return false; } };

export async function ensureAeRunning({ log }) {
  if (!pgrep(`${AE.app}.app/Contents/MacOS`)) { log('bumper: launching After Effects'); execFileSync('open', ['-a', AE.app]); }
  const dir = findAssets().assets?.dir || findAssets().dir;
  const ping = path.join(dir, 'ping.txt'), pingJsx = path.join(dir, 'ping.jsx');
  if (fs.existsSync(ping)) fs.unlinkSync(ping);
  fs.writeFileSync(pingJsx, `var f = new File("${ping}"); f.open("w"); f.write("ok"); f.close();`);
  const started = Date.now();
  while (Date.now() - started < AE.launchTimeoutMs) {
    await runJsx(pingJsx, { timeoutMs: 15000 });
    if (await waitFor(() => fs.existsSync(ping), { timeoutMs: 4000, intervalMs: 500 })) return true;
  }
  return false;
}

export async function renderAeBumpers({ meta, date, assets, log }) {
  const installed = fs.existsSync(AE.bundle), ccRunning = pgrep('Creative Cloud');
  let hasFont = false;
  try { execFileSync(textcardBin(assets.dir), ['--has-font', AE.font], { stdio: 'ignore' }); hasFont = true; } catch {}
  const guard = aeGuards({ installed, ccRunning, hasFont });
  if (!guard.ok) { log(`bumper: After Effects skipped (${guard.reason})`); return null; }
  if (!fs.existsSync(path.join(assets.dir, 'cornerstone-bumper.aep'))) { log('bumper: After Effects skipped (cornerstone-bumper.aep is missing)'); return null; }
  if (!(await ensureAeRunning({ log }))) { log('bumper: After Effects skipped (the app did not answer within two minutes)'); return null; }
  fs.writeFileSync(path.join(assets.dir, 'sermon.json'), JSON.stringify(sermonJson({ ...meta, date })));
  const intro = path.join(assets.dir, 'intro.mp4'), outro = path.join(assets.dir, 'outro.mp4'), logFile = path.join(assets.dir, 'render.log');
  for (const f of [intro, outro, logFile]) if (fs.existsSync(f)) fs.unlinkSync(f);
  const r = await runJsx(path.join(ROOT, 'scripts/bumper-ae/render.jsx'));
  const logText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
  if (r.timedOut) { log('bumper: After Effects skipped (render exceeded 20 minutes)'); return null; }
  if (!/\bdone\b/.test(logText) || !fs.existsSync(intro) || !fs.existsSync(outro)) { log(`bumper: After Effects skipped (render failed: ${logText.trim().split(/\r?\n/).pop() || 'no log'})`); return null; }
  return { intro, outro, introLen: probeDuration(intro), outroLen: probeDuration(outro) };
}

export function findAssets(dir = process.env.SERMON_BUMPER_DIR || path.join(os.homedir(), 'sermon-bumper')) {
  const assets = { plate: path.join(dir, 'plate.mp4'), logo: path.join(dir, 'logo.png'), bed: path.join(dir, 'bed.wav'), loop: path.join(dir, 'loop.wav'), font: path.join(dir, 'font.ttf'), dir };
  const missing = ['plate', 'logo', 'bed', 'loop', 'font'].filter(k => !fs.existsSync(assets[k]));
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
  const work = path.dirname(output);
  let clips = await renderAeBumpers({ meta, date, assets, log });
  if (clips) log(`bumper: After Effects intro ${clips.introLen}s, outro ${clips.outroLen}s`);
  else {
    const specs = cardSpecs({ ...meta, date });
    const cards = {
      intro: renderCard(specs.intro, assets.font, path.join(work, 'card-intro.png'), assets.dir),
      outro: renderCard(specs.outro, assets.font, path.join(work, 'card-outro.png'), assets.dir),
    };
    clips = { intro: path.join(work, 'bumper-intro.mp4'), outro: path.join(work, 'bumper-outro.mp4'), introLen: TIMING.intro, outroLen: TIMING.outro };
    execFileSync('ffmpeg', buildBumperArgs({ kind: 'intro', output: clips.intro, assets, card: cards.intro }), { stdio: 'inherit' });
    execFileSync('ffmpeg', buildBumperArgs({ kind: 'outro', output: clips.outro, assets, card: cards.outro }), { stdio: 'inherit' });
  }
  const duration = probeDuration(input);
  const plan = buildAssembleArgs({ ...clips, input, output, duration, loop: assets.loop });
  log(`bumper: rendering ${Math.round(plan.total / 60)} min edit`);
  execFileSync('ffmpeg', plan.args, { stdio: 'inherit' });
  if (!fs.existsSync(output)) throw new Error('ffmpeg did not produce the edited file');
  return { output, leadIn: plan.leadIn };
}

export async function previewSermon({ input, meta, date, log = console.log }) {
  const vimeo = await import('./vimeo.mjs');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bumper-preview-'));
  const head = path.join(work, 'head.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '0', '-t', '30', '-i', input, '-c', 'copy', head]);
  const out = path.join(work, `preview-${date}.mp4`);
  const edit = await editSermon({ input: head, output: out, meta, date, log });
  if (!edit) throw new Error('bumper assets are missing');
  const id = await vimeo.uploadVideo({ filePath: out, name: `Bumper preview ${date}`, description: `Preview of the intro and outro for ${meta.title}. Safe to delete.`, privacy: { view: 'unlisted', embed: 'public' } });
  const info = await vimeo.getVideo(id);
  fs.rmSync(work, { recursive: true, force: true });
  return { vimeoId: id, link: info.link || `https://vimeo.com/${id}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const meta = { title: flag('--title') || 'Sunday Sermon', speaker: flag('--speaker') || 'Pastor Josh Eldridge', series: flag('--series') || null };
  const date = flag('--date') || '2026-01-01';
  const run = args.includes('--preview')
    ? previewSermon({ input: flag('--in'), meta, date }).then(r => console.log(`preview: ${r.link}`))
    : editSermon({ input: flag('--in'), output: flag('--out'), date, meta }).then(r => console.log(r ? `edited: ${r.output} (lead-in ${r.leadIn}s)` : 'skipped'));
  run.catch(e => { console.error(e.message || e); process.exit(1); });
}
