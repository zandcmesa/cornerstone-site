# Findings to date (Oct 21, 2026)

What follows is what could be verified from the site repo, the Drive, DNS, and web search snippets. Items marked **(snippet)** come from search-engine summaries, not from loading the page, and must be re-checked against a screenshot before they go to the church. Items marked **(repo)** or **(Drive)** are verified.

Severity: **H** = a first-time guest or member hits it; **M** = brand erosion or lost engagement; **L** = polish.

## A. Canonical facts and where they drift

| Fact | Canonical (site) | Where it drifts | Sev |
|---|---|---|---|
| Service time | Sundays 10:00am (home, footer, Watch, meta description; PCO calendar "Sunday Service 10:00 AM – 12:00 PM") | Yelp: Sun 9:30 AM–12:30 PM **(snippet)**; Waze: Sun 09:30–13:00 **(snippet)**; Yellow Pages: Sun 10–12 **(snippet)**; NearFaith: "9:00 and 11:00 AM" marked as estimates **(snippet)**; a 2024 Q 99.7 blog post listed the Facebook livestream at 10:30am **(snippet)**. Google Business Profile not yet inspected. | H |
| Church name | "Cornerstone Church" | Yellow Pages carries the alternate name "Faith Tabernacle Church" **(snippet)**; some directories list ZIP 01018/01128 instead of 01028 **(snippet)**; handles are `cornerstonechurchma` everywhere except Church Online Platform (`cornerstonema`) and the pastors.ai scrape (`@cornerstonema`) **(repo, snippet)** | M |
| Phone format | `413-525-8802` (12 places) | `(413) 525-8802` (2 places on the site) **(repo)**; directories use the parenthesized form | L |
| Vision statement | About page: *"To see our region forever transformed by the Gospel, cultivating fully devoted, fully equipped, fully effective disciples of Jesus."* (12 occurrences) **(repo)** | **Home hero labels it the mission and drops "forever"**: *"Our mission is to see our region transformed by the Gospel — cultivating…"* (`index.html:88`, repeated in `styleguide.html:317`) **(repo)**. About defines Mission separately (Isaiah 61 / Luke 4). Slides and the announcements template use lowercase *"gospel"* and end with "!"; Facebook intro ends with "!" **(Drive, snippet)**; the 2025 storyboard script says *"followers of Jesus Christ"* instead of *"disciples of Jesus"* **(Drive)**. | H |
| Denomination | Meta description says "A Foursquare church" | Not visible on Facebook/Instagram snippets; directories call it non-denominational **(snippet)** | L |
| Partner / missions list | About page lists 8 (Between Bridges, Christina's House, Clearway Clinic, Cornerstone Foundation, FCA, InterVarsity, Springfield Crisis Pregnancy, Springfield Rescue Mission) | Give page names a different set (Hills Food Fair, Dugit, Samaritan's Purse…); 2023 slide brief lists 20 "Ministry Highlight" partners (Our Daily Bread, YWCA, Amherst Project, Boston/NY Dream Center…); Church Center "Serve in Our Community" has 9 (adds The Q 99.7, Foster the City, Salt and Light, Enfield Loaves and Fishes, East Longmeadow Food Pantry) **(repo, Drive)** | M |
| Testimony email | Not on the site | `testimony@cornerstonechurchma.com` appears only on slides and in the announcements template **(Drive)** | L |
| Text keyword | Announcements page: "Get Text Updates" with 97000 **(repo)** | Slides: "text connectcc to 97000"; keyword never shown anywhere else on the site; Clearstream opt-in language not seen | M |

## B. Website (cornerstonechurchma.com)

1. **No Open Graph / Twitter Card tags on any page** (0 matches across all 8 public pages) **(repo)**. Every link the church texts, posts to Facebook/Instagram, drops in Church Center or emails renders without an image, title card or description. For a church whose primary channels are text and Facebook this is the single highest-leverage fix on the site. **H**
2. **Vision/mission mislabeled on the home hero** (see table above). The About page gets it right; the home page contradicts it. **H**
3. **No first-time-guest path.** No "I'm New", "Plan your visit" or "What to expect" content anywhere on the site (grep: 0 matches outside the style guide). The Clearstream microsite has an "I'm New" form that the site does not. Kids check-in instructions exist only inside the Kingdom Kids group override copy. **H**
4. **Favicon is SVG only**; no PNG fallback and no `apple-touch-icon`, so "Add to Home Screen" on iOS and some crawlers get a blank/generic icon **(repo)**. **L**
5. **Logo blue ≠ site blue.** The logo artwork (`images/cornerstone-icon.svg`, `cornerstone-favicon.svg`) is `#1482C4` on `#1A242D`; the design tokens use `#3689C5` (`--brand`) and `#5AAEE0` (`--brand-text`) on `#0D0F14`. Two blues now compete as "the" Cornerstone blue, and the Drive "Branding Colors" folder (2021) has a third pair (Navy/Blue PNGs, hex unknown) **(repo, Drive)**. **M**
6. **Old URLs still in Google**: `/about/`, `/contact/`, `/sermons/sunday-sermon-dec-7/`, `/event/sunday-celebration-1000am-2025-04-20/` with titles like "Sunday Sermon (Dec 7) - Cornerstone Church" **(snippet)**. Redirect stubs catch some; individual sermon/event URLs land on the 404 page. Sitemap exists but has not been submitted to Search Console (launch report open item). **M**
7. **Hero copy vs Watch copy**: Watch says the service is "fully hosted through Church Online Platform" while the embedded player is YouTube; fine functionally, but the sentence will confuse someone comparing the two **(repo)**. **L**
8. What is working: one `h1` per page, consistent titles, meta descriptions, analytics gated to the live domain, clean nav, legacy redirects, accessibility pass (Oct 2026). The site is the only channel with a written design system.

## C. Church Center (Planning Center) — from the nightly snapshot

Content the church types into Planning Center is what members see in the app, on Church Center web, and (through the site) on Groups/Events. From `js/pco-data.js` (synced Oct 20, 2026) **(repo)**:

1. **Group naming is inconsistent**: leader-named Growth Groups ("Dan and Jayne | Fall 2026", "Deborah and Ann | Fall 2026", "Jim and Betsy | Fall 2026", "Joyce and Kathy | Fall 2026") sit beside topic-named ones ("Raising Arrows - Parenting Class", "Alpha — Fall 2026"); separators vary (`|`, `-`, `—`); capitalization varies ("Intercessor/prayer team", "Usher Team"); apostrophes vary ("Kingdom Kid's Church Teachers and Assistants" vs "Kingdom Kids" on the site, "Mom’s Group" with a curly quote). **M**
2. **Two group types have no description** (Ministries, Growth Groups, Unique Groups are blank; the site falls back to hand-written copy). **M**
3. **External organizations are listed as "groups"** (The Q 99.7, Springfield Rescue Mission, Foster the City…) under "Serve Opportunities in Our Community" with the partner's own boilerplate as the description, so the voice shifts from Cornerstone's to the partner's. **L**
4. **Calendar**: two recurring events are both titled just "Prayer" (Wed 7pm at "East Longmeadow Campus", Thu noon at "Church Office"). Location is "East Longmeadow Campus", multi-site language for a single-site church. **M**
5. **Stale and off-platform content**: the Kingdom Kids volunteer signup is open and undated (flagged at launch); Salt and Light's description points to SignUpGenius; the Josh Baldwin concert ticket link is a raw Humanitix URL inside the description. **M**
6. **Church Center branding settings (logo, color, header image, home-page blocks, enabled tabs) not yet inspected.** The in-service "Our App" slide says "Church Center App in App Store" only; no Google Play mention **(Drive)**. **M**
7. Working well: 38 public groups with real descriptions, enrollment states set, a public calendar, registrations in use, giving on Church Center.

## D. In-service screen graphics (Google Slides → ProPresenter)

Three decks built from Zand's April 2023 design brief, still edited (last modified Oct 15, 2026) **(Drive)**:

1. **The decks are archives, not loops.** "Event Highlights" still holds Legacy Luncheon (May 3), 7-Day Fast (Jan 4–10), Annual Meeting (Jan 25), DOZ Camp (Aug 11–15), Water Baptism (Oct 19), Spring Clean-Up (May 2), two different picnic dates. Whoever builds Sunday's loop has to know which are live. **M**
2. **Naming drift on screen**: "Impact Youth" and "Cornerstone Youth" both appear with the same time (Wednesdays 6pm); the site and Church Center say "Cornerstone Youth". **M**
3. **Possible fact conflict**: a slide advertises "Warfare Prayer Mom's Group — Every Third Saturday 10AM, Church Office"; Church Center's Mom's Group meets Fridays 10am–12pm. Either two different gatherings or a stale slide; needs confirming. **M**
4. **Vision slide** uses lowercase "gospel" and a trailing "!"; the site uses "Gospel" with a period. **L**
5. **Typography/system**: letter-spaced caps labels ("E V E N T  H I G H L I G H T") and the 2023 look predate the site's Cormorant/Albert Sans system and dark palette; slide and site now read as two brands. Fonts, safe margins, QR size and slide durations are not documented anywhere. **M**
6. **Serve deck** has near-duplicate slides for the same team ("Sign up today / Scan the code" vs "Sign up here" variants of Tech, Hospitality, Greeting), suggesting no single template per message type. **L**
7. "Internal" deck carries the standing CTAs (Give, Text connectcc to 97000, Testimony email, App download, Vision, Get in Touch). These are the five CTAs that should match the site word-for-word; today three of the five (text keyword, testimony email, app) are not on the site at all.

## E. Brand assets (Drive)

1. **Four logo generations** exist side by side: 2013 (`Cornerstone Logo - 2013.ai`), 2018 (`2018 CC Logo…`), 2021 (`21_CornerstoneChurch_Logo_Final.ai`, the one the site uses), and the 2023 "New Logos 2023" set built by jonathan@cornerstonechurchma.com. No single "current logo" folder; old versions are not archived. **M**
2. **The written style guide is from 2016** (Tw Cen MT headings, Source Sans Pro body, dark gray + medium blue, light blue on dark, DollarPhotoClub stock). It no longer matches the site (Cormorant Garamond + Albert Sans, warm ivory on near-black, `#3689C5`). Nothing reconciles the two for anyone making a slide, a Canva post or a Mailchimp email. **H**
3. **Sub-brands with their own palettes**: Kingdom Kids rebrand (2023: orange / pink / teal), High Praise Dance (orange), Cornerstone Young Adults (blue / taupe / cream, with a Canva brand kit), Growth Groups (own fonts and logo), Harmony Fest. Pastor Josh's own review note asked for ministry images that "all look like they are from the same church, same feel, even though they have individual logos." The site already enforces this on Groups (gradient + monogram, PCO photos never shown); nothing enforces it elsewhere. **M**
4. **Letterhead package (Sep 2026)** exists and is the only recent print asset; whether it uses the 2021 logo and which blue it carries needs a look. **L**

## F. Social (snippets only; needs screenshots)

| Channel | Observed | Issue |
|---|---|---|
| Facebook /CornerstoneChurchMA | 1,391 likes, ~1.3K followers, 2,422 check-ins; intro is the vision statement with "!"; recent post "Church At The Park" at Heritage Park, Springfield **(snippet)** | Was "Church At The Park" on Church Center / the site? It is not in the Oct 20 snapshot. If it was a real upcoming service change, the website said "Sundays at 10am, 15 Kibbe Rd" that week. **H** if confirmed |
| Instagram @cornerstonechurchma | 464 followers, 29 following, 105 posts; "FOREVER TRANSFORMED" in the snippet **(snippet)** | Small post count for an account that old; bio, link-in-bio target and highlights unknown |
| YouTube | Replays titled "Cornerstone Online MM/DD/YYYY", ~2h15m, public; one stray "Live Stream - […]" title **(repo notes)** | Channel art, handle, trailer, playlists unknown; full 2h15m replays include worship (licensing) |
| Vimeo /cornerstonechurchma | Sermon library; the site's player | Profile bio/avatar unknown; it is public and findable |
| Church Online Platform | `cornerstonema.online.church` | Only handle that differs from `cornerstonechurchma` |

## G. Email

1. **No SPF, DKIM or DMARC on cornerstonechurchma.com** (DNS snapshot Sep 20, 2026; launch report open item) **(repo)**. Google and Yahoo have required SPF/DKIM alignment and DMARC for bulk senders since Feb 2024; Mailchimp sends "from" the church domain are exposed to spam-foldering and the domain is spoofable. **H**
2. **Mailchimp**: audience "cornerstonechurchma", embedded signup on the Announcements page; Tori sends; no branded templates yet (Phase 5 deliverable); a 2018 "40th Anniversary Mailchimp Banner" in Drive is the last email design artifact found **(Drive)**. Cadence, open/click rates, template, sender name, welcome automation all unknown. **M**
3. **Weekly announcements template** (Sep 2026) lists four display locations per announcement (stage slides, bulletin/email, Church Center app, social) with no indication of a single source feeding them; the launch checklist's open question "How do announcements reach the Church Center app today?" is still open. **M**

## H. Texting (Clearstream)

1. Keyword `connectcc` → 97000 is only promoted on a slide and (as a number) on the Announcements page; the keyword itself is not on the site. **M**
2. The microsite (`clr.io/site/crjzg`) is the de-facto "link in bio" behind the sanctuary tap tags and links to homepage, /announcements/, giving, groups, app, "I'm New", Facebook, Instagram (launch report). Its logo, colors, and copy have not been seen. **M**
3. Opt-in confirmation text, STOP/HELP handling, send frequency and subscriber count unknown. **M**

## I. Third-party / uncontrolled presence

- `pastors.ai/church/@cornerstonema` republishes the church's sermons under a handle the church does not use **(snippet)**. Worth a look at what it shows and whether to claim or ignore.
- Yelp: 15 photos, one 5-star review, office hours Mon 9–5 / Tue 9–4 **(snippet)**. Unclaimed status unknown.
- Yellow Pages / D&B / ezlocal carry legacy data (alternate name, wrong ZIPs).

## J. What is already good (keep)

- The site: consistent nav, titles, meta descriptions, legacy redirects, accessibility pass, analytics only on the live domain, single giving destination (Church Center), the sermon archive.
- Planning Center as the one source for events and groups, with the site reading from it live.
- The 2023 slide system was a real attempt at one template language; it just predates the new brand.
- One handle (`cornerstonechurchma`) almost everywhere.
