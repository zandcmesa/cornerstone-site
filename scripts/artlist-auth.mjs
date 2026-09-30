import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { AUTH, CLIENT_ID, RESOURCE, refreshAccessToken, ArtlistMcp } from './artlist.mjs';

const PORT = 3118;
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
const state = crypto.randomBytes(8).toString('hex');
const redirect = `http://localhost:${PORT}/callback`;

const url = `${AUTH}/authorize?` + new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, redirect_uri: redirect, scope: 'openid offline_access', code_challenge: challenge, code_challenge_method: 'S256', state, resource: RESOURCE });

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, redirect);
    if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<p style="font:16px sans-serif">Artlist connected. You can close this tab.</p>');
    server.close();
    if (u.searchParams.get('state') !== state) reject(new Error('state mismatch'));
    else if (u.searchParams.get('error')) reject(new Error(u.searchParams.get('error_description') || u.searchParams.get('error')));
    else resolve(u.searchParams.get('code'));
  });
  server.listen(PORT, () => {
    console.log('Opening Artlist login in your browser. If nothing opens, paste this URL:\n' + url + '\n');
    try { execFileSync('open', [url]); } catch {}
  });
});

const res = await fetch(`${AUTH}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CLIENT_ID, code, redirect_uri: redirect, code_verifier: verifier, resource: RESOURCE }),
});
if (!res.ok) { console.error(`token exchange → ${res.status}: ${await res.text()}`); process.exit(1); }
const tok = await res.json();
if (!tok.refresh_token) { console.error('No refresh token returned. Response keys: ' + Object.keys(tok).join(', ')); process.exit(1); }

const mcp = await new ArtlistMcp(tok.access_token).init();
const balance = await mcp.call('get_balance', {});
console.log(`Connected to Artlist (${balance.planName}, ${balance.creditsLeft} credits left).`);

const again = await refreshAccessToken(tok.refresh_token).then(() => 'ok').catch(e => e.message);
console.log(`Refresh test: ${again}`);

if (process.argv.includes('--set-secret')) {
  execFileSync('gh', ['secret', 'set', 'ARTLIST_REFRESH_TOKEN', '-R', 'zandcmesa/cornerstone-site'], { input: tok.refresh_token, stdio: ['pipe', 'inherit', 'inherit'] });
  console.log('Saved as repo secret ARTLIST_REFRESH_TOKEN.');
} else {
  console.log('\nRefresh token (save as repo secret ARTLIST_REFRESH_TOKEN):\n' + tok.refresh_token);
}
