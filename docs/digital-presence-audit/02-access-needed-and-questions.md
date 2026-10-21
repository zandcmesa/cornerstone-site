# What the audit still needs, and the questions that define "good"

## 1. Why some of this is blocked

The audit sandbox's network policy denies every outside host except search. Direct loads of cornerstonechurchma.com, facebook.com, instagram.com, youtube.com, vimeo.com, churchcenter.com, clr.io, online.church, yelp.com and Google Maps all fail at DNS. Two ways forward:

- **Option A (fastest for the live channels):** allow these domains in the cloud environment's network settings (Edit → Network access → Limited → Allowed domains, keep "Allow package managers" ticked): `cornerstonechurchma.com`, `www.facebook.com`, `www.instagram.com`, `www.youtube.com`, `vimeo.com`, `player.vimeo.com`, `cornerstonechurchma.churchcenter.com`, `clr.io`, `cornerstonema.online.church`, `www.yelp.com`, `www.google.com`, `maps.google.com`, `apps.apple.com`, `play.google.com`, `us8.campaign-archive.com`, `mailchi.mp`, `www.theq997.com`, `www.bing.com`, `pastors.ai`. Logged-in views (Meta Business Suite, Clearstream, Mailchimp, Planning Center admin, GA4) still need exports or screenshots.
- **Option B:** send screenshots/exports per the list below into a Drive folder (suggest `Cornerstone Church / Digital Presence Audit 2026`).

## 2. Asset and access request list

Ordered by how much of the audit each unlocks.

### Must have

1. **Google Business Profile**: screenshot of the public knowledge panel (desktop + phone) and of the GBP dashboard: hours, categories, description, photos, Q&A, reviews, posts, attributes, "from the business"; who owns the listing. Also Apple Maps and Bing Places screenshots if anyone has claimed them.
2. **Church Center**: phone screenshots of the app home screen, each enabled tab, the giving screen, a group page and an event page; the Church Center branding settings in Planning Center (logo, accent color, header image, home-page blocks, welcome text); app analytics if available (installs, monthly actives, push history).
3. **Clearstream**: screenshots of the last 15–20 texts as received on a phone, the opt-in auto-reply, subscriber count, keyword list, send frequency, who sends; the microsite as rendered on a phone; link-click reports if available; the 10DLC brand name registered.
4. **Mailchimp**: the last 6–10 campaigns as received (forward to Oasis or share the campaign archive URL), audience size and growth, 12-month open/click/unsubscribe rates, sender name and from-address, the welcome automation (if any), current template screenshots.
5. **Social**: Facebook Page (profile photo, cover, About/Intro, services, hours, CTA button, pinned post) and Instagram (bio, link-in-bio destination, highlights, grid) screenshots; the last 30 posts on each, or a Meta Business Suite insights export for the last 90 days (reach, engagement, follower change); who posts and how often; any Canva brand kit the church uses.
6. **In-service**: a PDF/PNG export of the announcement loop actually run on the last two Sundays (not the master decks), the loop order and per-slide duration, the sanctuary screen specs (projector/LED resolution, screen width, distance to the back row), whether there are lobby or kids-wing screens, and who builds the loop each week and in what tool.
7. **Brand decisions** (see section 3): the canonical logo file, the official blue hex value(s), the intended fonts for non-web use.

### Should have

8. **YouTube**: channel page (banner, avatar, handle, About, playlists, featured video), YouTube Studio basics (subscribers, 90-day views, where viewers come from).
9. **Vimeo**: profile page screenshot (avatar, bio, link), showcase/album structure.
10. **Church Online Platform**: the page as a viewer sees it 10 minutes before service and mid-service; who administers it.
11. **GA4**: last 90 days export or screenshots: top pages, acquisition sources, the six conversion events, device split. (Zand already has Editor; just not reachable from here.)
12. **Paid**: Missional Marketing's current creative set and landing-page URLs, plus their reporting.
13. **Physical touchpoints with digital CTAs**: photos of the sanctuary tap tags, connection card, bulletin (if any), lobby signage, giving envelopes, business cards, exterior sign.
14. **Old site media**: anything worth saving from WordPress/Flywheel before ~Nov 13 (photos, PDFs), since directories and social may still link to it.

### Nice to have

15. The Kingdom Kids rebrand PDF opened (Drive `New Logos 2023 / Kingdom Kids / Brand Guide`), the "Branding Colors" Navy/Blue swatches with hex, and who Jonathan (2023 logo work) was so authorship is credited correctly.
16. Any past surveys or anecdotal feedback from first-time guests about how they found the church.
17. Whether the church has, or wants, a podcast feed (none found).

## 3. Grill-me: the questions that change what "good" means

Answer these before the recommendation list is written; each one changes the ranking.

**Audience and purpose**
1. Who is the audit's primary beneficiary: the first-time guest finding Cornerstone online, or the existing member taking a next step (group, serve, give)? If both, which wins a tie?
2. What does Josh count as success in 12 months: first-time guests per month, group sign-ups, giving, app installs, livestream reach? Pick two.

**Brand**
3. Is the new website's look (dark surfaces, warm ivory, Cormorant Garamond + Albert Sans, `#3689C5`) the church's master brand now, or a web-only expression of it? If master, every other channel is currently off-brand and the recommendation is a brand book plus templates. If web-only, the recommendation is a bridging guide and the slides/email keep a lighter look.
4. Which logo file is canonical: the 2021 "Final" (what the site uses) or anything newer? Is the official blue the artwork's `#1482C4` or the site's `#3689C5`? (They cannot both be "the blue".)
5. Should Kingdom Kids, Cornerstone Young Adults, High Praise Dance, Youth and Growth Groups keep independent identities (own palettes/fonts) or become endorsed sub-brands inside one system? Josh's review note leans toward "same church, same feel"; confirm.
6. Settle the words: exact vision statement punctuation and capitalization ("Gospel" vs "gospel", period vs "!"), and confirm the home hero should carry the *vision*, not "our mission". Confirm the mission wording (Isaiah 61) is the one to use everywhere.

**Facts**
7. Confirm 10:00am is the only service and whether the church wants listings to show "doors open 9:30" or office hours at all (Yelp currently shows Sun 9:30–12:30 and weekday office hours).
8. Preferred public name for handles and listings: "Cornerstone Church", "Cornerstone Church MA", or "Cornerstone Church East Longmeadow"? Should the Foursquare affiliation be visible outside the About page?
9. Was "Church At The Park" (Heritage Park, Springfield, posted on Facebook) a Sunday service relocation? If so, did it go on Church Center and the site? This tells us whether the content pipeline has a gap.
10. Is "Warfare Prayer Mom's Group, 3rd Saturdays 10am" a different gathering from the Friday Mom's Group on Church Center, or a stale slide?

**Channel roles and ownership**
11. What is each channel *for*? Proposed default to confirm: text = short/urgent/this-week; email = weekly digest; app = members and giving; Facebook = congregation and community; Instagram = outreach and story; YouTube = livestream; site = front door and archive. Who owns each (name, not role)?
12. Does one announcement get written once and fed to slides, email, app and social, or rebuilt four times? Is Church Center's announcements/home feed used at all today?
13. Is the Clearstream microsite meant to be the church's "link in bio" everywhere, or only the tap-tag landing page? Should it stay on Clearstream or become a page on the site?
14. Who runs texting, how often does a text go out, and has anyone reviewed opt-in wording and STOP handling?

**Website scope**
15. Does the church want an "I'm New / Plan your visit" page (what to expect, kids check-in, parking, dress, service length) on the site? Where should "I'm New" submissions go (Formspree to info@, or Planning Center People)?
16. Should Oasis add Open Graph tags, a PNG/apple-touch icon, and the SPF/DKIM/DMARC records now, without waiting for the audit? (All three are no-regret fixes.)

**Deliverable**
17. What format does the decision list need to be in for Josh and the council (Google Doc in the church Drive, a shared Claude Doc, a slide deck for a council meeting)? Should each recommendation carry an Oasis price, an effort estimate only, or neither?
18. Any constraints: budget ceiling, volunteer capacity for ongoing posting, anything off-limits (e.g., changing the logo), and timing (Advent/Christmas is eight weeks out; is a seasonal push in scope?).
19. Is Rose and Gold still touching any channel besides Vimeo uploads through ~Nov 13, and do they hold any social or brand logins or assets?
