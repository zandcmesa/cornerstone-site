const TZ = 'America/New_York';
const ROW = /^ {2}\{ id: (\d+),.*?date: "(\d{4}-\d\d-\d\d)".*?speaker: "([^"]*)".*?series: (null|"[^"]*").*?vimeoId: "([^"]+)" \},?\s*$/;

export function parseArchive(src) {
  const entries = [];
  for (const line of src.split('\n')) {
    const m = line.match(ROW);
    if (!m) continue;
    entries.push({ id: +m[1], date: m[2], speaker: m[3], series: m[4] === 'null' ? null : JSON.parse(m[4]), vimeoId: m[5], line });
  }
  const head = src.indexOf('const SERMON_DATA = [');
  const insertAt = src.indexOf('\n', head) + 1;
  return { entries, maxId: Math.max(0, ...entries.map(e => e.id)), insertAt };
}

export function sermonDateFromVideo(v) {
  const t = (v.name || '').match(/Sunday Sermon (\d\d)-(\d\d)-(\d{4})/);
  if (t) return `${t[3]}-${t[1]}-${t[2]}`;
  const d = (v.description || '').match(/Sermon date: (\d{4}-\d\d-\d\d)/);
  return d ? d[1] : null;
}

export function vttToText(vtt) {
  const out = [];
  for (const raw of vtt.split('\n')) {
    const line = raw.replace(/<[^>]+>/g, '').trim();
    if (!line || line === 'WEBVTT' || /^\d+$/.test(line) || line.includes('-->') || /^(NOTE|STYLE|REGION)\b/.test(line)) continue;
    if (out[out.length - 1] !== line) out.push(line);
  }
  return out.join(' ');
}

export function json3ToTimed(json) {
  return (json.events || []).flatMap(e => {
    const text = (e.segs || []).map(s => s.utf8).join('').replace(/\s+/g, ' ').trim();
    return text ? [{ t: Math.round(e.tStartMs / 1000), text }] : [];
  });
}

export function hms(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimed(segments, chunk = 15) {
  const lines = [];
  let cur = null;
  for (const seg of segments) {
    if (cur && seg.t - cur.t < chunk) cur.text += ' ' + seg.text;
    else { cur = { t: seg.t, text: seg.text }; lines.push(cur); }
  }
  return lines.map(l => `[${hms(l.t)}] ${l.text}`).join('\n');
}

const q = s => JSON.stringify(s ?? '');

export function buildEntryLine(e) {
  return `  { id: ${e.id}, title: ${q(e.title)}, date: ${q(e.date)}, speaker: ${q(e.speaker)}, series: ${e.series ? q(e.series) : 'null'}, scripture: ${q(e.scripture)}, scriptureBook: ${q(e.scriptureBook)}, topics: [${(e.topics || []).map(q).join(', ')}], description: ${q(e.description)}, vimeoId: ${q(e.vimeoId)} },`;
}

export function insertEntries(src, entries) {
  const { insertAt } = parseArchive(src);
  const block = [...entries].sort((a, b) => b.date.localeCompare(a.date)).map(e => e.line).join('\n') + '\n';
  return src.slice(0, insertAt) + block + src.slice(insertAt);
}

export function pickCandidates(videos, archive, drafts = { entries: [] }) {
  const usedIds = new Set(archive.entries.map(e => e.vimeoId));
  const usedDates = new Set(archive.entries.map(e => e.date));
  const draftIds = new Set(drafts.entries.map(e => e.vimeoId));
  const byDate = new Map();
  for (const v of videos) {
    const date = sermonDateFromVideo(v);
    if (!date || usedIds.has(v.vimeoId) || usedDates.has(date)) continue;
    const prev = byDate.get(date);
    if (!prev || (draftIds.has(v.vimeoId) && !draftIds.has(prev.vimeoId))) byDate.set(date, { ...v, date });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function localDate(d, tz = TZ) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function previousSunday(now = new Date(), tz = TZ) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
  const back = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  return localDate(new Date(now.getTime() - back * 86400000), tz);
}

export function seriesSlug(series) {
  return series.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function artFile(e) {
  return 'images/sermons/' + (e.series ? 'series-' + seriesSlug(e.series) : String(e.id)) + '.jpg';
}

export function validateBounds({ start, end }) {
  const len = end - start;
  if (!(start >= 0) || !(end > start)) return { ok: false, reason: `end (${end}) must come after start (${start})` };
  if (len < 900) return { ok: false, reason: `sermon span is only ${Math.round(len / 60)} minutes` };
  if (len > 5400) return { ok: false, reason: `sermon span is ${Math.round(len / 60)} minutes, longer than a service` };
  return { ok: true };
}
