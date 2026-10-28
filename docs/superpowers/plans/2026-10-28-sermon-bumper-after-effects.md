# Sermon Bumper from After Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each sermon's intro and outro from the adapted "Product Teaser" After Effects template (mountain sunset, drone shot, Degular text reveals, the sermon's own title) headlessly on the Mac mini every Monday, with the synth loop mixed in by ffmpeg, falling back to the ffmpeg bumper when After Effects cannot run.

**Architecture:** A one-time ExtendScript (`scripts/bumper-ae/adapt.jsx`, run inside After Effects through AppleScript `DoScript "$.evalFile(...)"`, never by file alias) turns the template into `~/sermon-bumper/cornerstone-bumper.aep` with two comps, `Intro` and `Outro`, whose text layers read `~/sermon-bumper/sermon.json` through expressions. On Mondays `scripts/sermon-edit.mjs` writes that JSON, runs `aerender` for both comps with a kill timer, and assembles with the existing xfade chain; all bumper clips are silent and the music is a separate input.

**Tech Stack:** After Effects 2026 ExtendScript + `aerender`, Node ESM + `node --test`, ffmpeg (videotoolbox), Swift/CoreText font check.

**Spec:** `docs/superpowers/specs/2026-10-27-sermon-bumper-after-effects-design.md`

## Global Constraints

- Scripts reach After Effects only as inline text: `osascript -e 'tell application "Adobe After Effects 2026" to DoScript "$.evalFile(\"/path.jsx\");"'`. A POSIX-file argument is executed as code and throws a modal "Expected: ;" that blocks everything after it.
- Template comps are 3840×2160 at 25 fps; `Intro` and `Outro` are rendered at half resolution (1920×1080) and set to 30 fps.
- Text slots: Scene_01 words `TextS1_01..04` = title lines (max 4), `TextS1_05` = series, `TextS1_06` = speaker · date. Scene_05 `Logo` comp = logo, `TextS5_01` hidden, `TextS5_02` = `cornerstonechurchma.com`. Scene_04 words `TextS4_01..03` = `JOIN US` / `SUNDAYS` / `10:00AM`, `TextS4_04` = `15 KIBBE RD, EAST LONGMEADOW`, `TextS4_05` = `cornerstonechurchma.com`, `Footage_S4` = drone shot.
- `sermon.json` shape: `{ "lines": [..up to 4..], "size": <px>, "series": "", "subtitle": "PASTOR JOSH ELDRIDGE   ·   OCTOBER 25, 2026", "title": "" }`. Footage item name inside the project is exactly `sermon.json`, absolute path `~/sermon-bumper/sermon.json`.
- Guards before `aerender`: `aerender` exists; Creative Cloud process running; Degular active (CoreText); each render killed after 20 min. Any failure → ffmpeg bumper + one log line `bumper: After Effects skipped (<reason>)`.
- Music: synth loop. Head copy: full through the intro, −18 dB during the 1 s crossfade and the 3 s pre-roll, then 6 s fade to silence. Tail copy: fade-up 3 s before the outro crossfade to −18 dB, full through the outro, fades with the picture.
- No licensed media in the repo. `~/sermon-bumper/` holds `cornerstone-bumper.aep`, `mountain.mp4`, `drone.mov`, `logo.png`, `loop.wav`, `sermon.json`, renders.
- Commit trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; no comments/docstrings.

## Review Focus

1. A title with one very long word (`WONDERFUL,`) must not overflow the frame: `titleLines()` sizes by the longest line. (Task 3 test.)
2. A missing series must not leave an empty slot that shifts the stack: the series layer hides when empty. (Task 1 expression; checked on the preview render.)
3. `aerender` hanging must not block Monday: the kill timer is tested with a fake command. (Task 3 test.)
4. Captions must still align after the new intro length: `leadIn` comes from the actual rendered intro duration via `ffprobe`. (Task 3 test with a fake probe.)
5. The fallback path must produce the same music mix as the AE path: one assembly graph builder, tested once. (Task 3 test.)

---

### Task 1: Adapt the template by script

**Files:**
- Create: `scripts/bumper-ae/adapt.jsx`, `scripts/bumper-ae/run.sh` (copies assets into `~/sermon-bumper`, runs the script through `osascript`, waits for `~/sermon-bumper/adapt.log`)
- Produces: `~/sermon-bumper/cornerstone-bumper.aep`, comps `Intro` (≈10.5 s) and `Outro` (≈8 s), expressions reading `sermon.json`.

- [ ] Step 1: `run.sh` copies the stock clip → `mountain.mp4`, drone → `drone.mov`, the existing keyed `logo.png`, the wav → `loop.wav`, writes a sample `sermon.json`, and opens the converted template in After Effects if not open.
- [ ] Step 2: `adapt.jsx` imports the four files into a `Cornerstone` folder; duplicates `Color` → `Intro`: delete Scene_02/03/04 and their transitions, keep `LightLeack 4`, `Scene_01`, one light leak at the Scene_01→Scene_05 join, move `Scene_05` to start at 3.9 s, trim to 10.5 s, set 30 fps; replace both `BackGround` layers with `mountain.mp4` (scaled to fill) plus a multiply gradient solid. Duplicate `Color` → `Outro` with `Scene_04` (0–4 s) + `Scene_05` (3.6–8 s) over `drone.mov` trimmed to its last 8 s.
- [ ] Step 3: Text wiring. Word comps `TextS1_01..04` resized to 3200×262 with centered text; in `Scene_01` their x is the scene center and y comes from an expression using `lines.length`. Each word's Source Text expression: `var d = footage("sermon.json").sourceData; var i = <index>; (d.lines[i] || "")` with `style.setFontSize(d.size)` guarded in try/catch. `TextS1_05` → `d.series`, opacity 0 when empty. `TextS1_06` → `d.subtitle`. Scene_04 and Scene_05 slots set to the fixed strings. `Logo` comp gets `logo.png` scaled to 1200 wide, centered. `Footage_S4` gets `drone.mov`.
- [ ] Step 4: Save as `~/sermon-bumper/cornerstone-bumper.aep`; write `adapt.log` with comp durations and any expression errors (`layer.property("Source Text").expressionError`).
- [ ] Step 5: Verify: `aerender -comp Intro` and `-comp Outro` with `-RStemplate "Best Settings"` at half resolution (`-s`/`-e` not needed) to `~/sermon-bumper/test-intro.mov` / `test-outro.mov` using `-OMtemplate "High Quality"`; frame sheets viewed; fix and re-run until the title stack, series, subtitle, logo, drone shot and address read correctly. Commit the scripts.

### Task 2: Pure helpers

**Files:** `scripts/sermon-lib.mjs` (+ test)

- [ ] `titleLines(title)` → up to 4 lines, balanced by character count, never splitting a word; `titleSize(lines)` → 143 for longest line ≤ 10 chars, stepping down to 96 at 18+ chars. Tests with "Get Out of the Tube" (→ 3 lines) and "Wonderful, Beautiful, Glorious, Matchless" (→ 4 lines, size ≤ 110).
- [ ] `sermonJson({ title, speaker, date, series })` → the JSON object per Global Constraints. Test.

### Task 3: After Effects path in the editor

**Files:** `scripts/sermon-edit.mjs` (+ test), `scripts/textcard.swift` (add `--has-font <PostScriptName>` mode exiting 0/1)

- [ ] `aeGuards({ exists, ccRunning, hasFont })` pure → `{ ok, reason }`; test.
- [ ] `renderWithTimeout(cmd, args, ms)` → spawns, kills after `ms`, resolves `{ ok, timedOut }`; test with `sleep`.
- [ ] `buildAssembleArgs({ intro, input, outro, output, duration, introLen, outroLen, loop })`: three video inputs silent; audio = loop head + sermon + loop tail with the fades in Global Constraints; `leadIn = introLen - xfade`. Test asserts the fade timings for a 10.5 s intro and the two adelay values.
- [ ] `editSermon`: AE path when guards pass (write `sermon.json`, render `Intro`/`Outro` to `intro.mov`/`outro.mov`, `ffprobe` their lengths), else ffmpeg bumpers (now rendered silent); then one assembly. Log lines per Global Constraints.
- [ ] `--preview` CLI flag: assemble intro + first 30 s of the input + outro, upload unlisted as `Bumper preview <date>`, print the private link (reuse `vimeo.uploadVideo`; retire it afterwards with `retireVideo`).

### Task 4: Docs, preview, recut

- [ ] Setup doc "The bumper" section rewritten for the AE path (assets list, guards, how to re-run `adapt.jsx`, how to check the font); CLAUDE.md one sentence.
- [ ] Preview of Oct 25 rendered on the mini, link to Zach. Then recut through the workflow on this branch; verify PR 24; merge is Zach's call.
