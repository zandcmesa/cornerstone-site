import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingPublish } from './publish-sermons.mjs';

test('pendingPublish returns private Vimeo videos that are now in the merged archive', () => {
  const videos = [
    { vimeoId: 'P', privacy: 'nobody' },
    { vimeoId: 'Q', privacy: 'nobody' },
    { vimeoId: 'R', privacy: 'anybody' },
  ];
  const archive = { entries: [{ vimeoId: 'P' }, { vimeoId: 'R' }] };
  assert.deepEqual(pendingPublish(videos, archive), ['P']);
});

test('pendingPublish also flips unlisted uploads', () => {
  assert.deepEqual(pendingPublish([{ vimeoId: 'U', privacy: 'unlisted' }], { entries: [{ vimeoId: 'U' }] }), ['U']);
});
