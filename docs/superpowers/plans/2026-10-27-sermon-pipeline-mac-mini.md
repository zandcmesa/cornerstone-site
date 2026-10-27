# Sermon Pipeline on the Mac Mini Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the Monday sermon cut on the always-on Mac mini (no YouTube cookies), make the PR reviewable from a phone, and let a wrong cut be fixed from the phone with "recut … start … end …".

**Architecture:** A self-hosted GitHub Actions runner on the mini executes the existing `cut-sermon.yml`; the workflow file stays the source of truth for schedule, logs, and dispatch. `scripts/cut-sermon.mjs` gains a replacement path (explicit bounds retire the earlier Vimeo upload for that Sunday) and quiet exits for "not ready yet". `scripts/sync-sermons.mjs` writes a phone-first PR body. A new `issue_comment` job turns a `recut …` PR comment into the same workflow run.

**Tech Stack:** Node 20+ ESM scripts, `node --test`, GitHub Actions (self-hosted macOS runner), yt-dlp + ffmpeg + deno via Homebrew, Vimeo API v3.4, Claude API via `@anthropic-ai/sdk`.

**Spec:** `docs/superpowers/specs/2026-10-27-sermon-pipeline-mac-mini-design.md`

## Global Constraints

- The runner machine is this Mac mini (`Zachs-Mac-mini.local`, macOS 26.6, FileVault on, no auto-login). Tools live in `/opt/homebrew/bin` (node v26, npm, yt-dlp, deno, ffmpeg, gh).
- Runner labels: `self-hosted`, `macOS`, `sermon-mini`. Runner directory: `~/actions-runner`.
- Only `cut-sermon.yml` and `yt-check.yml` target the runner. Their triggers are limited to `schedule`, `workflow_dispatch`, `issue_comment`. Never `pull_request` / `pull_request_target`.
- Vimeo token scopes are `private edit upload public`. No `delete`. `VIMEO_USER` stays unset.
- Secrets come from GitHub Actions secrets only. No secret files on the mini.
- Cut schedule: `0 11-18 * * 1` plus Tuesday `0 10 * * 2`. Concurrency group for the cut: `sermon-cut`. Sync and publish keep `sermon-sync`.
- Non-error exits: `captions-not-ready`, `no-replay`, `already-on-vimeo`, `before-cutover` all exit 0.
- Recut of a date already in `js/sermons.js` on `main` is refused before any Vimeo write.
- PR body first line: `**Watch the cut:** https://vimeo.com/<id>  (unlisted until merge)`.
- No comments in code except where the reason is non-obvious; no docstrings. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Instructions for Zach: one command per line, no inline comments, no `<placeholders>`.

## Review Focus

1. A `recut` comment from someone other than the repo owner must do nothing (Task 6 workflow `if`; parser test in Task 2 covers the body only, so the `if` is checked by reading the YAML in review).
2. A `recut` comment with a date given as "Oct 25" or "10/25" must resolve to the correct ISO date in the current year, and a missing date must fall back to the PR title's date. (Task 2 tests.)
3. A replacement run whose upload fails after the old video was retired leaves the Sunday with no visible upload. Retire must happen only after the new upload succeeds. (Task 3 test asserts call order.)
4. The hourly Monday polling must not open or edit a PR when nothing changed: `captions-not-ready` and `already-on-vimeo` return before `syncSermons` is called. (Task 3 test.)
5. An agency-named Vimeo video (`Sunday Sermon 10-25-2026`) retired by name must stop matching `sermonDateFromVideo`. (Task 2 test.)

---

### Task 1: Register the runner and move the YouTube check onto it

**Files:**
- Modify: `.github/workflows/yt-check.yml`
- Create: `~/actions-runner/` (outside the repo, on this machine)

**Interfaces:**
- Produces: a runner named `sermon-mini` visible in Settings → Actions → Runners, Idle; `yt-check.yml` green on it.

- [ ] **Step 1: Get a registration token and install the runner**

Run from this machine (not inside the repo):

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
gh api -X POST repos/zandcmesa/cornerstone-site/actions/runners/registration-token --jq .token
```

Open https://github.com/zandcmesa/cornerstone-site/settings/actions/runners/new?arch=arm64&os=osx, copy the current "Download" commands (curl + tar) and run them in `~/actions-runner`. Then:

```bash
./config.sh --url https://github.com/zandcmesa/cornerstone-site --token PASTE_TOKEN --name sermon-mini --labels sermon-mini --unattended
./svc.sh install
./svc.sh start
./svc.sh status
```

Expected: `svc.sh status` prints `Started`; `gh api repos/zandcmesa/cornerstone-site/actions/runners --jq '.runners[].status'` prints `online`.

- [ ] **Step 2: Rewrite `yt-check.yml` for the runner**

Replace the file. Keep the `workflow_dispatch` input `video`. Add `schedule: - cron: '0 11 * * 0'`. Set `runs-on: [self-hosted, macOS, sermon-mini]`, `env: PATH: /opt/homebrew/bin:/usr/bin:/bin` at job level. Remove the deno, apt, pip, and cookie steps. Pull step: same yt-dlp command minus `--cookies`, plus `--remote-components ejs:npm`. Report step: `stat -f%z`; failure text becomes "The mini could not reach YouTube. Check that the runner is online and run `brew upgrade yt-dlp` on the mini." Top-of-file comment (allowed, non-obvious): `# Runs on the Mac mini. Never add pull_request triggers to a self-hosted workflow.`

- [ ] **Step 3: Commit and run it on the runner**

```bash
git add .github/workflows/yt-check.yml
git commit -m "Run the YouTube check on the Mac mini runner"
git push -u origin HEAD
gh workflow run yt-check.yml --ref $(git branch --show-current)
gh run watch $(gh run list --workflow=yt-check.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Expected: run succeeds; job summary says "YouTube access is working" with a byte count.

---

### Task 2: Pure helpers: timestamps, recut comments, retiring a video

**Files:**
- Modify: `scripts/sermon-lib.mjs`
- Test: `scripts/sermon-lib.test.mjs`

**Interfaces:**
- Produces:
  - `parseTimestamp(s: string | number): number` — seconds. Accepts `"2530"`, `2530`, `"42:10"`, `"1:19:00"`. Throws `Error("bad timestamp: …")` otherwise.
  - `parseRecutComment(body: string, prTitle = '', now = new Date()): { date: string, start: number, end: number } | { error: string }` — `date` ISO. Date forms: `YYYY-MM-DD`, `Oct 25`, `October 25`, `10/25`. No date → `Sermon archive: YYYY-MM-DD` from `prTitle` → `previousSunday(now)`.
  - `retireVideoFields({ name, description }): { name, description }` — new fields such that `sermonDateFromVideo` returns `null`.

- [ ] **Step 1: Write the failing tests**

```js
test('parseTimestamp reads seconds, MM:SS and H:MM:SS', () => {
  assert.equal(parseTimestamp('2530'), 2530);
  assert.equal(parseTimestamp(2530), 2530);
  assert.equal(parseTimestamp('42:10'), 2530);
  assert.equal(parseTimestamp('1:19:00'), 4740);
  assert.throws(() => parseTimestamp('42m'), /bad timestamp/);
});

test('parseRecutComment reads the grammar and resolves the date', () => {
  const now = new Date('2026-10-27T15:00:00Z');
  assert.deepEqual(parseRecutComment('recut 2026-10-25 start 42:10 end 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('Recut Oct 25, start at 42:10, end at 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut 10/25 from 42:10 to 1:19:00', '', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut start 42:10 end 1:19:00', 'Sermon archive: 2026-10-18', now), { date: '2026-10-18', start: 2530, end: 4740 });
  assert.deepEqual(parseRecutComment('recut start 42:10 end 1:19:00', 'Sermon archive: 3 new sermons', now), { date: '2026-10-25', start: 2530, end: 4740 });
  assert.match(parseRecutComment('recut start 42:10', '', now).error, /end/);
  assert.match(parseRecutComment('looks good, merging', '', now).error, /recut/);
});

test('retireVideoFields makes a video invisible to sermonDateFromVideo', () => {
  const agency = retireVideoFields({ name: 'Sunday Sermon 10-25-2026', description: null });
  assert.equal(sermonDateFromVideo(agency), null);
  assert.match(agency.name, /Superseded/);
  const cutter = retireVideoFields({ name: 'Wonderful, Beautiful', description: 'Josh · John 15\n\nSermon date: 2026-10-25\nSource: x' });
  assert.equal(sermonDateFromVideo(cutter), null);
  assert.equal(cutter.name, 'Superseded: Wonderful, Beautiful');
  assert.match(cutter.description, /Superseded sermon date: 2026-10-25/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test scripts/sermon-lib.test.mjs`
Expected: 3 failures, "is not a function" / not exported.

- [ ] **Step 3: Implement the three functions in `scripts/sermon-lib.mjs`**

`parseRecutComment` returns `{ error }` rather than throwing so the workflow can reply politely. Month names map through `new Date(\`${month} 1 2000\`)` or a 12-entry table; year is `now`'s year in New York (`localDate(now)`). `retireVideoFields` replaces `Sunday Sermon (\d\d-\d\d-\d{4})` with `Superseded sermon $1` in the name, prefixes `Superseded: ` otherwise, and replaces `Sermon date:` with `Superseded sermon date:` in the description.

- [ ] **Step 4: Run to verify they pass**

Run: `node --test scripts/sermon-lib.test.mjs`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/sermon-lib.mjs scripts/sermon-lib.test.mjs
git commit -m "Add timestamp, recut-comment and retire helpers"
```

---

### Task 3: Cutter: quiet exits, replacement with guard, injectable deps

**Files:**
- Modify: `scripts/cut-sermon.mjs` (`fetchTimedCaptions`, `cutSermon`, CLI block)
- Modify: `scripts/vimeo.mjs` (add `retireVideo`)
- Test: `scripts/cut-sermon.test.mjs`

**Interfaces:**
- Consumes: Task 2 helpers.
- Produces:
  - `vimeo.retireVideo(vimeoId: string): Promise<void>` — one PATCH `/videos/{id}` with `{ name, description, privacy: { view: 'nobody' } }` from `retireVideoFields`. Needs a `getVideo(id)` first (`fields=name,description`).
  - `cutSermon(opts, deps = cutDeps)` where `cutDeps = { listVideos, uploadVideo, uploadTextTrack, retireVideo, findReplay, fetchTimedCaptions, downloadSection, findSermonBounds, extractMetadata, syncSermons, readArchive, log }`. `readArchive()` returns `parseArchive(fs.readFileSync(ROOT/js/sermons.js))`.
  - New return statuses: `captions-not-ready`, `replaced` (plus existing). Return object for `uploaded`/`replaced` adds `{ startLine, endLine, cutAt }` where `startLine`/`endLine` are the caption `text` at the segment nearest `bounds.start`/`bounds.end` and `cutAt` is `new Date().toISOString()`.
  - `syncSermons` is called with a third override, `previewOverride: { [vimeoId]: { youtubeId, start, end, startLine, endLine, cutAt } }` (consumed in Task 5).
  - `fetchTimedCaptions` returns `null` instead of throwing when no `.json3` file appears.

- [ ] **Step 1: Write the failing tests**

Build a `fakeDeps()` helper in the test with an ordered `calls` array (`['listVideos', 'retireVideo:123', 'uploadVideo', …]`), `listVideos` returning `[{ vimeoId: '123', name: 'Old', description: 'Sermon date: 2026-10-25' }]`, `fetchTimedCaptions` returning segments `[{t:0,text:'pre'},{t:2500,text:'Open your Bibles'},{t:4800,text:'amen'}]`, `readArchive` returning `{ entries: [{ date: '2026-10-18', vimeoId: 'X' }], maxId: 1 }`, `downloadSection` writing a 1-byte file, `uploadVideo` returning `'999'`.

```js
test('without bounds, a Sunday already on Vimeo exits before any download or sync', …)
  // status 'already-on-vimeo'; calls contains neither 'downloadSection' nor 'syncSermons'
test('captions not ready is a quiet status, not an error', …)
  // fetchTimedCaptions: () => null → { status: 'captions-not-ready' }, no 'findSermonBounds', no 'syncSermons'
test('explicit bounds replace: upload first, then retire the old video, then sync', …)
  // start: '42:10', end: '1:19:00' → status 'replaced', vimeoId '999';
  // calls.indexOf('uploadVideo') < calls.indexOf('retireVideo:123') < calls.indexOf('syncSermons');
  // syncSermons received previewOverride['999'] with start 2530, end 4740, startLine 'Open your Bibles', endLine 'amen'
test('explicit bounds for a date already on main are refused before touching Vimeo', …)
  // date '2026-10-18' → rejects /already published/; calls has no 'retireVideo', no 'uploadVideo'
test('bounds accept H:MM:SS on the CLI path', …)
  // dryRun with start '42:10' end '1:19:00' → bounds.start 2530
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test scripts/cut-sermon.test.mjs`
Expected: new tests fail (deps not accepted / wrong status / throws).

- [ ] **Step 3: Implement**

In `scripts/vimeo.mjs`: `getVideo(id)` and `retireVideo(id)` as specified. In `scripts/cut-sermon.mjs`: build `cutDeps` from the module imports, thread `d.` through `cutSermon`, parse `start`/`end` with `parseTimestamp`, add the published-date guard right after the cutover check (`d.readArchive().entries.some(e => e.date === date)` only when bounds are given), skip the already-on-Vimeo early return when bounds are given or `dryRun` is set (so a dry run can re-examine a Sunday that is already uploaded), retire matching videos after `uploadTextTrack`, compute `startLine`/`endLine` from `segments`, pass `previewOverride`. Leave `YouTubeLoginError` and its cookie advice as they are; cookies may be needed again someday.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/cut-sermon.mjs scripts/cut-sermon.test.mjs scripts/vimeo.mjs
git commit -m "Cutter: quiet exits, replacement runs with a published-date guard"
```

---

### Task 4: Boundary prompt knows the service order

**Files:**
- Modify: `scripts/sermon-ai.mjs` (`buildBoundsPrompt`)
- Test: `scripts/sermon-ai.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('bounds prompt warns that the welcome before worship is not the sermon', () => {
  const { system } = buildBoundsPrompt('[0:00:00] hi');
  assert.match(system, /second appearance/i);
  assert.match(system, /second half/i);
  assert.match(system, /30 to 50 minutes/);
  assert.match(system, /singing or an offering/i);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/sermon-ai.test.mjs`

- [ ] **Step 3: Add two lines to the `system` array in `buildBoundsPrompt`**

Exact copy:

`'The preacher often greets the room before worship ("Morning everybody") and again after the offering and kids dismissal. The sermon is the second appearance, normally in the second half of the recording, and lasts 30 to 50 minutes.'`

`'If the span you chose contains singing or an offering, it is wrong: move start later, to where the teaching from scripture begins.'`

- [ ] **Step 4: Run to verify it passes, then commit**

```bash
npm test
git add scripts/sermon-ai.mjs scripts/sermon-ai.test.mjs
git commit -m "Tell the boundary finder the welcome is not the sermon"
```

---

### Task 5: Phone-first PR body

**Files:**
- Modify: `scripts/sync-sermons.mjs` (signature, body builder)
- Modify: `scripts/sermon-lib.mjs` (add pure `buildPrBody(entries, skipped, previews)`)
- Test: `scripts/sermon-lib.test.mjs`, `scripts/sync-sermons.test.mjs`

**Interfaces:**
- Consumes: `previewOverride` from Task 3.
- Produces: `buildPrBody(entries, skipped = [], previews = {}): string`. `entries[i]` has `date, title, speaker, series, scripture, description, vimeoId, art` (`art` is a path or `null`). `previews[vimeoId]` is `{ youtubeId, start, end, startLine, endLine, cutAt }` or absent.
- `syncSermons({ …, previewOverride = {} })` passes `previewOverride` to `buildPrBody`.

- [ ] **Step 1: Write the failing tests**

```js
test('buildPrBody leads with the Vimeo link and shows the cut edges', () => {
  const body = buildPrBody([{ date: '2026-10-25', title: 'T', speaker: 'Pastor Josh Eldridge', series: 'Seek First the Kingdom', scripture: 'John 15', description: 'D.', vimeoId: '999', art: 'images/sermons/series-seek-first-the-kingdom.jpg' }], [],
    { '999': { youtubeId: 'abc', start: 2530, end: 4740, startLine: 'Open your Bibles', endLine: 'amen', cutAt: '2026-10-26T15:12:00Z' } });
  assert.ok(body.startsWith('**Watch the cut:** https://vimeo.com/999  (unlisted until merge)'));
  assert.match(body, /\*\*T\*\* — Pastor Josh Eldridge · Seek First the Kingdom/);
  assert.match(body, /John 15 · 42:10–1:19:00 of the YouTube replay/);
  assert.match(body, /Starts: "Open your Bibles" · Ends: "amen"/);
  assert.match(body, /Cut at 11:12am ET Mon Oct 26/);
  assert.match(body, /To fix the cut, comment: `recut start 42:10 end 1:19:00`/);
  assert.match(body, /Merging publishes the video and the site\./);
  assert.doesNotMatch(body, /art/i);
});

test('buildPrBody names the missing art by series or by its absence', () => {
  const withSeries = buildPrBody([{ date: '2026-11-01', title: 'T', speaker: 'S', series: 'New Series', scripture: '', description: '', vimeoId: '1', art: null }]);
  assert.match(withSeries, /Art missing for the series "New Series": run \/sermon-art\./);
  const noSeries = buildPrBody([{ date: '2026-11-01', title: 'T', speaker: 'S', series: null, scripture: '', description: '', vimeoId: '1', art: null }]);
  assert.match(noSeries, /No series and no art: if this belongs to an existing series, fix the series name here; otherwise run \/sermon-art\./);
});
```

And in `sync-sermons.test.mjs`, extend the "overrides supply transcript and metadata" test to pass `previewOverride` and assert `calls.published.body` starts with `**Watch the cut:**` and contains `Starts:`.

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`

- [ ] **Step 3: Implement `buildPrBody` in `sermon-lib.mjs`, use it in `syncSermons`**

Time format for `cutAt`: `America/New_York`, pattern `h:mma ET ddd MMM D` via `Intl.DateTimeFormat` (lowercase am/pm). `hms()` already exists for the span. The "Skipped this run" block and the Claude Code footer stay at the end. Entries without a preview omit the span, edges, and cut-time lines; the recut hint still appears, with the generic form `recut start M:SS end H:MM:SS` when no bounds are known.

- [ ] **Step 4: Run tests, commit**

```bash
npm test
git add scripts/sermon-lib.mjs scripts/sermon-lib.test.mjs scripts/sync-sermons.mjs scripts/sync-sermons.test.mjs
git commit -m "Lead the sermon PR with the Vimeo preview and the cut edges"
```

---

### Task 6: Workflow on the runner, hourly Monday schedule, PR-comment door

**Files:**
- Modify: `.github/workflows/cut-sermon.yml`
- Create: `scripts/recut-comment.mjs` (thin CLI: reads `COMMENT_BODY`, `PR_TITLE` env, prints `date=… start=… end=…` lines to `$GITHUB_OUTPUT`, or `error=…`)
- Test: `scripts/recut-comment.test.mjs` (spawns the script with env, checks output file)

**Interfaces:**
- Consumes: `parseRecutComment` (Task 2), `cutSermon` statuses (Task 3).

- [ ] **Step 1: Write the failing test for the CLI wrapper**

```js
test('recut-comment writes outputs for a valid comment and an error otherwise', () => {
  // spawn node scripts/recut-comment.mjs with env { COMMENT_BODY: 'recut start 42:10 end 1:19:00', PR_TITLE: 'Sermon archive: 2026-10-25', GITHUB_OUTPUT: tmpfile }
  // tmpfile contains 'date=2026-10-25\nstart=2530\nend=4740\n'
  // with COMMENT_BODY 'recut start 42:10' → tmpfile contains 'error=' and the process still exits 0
});
```

- [ ] **Step 2: Run to verify it fails, then implement `scripts/recut-comment.mjs`**

- [ ] **Step 3: Rewrite `cut-sermon.yml`**

Top comment: `# Runs on the Mac mini. Never add pull_request triggers to a self-hosted workflow.`

Triggers:
```yaml
on:
  schedule:
    - cron: '0 11-18 * * 1'
    - cron: '0 10 * * 2'
  workflow_dispatch: (inputs unchanged)
  issue_comment:
    types: [created]
```
`concurrency: group: sermon-cut`. Two jobs:

`parse` (runs-on `ubuntu-latest`, only `if: github.event_name == 'issue_comment' && github.event.issue.pull_request && github.event.comment.author_association == 'OWNER' && (startsWith(github.event.comment.body, 'recut') || startsWith(github.event.comment.body, 'Recut'))`): checkout, `node scripts/recut-comment.mjs` with `COMMENT_BODY`/`PR_TITLE` env, outputs `date start end error`. If `error`, `gh pr comment` with the error text and the expected form, and reaction 👀 → ❌. Else react 👀.

`cut` (runs-on `[self-hosted, macOS, sermon-mini]`, `needs: [parse]`, `if: always() && (github.event_name != 'issue_comment' || needs.parse.outputs.start)`): job `env: PATH: /opt/homebrew/bin:/usr/bin:/bin`; steps: checkout (`fetch-depth: 0`), `brew upgrade yt-dlp || true`, `node --version`, `npm ci`, run `node scripts/cut-sermon.mjs` with `--date/--start/--end` from `inputs.*` or `needs.parse.outputs.*`. Env: `VIMEO_TOKEN`, `ANTHROPIC_API_KEY`, `SERMON_CUT_START`, `GH_TOKEN`. No `YOUTUBE_COOKIES`, no `GEMINI_API_KEY`, no setup-node/deno/apt/pip steps. Final step, `if: github.event_name == 'issue_comment' && always()`: `gh pr comment` with "Recut done: https://vimeo.com/<id>" on success (the script prints `uploaded`/`replaced`; capture the Vimeo id by having `cut-sermon.mjs` print `vimeo=<id>` as its last line) or "Recut failed: <last log line>" on failure.

- [ ] **Step 4: Validate the YAML and test locally**

```bash
npm test
node -e "require('node:child_process').execFileSync('ruby',['-ryaml','-e','YAML.load_file(\".github/workflows/cut-sermon.yml\")'],{stdio:'inherit'})"
```

- [ ] **Step 5: Commit and run a dry dispatch on the runner**

```bash
git add .github/workflows/cut-sermon.yml scripts/recut-comment.mjs scripts/recut-comment.test.mjs scripts/cut-sermon.mjs
git commit -m "Cut sermons on the Mac mini, poll Mondays, accept recut comments"
git push
gh workflow run cut-sermon.yml --ref $(git branch --show-current) -f date=2026-10-18
gh run watch $(gh run list --workflow=cut-sermon.yml --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Expected: run goes green on the `sermon-mini` runner with "2026-10-18 is already on Vimeo"; no PR change.

---

### Task 7: Docs and CLAUDE.md

**Files:**
- Modify: `docs/sermon-automation-setup.md` (replace section 4 "YouTube cookies"; add "The Mac mini runner", "From your phone", "If something is off")
- Modify: `CLAUDE.md` (the "Adding more sermon data" paragraph)

- [ ] **Step 1: Rewrite the setup doc sections**

"The Mac mini runner": what it is, where it lives (`~/actions-runner`), how to see it (Settings → Actions → Runners), the three `svc.sh` commands, "after a reboot or macOS update, sign in at the mini once; the runner comes back with the login", the Sunday 7am ET health check and what red means, `brew upgrade yt-dlp` as the first fix for any YouTube error. One manual setting: Settings → Actions → General → "Require approval for all external contributors".

"From your phone": the Monday flow (PR arrives, open the Vimeo link, read Starts/Ends, merge). Then recut, Door A first:

```
gh workflow run cut-sermon.yml -f date=2026-10-25 -f start=42:10 -f end=1:19:00
gh run watch --exit-status
```

then Door B: comment `recut start 42:10 end 1:19:00` on the PR. Say explicitly that recut only works before merge.

Delete the cookie export instructions and the "Check YouTube access" cookie paragraph; keep a one-line note that `YOUTUBE_COOKIES`, if ever set again, is still honored.

- [ ] **Step 2: Update CLAUDE.md**

In "Adding more sermon data", change "runs `scripts/cut-sermon.mjs` on Mondays" to describe the Mac mini runner, hourly Monday polling, and the recut doors, and point at the "From your phone" section. Two sentences.

- [ ] **Step 3: Commit**

```bash
git add docs/sermon-automation-setup.md CLAUDE.md
git commit -m "Document the Mac mini runner and the phone recut flow"
```

---

### Task 8: First real use: recut Oct 25

**Files:** none (operational)

- [ ] **Step 1: Dry-run the new boundary finder on the mini**

Export `VIMEO_TOKEN` (from `~/grokbot/oasis-creative-studios/cornerstone-church/vimeo-token.rtf`) and `ANTHROPIC_API_KEY` (from `~/Desktop/anthropic-api-key-cornerstone.rtf`) in the shell, never into a file in the repo, then:

```bash
node scripts/cut-sermon.mjs --date 2026-10-25 --dry-run
```

Expected: it prints bounds, confidence, and the note and exits with `dry-run`; with the improved prompt the start should be after the offering, around the second half of the 1:59:20 recording.

- [ ] **Step 2: Confirm the bounds against the captions**

Open the replay `https://www.youtube.com/watch?v=DszPuPkw1m0` at the proposed start and end. Adjust by hand if needed.

- [ ] **Step 3: Replace the Oct 25 upload through the workflow**

```bash
gh workflow run cut-sermon.yml -f date=2026-10-25 -f start=H:MM:SS -f end=H:MM:SS
gh run watch --exit-status
gh pr view 24 --json body --jq .body
```

Expected: PR 24 body starts with `**Watch the cut:**`, series is Seek First the Kingdom, no art line, old video 1239551077 renamed "Superseded: …" and private on Vimeo.

- [ ] **Step 4: Report the Vimeo link to Zach for the phone review. Do not merge.**
