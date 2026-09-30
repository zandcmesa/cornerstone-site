# Planning Center: live data setup

Status: the worker is deployed at https://cornerstone-pco.oasisagency.workers.dev on the Oasis Cloudflare account (zach@oasisagency.is) and `js/pco.js` points at it. The steps below are for reference or for redeploying.

The site reads Planning Center two ways. A nightly GitHub Action commits a snapshot to `js/pco-data.js`
(already wired; secrets `PCO_APP_ID` / `PCO_SECRET` are set on the repo). A Cloudflare Worker serves the
same data live so same-day changes show within 5 minutes. Pages render the snapshot instantly and
then swap in the live copy.

## One-time: deploy the worker

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up (no domain needed).
2. Open Terminal and go to the worker folder. Paste one line at a time (don't paste the whole block; zsh treats `#` as text, not a comment).

   ```bash
   cd /Users/mesa/conductor/workspaces/cornerstone-site/rio-de-janeiro/worker
   ```

3. Log in. A browser tab opens; click Allow.

   ```bash
   npx wrangler@latest login
   ```

4. Deploy. The last line printed is the worker URL, something like `https://cornerstone-pco.<account>.workers.dev`.

   ```bash
   npx wrangler@latest deploy
   ```

5. Add the two secrets. Each command prompts for a value; paste it and press Enter. The values are in `~/Documents/planning-center-api-key-cornerstone.rtf`.

   ```bash
   npx wrangler@latest secret put PCO_APP_ID
   npx wrangler@latest secret put PCO_SECRET
   ```

6. Open the worker URL in a browser. You should see JSON starting with `{"syncedAt":`.
7. Paste that URL into `js/pco.js` as the value of `PCO_WORKER_URL`, commit, push.

## Re-deploying after a code change

```bash
cd worker && npx wrangler@latest deploy
```

## Testing the worker locally

Create `worker/.dev.vars` (git-ignored) with `PCO_APP_ID=…` and `PCO_SECRET=…`, then
`cd worker && npx wrangler@latest dev` and open http://localhost:8787.

## How data is filtered

Only Church Center-visible items ever leave the worker: visible Calendar events, open non-archived
Registrations signups, listed groups with a public Church Center URL, and Church Center-visible group
types. Photos from Planning Center are not used; cards use the site's gradients.

## Refreshing the test fixtures

```bash
PCO_APP_ID=… PCO_SECRET=… node scripts/capture-fixtures.mjs && node --test 'scripts/*.test.mjs'
```
