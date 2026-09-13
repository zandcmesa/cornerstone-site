# Design Notes: Three Alternate Homepage Concepts

## Anti-AI Design Review

This document outlines intentional design decisions made to avoid common AI-generated website patterns.

### AI Tells Actively Avoided

#### Typography
❌ **Avoided:** Inter/Roboto/Arial as primary typefaces (the default AI choice)
✅ **Used:** 
- Design A: Fraunces + Manrope (editorial pairing)
- Design B: Playfair Display + Outfit (liturgical sophistication)
- Design C: Space Grotesk + Source Serif 4 (kinetic contrast)

#### Color Palettes
❌ **Avoided:** 
- Purple-blue gradients
- Cream + terracotta default combo
- Pure black + acid green
✅ **Used:**
- Design A: Dusk charcoal-blue (#1C2430) + copper accent (#B87333)
- Design B: Deep indigo (#0E1630) + warm paper (#F7F2E8) + restrained gold (#C4A35A)
- Design C: Forest green (#1F3D2F) + electric berry (#C23B5E) - NOT terracotta

#### Layout Patterns
❌ **Avoided:**
- Glassmorphism card grids
- Identical 3-column feature cards with identical 80px padding
- Everything centered
- Identical rounded cards throughout
✅ **Used:**
- Design A: Sparse magazine sections, varied spacing, asymmetric content blocks
- Design B: Alternating full-width panels (indigo/paper), Roman numeral sections
- Design C: Uneven photo mosaic, dynamic ticker, left-aligned content with intentional negative space

#### Motion & Animation
❌ **Avoided:**
- Scattered micro-animations on every element
- Generic scroll-triggered fades on every card
✅ **Used:**
- Design A: ONE signature parallax moment (hero image + reveal text)
- Design B: ONE monumental fade-up entrance on scripture, otherwise quiet
- Design C: ONE infinite ministry ticker + hover lifts on specific tiles

#### Visual Elements
❌ **Avoided:**
- Stock handshake photos
- Generic "Welcome to our church" hero text
- Emoji (none used anywhere)
- Hairline broadsheet typography as entire identity
- Copy-paste "About/Services/Contact" structure
- Gradient placeholders pretending to be photos
✅ **Used:**
- Real Cornerstone content (actual sermons, real address, authentic vision statement)
- Real ministry photography from the repository (High Praise Dance, Young Adults, Kingdom Kids, Pastor Josh)
- Photography integrated into layout, not decorative cards
- Content-first structure unique to each design aesthetic

#### Accessibility & Polish
✅ **Included:**
- `prefers-reduced-motion` media query in all three designs
- Proper keyboard focus states (inherited from button transitions)
- WCAG-minded contrast (fog-cream on dusk-dark, paper on indigo, forest on cream)
- Semantic HTML structure
- No decorative animations for users who prefer reduced motion

### Design Philosophy by Version

#### Design A: "Kibbe Dusk"
**Inspiration:** Editorial magazines, New England coastal dusk
**Key decision:** Restrained motion, ONE parallax moment, copper as single accent
**Photography:** High Praise Dance ministry hero image with dusk overlay + Young Adults photo in Visit section
**Anti-AI element:** Sparse layout rejects the "fill every section" impulse; photography integrated, not decorative

#### Design B: "Sanctuary Type"
**Inspiration:** Liturgical printed materials, museum websites
**Key decision:** Alternating panels, slow fade-up ONLY on hero scripture, liturgical restraint
**Photography:** Pastor Josh Eldridge portrait in Who We Are panel + full-bleed High Praise Dance editorial panel
**Anti-AI element:** Monumental centered type rejects card-grid defaults; gold used sparingly; photography as editorial panels, not hero wallpaper

#### Design C: "Sunday Pulse"
**Inspiration:** Living congregations, kinetic community energy
**Key decision:** Infinite ticker, uneven photo tiles, bold type contrast
**Photography:** Uneven mosaic grid with Kingdom Kids, Young Adults, High Praise Dance, and Pastor Josh
**Anti-AI element:** Forest + berry palette (NOT terracotta), intentional motion only where it serves purpose; photo mosaic is structural, not decorative

### Second Polish Pass Changes

1. **Removed one accessory per version:**
   - Design A: Removed decorative line dividers between sections
   - Design B: Removed excessive gold hairline borders
   - Design C: Removed redundant gradient overlays on cards

2. **Contrast refinements:**
   - Design A: Fog-dim (#B8B4AC) for secondary text, tested against dusk-dark
   - Design B: Ensured paper text passes WCAG AA against paper background
   - Design C: Berry accent tested for readability on cream

3. **Motion respect:**
   - All animations wrapped in `prefers-reduced-motion` checks
   - Parallax disabled for users who prefer reduced motion
   - Ticker pauses for reduced motion users

### Real Content Used

- **Church name, address, phone:** 15 Kibbe Rd, East Longmeadow, MA 01028 • (413) 525-8802
- **Service times:** Sundays at 10:00am
- **Mission statement:** Actual Cornerstone vision (region transformed by Gospel)
- **Sermon titles:** Real recent sermons (The Table of Covenant Grace, When You've Been Wronged, What's Worth Pursuing)
- **Ministries:** Kingdom Kids, Young Adults, Worship Ministry, High Praise Dance (all real)
- **No Lorem ipsum, no fake testimonials, no stock "join us" copy**

### Technical Notes

- Static HTML/CSS/JS (no build step)
- Google Fonts for specified typefaces
- Responsive design (mobile breakpoints at 768px)
- Works in file:// protocol or served over HTTP
- No dependencies beyond fonts
- Each design fully self-contained (own CSS/JS)

---

These designs represent three distinct studio aesthetics, not three color themes of one AI template.
