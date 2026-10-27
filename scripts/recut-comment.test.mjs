import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const run = (env) => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'recut-')), 'output');
  fs.writeFileSync(out, '');
  const r = spawnSync(process.execPath, ['scripts/recut-comment.mjs'], { env: { ...process.env, ...env, GITHUB_OUTPUT: out }, encoding: 'utf8' });
  return { status: r.status, output: fs.readFileSync(out, 'utf8') };
};

test('recut-comment writes outputs for a valid comment and an error otherwise', () => {
  const ok = run({ COMMENT_BODY: 'recut start 42:10 end 1:19:00', PR_TITLE: 'Sermon archive: 2026-10-25' });
  assert.equal(ok.status, 0);
  assert.equal(ok.output, 'date=2026-10-25\nstart=2530\nend=4740\n');

  const bad = run({ COMMENT_BODY: 'recut start 42:10', PR_TITLE: 'Sermon archive: 2026-10-25' });
  assert.equal(bad.status, 0);
  assert.equal(bad.output, 'error=I could not find an end time; add "end 1:19:00".\n');
});
