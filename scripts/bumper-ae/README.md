# Bumper After Effects scripts

- `adapt.jsx` — one-time: turns the Artlist "Product Teaser" template (open it in After Effects first) into `~/sermon-bumper/cornerstone-bumper.aep`: imports the mountain and drone clips, the logo and `sermon.json`, builds the `Intro` and `Outro` comps, wires the text slots, swaps the social icons (via `icons.jsx`), and saves.
- `icons.jsx` — replaces the template's three social marks with Facebook, Instagram and YouTube from `~/sermon-bumper/icons/*.png` (white marks on transparency, 512 px; made from the SVGs in `icons/` with QuickLook + ffmpeg alphamerge). `icons/cmark.png` is the white C cut from the logo for the outro's top-left corner; copy the whole `icons/` folder to `~/sermon-bumper/icons/` before running `adapt.jsx`.
- `render.jsx` — every cut: reads `~/sermon-bumper/sermon.json`, sets the text, renders `Intro` and `Outro` through the render queue at half resolution to `intro.mp4` / `outro.mp4`, writes `render.log` ending in `done`.

Run any of them from a shell as inline text, never as a file alias:

```bash
osascript -e 'tell application "Adobe After Effects 2026" to DoScript "$.evalFile(\"/full/path/render.jsx\");"'
```

ExtendScript gotchas learned the hard way: never concatenate a property's array value into a string (the script dies silently; wrap numbers with `Number()` or serialize element by element); wrap every `importFile` in `beginSuppressDialogs`/`endSuppressDialogs`; create a fresh `File` object per log write; `aerender` cannot read JSON footage, so text is set by script and rendered in-app.
