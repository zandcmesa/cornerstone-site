import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArchive } from './sermon-lib.mjs';
import { listVideos, setPrivacy } from './vimeo.mjs';

export function pendingPublish(videos, archive) {
  const merged = new Set(archive.entries.map(e => e.vimeoId));
  return videos.filter(v => (v.privacy === 'nobody' || v.privacy === 'unlisted') && merged.has(v.vimeoId)).map(v => v.vimeoId);
}

export async function publishSermons({ log = console.log } = {}) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const src = execFileSync('git', ['show', 'HEAD:js/sermons.js'], { cwd: root, encoding: 'utf8' });
  const ids = pendingPublish(await listVideos({ perPage: 25, pages: 1 }), parseArchive(src));
  for (const id of ids) { await setPrivacy(id, 'anybody'); log(`published vimeo.com/${id}`); }
  if (!ids.length) log('nothing to publish');
  return ids;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  publishSermons().catch(e => { console.error(e.message || e); process.exit(1); });
}
