# Accessibility review — October 2026

Scope: the ten public pages (`index`, `sermons`, `about`, `groups`, `events`, `announcements`, `give`, `watch`, `accessibility`, `privacy`) plus every modal and the dynamically rendered Planning Center content. Verified with axe-core 4.13 (WCAG 2.0/2.1/2.2 A+AA and best-practice rules) in headless Chromium and a scripted keyboard walkthrough of every interactive flow. Conventions are documented in `DESIGN.md` → "Accessibility primitives".

## What was wrong

**Keyboard traps and unreachable controls**
- Sermon cards were click-only `<article>` elements: no tab stop, no role, no keyboard activation.
- Active-filter chips and "Clear all" on the sermon archive were `<span>`s.
- No modal managed focus. Opening one left focus on the page behind it, Tab walked the hidden page, and closing never returned focus. Only Escape and backdrop click were wired.
- The mobile drawer had no Escape handling and no `aria-controls`; closing it on scroll could orphan focus.

**Landmarks and headings**
- Events page sections, the weekly/upcoming/next-steps lists, event rows, group cards, announcement cards, staff cards, value cards, give/watch cards and footer columns all used `<div>` titles, so heading navigation skipped most of the site. About skipped from h2 to h4.
- Sermons page had no h2 at all; footer link columns were not navigation landmarks; the filter bar was not a search landmark.
- The video modal sat inside `<main>`.

**Names, labels, and text alternatives**
- The four filter `<select>`s had no label; the newsletter input used only `aria-label`.
- Social links relied on `title`; the hamburger said "Open menu" permanently; iframes had no title; event buttons read "Details" five times with no context.
- Roughly 60 decorative inline SVGs per page were not hidden from screen readers; skeleton placeholders announced blank rows; group logos repeated the group name.
- New-tab links gave no warning.

**Motion and media**
- The hero background video autoplayed with no pause control (WCAG 2.2.2) and ignored reduced-motion.

**Contrast**
- Skip link: white on brand blue, 3.8:1. Scripture pill, group schedule line, staff titles and the eyebrow on the "Support Our Mission" card: brand blue at 11–13px on elevated surfaces, 4.3:1.

## What changed

- `js/main.js`: `window.A11yModal` (focus into dialog, Tab trap with keydown plus focus sentinels for the iframe cases, `inert` on everything else, Escape, focus return). All five modals use it. Nav drawer gets Escape, `aria-controls`, and focus return; `aria-current="page"` is set; new-tab links get a visually hidden note; hero video pause/play toggle that starts paused under reduced motion; contact form marks empty fields `aria-invalid` and focuses the first one; toasts are a polite live region.
- `js/sermons.js`, `index.html`, `js/groups.js`, `js/events.js`: cards render as `<ul>`/`<li>` with the title as a real `<button>` stretched over the card; chips are buttons; result count is a live region; `<time>` on dates; sr-only "Speaker/Scripture/Date/When/Where" prefixes; group sections are labelled `<section>`s.
- HTML: landmark labels, `<main tabindex="-1">`, heading levels, footer `<nav>`s and `<address>`, `tel:` links, `<dl>` info band, labelled filter form, dialog roles and labels, descriptive close-button names, `aria-hidden` on decorative SVGs and skeletons, button `type` attributes, video modal moved out of `<main>`.
- CSS: `.sr-only`, global `:focus-visible` ring, `.card-btn` pattern, `.plain-list`, focus-within card rings, skip-link contrast fix, and a new `--brand-text` token (#5AAEE0) used for every blue text role so small blue text clears 6:1 on every surface while `--brand` stays on icons, borders and large numerals.
- `styleguide.html`: new Accessibility section (landmarks, focus, dialogs, names, contrast table), Blue Text swatch, card demos updated to the list/button markup, and the page itself gets a skip link, `<main>` and labelled nav.

## Known limits

- Keystrokes inside the Vimeo and Planning Center iframes are handled by those players; Escape only closes the modal once focus is back in the page (Tab out of the player first).
- Vimeo's player accessibility and caption quality are the vendor's; auto-captions are noted on the accessibility statement.
- `proposal.html` is an internal pitch page and was not audited.
