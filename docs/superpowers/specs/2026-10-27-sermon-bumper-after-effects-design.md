# Sermon bumper from the After Effects template: design

Date: 2026-10-27. Status: draft for builder check. Supersedes the ffmpeg-only bumper that shipped earlier today (`scripts/sermon-edit.mjs`); that code stays as the fallback.

## Intent

Josh loves mountain scenery and Zach loves the motion of Artlist's "Product Teaser" After Effects template (by US3R). Every Sunday cut should open with that template's big text reveals and animation feel, over a mountain-sunset stock clip, with the Cornerstone logo and the sermon's own title, speaker and date animated inside the render. It should close over the church's drone shot with the address and service time. A synth-keys loop Zach picked plays through the intro, lingers under Josh's first words instead of cutting out, and swells back in for the outro. All of this must keep running unattended on the Mac mini every Monday.

## Goals

- Intro and outro rendered from the adapted After Effects project, in the template's style and font (Degular).
- The per-sermon text (series, title, speaker, date) is inside the After Effects render, not overlaid afterwards.
- Monday stays automatic: the cutter writes the sermon's text to a small data file, the headless renderer (`aerender`) renders the intro and outro, ffmpeg assembles. No one opens After Effects.
- Music: runs through the intro, keeps playing quietly for about six seconds after Josh starts, then is gone. Rises under Josh's last sentence and carries through the outro to black.
- If After Effects is unavailable or fails, the cut still goes out with the existing ffmpeg bumper, with a clear log line.

## Non-goals

- Re-cutting old sermons. Only Oct 25 gets re-rendered as the first use.
- A Visit page video. The drone shot is used only as the outro background here.
- Editing the template's animation curves. We use its scenes as designed; we change content, colors, footage, and timing of the assembled sequence.

## Anti-goals

- A render that needs a person at the mini on Monday (a dialog, a sign-in, a font prompt).
- Committing licensed media (the Artlist stock clip, music, template, Degular) to the public repo.

## Assets (all on the mini, outside the repo)

Source folder: `~/Desktop/visit-media/`

- `1003081_Product Teaser_By_US3R_Artlist/After Effects/Product Teaser.aep`: the template. Scenes include large condensed text reveals with blur/position text animators, product panels, and a logo scene (circle mark, tagline, URL) with a color control. Footage folder holds only a grain overlay. Font: Degular (Adobe Fonts).
- `6266229_Mountains Forest Road Sunset_By_Clever_Stock_Studio_Artlist_HD.mp4`: 1920×1012, 29.97 fps, 19.5 s. Warm orange sunset over forested hills, slow drift.
- `cornerstone-drone-1.mov`: 3840×2160, 30 fps, 22 s, descending drone move toward the church entrance.
- `Artlist Original - Synth Keys Loops - Relaxing Melody.wav`: 20.9 s loop.
- `21_CornerstoneChurch_Logo_Final.ai`: four artboards; the stacked lockup with the blue ring and white C (artboard 2) is the one to use, on transparency.

Working folder for the pipeline: `~/sermon-bumper/` (already used by the ffmpeg bumper). The adapted project is saved there as `cornerstone-bumper.aep` with its footage copied alongside, so the project never points at the Desktop.

## Decisions

### 1. Sequence

**Intro (target 10–11 s, 1920×1080, 30 fps)**

1. 0.0–1.2 s: black fades up to the mountain sunset. The clip is scaled to fill 1080 (1920×1012 → ~1.07×, a 3% crop is fine) and placed under a subtle dark gradient (top-left to bottom, black at ~45% opacity) so white type reads. Keep the warm colors; the brand blue appears only in the logo ring.
2. 1.0–4.5 s: the template's text-reveal scene plays the sermon title. Long titles wrap to two lines; the template's text animator handles the reveal. Series name above in small tracked caps if the sermon has one.
3. 4.0–7.5 s: speaker and date reveal in the same style, smaller, replacing the title (template's second text scene), or stacked under it if the scene supports two lines. Builder's call after inspecting the scenes.
4. 7.0–10.5 s: the logo scene: the Cornerstone stacked logo animates in where the template's circle "LOGO" placeholder is; the template's tagline slot carries "cornerstonechurchma.com" or is hidden. Holds ~2 s, then the whole intro crossfades into Josh over 1 s.

**Outro (target 8 s)**

1. Crossfade (1 s) from Josh's last frame into the drone shot, starting near the end of its descent so the building is close and centered. Same dark gradient.
2. Logo scene again, then the address block in the text style: "15 Kibbe Rd, East Longmeadow" / "Sundays 10:00am" / "cornerstonechurchma.com".
3. Fade to black over the last 1.2 s.

Exact in/out points, scene choice and layout are the builder's after reading the project structure (see "Left to the builder"); the sequence above is the brief.

### 2. Text comes from a JSON file, not a script, on Mondays

After Effects can import a `.json` as footage, and text layers can read it in expressions: `footage("sermon.json").sourceData.title`. The adapted project's four text layers (series, title, speaker, date) use that. The cutter writes `~/sermon-bumper/sermon.json` with `{ "series", "title", "speaker", "date" }` (date already formatted "October 25, 2026") and then runs `aerender` on the two comps. After Effects never needs to open with its UI on a Monday. `aerender` is the headless Render Engine shipped with After Effects 2026 at `/Applications/Adobe After Effects 2026/aerender`; it answered `-version` on the mini.

Render settings: comps `Intro` and `Outro`, ProRes 422 or H.264 at 1080p30 with audio off (music is mixed in ffmpeg). Builder picks the output module that `aerender` has available non-interactively; a QuickTime ProRes `.mov` is the safe default.

### 3. Assembly and music stay in ffmpeg

`scripts/sermon-edit.mjs` gets a second path: if `~/sermon-bumper/intro.mov` and `outro.mov` were just rendered for this sermon, assemble those; otherwise fall back to the current plate/logo/card bumpers. The assembly is the existing xfade chain. Music changes:

- Intro bed: the synth loop from 0 s, full through the intro, then a 6-second fade starting at the moment Josh's picture is fully in (lead-in + 0 s), so the music is gone 6 s into the sermon. Level under speech: about −18 dB relative to the sermon.
- Outro bed: the loop fades up over 3 s starting 3 s before the outro crossfade, holds under the outro, and fades with the picture.
- `leadIn` becomes the intro's length minus the crossfade, as today, so captions still shift correctly.

### 4. Degular font

The template is set in Degular, an Adobe Fonts family. It must be activated on the mini through the Creative Cloud app (Zach, one time; see "Open items"). The builder verifies with a render: if `aerender` substitutes the font, the render still completes but looks wrong, so the setup doc says how to check (a frame from the intro next to the template's tutorial frames).

### 5. One-time After Effects work is scripted, not clicked

The adaptation of the template (import footage, replace the background, place the logo, wire the JSON expressions, set colors, save as `cornerstone-bumper.aep`) is done by an ExtendScript (`scripts/bumper-ae/adapt.jsx`) run once in After Effects, so it is repeatable and reviewable. Running it needs After Effects to open normally on the mini once (see "Open items"). After that, the saved project is the artifact; the script is kept for re-running if the template or logo changes.

### 6. First use

Re-render Oct 25 through the normal recut door (`workflow_dispatch` with the same bounds), which replaces the current Vimeo upload and refreshes PR 24. Zach reviews on his phone as before.

## Open items

- **After Effects on the mini is stuck on a first-launch dialog.** Launching it (with UI or headless) sits idle and never finishes initializing; scripts cannot run. Zach needs to screen-share into the mini once, open After Effects, click through whatever it shows (sign-in, welcome, permissions, missing fonts), and quit. Until then the builder can only prepare scripts.
- **Degular activation** in Creative Cloud on the mini, same session.
- Whether the Creative Cloud license on the mini is Zach's personal account. `aerender` needs a signed-in Creative Cloud; if the sign-in expires, Monday falls back to the ffmpeg bumper and the log says so.

## Left to the builder

- Reading the project structure (a recon script already exists at `/tmp/ae/recon.jsx`; move it into `scripts/bumper-ae/`) and choosing which template comps map to the three intro beats and the outro.
- Final durations within the targets above, gradient strength, and type sizes.
- How the logo is placed into the template's circle scene (replace the placeholder layer's source with the keyed PNG at ~800 px wide; remove the circle if it fights the ring in the logo).
- The `aerender` output module and codec.
- Tests: pure helpers for the JSON writer and the new assembly timing get `node --test` coverage as before; rendering is verified by the Oct 25 run.
