# Cornerstone Design System

Living documentation for cornerstonechurchma.org. The visual, client-facing version is `styleguide.html`.

The generic layers (`blocks.css`, `blocks.js`, theme template) are also extracted as a standalone kit at `~/conductor/repos/oasis-blocks` for future client sites; this site is the reference implementation, so sync changes both ways.

## Architecture

Three layers, loaded in order on every page:

```html
<link rel="stylesheet" href="css/theme-cornerstone.css?v=1">  <!-- tokens only -->
<link rel="stylesheet" href="css/blocks.css?v=1">             <!-- generic building blocks -->
<link rel="stylesheet" href="css/style.css?v=7">              <!-- page-specific styles -->
...
<script src="js/main.js"></script>
<script src="js/blocks.js"></script>  <!-- motion engine, load last -->
```

- **`theme-cornerstone.css`** — every color, font, radius, spacing, and motion value. The only file that changes per client. A future client site copies `blocks.css` + `blocks.js` untouched and writes a new `theme-*.css`.
- **`blocks.css`** — reset, layout, typography, buttons, section headers, dividers, reveal system, hero choreography, CTA panel, utilities. No client-specific values; reads tokens only.
- **`style.css`** — nav, hero, cards, modals, filters, footer — the Cornerstone-specific components.
- **`blocks.js`** — dependency-free motion engine (works on `file://`). Skips everything under `prefers-reduced-motion`; without JS nothing is ever hidden.

## Tokens

- Brand: `--brand` (#3689C5), `--brand-light`, `--brand-dim`, `--brand-border` — *renamed from the legacy `--gold*` names*
- Surfaces: `--bg-base` → `--bg-surface` → `--bg-elevated` → `--bg-highlight`
- Text: `--text-primary` (warm ivory), `--text-secondary`, `--text-muted`
- Hairlines: `--border-subtle`, `--border-normal`, `--divider` (edge-fading section rules)
- Fonts: `--font-display` (Cormorant Garamond), `--font-body` (Albert Sans); `--leading-display` (1.08) is the line-height for every display heading — it lives in the theme because it depends on the display face's ascender/descender extents
- Spacing: `--space-section` (96px / 56px mobile), `--space-section-sm`
- Motion: `--ease-out`, `--ease-soft`, `--dur-quick` (.2s), `--dur-reveal` (.65s), `--dur-hero` (.9s), `--reveal-distance` (24px)

## Motion system

Authored in HTML with data attributes; `js/blocks.js` drives everything:

| Attribute / class | Effect |
|---|---|
| `data-reveal` | Fade-up 24px on first viewport entry, then attributes are released so hover transforms never conflict |
| `data-reveal="fade"` | Fade only |
| `data-reveal-delay="150"` | Manual delay (ms) |
| `data-reveal-stagger` (on container) | Children auto-cascade at 90ms, capped at 540ms |
| `.divider-top` / `.divider-bottom` | Semi-transparent hairline that draws outward from center on first view |
| `data-parallax="0.1"` | Decorative drift at a fraction of scroll speed (desktop only) |
| `.hero-in` (added by JS) | Hero choreography: eyebrow → title (with blur-in) → body → CTAs; SVG arc line-draws via `pathLength` |
| `.kenburns` (added by JS) | 28s slow zoom on `.hero-video-wrap` |

Dynamically injected content: call `Blocks.scan(container)` after insertion. The sermon archive grid intentionally has no reveal attributes — it re-renders on every filter change.

**Rules:** motion is one-shot and slow (welcome, not performance). Reveals on content, parallax only on atmosphere. One CTA panel per page.

## Blocks inventory

Section shell (`.section` + `.divider-top/-bottom`) · eyebrow label (`.label`) · display headings (`.display-hero`, `.display-section`, `.display-section-italic`) · section header row (`.section-header-row`) · buttons (`.btn` + `-primary/-outline/-ghost/-sm/-flush`) · accent rule (`.gold-line`) · CTA panel (`.cta-panel` > `.cta-panel-inner`) · info band · media cards (sermon/group/announcement) · event list row · staff card · modal shells.

## How to change

- **Rebrand / new client:** edit or copy `theme-cornerstone.css`. Nothing else.
- **New button style / block:** add to `blocks.css` if generic, `style.css` if Cornerstone-only.
- **Page-specific hover zoom:** `.group-card`, `.announcement-card`, `.staff-card` image zooms live in `style.css`; generic version is `.media-zoom` in `blocks.css`.
- Bump the `?v=` query on any CSS file you edit.
- Update this file and `styleguide.html` when patterns change.

## Voice

Warm, invitational, plain-spoken. Italic serif for the emotional register; sans caps for wayfinding. Blue is a signal, not a decoration.
