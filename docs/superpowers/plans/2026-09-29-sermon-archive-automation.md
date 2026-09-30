# Sermon Archive Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `SERMON_DATA` current with no manual work: new Vimeo sermons become reviewed PRs (Stage A), and from Oct 4, 2026 the Sunday YouTube live replay is cut to just the sermon and uploaded to Vimeo automatically (Stage B).

**Architecture:** Plain Node ESM scripts under `scripts/` (same style as the Planning Center sync) driven by three GitHub Actions workflows. Stage A lists Vimeo videos, derives each sermon's date, pulls the Vimeo auto-caption transcript, extracts metadata with the Claude API, generates typographic art with Gemini, and force-pushes a single `sermon-sync` branch with one open PR. Stage B finds the Sunday replay on YouTube, uses the timed auto-captions plus Claude to find the sermon start and end, downloads only that section with yt-dlp, uploads it privately to Vimeo (with the sermon transcript as a caption track), then runs Stage A's sync so the PR appears the same morning. A post-merge workflow flips private Vimeo uploads public.

**Tech Stack:** Node 20+ ESM, `@anthropic-ai/sdk` (only npm dependency), Vimeo API v3 (tus upload), yt-dlp + ffmpeg on the runner, Gemini `gemini-3-pro-image` REST, `gh` CLI for PRs. Tests with `node --test`.

**Spec:** `docs/decisions.md` → "Sermon archive automation (2026-09-29)".

## Global Constraints

- Nothing publishes without review: every archive change lands as a PR on branch `sermon-sync`; Stage B uploads with `privacy.view: "nobody"` until merge.
- Stage B only acts on Sundays on or after `2026-10-04` (repo variable `SERMON_CUT_START`, default that date).
- Dedupe by sermon date. A video for a date already in `origin/main`'s archive is ignored. Stage B skips a Sunday that already has a Vimeo video.
- Never commit tokens. Vimeo token, Anthropic key, Gemini key are repo secrets `VIMEO_TOKEN`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.
- Claude model: `claude-opus-5-5`, `output_config.effort: "high"`, structured JSON via `output_config.format`.
- All dates are `America/New_York`.
- Entry shape and key order must match existing `SERMON_DATA` rows: `id, title, date, speaker, series, scripture, scriptureBook, topics, description, vimeoId`.
- Art filename follows `sermonArt(s)`: `series-<slug>.jpg` for a series, `<id>.jpg` otherwise. Existing files are never overwritten.

## Review Focus

- A Vimeo video with a non-sermon title (e.g. "Christmas Eve 2026") has no derivable date; it must be skipped, never crash the run. Test in Task 1 (`sermonDateFromVideo` returns null).
- Vimeo captions can lag a new upload by hours; a video without a text track is skipped this run and picked up later, and the run still processes other videos. Test in Task 5 (sync loop continues after a null transcript).
- Two Vimeo videos for the same Sunday (agency + Stage B both upload) must produce one entry. Test in Task 1 (`pickCandidates` dedupes by date, preferring the one already drafted).
- The transcript-based cut can return nonsense (end before start, or a 5-minute "sermon"). Stage B must refuse to upload when the span is under 15 minutes or over 90, and report it in the run log. Test in Task 6 (`validateBounds`).
- Force-pushing `sermon-sync` must preserve entries Zand already edited in the open PR. Test in Task 5 (drafted entries are reused verbatim from `origin/sermon-sync`).

---

### Task 1: Pure helpers — `scripts/sermon-lib.mjs`

**Files:**
- Create: `package.json` (`"type": "module"`, `"scripts": {"test": "node --test 'scripts/*.test.mjs'"}`, dependency `@anthropic-ai/sdk`)
- Create: `scripts/sermon-lib.mjs`
- Test: `scripts/sermon-lib.test.mjs`
- Fixtures: `scripts/fixtures/vimeo-captions.vtt`, `scripts/fixtures/youtube-captions.json3`

**Produces:**
- `parseArchive(src) → { entries: [{id, date, vimeoId, series, speaker, line}], maxId, insertAt }` — regex over `js/sermons.js` source; `line` is the raw row text; `insertAt` is the index right after `const SERMON_DATA = [`.
- `sermonDateFromVideo({name, description, created_time}) → 'YYYY-MM-DD' | null` — `Sunday Sermon MM-DD-YYYY` in name, else `Sermon date: YYYY-MM-DD` in description, else null.
- `vttToText(vtt) → string` — strip WEBVTT header, cue timings, tags, dedupe consecutive repeats.
- `json3ToTimed(json) → [{t: seconds, text}]` and `formatTimed(segments) → string` as `[H:MM:SS] text` lines, merged into ~15-second chunks.
- `buildEntryLine({id, title, date, speaker, series, scripture, scriptureBook, topics, description, vimeoId}) → string` — one row in the existing style, JSON-escaped strings, two-space indent, trailing comma.
- `insertEntries(src, lines) → string` — inserts lines after `insertAt`, newest first.
- `pickCandidates(videos, archive, drafts) → [{vimeoId, date, name, description}]` — videos with a date, not in archive by id or date, one per date (prefer a draft's vimeoId), sorted oldest first.
- `previousSunday(date = now, tz = 'America/New_York') → 'YYYY-MM-DD'`.
- `artFile(entry) → 'images/sermons/<series-slug or id>.jpg'` — mirrors `sermonArt`.
- `validateBounds({start, end}) → {ok, reason}` — ok when `end - start` is between 900 and 5400 seconds.

- [ ] Write failing tests for each function (real `js/sermons.js` for `parseArchive`, fixture VTT with duplicate cues, fixture json3 with two events, a video list containing a Christmas Eve title and two videos on one date).
- [ ] Run `npm test`, confirm failures are "not exported".
- [ ] Implement `scripts/sermon-lib.mjs`.
- [ ] Run `npm test`, all pass.
- [ ] Commit: `Add sermon archive helpers`.

### Task 2: Vimeo client — `scripts/vimeo.mjs`

**Consumes:** `VIMEO_TOKEN` env.
**Produces:**
- `listVideos({perPage = 50, pages = 2}) → [{vimeoId, name, description, created_time, duration, privacy}]` via `GET /me/videos?sort=date&direction=desc&fields=uri,name,description,created_time,duration,privacy.view`.
- `getTranscript(vimeoId) → string | null` — `GET /videos/{id}/texttracks`, pick active English track, fetch `link`, `vttToText`.
- `uploadVideo({filePath, name, description, privacy}) → vimeoId` — `POST /me/videos` with `upload.approach: "tus"` and `upload.size`, then PATCH `upload.upload_link` in 64 MB chunks with `Tus-Resumable: 1.0.0`, `Upload-Offset`, `Content-Type: application/offset+octet-stream`; verify with HEAD until `Upload-Offset === size`.
- `uploadTextTrack(vimeoId, vttString)` — `POST /videos/{id}/texttracks {type:"captions", language:"en", name:"English"}`, PUT body to returned `link`, then `PATCH` `active: true`.
- `setPrivacy(vimeoId, view)` — `PATCH /videos/{id} {privacy:{view}}`.

- [ ] Write tests for the pure request builders (chunk ranges for a 150 MB file → 3 chunks; texttrack selection prefers `en` over `en-x-autogen` when both active).
- [ ] Implement with `fetch`; every non-2xx throws with status and body.
- [ ] Live check (read-only): `node -e` list first 3 videos and fetch the transcript for `1230963153`; confirm text length > 10,000 chars.
- [ ] Commit: `Add Vimeo API client`.

### Task 3: Claude extraction — `scripts/sermon-ai.mjs`

**Consumes:** `ANTHROPIC_API_KEY` env, `@anthropic-ai/sdk`.
**Produces:**
- `extractMetadata(transcript, {date, knownSeries, knownSpeakers, examples}) → {title, speaker, series, scripture, scriptureBook, topics, description, artMood}` — `client.messages.create` with `output_config: {format: {type: "json_schema", schema}, effort: "high"}`, `max_tokens: 4000`. System prompt: house style from three existing rows; `series` must be an existing name or a new explicit series named in the sermon, else null; speaker from `knownSpeakers` unless the transcript introduces a guest by name; `artMood` is one sentence in the style of `scripts/sermon-art-jobs.json` moods.
- `findSermonBounds(timedTranscript) → {start, end, confidence, note}` — seconds; start = preacher begins the message (after announcements, offering, worship, kids dismissal), end = final words of the message before any closing song, response, or benediction music.
- `buildMetadataPrompt(...)` and `buildBoundsPrompt(...)` exported for tests.

- [ ] Write tests for both prompt builders (contain the date, the known series list, and the JSON keys).
- [ ] Implement; check `stop_reason === "refusal"` and throw a clear error.
- [ ] `npm test`.
- [ ] Commit: `Add Claude sermon metadata and cut-point extraction`.

### Task 4: Art — `scripts/sermon-art.mjs`

**Consumes:** `GEMINI_API_KEY` env, ffmpeg on PATH.
**Produces:** `generateArt({title, mood, outJpg}) → outJpg` — port of `scripts/gen-art.py`: same STYLE prompt, `gemini-3-pro-image`, `aspectRatio 16:9`, `imageSize 1K`; write PNG, convert with `ffmpeg -y -i in.png -q:v 4 out.jpg`, delete PNG. Skips when `outJpg` already exists.

- [ ] Test: `buildArtPrompt(title, mood)` contains the exact title in quotes and the mood.
- [ ] Implement.
- [ ] Live check with the local key from `~/.claude.json`: generate to `/tmp/art-test.jpg`, open and eyeball spelling.
- [ ] Commit: `Add Gemini sermon art generator`.

### Task 5: Stage A — `scripts/sync-sermons.mjs` + workflow

**Files:**
- Create: `scripts/sync-sermons.mjs`, `.github/workflows/sync-sermons.yml`
- Modify: `js/sermons.js` `loadSermons()` → sort a copy of `SERMON_DATA` by date desc so merge order never matters.

**Algorithm (`syncSermons({dryRun, limit})`, also exported for Stage B):**
1. `git fetch origin main sermon-sync` (ignore missing branch). `base = parseArchive(show origin/main:js/sermons.js)`; `drafts = parseArchive(show origin/sermon-sync:js/sermons.js)` or empty.
2. `videos = listVideos()`; `candidates = pickCandidates(videos, base, drafts)`.
3. For each candidate oldest first: if `drafts` has its vimeoId, reuse `line` and `git show origin/sermon-sync:<artFile>`; else `transcript = getTranscript()`; skip with log if null; `meta = extractMetadata()`; `id = nextId++`; `generateArt` unless the art file exists in main; `line = buildEntryLine()`.
4. No lines → exit 0 with "Archive is current".
5. Not dry run: `git checkout -B sermon-sync origin/main`, write `js/sermons.js` via `insertEntries`, write art, commit `Add N sermon(s) to the archive`, `git push --force origin sermon-sync`, `gh pr create` if `gh pr list --head sermon-sync` is empty; PR body lists date, title, speaker, Vimeo link, and cut info per entry.
6. Dry run prints the lines and stops before step 5.

**Workflow:** cron `0 9 * * 1-3` (5am ET Mon–Wed) plus `workflow_dispatch`; `permissions: contents: write, pull-requests: write`; `npm ci`; `sudo apt-get install -y ffmpeg`; env from secrets.

- [ ] Test `syncSermons` in dry-run with injected fakes (`deps` param: `listVideos`, `getTranscript`, `extractMetadata`, `generateArt`, `git`): one draft reused verbatim, one new video, one video with null transcript skipped, one non-sermon title ignored → exactly two lines, Claude called once.
- [ ] Implement.
- [ ] `npm test`; run `node scripts/sync-sermons.mjs --dry-run --limit 1` live against Vimeo (Claude step requires the key; if unavailable, stop at transcript and print it).
- [ ] Commit: `Add Vimeo sermon sync and PR workflow`.

### Task 6: Stage B — `scripts/cut-sermon.mjs` + workflow

**Files:** `scripts/cut-sermon.mjs`, `.github/workflows/cut-sermon.yml`

**Algorithm (`--date`, `--youtube`, `--start`, `--end`, `--dry-run`, `--keep`):**
1. `date = --date || previousSunday()`; exit if `date < SERMON_CUT_START`.
2. If any Vimeo video maps to `date` → exit "already on Vimeo".
3. Find replay: `yt-dlp --flat-playlist --print id <channel>/streams --playlist-end 8`, then `yt-dlp --print release_timestamp` per id until one falls on `date` in New York; exit if none.
4. `yt-dlp --skip-download --write-auto-subs --sub-lang en-orig --sub-format json3` → `json3ToTimed` → `formatTimed`.
5. `bounds = --start/--end || findSermonBounds()`; `validateBounds` or exit 1 with reason.
6. `yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --download-sections "*{start-3}-{end+2}" -o sermon.mp4`.
7. Build sermon-only transcript text (segments within bounds) and a VTT with times rebased to the cut.
8. `meta = extractMetadata(sermonTranscript)`; `vimeoId = uploadVideo({name: meta.title, description: "<speaker> · <scripture>\n\n<description>\n\nSermon date: <date>\nSource: youtube.com/watch?v=<id> (<start>–<end>)", privacy: {view:"nobody", embed:"public"}})`; `uploadTextTrack`.
9. Call `syncSermons({transcriptOverride: {[vimeoId]: sermonTranscript}, metaOverride: {[vimeoId]: meta}})` so the PR opens now rather than after Vimeo captions.
10. `--dry-run` stops after step 5 and prints bounds; `--keep` leaves `sermon.mp4` on disk.

**Workflow:** cron `0 10 * * 1` (6am ET Monday) plus `workflow_dispatch` with inputs `date`, `youtube`, `start`, `end`; `pip install yt-dlp`; ffmpeg; 90-minute timeout.

- [ ] Tests: `rebaseVtt(segments, start, end)` output starts at `00:00:00.000`; `findReplay` picks the id whose release date is the target Sunday from a fake list.
- [ ] Implement.
- [ ] Live dry run on Sep 27: `node scripts/cut-sermon.mjs --date 2026-09-27 --dry-run` (with `--start/--end` manual bounds if no Anthropic key). Confirm captions fetch and bounds print. Then `--keep --skip-upload` to produce a local cut of ~1 minute (`--start 3600 --end 3660`) and check it plays.
- [ ] Commit: `Add YouTube sermon cut and Vimeo upload`.

### Task 7: Publish after merge — `scripts/publish-sermons.mjs` + workflow

- `listVideos()` → those with `privacy.view === "nobody"` whose vimeoId is in `origin/main` archive → `setPrivacy(id, "anybody")`.
- Workflow on `push` to `main` with `paths: js/sermons.js`.
- [ ] Test the filter function with fakes.
- [ ] Implement, commit: `Publish Vimeo uploads when the archive PR merges`.

### Task 8: Setup docs, repo settings, CLAUDE.md, memory

- [ ] `docs/sermon-automation-setup.md`: regenerate Vimeo token with `public private upload edit` (developer.vimeo.com → the app → Personal access tokens; request Upload Access if the app shows it disabled), add `VIMEO_TOKEN`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` secrets, optional `SERMON_CUT_START` variable, run "Sync sermons" via workflow_dispatch, review PR. One command per line, no inline comments.
- [ ] Enable Actions PR creation: `gh api -X PUT repos/zandcmesa/cornerstone-site/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true`.
- [ ] Add `GEMINI_API_KEY` secret from the local nanobanana config (`gh secret set`).
- [ ] Update CLAUDE.md "Adding more sermon data" section to describe the automation and the token path.
- [ ] Save memory: token path, Vimeo account facts, Oct 4 cutover.
- [ ] `npm test`, commit, push branch, open PR.
