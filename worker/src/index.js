import { makeGetter, fetchSnapshot } from '../../scripts/pco-lib.mjs';

const TTL_MS = 5 * 60 * 1000;
let cached = null;

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=300',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: HEADERS });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
    if (!cached || Date.now() - cached.at > TTL_MS) {
      try {
        const auth = 'Basic ' + btoa(`${env.PCO_APP_ID}:${env.PCO_SECRET}`);
        const snap = await fetchSnapshot(makeGetter(auth));
        cached = { at: Date.now(), body: JSON.stringify(snap) };
      } catch (err) {
        if (!cached) return new Response(JSON.stringify({ error: String(err.message || err) }), { status: 502, headers: HEADERS });
      }
    }
    return new Response(cached.body, { headers: HEADERS });
  },
};
