# Cornerstone Church — Digital Presence Audit (working folder)

Status: **in progress** (started Oct 21, 2026). This is the "Digital presence audit" owed under Phase 5 of the launch checklist (map of accounts, what's working, what to do next), widened to cover brand consistency across every channel.

Goal: identify brand inconsistencies and problems across Cornerstone's digital presence, with rationale, and produce a ranked list of recommendations the church can decide on.

Files in this folder:

| File | What it is |
|---|---|
| `README.md` | Scope, channel inventory, method, scoring rubric |
| `01-findings-to-date.md` | Evidence-backed findings by channel, from what could be reached so far |
| `02-access-needed-and-questions.md` | What Oasis still needs from the church / Zand, and the decisions that shape "good" |
| `03-benchmarks.md` | Sourced research on what "good" looks like (filled in from the research pass) |

The final deliverable for the church (decision list with rationale, effort and priority) will be written once the items in `02-` are answered. Nothing in this folder is customer-facing yet.

## Channel inventory

Everything Cornerstone shows up on, as far as can be established from the site repo, the Drive, and search results. "Reachable" means Oasis could inspect it directly from the audit sandbox; the rest needs screenshots/exports or a network allow-list (see `02-`).

| # | Channel | Handle / location | Owner | Reachable in audit | Notes |
|---|---|---|---|---|---|
| 1 | Website | cornerstonechurchma.com (GitHub Pages) | Oasis builds, church owns domain | Yes (repo) | Launched Oct 14, 2026 |
| 2 | Google Business Profile | "Cornerstone Church", 15 Kibbe Rd | Unknown (church to confirm) | No | Most important listing; not yet inspected |
| 3 | Other listings | Yelp, Yellow Pages, Waze, NearFaith, D&B, ezlocal, The Q 99.7 directory, pastors.ai | Nobody | Search snippets only | Hours and names disagree with the site |
| 4 | Google search index | old WordPress URLs | — | Search snippets | Old sermon/event URLs still indexed; Search Console not set up |
| 5 | Facebook Page | facebook.com/CornerstoneChurchMA | Josh | Snippets only | ~1.3K followers |
| 6 | Instagram | @cornerstonechurchma | Josh | Snippets only | 464 followers, 105 posts |
| 7 | YouTube | channel UCl4J6MR32QrZOfk8M_n7wvA | Josh (Zand editor) | No | Sunday live stream + replays, ~2h15m each |
| 8 | Vimeo | vimeo.com/cornerstonechurchma (Plus) | Church | No | Sermon library feeding the site |
| 9 | Church Online Platform | cornerstonema.online.church | Church to confirm | No | Chat/hosts during the stream |
| 10 | Church Center (web + app) | cornerstonechurchma.churchcenter.com | Tori (PCO admin) | Partially (nightly snapshot in `js/pco-data.js`) | Giving, groups, registrations, calendar |
| 11 | Clearstream (texting + microsite) | keyword `connectcc` → 97000; clr.io/site/crjzg | Josh | No | Microsite is linked from sanctuary tap tags |
| 12 | Mailchimp | audience "cornerstonechurchma" | Church (Tori sends) | No | Signup form on Announcements page; branded templates owed by Oasis |
| 13 | In-service screens | Google Slides decks → ProPresenter | Church (slides built by Zand 2023) | Yes (Drive) | Three decks: Serve Opportunities, Internal, Event Highlights |
| 14 | Brand assets | Drive "Cornerstone Church" folders | Church | Yes (Drive) | 2013 / 2018 / 2021 logos, 2016 style guide, 2023 sub-brand kits |
| 15 | Email domain | @cornerstonechurchma.com (Google Workspace) | Josh (super admin) | DNS only | No SPF/DKIM/DMARC published |
| 16 | Paid | Google Display/YouTube via Missional Marketing | Agency | No | Creative and landing pages not seen |
| 17 | Print/physical touchpoints that carry digital CTAs | tap tags, connection cards, bulletin, signage, letterhead | Church | Letterhead only (Drive) | QR/short links need checking |

## Method

1. **Source of truth first.** Establish the canonical facts (name, address, phone, service time, URL, vision/mission wording, logo, colors, type) and record where each is defined.
2. **Channel by channel.** For each channel capture identity (logo, name, colors, type, imagery), core facts, voice, calls to action and link hygiene, freshness, accessibility, and measurement. Score each 0–3 (rubric below).
3. **Cross-channel.** Trace the same message (an announcement, an event, the vision statement, the service time) through every channel and note where it diverges.
4. **Benchmark.** Compare against sourced research and platform guidance (`03-benchmarks.md`).
5. **Recommend.** Rank by impact on a first-time guest and on a member taking a next step, then by effort. Each recommendation names the owner and the decision the church has to make.

## Scoring rubric (0–3 per dimension, per channel)

| Dimension | 0 | 3 |
|---|---|---|
| Identity consistency | Wrong/old logo, off-palette, random type | Current logo, palette and type used per guide |
| Core facts | Name, address, phone, time or URL wrong or missing | All correct and formatted the same as the site |
| Voice | Reads like a different organization | Warm, invitational, plain-spoken (per `DESIGN.md` voice) |
| Calls to action / links | Dead or off-platform links, no CTA | One clear CTA, links land on the right page, tracked |
| Freshness | Stale content visible | Nothing out of date visible |
| Accessibility | Missing alt text/captions, low contrast | Alt text, captions, legible contrast |
| Measurement | No way to know if it works | Owner reviews a number monthly |

## Scope boundaries

- Not a redesign of any channel. The output is a decision list.
- The website is treated as the current brand reference because it is the only channel with a written design system (`DESIGN.md`, `styleguide.html`). Whether that is the *intended* master brand is one of the open questions in `02-`.
- Passwords and keys are never recorded here. They live in the restricted Keys and Secrets sheet.
