---
name: sermon-art
description: Generate the missing sermon art for the open sermon-sync PR through the Artlist connector and push it to the PR branch. Use when a "Sermon archive" PR says "art missing", or when the user says "/sermon-art", "make the sermon art", or "art for the new sermons".
---

# Sermon art for the open archive PR

Art is generated through the Artlist MCP connector (tools `mcp__claude_ai_artlist__*`). If those tools are not available, stop and tell the user to enable the Artlist connector; do not use another image generator.

## Steps

1. Check out the PR branch in this workspace:

   ```bash
   git fetch origin sermon-sync && git checkout sermon-sync && git pull -q origin sermon-sync
   ```

   If the branch does not exist there is no open archive PR; say so and stop.

2. List what is missing:

   ```bash
   node scripts/art-todo.mjs
   ```

   Each job has `file` (where the JPEG goes), `title` (the exact text to render: the series name for a series, else the sermon title), `context` (the sermon descriptions, for the mood), and `promptTemplate` with a `{mood}` placeholder.

3. For every job, write one mood clause in the style of `scripts/sermon-art-jobs.json` (a background scene plus a palette; no people, no text), then call `mcp__claude_ai_artlist__generate_image` with:
   - `modelId`: 1042 (Nano Banana Pro)
   - `prompt`: the `promptTemplate` with `{mood}` replaced
   - `settings`: `{"aspect_ratio": "16:9", "quality": "1K", "num_images": 1}`

   Fire all generate calls first, then poll with one `mcp__claude_ai_artlist__get_generation_status` call passing the array of generationIds. Each image costs about 160 credits.

4. For each finished generation, download `assets[0].assetUrl` and convert:

   ```bash
   curl -sL -o /tmp/art.png "<assetUrl>" && ffmpeg -y -loglevel error -i /tmp/art.png -q:v 4 <file>
   ```

5. Look at every JPEG (Read tool). The title must be spelled exactly and fully visible. About a third of renders duplicate a word or hide letters behind the scene; regenerate those with a nudged mood. Do not commit a misspelled image.

6. Commit and push to the PR branch, then note the result on the PR:

   ```bash
   git add images/sermons && git commit -m "Add sermon art for the archive PR" && git push origin sermon-sync
   gh pr comment --body "Art added for N sermon(s)."
   ```

7. Switch back off the branch when done (`git checkout -`). Report which files were added and how many credits were spent.

## Notes

- Series art is shared: one `series-<slug>.jpg` covers every sermon in that series, so fix series-name inconsistencies in the PR before generating.
- Never overwrite an existing file in `images/sermons/`.
