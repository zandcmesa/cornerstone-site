# Sermon bumper from the After Effects template: design

Date: 2026-10-27. Status: reviewed; awaiting Zach's go and two one-time actions on the mini. Supersedes the ffmpeg-only bumper that shipped earlier today (`scripts/sermon-edit.mjs`); that code stays as the fallback.

## Intent

Josh loves mountain scenery and Zach loves the motion of Artlist's "Product Teaser" After Effects template (by US3R). Every Sunday cut should open with that template's big text reveals and animation feel, over a mountain-sunset stock clip, with the Cornerstone logo and the sermon's own title, speaker and date animated inside the render. It should close over the church's drone shot with the address and service time. A synth-keys loop Zach picked plays through the intro, lingers under Josh's first words instead of cutting out, and swells back in for the outro. All of this must keep running unattended on the Mac mini every Monday.

## Goals

- Intro and outro rendered from the adapted After Effects project, in the template's style and font (Degular).
- The per-sermon text (series, title, speaker, date) is inside the After Effects render, not overlaid afterwards.
- Monday stays automatic: the cutter writes the sermon's text to a small data file, the headless renderer (`aerender`) renders the intro and outro, ffmpeg assembles. No one opens After Effects.
- Music: runs through the intro, keeps playing quietly for about six seconds after Josh starts, then is gone. Rises under Josh's last sentence and carries through the outro to black.
- If After Effects is unavailable, hangs, or the Degular font is not active, the cut still goes out with the existing ffmpeg bumper, with a clear log line. Unattended Mondays never wait on After Effects: the render is killed after 20 minutes.

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
2. 1.0–4.5 s: the template's text-reveal scene plays the sermon title. The title layer becomes a paragraph text box (text animators do not wrap point text) with a font-size expression that steps down for long titles, so "Wonderful, Beautiful, Glorious, Matchless" fits on two lines. Series name above in small tracked caps if the sermon has one.
3. 4.0–7.5 s: speaker and date reveal in the same style, smaller, replacing the title (template's second text scene), or stacked under it if the scene supports two lines. Builder's call after inspecting the scenes.
4. 7.0–10.5 s: the logo scene: the Cornerstone stacked logo animates in where the template's circle "LOGO" placeholder is; the template's tagline slot carries "cornerstonechurchma.com" or is hidden. Holds ~2 s, then the whole intro crossfades into Josh over 1 s.

**Outro (target 8 s)**

1. Crossfade (1 s) from Josh's last frame into the drone shot, starting near the end of its descent so the building is close and centered. Same dark gradient.
2. Logo scene again, then the address block in the text style: "15 Kibbe Rd, East Longmeadow" / "Sundays 10:00am" / "cornerstonechurchma.com".
3. Fade to black over the last 1.2 s.

Exact in/out points, scene choice and layout are the builder's after reading the project structure (see "Left to the builder"); the sequence above is the brief.

### 2. Text comes from a JSON file, not a script, on Mondays

After Effects can import a `.json` as footage, and text layers can read it in expressions: `footage("sermon.json").sourceData.title`. The adapted project's four text layers (series, title, speaker, date) use that. The cutter writes `~/sermon-bumper/sermon.json` with `{ "series", "title", "speaker", "date" }` (date already formatted "October 25, 2026") and then runs `aerender` on the two comps. After Effects never needs to open with its UI on a Monday. `aerender` is the headless Render Engine shipped with After Effects 2026 at `/Applications/Adobe After Effects 2026/aerender`; it answered `-version` on the mini.

Render settings: comps `Intro` and `Outro`, ProRes 422 or H.264 at 1080p30 with audio off (music is mixed in ffmpeg). Builder picks the output module that `aerender` has available non-interactively; a QuickTime ProRes `.mov` is the safe default. The JSON is read when the project loads, so every render is a fresh `aerender` process (never a reused session), the footage item keeps the exact name `sermon.json`, and the project links to it by absolute path inside `~/sermon-bumper/`.

Guards before rendering, each falling back to the ffmpeg bumper with one log line: Creative Cloud must be running (Adobe Fonts only resolve while it is signed in and running), Degular must be active (checked with a CoreText lookup from `textcard`, which already links CoreText), and `aerender` is run with a 20-minute kill timer. The builder also checks whether After Effects 2026 still honors the render-only node file (`~/Documents/ae_render_only_node.txt`), which lets `aerender` run without a sign-in; fonts still need Creative Cloud either way.

### 3. Assembly and music stay in ffmpeg, one music path for both bumpers

`scripts/sermon-edit.mjs` gets a second path: if `~/sermon-bumper/intro.mov` and `outro.mov` were just rendered for this sermon, assemble those; otherwise render the current plate/logo/card bumpers. Both kinds of bumper clip are now silent; the music is a separate input mixed at assembly, so the fallback sounds the same as the After Effects version. Music (the synth loop, one copy at the head and one at the tail):

- Intro: full level from 0 s through the intro. During the 1-second crossfade it drops to about −18 dB under the sermon audio and holds there through the 3-second pre-roll before Josh's first words (the cut starts `PAD_BEFORE` seconds early). From Josh's first words it fades to silence over 6 s. So it is gone about 6 s after he starts speaking, which is the "slow fade as the sermon starts" Zach asked for.
- Outro: fades up over 3 s to −18 dB starting 3 s before the outro crossfade, rises to full as the picture crossfades into the outro, holds, and fades with the picture to black.
- `leadIn` is still the intro's length minus the crossfade, so captions shift correctly.

### 4. Degular font

The template is set in Degular, an Adobe Fonts family. It must be activated on the mini through the Creative Cloud app (Zach, one time; see "Open items"). The builder verifies with a render: if `aerender` substitutes the font, the render still completes but looks wrong, so the setup doc says how to check (a frame from the intro next to the template's tutorial frames).

### 5. One-time After Effects work is scripted, not clicked

The adaptation of the template (import footage, replace the background, place the logo, wire the JSON expressions, set colors, save as `cornerstone-bumper.aep`) is done by an ExtendScript (`scripts/bumper-ae/adapt.jsx`) run once in After Effects, so it is repeatable and reviewable. Running it needs After Effects to open normally on the mini once (see "Open items"). After that, the saved project is the artifact; the script is kept for re-running if the template or logo changes.

### 6. First use and go-live order

1. A preview command renders the intro, 30 seconds of the Oct 25 sermon, and the outro, uploads it unlisted to Vimeo as "Bumper preview" (retired afterwards), and prints the link. Zach looks at it on his phone before anything replaces the real cut.
2. Then re-render Oct 25 through the normal recut door (`workflow_dispatch` on this branch with the same bounds), which replaces the current Vimeo upload and refreshes PR 24.
3. Only after that works does the branch merge to `main`. If it is not merged by Monday Nov 2, that Monday simply runs the ffmpeg bumper already on `main`. Nothing unproven ships to the automatic path.

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
