# Sermon pipeline on the Mac mini: design

Date: 2026-10-27. Status: approved 2026-10-27.

## Intent

Every Monday a cut of Sunday's sermon should appear as a PR that Zach can review and merge from his phone, with nothing that requires a computer. Today the pipeline exists (`cut-sermon.yml` → `scripts/cut-sermon.mjs` → `sync-sermons.mjs` → PR on `sermon-sync`) but it fails for two structural reasons:

1. **YouTube blocks GitHub-hosted runners.** Four of the last eight Monday runs died on "Sign in to confirm you're not a bot." The `YOUTUBE_COOKIES` secret expires or gets flagged on a datacenter IP. Verified on 2026-10-27 that the Mac mini, on a residential connection, lists the channel's replays, reads video metadata, and downloads a 20-second section of the Oct 25 replay (with `--remote-components ejs:npm`) with **no cookies at all**.
2. **A wrong cut has no phone-sized fix.** On 2026-10-25 the Claude boundary finder picked the worship set and offering instead of the message (PR #24: title from a worship lyric, `series: null`, so the PR also said "art missing" even though the sermon belongs to Seek First the Kingdom and the series art already exists). Repairing that required renaming the Vimeo upload and re-running with overrides from a computer, because the cutter skips any Sunday already on Vimeo.

The user's always-on Mac mini (macOS 26.6, with ffmpeg, yt-dlp, deno, node, gh, and Claude Code already installed) becomes the machine that cuts.

## Goals

- The Monday cut runs on the Mac mini with no YouTube cookies.
- The PR is reviewable on a phone: the unlisted Vimeo link is the first line, followed by title, speaker, series, and description.
- A bad cut is fixed from the phone by telling Claude "recut Oct 25, start 42:10, end 1:19:00", or by typing the same thing as a PR comment. The rerun replaces the earlier upload and refreshes the PR.
- Runs remain visible and triggerable in GitHub Actions. Logs, history, and `workflow_dispatch` keep working as they do today.
- `npm test` stays green; new pure logic gets tests.

## Non-goals

- The cinematic edit (logo bumper, fades, music). Separate design; the cut step should leave an obvious seam for it (see "Seam for the edit").
- Moving sync, publish, or Planning Center off GitHub-hosted runners. They never touch YouTube.
- Automating new-series art. When a new series starts the PR says so in one line and art is still made with `/sermon-art`.
- Any change to the site's HTML/CSS/JS beyond `js/sermons.js` data.

## Anti-goals

- A second scheduler on the mini (cron, launchd script) that duplicates what Actions does. One source of truth: the workflow file.
- Secrets stored in files on the mini. Secrets keep coming from GitHub Actions secrets.
- A self-hosted runner that executes code from fork pull requests.

## Constraints

- Public repo (`zandcmesa/cornerstone-site`). GitHub advises against self-hosted runners on public repos because a fork PR could run code on the machine. Mitigation below.
- The Vimeo token has scopes `private edit upload public`, **not `delete`**. Replacing an upload must work with edit only.
- Claude on the phone (claude.ai Claude Code cloud sessions) can reach GitHub (`gh`) but cannot open YouTube or Vimeo. The mini can.
- The mini runs as Zach's user account and may be used interactively at the same time; the runner must not interfere (no Chrome automation, no cookie export).

## Decisions

### 1. Self-hosted GitHub Actions runner on the Mac mini

- Register one repository-level runner on the mini, installed as a launchd service with the runner's `svc.sh install` so it restarts whenever Zach's user is logged in. Labels: `self-hosted`, `macOS`, plus a custom label `sermon-mini`.
- **Reboots.** The mini has FileVault on and no auto-login, so after a power cut or an OS update the runner is offline until someone logs in at the mini. See Decision 8.
- **Health check.** `yt-check.yml` (moved to the runner, below) also gets a weekly schedule, Sunday 6am ET. If the runner is offline the Monday cut will queue; the Sunday check turning red is the early warning. Document how to read it.
- `cut-sermon.yml` changes `runs-on: ubuntu-latest` → `runs-on: [self-hosted, macOS, sermon-mini]`. Drop the apt/pip install steps, the `setup-deno` step, and the `YOUTUBE_COOKIES` env. Keep `actions/checkout`. Drop `actions/setup-node` and use the mini's node (verify `node --version` ≥ 20 at the start of the job; fail fast with a clear message otherwise). Keep `npm ci`.
- `ytBaseArgs()` in `scripts/cut-sermon.mjs` already only adds `--cookies` when `YOUTUBE_COOKIES` is set; leave that so a cookie can be re-added if YouTube ever changes its mind. Keep `--remote-components ejs:npm` (deno is on the mini).
- `yt-check.yml` moves to the same runner and loses the cookie step. It becomes a one-click "is YouTube reachable from the mini" check. Its `stat -c%s` is GNU-only; use `stat -f%z` on macOS. Build order: register the runner, move `yt-check.yml` first and run it, then migrate `cut-sermon.yml`.
- Runner upkeep lives in `docs/sermon-automation-setup.md`: install steps, where the runner lives on disk (my call: `~/actions-runner`), how to see it in Settings → Actions → Runners, and what to do if it shows Offline (open the mini, run `svc.sh status`/`start`). Replace the "YouTube cookies" section with this.
- Security: the only workflows that target the runner are `cut-sermon.yml` and `yt-check.yml`, and their triggers are `schedule`, `workflow_dispatch`, and `issue_comment`. None of these run code from a fork: `schedule` and `issue_comment` always check out the default branch; `workflow_dispatch` is limited to collaborators. Additionally set repository Actions settings to "Require approval for all external contributors" (documented as a manual step). Never add `pull_request` or `pull_request_target` triggers to runner-targeted workflows; say so in a comment at the top of each.

### 2. Rerun with bounds replaces the earlier upload

In `cutSermon()`:

- The "already on Vimeo → nothing to do" check stays for runs **without** explicit bounds (scheduled Monday run, plain dispatch). This keeps Tuesday's retry idempotent.
- **Guard first.** If the date already has an entry in `js/sermons.js` on `main`, the run refuses before touching Vimeo: "2026-10-18 is already published; recut only works while the sermon is still an open PR." Recutting a merged sermon is out of scope for this design (my call: it is rare, the phone review happens before merge, and a swap on `main` would blank the live embed mid-run).
- When `start` and `end` are both given and the guard passes, the run is a **replacement**. Before uploading, find every video whose `sermonDateFromVideo()` equals the date and *retire* it: rewrite the name so the date no longer parses (`sermonDateFromVideo` matches `Sunday Sermon MM-DD-YYYY` anywhere in the name, so a prefix is not enough; replace that phrase with `Superseded sermon MM-DD-YYYY`), rewrite the description so the `Sermon date:` line reads `Superseded sermon date: YYYY-MM-DD`, and set privacy `nobody`. New helper `vimeo.retireVideo(id)`; pure helper `retireVideoFields({ name, description })` in `sermon-lib.mjs` with a test that asserts `sermonDateFromVideo` returns null afterwards. Deletion is not possible with the current token scopes.
- After upload, `syncSermons()` runs as today. It builds from `origin/main` and `publish()` recreates `sermon-sync` from `origin/main`, so the old draft entry disappears on its own. Because the retired video no longer matches a date, `pickCandidates` sees only the new upload. The PR is force-pushed and `gh pr edit` updates its body. Expected result: a PR with one entry for the date and the new vimeoId. The id may skip a number (drafts count toward `nextId`); that is fine.
- Accept bounds as either integer seconds or `H:MM:SS` / `MM:SS`. New pure helper `parseTimestamp()` in `sermon-lib.mjs` with tests. Used by the CLI flags, the workflow inputs, and the comment parser.

### 3. Phone-driven recut: two doors, one workflow

**Door A, Claude on the phone.** Zach says "recut Oct 25, start 42:10, end 1:19:00." Claude runs:

```
gh workflow run cut-sermon.yml -f date=2026-10-25 -f start=42:10 -f end=1:19:00
```

then watches with `gh run watch` and reports the Vimeo link from the updated PR. A cloud Claude session's GitHub token may lack permission to dispatch workflows; if the command is refused, Claude falls back to Door B by posting the `recut …` comment on the open PR with `gh pr comment`. Document both, in that order, in `docs/sermon-automation-setup.md` under "From your phone" so a cloud Claude session can find it (it reads the repo). Also add a short note to `CLAUDE.md` pointing at that section.

**Door B, a PR comment.** `cut-sermon.yml` gains an `issue_comment` trigger with `types: [created]`. A job-level `if` requires: the issue is a pull request, `comment.author_association` is `OWNER`, and the body starts with `recut` (case-insensitive). A pure helper `parseRecutComment(body, prTitle)` in `sermon-lib.mjs` with tests extracts `{ date, start, end }`:

- Grammar: `recut [YYYY-MM-DD | Oct 25] start <ts> end <ts>`. Tolerant of commas, "at", "to", "from". If no date, take it from the PR title `Sermon archive: YYYY-MM-DD`; if the title has no date, fall back to `previousSunday()`.
- If start or end is missing, the job posts a reply comment explaining the expected form and exits 0 (no red X for a typo).

The job reacts to the comment with 👀 when it starts and posts a one-line comment with the new Vimeo link when done, or the error message if it failed. Use `gh api` for the reaction and `gh pr comment` for the reply.

### 4. PR body leads with the preview

Reorder the body built in `syncSermons()`:

```
**Watch the cut:** https://vimeo.com/<id>  (unlisted until merge)

**Wonderful, Beautiful, Glorious, Matchless** — Pastor Josh Eldridge · Seek First the Kingdom
John 15–17 · 42:10–1:19:00 of the YouTube replay
<description>

To fix the cut, comment: `recut start 42:10 end 1:19:00`
Merging publishes the video and the site.

[only when art is missing, series set]   Art missing for the series "X": run /sermon-art.
[only when art is missing, series null]  No series and no art: if this belongs to an existing series, fix the series name here; otherwise run /sermon-art.
```

Multi-sermon PRs (the rare catch-up case) repeat the block per sermon. The YouTube span line is only available when the entry came through the cutter (`metaOverride` path); omit otherwise. The "art missing" line changes from a per-row suffix to one of the sentences above, chosen by whether `series` is set, and only for entries whose `artFile()` is absent. The `series: null` wording matters: on Oct 25 the real problem was a wrong cut that produced no series, not missing art.

### 5. Operational notes and failure modes

- **Mini offline.** GitHub queues the job for up to 24 hours (default `timeout` for waiting on a runner is not configurable; jobs expire after 24h with a failure). That failure shows in Actions; the Tuesday schedule run retries. Document.
- **yt-dlp drift.** YouTube changes break yt-dlp a few times a year. Add a first step `brew upgrade yt-dlp || true` to the job so the mini self-updates. Document the manual fallback (`brew upgrade yt-dlp`).
- **Runner user and PATH.** launchd services get a minimal PATH. The workflow sets `PATH=/opt/homebrew/bin:$PATH` in `env:` at job level rather than relying on the shell profile. Verified: node v26, npm, yt-dlp, deno, ffmpeg, and gh all live in `/opt/homebrew/bin`, no nvm.
- **Disk.** Cuts are made in a temp dir and removed unless `--keep`. The runner's `_work` directory keeps the checkout; nothing else accumulates.
- **Concurrency.** The cut gets its own group, `sermon-cut`, instead of sharing `sermon-sync`. Sharing would mean a cut queued behind an offline mini holds the group and GitHub cancels the pending hosted sync behind it. The remaining race (a hosted sync and a cut both pushing `sermon-sync` within the same minute) is benign: both build from `origin/main` and the same Vimeo list, so whichever lands second produces the same branch. `publish-sermons.yml` and `sync-sermons.yml` keep `sermon-sync`.

### 6. Timing: poll through Monday instead of guessing one hour

YouTube's replay and its auto-captions appear some hours after the stream ends, and the gap varies. The cron is 6am ET, but GitHub's scheduler has actually started the last four runs between 10:30am and 12:45pm ET, so nobody knows when the job really fires. Instead of picking a time:

- Schedule: `0 11-18 * * 1` (hourly, 7am to 2pm ET on Mondays, allowing for DST drift) plus the existing Tuesday run as a backstop. Each run is cheap on the mini and idempotent: once the Sunday is on Vimeo it exits with "already on Vimeo."
- "Auto-captions are not available yet" currently throws and paints the run red. Make it a clean exit with status `captions-not-ready` and exit code 0, logged in one line, so the hourly polling does not produce a wall of failures. The same for "no YouTube live replay found." Only real errors stay red.
- Record in the PR body (see 4) what time the cut actually happened, so Zach learns the typical Monday hour over a few weeks.

### 7. Boundary finder: the welcome is not the sermon

The Oct 26 run chose 0:17:16 → 0:59:09 with high confidence because Josh said "Morning everybody" at 17:16. That was the welcome before worship; the cut was welcome, worship, and offering. Two cheap fixes:

- Add the service order to the prompt in `scripts/sermon-ai.mjs`: the preacher often greets the room before worship and again after the offering and kids dismissal; the sermon is the second appearance, normally in the second half of the recording, and lasts 30 to 50 minutes. If the chosen span contains singing or an offering, it is wrong.
- Return the caption line at `start` and at `end` alongside the bounds, and print both in the PR body under the Vimeo link ("Starts: 'Open your Bibles to Colossians 3…' · Ends: '…in Jesus' name, amen.'"). Those two lines let Zach judge the cut from the PR text before pressing play.

Keep `validateBounds` as the hard check; the prompt change is a nudge, not a guarantee.

### 8. Reboots: auto-login stays off (my call)

Zach did not pick, so the default is the safer one: FileVault stays locked and auto-login stays off. The runbook says: after any reboot or macOS update, sign in at the mini once; the runner service comes back with the login. The Sunday health check (Decision 1) is the reminder. If this bites more than once a quarter, flip auto-login on and delete this paragraph.

### Seam for the edit (future design)

`cutSermon()` currently goes `downloadSection()` → upload. The cinematic edit will be a function between them: input `sermon-<date>.mp4`, output the same path, run on the mini. Keep that line of code obvious and don't build the edit here. Assets for that design: the new logo is on the mini's desktop as `cornerstone-logo-display.png` (1714×1022, flat on navy) and as vector `21_CornerstoneChurch_Logo_Final.ai`; the vector is the one to render bumpers from.

## Left to the builder

- Exact runner install commands for the current GitHub runner version (follow the Settings → Actions → Runners → New self-hosted runner page; don't paste a hard-coded tarball URL into docs that will rot. Tell Zach to run the install interactively, with one command per line and no inline comments).
- Whether `actions/checkout` on a self-hosted mac needs `persist-credentials` tweaks for the `git push` inside `publish()` (today it relies on the checkout token; keep that).
- Test fixtures for `parseRecutComment`, `parseTimestamp`, `retireDescription`, and the replacement branch of `cutSermon` (the existing `cut-sermon.test.mjs` injects deps; extend that pattern, don't call Vimeo in tests).
- Whether to post a comment on the PR when the scheduled run finishes too (nice, not required).

## Open question (Zach)

- **Auto-login after reboot.** FileVault is on and auto-login is off, so after a power cut or macOS update the runner stays offline until someone signs in at the mini. Turning auto-login on means anyone with physical access gets into the account, but the runner comes back on its own. Leaving it off keeps the disk locked, and the runbook says "sign in at the mini after a reboot," with the Sunday health check as the reminder. Zach decides; the doc's Offline section is written for whichever he picks.

## Out of scope but noted

- The Oct 25 cut itself still needs recutting once this ships; the first real use of Door A will be that recut. The Oct 26 run chose 0:17:16 → 0:59:09 with high confidence, which is the worship set; the spans used as examples in this doc (42:10–1:19:00) are illustrative, not verified. Find the actual timestamps from the YouTube replay `DszPuPkw1m0`.
- Recutting a sermon that is already merged. Refused for now (Decision 2); a later design could swap the vimeoId on `main` and retire the old upload only after the new one is public.
