import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export const CLIENT_ID = 'https://zandcmesa.github.io/cornerstone-site/oauth-client.json';
export const AUTH = 'https://auth.artlist.io';
export const MCP = 'https://mcp.artlist.io/mcp';
export const RESOURCE = 'https://mcp.artlist.io/';
export const NANO_BANANA_PRO = 1042;

export function parseMcpBody(text, contentType = '') {
  if (contentType.includes('text/event-stream')) {
    const datas = text.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).filter(Boolean);
    const msgs = datas.map(d => JSON.parse(d));
    return msgs.find(m => m.id !== undefined) || msgs.at(-1);
  }
  return JSON.parse(text);
}

export function toolCallPayload(id, name, args) {
  return { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } };
}

export function pickAssetUrl(result) {
  return result?.assets?.[0]?.assetUrl || null;
}

export async function refreshAccessToken(refreshToken) {
  const res = await fetch(`${AUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: refreshToken, resource: RESOURCE }),
  });
  if (!res.ok) throw new Error(`Artlist token refresh → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const d = await res.json();
  if (d.refresh_token && d.refresh_token !== refreshToken) rotateSecret(d.refresh_token);
  return d.access_token;
}

function rotateSecret(newToken) {
  console.log('Artlist rotated the refresh token; updating ARTLIST_REFRESH_TOKEN');
  try {
    execFileSync('gh', ['secret', 'set', 'ARTLIST_REFRESH_TOKEN', '-R', 'zandcmesa/cornerstone-site'], { input: newToken, stdio: ['pipe', 'ignore', 'inherit'], env: { ...process.env, GH_TOKEN: process.env.ADMIN_GH_TOKEN || process.env.GH_TOKEN } });
  } catch {
    console.log('WARNING: could not update the ARTLIST_REFRESH_TOKEN secret. Re-run scripts/artlist-auth.mjs before the next run.');
  }
}

export class ArtlistMcp {
  constructor(accessToken) { this.token = accessToken; this.session = null; this.n = 0; }
  async rpc(body) {
    const res = await fetch(MCP, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18', ...(this.session ? { 'Mcp-Session-Id': this.session } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Artlist MCP ${body.method} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
    this.session ||= res.headers.get('mcp-session-id');
    if (res.status === 202) return null;
    const msg = parseMcpBody(await res.text(), res.headers.get('content-type') || '');
    if (msg.error) throw new Error(`Artlist MCP ${body.method}: ${msg.error.message}`);
    return msg.result;
  }
  async init() {
    await this.rpc({ jsonrpc: '2.0', id: ++this.n, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'cornerstone-sermon-art', version: '1' } } });
    await this.rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
    return this;
  }
  async call(name, args) {
    const result = await this.rpc(toolCallPayload(++this.n, name, args));
    const text = (result?.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    if (result?.isError) throw new Error(`Artlist ${name} failed: ${text.slice(0, 300)}`);
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }
}

export async function generateImage({ prompt, outPng, modelId = NANO_BANANA_PRO, quality = '1K', refreshToken = process.env.ARTLIST_REFRESH_TOKEN }) {
  if (!refreshToken) throw new Error('ARTLIST_REFRESH_TOKEN is not set');
  const mcp = await new ArtlistMcp(await refreshAccessToken(refreshToken)).init();
  const started = await mcp.call('generate_image', { prompt, modelId, settings: { aspect_ratio: '16:9', quality, num_images: 1 } });
  if (!started.generationId) throw new Error(`Artlist did not start a generation: ${JSON.stringify(started).slice(0, 300)}`);
  let url = null;
  for (let i = 0; i < 8 && !url; i++) url = pickAssetUrl(await mcp.call('get_generation_status', { generationId: started.generationId }));
  if (!url) throw new Error(`Artlist generation ${started.generationId} did not finish in time`);
  const img = await fetch(url);
  if (!img.ok) throw new Error(`Artlist asset download → ${img.status}`);
  fs.writeFileSync(outPng, Buffer.from(await img.arrayBuffer()));
  return { outPng, generationId: started.generationId, price: started.price };
}
