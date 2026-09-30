# Sermon archive automation: setup

Two GitHub Actions keep `js/sermons.js` current. Nothing publishes without you: each run opens or updates one PR on the `sermon-sync` branch, and you merge it.

- **Sync sermons** (Mon–Wed 5am ET, or run by hand). Looks at the church's Vimeo library, finds Sunday sermons not yet in the archive, reads the auto-captions, has Claude write the title, scripture, series, topics and description, generates the typographic art, and opens the PR.
- **Cut Sunday sermon** (Mon 6am ET, or run by hand). From Oct 4, 2026 onward. Finds Sunday's live replay on YouTube, uses the captions to locate where the sermon starts and ends, downloads and cuts that section, uploads it privately to Vimeo with captions, then runs the sync so the PR appears the same morning.
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

### 4. YouTube cookies (cut workflow only)

YouTube blocks anonymous video downloads from servers. A logged-in cookie file works. Export it from Chrome while signed in to the channel's Google account:

```bash
yt-dlp --cookies-from-browser chrome --cookies /tmp/yt-cookies.txt --skip-download "https://www.youtube.com/watch?v=TD_nPXueeeo"
grep -E "^#|youtube\.com|google\.com" /tmp/yt-cookies.txt > /tmp/yt-cookies-small.txt
```

The second line keeps only YouTube and Google cookies; the full Chrome export is too large for a GitHub secret (48 KB limit).

Cookies last weeks to months. If the cut workflow starts failing with "Sign in to confirm you're not a bot" or 403, export again and update the secret.

### 5. Repo secrets and variables

Paste one line at a time from the repo folder:

```bash
gh secret set VIMEO_TOKEN --body "$VIMEO_TOKEN"
gh secret set ANTHROPIC_API_KEY
gh secret set YOUTUBE_COOKIES < /tmp/yt-cookies-small.txt
rm /tmp/yt-cookies.txt /tmp/yt-cookies-small.txt
```

Variables (only if needed):

- `VIMEO_USER`: leave unset once the token is the church's own. Set to `cornerstonechurchma` while still using Josh's personal token so the sync can list the church's public videos.
- `SERMON_CUT_START`: defaults to `2026-10-04`. Move it later if the agency keeps uploading past that date.

### 6. Let Actions open PRs

Already done for this repo (Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"). If the sync fails with "GitHub Actions is not permitted to create or approve pull requests", re-check that box.

## First run

1. Go to the repo's Actions tab, pick **Sync sermons**, click Run workflow.
2. A PR titled "Sermon archive: N new sermons" appears within a few minutes. Open it, check titles and art, edit anything in the PR, merge.
3. After Oct 4, watch for the Monday **Cut Sunday sermon** run (it retries Tuesday if YouTube's captions weren't ready). Its PR lists the cut timestamps and an unlisted Vimeo link so you can preview the cut before merging. The cut workflow refuses to run while `VIMEO_USER` is set, because that means the token isn't the church's and the upload would land in the wrong library.

## Running by hand

Cut a specific Sunday, or override where the sermon starts and ends (seconds into the replay):

Actions → Cut Sunday sermon → Run workflow → fill in `date`, and optionally `youtube`, `start`, `end`.

Locally, with the same env vars exported:

```bash
node scripts/sync-sermons.mjs --dry-run
node scripts/cut-sermon.mjs --date 2026-10-04 --dry-run
node scripts/cut-sermon.mjs --date 2026-10-04 --start 2710 --end 5150 --skip-upload --keep
```

## Notes

- Vimeo auto-captions can take a few hours after upload. A sermon without captions is skipped and picked up on the next run; the PR body lists it under "Waiting on captions".
- If both the agency and the cut workflow upload the same Sunday, only one entry is created (matched by sermon date).
- The cut refuses to upload if the detected sermon is shorter than 15 minutes or longer than 90.
