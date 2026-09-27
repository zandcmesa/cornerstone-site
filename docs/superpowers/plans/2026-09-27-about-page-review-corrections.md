# About Page Review Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Pastor Josh's and Tori's review feedback to the About page so the copy matches the church's own wording and the council roster is complete.

**Architecture:** All changes are static HTML edits to `about.html`, plus one spelling fix in the orphaned `staff.html`. No CSS or JS changes. Existing classes (`.value-card`, `.staff-card`, `.staff-photo-placeholder`) already cover every layout need.

**Tech Stack:** Plain HTML, opened directly from disk (`file://`). No build, no test runner. Verification is `grep` plus a browser look.

**Spec:** The review feedback lives in the Google Doc "Launch Checklist", tab "Old Site Review - Cornerstone" (doc id `1nEAutYUfKNvK5kYU1qV_n1leZ1lY2DTs5iBTZnCGel0`). Decisions made with Zand on 2026-09-27 are recorded in the next section so the plan stands alone.

## Decisions (from the review doc and Zand, 2026-09-27)

- **Mission.** The "Who We Are" block becomes "Our Mission". Drop our three paraphrase paragraphs. Use Josh's revised opening sentence, then the full Isaiah 61 / Luke 4 passage exactly as it appears on the old site.
- **Core values.** Restore the old site's nine full phrases as card titles. Keep our written descriptions; Josh will review them.
- **Missions intro.** Restore the old site's structure: Matthew 28:19 quote, then the paragraph. Josh's "REWORD / NEW WORDING" pair is read as: replace the sentence "Cornerstone cares about those who don't know Him all around the world because Jesus cares for them." with "We are called to partner with the global body of Christ to disciple nations, impact culture, and see entire regions transformed by Jesus Christ!" Keep the Great Commission sentence after it. Flag this reading for Josh in the review.
- **Council.** Add Melvin Walls, title "Council Member", initials placeholder until Tori sends a photo. Correct spelling is Villeneuve everywhere.
- **Home footer.** Tori's note about old "Our purpose is to follow the commands of Jesus" language needs no change; the new footer already uses the vision statement.
- **Global Requests table rows** (favicon, buttons, copyright) are template placeholders. Ignore.
- **staff.html** is not linked from any page or the nav. The About page is the canonical staff and council listing. This plan only fixes the spelling there so the two files don't disagree; deleting it is a separate decision for Zand.

## Global Constraints

- Copy the church's wording verbatim, including punctuation and the trailing exclamation marks. Do not tidy their prose.
- Use `&amp;` for ampersands and curly quotes as literal characters, matching the rest of `about.html`.
- No new CSS classes. No inline styles beyond what neighboring markup already uses.
- Keep `data-reveal` / `data-reveal-stagger` attributes where they exist; do not add new ones.
- One commit per task. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

- **Long value titles wrap.** "Serving Together in Unity with a spirit of excellence" and "Loving God with passion, and Love your neighbor as yourself!" are far longer than the old one-word titles. Cards must not overflow or misalign at desktop (3 columns) or mobile (1 column). Task 2 Step 4 checks this.
- **Isaiah passage length.** About 110 words in an italic display face inside a 2-column layout. It must stay readable and not push the vision box out of alignment. Task 1 Step 4 checks this.
- **Placeholder card with gradient footer.** `.staff-card-footer` overlays a dark gradient; on the initials placeholder it must not hide the initials. Task 4 Step 4 checks this.
- **Six council cards in a 4-column grid.** Second row has two cards, left-aligned. Confirm it reads intentionally rather than broken. Task 4 Step 4 checks this.
- **Missions quote attribution.** The Matthew 28:19 citation must render outside the quote marks so it isn't read as scripture text. Task 3 Step 4 checks this.

---

### Task 1: Replace "Who We Are" with "Our Mission"

**Files:**
- Modify: `about.html:66-84` (the left column of `.about-two-col`)

- [ ] **Step 1: Confirm the current block is the one you expect**

Run:
```bash
grep -n 'Who We Are\|Continuing the Kingdom ministry\|Rooted in Isaiah 61' about.html
```
Expected: three matches, all between lines 66 and 84.

- [ ] **Step 2: Replace the left column**

Replace this:
```html
      <div>
        <p class="label mb-16" data-reveal>Who We Are</p>
        <h2 class="heading mb-24">Continuing the Kingdom ministry of Jesus</h2>
        <p class="body-text mb-16">
          Cornerstone Church exists to continue the ministry Jesus began — proclaiming good news to the poor, healing the brokenhearted, setting the captive free, and restoring sight to those in darkness.
        </p>
        <p class="body-text mb-16">
          Rooted in Isaiah 61 and Luke 4, our call is not simply to hold services — it's to be the presence of Christ in our community and our region.
        </p>
        <p class="body-text">
          We are a church for New England — committed to the full gospel: salvation, healing, the Holy Spirit, and the soon return of Jesus. Our vision is to see the northeast transformed, equipping and sending believers across the region.
        </p>
      </div>
```
with this:
```html
      <div>
        <p class="label mb-16" data-reveal>Our Mission</p>
        <h2 class="heading mb-24">Continuing the Kingdom ministry of Jesus</h2>
        <p class="body-text mb-16">
          Our mission is to continue the Kingdom ministry of Jesus as described in Isaiah 61:
        </p>
        <p class="body-text mb-16" style="font-style:italic;">
          “The Spirit of the Lord God is upon me, because the Lord has anointed me to bring good news to the poor; he has sent me to bind up the brokenhearted, to proclaim liberty to the captives, and the opening of the prison to those who are bound; to proclaim the year of the Lord’s favor, and the day of vengeance of our God; to comfort all who mourn; to grant to those who mourn in Zion—to give them a beautiful headdress instead of ashes, the oil of gladness instead of mourning, the garment of praise instead of a faint spirit; that they may be called oaks of righteousness, the planting of the Lord, that he may be glorified.”
        </p>
        <p class="label">Isaiah 61 / Luke 4</p>
      </div>
```

- [ ] **Step 3: Verify the old copy is gone and the new copy is in**

Run:
```bash
grep -c 'Who We Are\|church for New England — committed\|Rooted in Isaiah 61 and Luke 4' about.html
grep -c 'Our Mission\|as described in Isaiah 61:\|oaks of righteousness' about.html
```
Expected: first command prints `0`, second prints `3`.

- [ ] **Step 4: Look at it**

Run: `open about.html`
Check at desktop width: the passage sits in the left column, the vision box and service-times box stay in the right column, tops aligned. Resize to under 700px: columns stack, passage first. Nothing overflows horizontally.

- [ ] **Step 5: Commit**

```bash
git add about.html
git commit -m "About: replace Who We Are with the church's mission statement

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Restore the church's core value phrases

**Files:**
- Modify: `about.html:108-150` (the nine `.value-title` elements)

- [ ] **Step 1: List the current titles**

Run:
```bash
grep -n 'value-title' about.html | sed 's/<[^>]*>//g'
```
Expected: nine lines: Scripture, Holy Spirit, Love God &amp; Neighbor, Prayer, Kingdom Focus, Discipleship, Evangelism, Unity, Passionate Worship.

- [ ] **Step 2: Replace each title, in order, leaving the numbers and descriptions alone**

| # | Old title | New title (verbatim from old site) |
|---|---|---|
| 01 | `Scripture` | `Rooted in Scripture` |
| 02 | `Holy Spirit` | `Dependent on the Holy Spirit` |
| 03 | `Love God &amp; Neighbor` | `Loving God with passion, and Love your neighbor as yourself!` |
| 04 | `Prayer` | `Unceasingly Prayerful` |
| 05 | `Kingdom Focus` | `Seeking First His Kingdom` |
| 06 | `Discipleship` | `Dedicated to Discipleship` |
| 07 | `Evangelism` | `Effective Evangelism` |
| 08 | `Unity` | `Serving Together in Unity with a spirit of excellence` |
| 09 | `Passionate Worship` | `Passionate in our Praise and Worship` |

Each edit is of the form:
```html
<div class="value-title">Rooted in Scripture</div>
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -n 'value-title' about.html | sed 's/<[^>]*>//g'
```
Expected: the nine new titles, in the order above, and no old one-word titles remain.

- [ ] **Step 4: Look at it**

Run: `open about.html` and scroll to Core values (the section has no id anchor).
Desktop: three columns, cards in a row share the same top edge, the two long titles wrap to two or three lines without pushing the card border. Mobile under 700px: single column, no clipping. If a long title looks cramped, that is a design follow-up for Zand, not a reason to shorten Josh's wording.

- [ ] **Step 5: Commit**

```bash
git add about.html
git commit -m "About: use the church's original core value phrases as card titles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Restore the Missions intro with Josh's new sentence

**Files:**
- Modify: `about.html:157-164` (Missions section header and intro paragraph)

- [ ] **Step 1: Confirm the current intro**

Run:
```bash
grep -n 'The Great Commission sends us' about.html
```
Expected: one match inside `<section class="section" id="missions">`.

- [ ] **Step 2: Replace the intro**

Replace this:
```html
    <p class="label mb-16" data-reveal>Missions</p>
    <h2 class="display-section-italic mb-8" data-reveal>Local and global</h2>
    <p class="body-text mb-48" style="max-width:540px;">
      The Great Commission sends us both across the street and across the world. Cornerstone is actively partnered with local organizations and global missions efforts.
    </p>
```
with this:
```html
    <p class="label mb-16" data-reveal>Missions</p>
    <h2 class="display-section-italic mb-8" data-reveal>Local and global</h2>
    <p class="body-text mb-16" style="max-width:640px;font-style:italic;">
      “Go and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all that I have commanded you; and lo, I am with you always, even to the end of the age.”
    </p>
    <p class="label mb-24">Matthew 28:19</p>
    <p class="body-text mb-48" style="max-width:640px;">
      We are called to partner with the global body of Christ to disciple nations, impact culture, and see entire regions transformed by Jesus Christ! We believe that the Great Commission found in Matthew 28:19 is at the heart of God’s will for the Church.
    </p>
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -c 'The Great Commission sends us' about.html
grep -c 'Go and make disciples of all the nations\|partner with the global body of Christ\|heart of God’s will for the Church' about.html
```
Expected: `0` then `3`.

- [ ] **Step 4: Look at it**

Run: `open about.html#missions`
The quote reads as italic body text, the "Matthew 28:19" label sits under it in the small caps label style, then the plain paragraph, then the two partner columns. The citation is clearly outside the quote marks.

- [ ] **Step 5: Commit**

```bash
git add about.html
git commit -m "About: restore Missions intro with Great Commission quote and Josh's new wording

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Add Melvin Walls to the council and fix the Villeneuve spelling

**Files:**
- Modify: `about.html:281-287` (Robert Villeneuve's card is the last in the council `.staff-grid`)
- Modify: `staff.html:168` (spelling only)

- [ ] **Step 1: Confirm current state**

Run:
```bash
grep -n 'Villen' about.html staff.html
grep -c 'Melvin' about.html
```
Expected: about.html shows `Villeneuve` twice, staff.html shows `Villenue` once. Melvin count is `0`.

- [ ] **Step 2: Add Melvin's card after Robert Villeneuve's card in about.html**

Insert directly after this closing block (the last card in the Church Council grid):
```html
      <div class="staff-card">
        <div class="staff-photo"><img loading="lazy" src="images/staff-council/bob-villeneuve.jpg" alt="Robert Villeneuve"></div>
        <div class="staff-card-footer">
          <div class="staff-name">Robert Villeneuve</div>
          <div class="staff-title">Secretary</div>
        </div>
      </div>
```
this new card:
```html
      <div class="staff-card">
        <div class="staff-photo">
          <div class="staff-photo-placeholder">
            <div class="staff-photo-initials">MW</div>
          </div>
        </div>
        <div class="staff-card-footer">
          <div class="staff-name">Melvin Walls</div>
          <div class="staff-title">Council Member</div>
        </div>
      </div>
```

- [ ] **Step 3: Fix the spelling in staff.html**

Run:
```bash
sed -i '' 's/Robert Villenue/Robert Villeneuve/' staff.html
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -c 'Villenue\b' about.html staff.html
grep -n 'Melvin Walls\|staff-photo-initials">MW' about.html
```
Expected: both files report `0` for the misspelling. Melvin's name and MW initials each appear once in about.html.

Run: `open about.html#staff` and scroll to Church Council.
Desktop: six cards, four on the first row, two on the second. Melvin's card shows the gradient placeholder with "MW" initials visible above the dark footer gradient. Mobile under 700px: two columns, three rows.

- [ ] **Step 5: Commit**

```bash
git add about.html staff.html
git commit -m "About: add Melvin Walls to Church Council, fix Villeneuve spelling

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Note the open items for Josh's review

**Files:**
- None in the repo. This is a handoff note for Zand to paste into the "New Site Review - Cornerstone" tab of the Launch Checklist doc.

- [ ] **Step 1: Write the note to the terminal for Zand**

Items Josh should confirm on the review site:
1. Mission section now reads "Our mission is to continue the Kingdom ministry of Jesus as described in Isaiah 61:" followed by the full passage. Confirm the opening line is what he wanted.
2. Missions paragraph: we replaced "Cornerstone cares about those who don't know Him…" with his new "We are called to partner with the global body of Christ…" sentence and kept the Great Commission sentence. Confirm that's the intended swap.
3. Core values: his nine original phrases are the titles. The short descriptions under each are ours. Edit or approve.
4. Melvin Walls is on the council with an initials placeholder. Tori to send a photo.
5. Footer social links: old site had Facebook, X, Instagram, RSS. New site has Facebook, Instagram, YouTube, Vimeo. Confirm X should be dropped.

- [ ] **Step 2: No commit**

Nothing to commit for this task.
