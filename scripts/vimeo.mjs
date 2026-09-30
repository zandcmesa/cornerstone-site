import fs from 'node:fs';
import { vttToText } from './sermon-lib.mjs';

const API = 'https://api.vimeo.com';
const CHUNK = 64 * 1024 * 1024;

function token() {
  const t = process.env.VIMEO_TOKEN;
  if (!t) throw new Error('VIMEO_TOKEN is not set');
  return t;
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path.startsWith('http') ? path : API + path, {
    method,
    headers: { Authorization: `bearer ${token()}`, Accept: 'application/vnd.vimeo.*+json;version=3.4', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Vimeo ${method} ${path} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

export async function listVideos({ perPage = 50, pages = 2, user = process.env.VIMEO_USER || 'me' } = {}) {
  const base = user === 'me' ? '/me/videos' : `/users/${user}/videos`;
  const out = [];
  for (let page = 1; page <= pages; page++) {
    const d = await api(`${base}?sort=date&direction=desc&per_page=${perPage}&page=${page}&fields=uri,name,description,created_time,duration,privacy.view`);
    for (const v of d.data) out.push({ vimeoId: v.uri.split('/').pop(), name: v.name, description: v.description, created_time: v.created_time, duration: v.duration, privacy: v.privacy?.view });
    if (!d.paging?.next) break;
  }
  return out;
}

export function pickTrack(tracks) {
  const active = tracks.filter(t => t.active && /^en(-|$)/.test(t.language || ''));
  return active.find(t => t.language === 'en') || active[0] || null;
}

export async function getTranscript(vimeoId) {
  const d = await api(`/videos/${vimeoId}/texttracks?fields=type,language,active,link`);
  const track = pickTrack(d.data || []);
  if (!track) return null;
  const res = await fetch(track.link);
  if (!res.ok) throw new Error(`Vimeo text track fetch → ${res.status}`);
  return vttToText(await res.text());
}

export function chunkRanges(size, chunk = CHUNK) {
  const out = [];
  for (let start = 0; start < size; start += chunk) out.push([start, Math.min(start + chunk, size)]);
  return out;
}

export async function uploadVideo({ filePath, name, description, privacy = { view: 'nobody', embed: 'public' } }) {
  const size = fs.statSync(filePath).size;
  const created = await api('/me/videos', { method: 'POST', body: { upload: { approach: 'tus', size: String(size) }, name, description, privacy } });
  const link = created.upload.upload_link;
  const fd = fs.openSync(filePath, 'r');
  try {
    for (const [start, end] of chunkRanges(size)) {
      const buf = Buffer.alloc(end - start);
      fs.readSync(fd, buf, 0, end - start, start);
      const res = await fetch(link, {
        method: 'PATCH',
        headers: { 'Tus-Resumable': '1.0.0', 'Upload-Offset': String(start), 'Content-Type': 'application/offset+octet-stream' },
        body: buf,
      });
      if (!res.ok) throw new Error(`Vimeo upload chunk at ${start} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const offset = +res.headers.get('Upload-Offset');
      if (offset !== end) throw new Error(`Vimeo upload offset mismatch: expected ${end}, got ${offset}`);
    }
  } finally {
    fs.closeSync(fd);
  }
  const head = await fetch(link, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0' } });
  if (+head.headers.get('Upload-Offset') !== size) throw new Error('Vimeo upload did not complete');
  return created.uri.split('/').pop();
}

export async function uploadTextTrack(vimeoId, vtt, { language = 'en', name = 'English' } = {}) {
  const track = await api(`/videos/${vimeoId}/texttracks`, { method: 'POST', body: { type: 'captions', language, name } });
  const put = await fetch(track.link, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: vtt });
  if (!put.ok) throw new Error(`Vimeo text track upload → ${put.status}`);
  await api(track.uri, { method: 'PATCH', body: { active: true } });
  return track.uri;
}

export async function setPrivacy(vimeoId, view) {
  return api(`/videos/${vimeoId}`, { method: 'PATCH', body: { privacy: { view } } });
}
