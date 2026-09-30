import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseMcpBody, toolCallPayload, pickAssetUrl, CLIENT_ID } from './artlist.mjs';

test('parseMcpBody reads both plain JSON and SSE framed responses', () => {
  const json = parseMcpBody('{"jsonrpc":"2.0","id":1,"result":{"ok":true}}', 'application/json');
  assert.deepEqual(json.result, { ok: true });
  const sse = parseMcpBody('event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"{\\"status\\":\\"queued\\"}"}]}}\n\n', 'text/event-stream');
  assert.equal(sse.id, 2);
});

test('toolCallPayload wraps a generate_image call for Nano Banana Pro at 16:9 1K', () => {
  const p = toolCallPayload(7, 'generate_image', { prompt: 'x', modelId: 1042, settings: { aspect_ratio: '16:9', quality: '1K', num_images: 1 } });
  assert.equal(p.method, 'tools/call');
  assert.equal(p.params.name, 'generate_image');
  assert.equal(p.params.arguments.modelId, 1042);
  assert.equal(p.id, 7);
});

test('pickAssetUrl takes the first asset URL from a finished generation', () => {
  assert.equal(pickAssetUrl({ assets: [{ assetUrl: 'https://a/1.png' }] }), 'https://a/1.png');
  assert.equal(pickAssetUrl({ status: 'pending' }), null);
});

test('the hosted client metadata document matches what Auth0 expects', () => {
  const doc = JSON.parse(fs.readFileSync(new URL('../oauth-client.json', import.meta.url), 'utf8'));
  assert.equal(doc.client_id, CLIENT_ID);
  assert.equal(CLIENT_ID, 'https://zandcmesa.github.io/cornerstone-site/oauth-client.json');
  assert.deepEqual(doc.grant_types, ['authorization_code', 'refresh_token']);
  assert.equal(doc.token_endpoint_auth_method, 'none');
  assert.ok(doc.redirect_uris.includes('http://localhost/callback'));
});
