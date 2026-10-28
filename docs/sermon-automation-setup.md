# Sermon archive automation: setup

Four GitHub Actions keep `js/sermons.js` current. Nothing publishes without you: each run opens or updates one PR on the `sermon-sync` branch, and you merge it.

- **Sync sermons** (Mon–Wed 5am ET, or run by hand). Looks at the church's Vimeo library, finds Sunday sermons not yet in the archive, reads the auto-captions, has Claude write the title, scripture, series, topics and description, generates the typographic art, and opens the PR.
- **Cut Sunday sermon** (every hour Monday from about 7am to 2pm ET, plus Tuesday morning, on the Mac mini; or run by hand, or by commenting on the PR). From Oct 4, 2026 onward. Finds Sunday's live replay on YouTube, uses the captions to locate where the sermon starts and ends, downloads and cuts that section, uploads it unlisted to Vimeo with captions, then runs the sync so the PR appears as soon as the cut is done. Once Sunday has a sermon on Vimeo, the later hourly runs do nothing.
- **Check YouTube access** (Sundays about 7am ET, on the Mac mini). Pulls 20 seconds of real video. If it goes red, YouTube has changed something and the Monday cut is at risk; see "If something is off".
- **Publish merged sermons** (on merge). Flips any private Vimeo upload in the merged archive to public.

## One-time setup

### 1. Vimeo token with upload rights

The current token belongs to Josh's personal Vimeo user and can only read. Uploads need a token created while logged in as the **cornerstonechurchma** account.

1. Log in to vimeo.com as the church account.
2. Go to https://developer.vimeo.com/apps and open the existing app, or click Create an app.
3. Under Personal access tokens, click Generate. Check these scopes: Public, Private, Upload, Edit. Copy the token.
4. If Upload is greyed out, click Request upload access on the app page and fill out the short form. Vimeo usually approves within a few business days. The sync workflow works without upload rights; only the cut workflow needs them.
5. Replace the token in `~/grokbot/oasis-creative-studios/cornerstone-church/vimeo-token.rtf`. Never commit it.

Check it (paste one line at a time):

```bash
export VIMEO_TOKEN=paste-the-token-here
curl -s -H "Authorization: bearer $VIMEO_TOKEN" https://api.vimeo.com/oauth/verify
```

The response should show `"scope": "public private upload edit"` and the church's name.

### 2. Anthropic API key

1. Go to https://console.anthropic.com, create an API key, add a few dollars of credit. Each sermon costs roughly 15 to 30 cents.

### 3. Sermon art (one command at review time)

Artlist's login server only accepts clients it has approved, so the workflow cannot generate art on its own. Instead, when the weekly PR appears, open this repo in Conductor (with the Artlist connector enabled) and run:

```
/sermon-art
```

Claude lists the entries missing art, generates each on your Artlist plan (Nano Banana Pro, about 160 credits per image), checks spelling, and pushes the JPEGs to the PR branch. Then merge the PR as usual. Series share one image, so fix any series-name inconsistencies in the PR first.

If `GEMINI_API_KEY` is set to a key with billing enabled, the workflow generates art itself and the command is only needed for retries. The current key is free-tier and does nothing.

### 4. The Mac mini runner (cut workflow only)

YouTube blocks GitHub's own servers, so the cut runs on the Mac mini at home instead. The mini is registered with this repo as a self-hosted runner: GitHub hands it the job, and it does the download and cut over a normal home connection. No YouTube login or cookies are involved.

- It lives in `~/actions-runner` on the mini and runs as a background service for whoever is signed in.
- To see it, open the repo on GitHub, then Settings → Actions → Runners. It is named `sermon-mini` and should say Idle (or Active mid-job). Offline means the mini is off, asleep, or signed out.
- It runs on the mini's own copy of yt-dlp, which is upgraded at the start of every cut.

Control it from a terminal on the mini:

```bash
cd ~/actions-runner
./svc.sh status
./svc.sh stop
./svc.sh start
```

FileVault is on and auto-login is off. After a reboot or a macOS update, sign in at the mini once; the runner comes back with the login. If the mini restarts overnight and nobody signs in, Monday's cut waits. Tuesday's run needs the mini too, so sign in before then; it is the strict run, which turns red if the replay or its captions never showed up.

One manual repo setting protects the mini: Settings → Actions → General → "Require approval for all external contributors". Leave it on so a stranger's pull request can never run code on the mini. The workflows also never use `pull_request` triggers.

The **Check YouTube access** workflow runs every Sunday about 7am ET and pulls 20 seconds of real video, so a YouTube change shows up the day before the cut instead of during it. A green check means Monday should be fine. A red check, or the runner showing Offline, is the signal to look at the mini.

The first fix for any YouTube error (the check turning red, or a cut failing with "Requested format is not available" or a sign-in message) is to upgrade yt-dlp on the mini:

```bash
brew upgrade yt-dlp
```

Then re-run Actions → Check YouTube access → Run workflow. It takes about a minute.

If `YOUTUBE_COOKIES` is ever set again (as a secret passed to the cut step), the cut script still honors it.

### 5. Repo secrets and variables

Paste one line at a time from the repo folder:

```bash
gh secret set VIMEO_TOKEN --body "$VIMEO_TOKEN"
gh secret set ANTHROPIC_API_KEY
```

Variables (only if needed):

- `VIMEO_USER`: leave unset once the token is the church's own. Set to `cornerstonechurchma` while still using Josh's personal token so the sync can list the church's public videos.
- `SERMON_CUT_START`: defaults to `2026-10-04`. Move it later if the agency keeps uploading past that date.

### 6. Let Actions open PRs

Already done for this repo (Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"). If the sync fails with "GitHub Actions is not permitted to create or approve pull requests", re-check that box.

## The bumper (intro and outro)

Every cut gets an open and a close before it goes to Vimeo, rendered from the Artlist "Product Teaser" After Effects template adapted for Cornerstone: the sermon title in big stacked Degular caps over a mountain sunset, the series above it, the speaker and date below, then the Cornerstone logo; at the end, a crossfade to the drone shot of the church with "Join us Sundays 10:00am", the address and the website, then the logo again and a fade to black. The synth-keys loop plays through the intro, drops under Josh for his first few sentences and is gone about six seconds after he starts, then rises again under his last line and carries through the outro. The intro adds about nine seconds before the sermon; captions are shifted to match.

Everything lives in `~/sermon-bumper` on the mini, outside the repo (the template, stock clip, music and font are licensed and must not be published with the site):

- `cornerstone-bumper.aep` — the adapted project with two comps, `Intro` and `Outro`. Built once by `scripts/bumper-ae/adapt.jsx` from the template on the Desktop; re-run that only if the template or logo changes.
- `mountain.mp4`, `drone.mov`, `logo.png`, `loop.wav` — the footage, logo on transparency, and music the project uses.
- `sermon.json`, `intro.mp4`, `outro.mp4`, `render.log` — written fresh on every cut.
- `plate.mp4`, `bed.wav`, `font.ttf`, `textcard` — the older ffmpeg bumper, kept as the fallback.

How a Monday render works: the cutter writes `sermon.json` (title split into up to four lines, series, speaker and date), then runs `scripts/bumper-ae/render.jsx` inside After Effects through AppleScript. That script sets the text on the template's layers and renders both comps through the render queue (the headless renderer cannot read the JSON, so the app itself does the work). After Effects must be installed and left able to launch; the cutter opens it if it is not running and waits up to two minutes for it to answer. Creative Cloud must be signed in and running so the Degular font resolves. If any of that is missing, or the render takes more than twenty minutes, the cut goes out with the ffmpeg bumper instead and the log says `bumper: After Effects skipped (reason)`.

One-time setup on the mini: open After Effects once by hand and click through its first-launch dialogs; in the Creative Cloud app activate the Degular font (Display Bold and Semibold). Never pass a script to After Effects as a file path through AppleScript; always `DoScript "$.evalFile(\"/path.jsx\")"`, or the app shows an error dialog and stops answering until someone clicks it.

To preview the bumper on any sermon without touching the real upload (renders the intro, the first 30 seconds, and the outro, uploads it unlisted and prints the private link):

```bash
export VIMEO_TOKEN=paste-the-token-here
node scripts/sermon-edit.mjs --preview --in sermon.mp4 --title "Get Out of the Tube" --speaker "Pastor Josh Eldridge" --date 2026-10-25 --series "Seek First the Kingdom"
```

To change the look, edit the After Effects project in the app (the text slots are the `TextS1_*`, `TextS4_*` and `TextS5_02` comps; the footage is the `mountain.mp4` and `drone.mov` layers in `Intro` and `Outro`). To change the music timing, edit `MUSIC` in `scripts/sermon-edit.mjs`.

## First run

1. Go to the repo's Actions tab, pick **Sync sermons**, click Run workflow.
2. A PR titled "Sermon archive: N new sermons" appears within a few minutes. Open it, check titles and art, edit anything in the PR, merge.
3. After Oct 4, a PR appears on Monday morning by itself once the cut finishes (it retries every hour until YouTube's captions are ready, and once more Tuesday). Its PR lists the cut timestamps and an unlisted Vimeo link so you can preview the cut before merging. The cut workflow refuses to run while `VIMEO_USER` is set, because that means the token isn't the church's and the upload would land in the wrong library.

## From your phone

The whole Monday flow works from the GitHub app or a phone browser.

1. **The PR arrives.** Sometime Monday morning, a PR titled "Sermon archive: 2026-10-25" (the Sunday's date) shows up. The hourly runs are quiet when there is nothing to do, so no PR yet means the captions are not ready; check back in an hour.
2. **Judge the cut.** The top of the PR has an unlisted Vimeo link. Open it and scrub the start and the end. The PR also shows what the first and last spoken lines are (Starts: and Ends:) and the cut times, so you can check at a glance without watching.
3. **Merge.** If the cut is right, merging publishes the sermon. Art can wait for a computer: a sermon without art still looks fine because its card falls back to the gradient, and only a brand-new series needs art at all (see section 3).

If the cut is wrong (it starts in the worship set, or runs into the closing announcements), recut it **before you merge**. There are two ways in. Try the first, and use the second if Claude on your phone says it does not have permission to run workflows.

**Door A: start the workflow directly.** Ask Claude on your phone to run these, with the Sunday's date and the right times (minutes:seconds into the replay, or hours:minutes:seconds):

```bash
gh workflow run cut-sermon.yml -f date=2026-10-25 -f start=42:10 -f end=1:19:00
gh run watch $(gh run list --workflow=cut-sermon.yml --event workflow_dispatch --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

**Door B: comment on the PR.** Write a comment that begins with `recut` and gives a start and an end:

```bash
gh pr comment 31 --body "recut start 42:10 end 1:19:00"
```

or just type `recut start 42:10 end 1:19:00` in the PR's comment box in the app. Only comments from the repo owner (your account) are accepted. GitHub puts an eyes emoji on your comment right away. If it can't read your comment, it replies with what is missing. Otherwise the mini picks the job up and, when it finishes, posts "Recut done" with the new Vimeo link, or "Recut failed" with the reason. An eyes emoji followed by silence means the mini is offline: sign in at the mini (see section 4).

The date is optional in the comment; it defaults to the PR's Sunday. These all work if you want to name it: `recut Oct 25 start 42:10 end 1:19:00`, `recut 10/25 start 42:10 end 1:19:00`, `recut 2026-10-25 start 42:10 end 1:19:00`. `from` and `to` also work in place of `start` and `end`.

Either door re-cuts from the replay, uploads a new unlisted Vimeo video, retires the old one (it is renamed to start with "Superseded" and made private), and updates the same PR. Open the new Vimeo link, check it, and merge.

Two things learned the hard way: a recut refuses any Sunday that `main` already lists (it reads `origin/main`, not the branch the runner checked out), because retiring a published video takes it off the live site; and Vimeo can hold a finished upload in "uploading" for an hour or more before it starts transcoding, so a cut whose upload looks stuck is usually fine, it just needs time, and the PR will say "processing" until Vimeo catches up.

**Recut only works while the sermon is still an open PR.** Once you merge, the Sunday is published and a recut is refused with "already published on the site". To fix a published sermon, edit it by hand in `js/sermons.js`, or ask Claude to open a fix.

## If something is off

- **No PR by Monday afternoon.** Open Actions → Cut Sunday sermon and read the latest run. "Captions for ... are not ready yet" means YouTube has not produced captions for the replay; the hourly run keeps trying until Tuesday. "No YouTube live replay found" means the Sunday stream was not recorded or titled as usual; run it by hand with the video id (see "Running by hand"). "Already on Vimeo" means that Sunday is already uploaded, either by the cut earlier that morning or by the agency; the later hourly runs stop there and the regular sync handles the PR.
- **Runner shows Offline, or the Sunday check is red.** Go to the mini and sign in (see section 4). If it is signed in and still red, run `brew upgrade yt-dlp` there, then re-run the check.
- **"Recut failed" on a PR.** The comment includes the last line of the log. A time outside 15 to 90 minutes long is refused; fix the times and try again. "Already published" means the PR was merged; see above.
- **Cut works but art or titles look wrong.** Edit titles in the PR as usual; they are separate from the cut. Art is fixed later with `/sermon-art` on a computer.

## Running by hand

Cut a specific Sunday, or override where the sermon starts and ends (`42:10` or `1:19:00`, or plain seconds):

Actions → Cut Sunday sermon → Run workflow → fill in `date`, and optionally `youtube`, `start`, `end`. It runs on the mini like any other cut.

On a laptop, with the same env vars exported (this is where you would be using your own network, so YouTube rarely objects):

```bash
node scripts/sync-sermons.mjs --dry-run
node scripts/cut-sermon.mjs --date 2026-10-04 --dry-run
node scripts/cut-sermon.mjs --date 2026-10-04 --start 42:10 --end 1:19:00 --skip-upload --keep
```

## Notes

- Vimeo auto-captions can take a few hours after upload. A sermon without captions is skipped and picked up on the next run; the PR body lists it under "Waiting on captions".
- If both the agency and the cut workflow upload the same Sunday, only one entry is created (matched by sermon date).
- The cut refuses to upload if the detected sermon is shorter than 15 minutes or longer than 90.
