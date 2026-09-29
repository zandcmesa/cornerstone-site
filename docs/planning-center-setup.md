# Planning Center: live data setup

The site reads Planning Center two ways. A nightly GitHub Action commits a snapshot to `js/pco-data.js`
(already wired; secrets `PCO_APP_ID` / `PCO_SECRET` are set on the repo). A Cloudflare Worker serves the
same data live so same-day changes show within 5 minutes. Pages render the snapshot instantly and
then swap in the live copy.

## One-time: deploy the worker

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up (no domain needed).
2. In a terminal, from the repo root:

   ```bash
   cd worker
   npx wrangler@latest login        # opens the browser once
   npx wrangler@latest deploy       # prints a URL like https://cornerstone-pco.<you>.workers.dev
   npx wrangler@latest secret put PCO_APP_ID     # paste the App ID from the key file
   npx wrangler@latest secret put PCO_SECRET     # paste the Secret
   ```

3. Open the printed URL in a browser. You should see JSON starting with `{"syncedAt":`.
4. Paste that URL into `js/pco.js` as the value of `PCO_WORKER_URL`, commit, push.

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
