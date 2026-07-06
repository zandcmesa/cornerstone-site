const SERMON_DATA = [
  // ── Jun 2026 ─────────────────────────────────────────────────────
  { id: 1,  title: "The Dynamite Power You Keep Quenching",        date: "2026-06-28", speaker: "Pastor Christine Disibio",  series: null,                   scripture: "1 Corinthians 2:1–16",  scriptureBook: "1 Corinthians",  topics: ["Holy Spirit", "Self-Reliance", "Spiritual Wisdom"],         description: "Pastor Christine preaches through 1 Corinthians 2, contrasting the hollow promises of human wisdom and self-sufficiency — including AI — with the dunamis power of the Holy Spirit. She calls the church to stop quenching the Spirit's fire and choose to know the things freely given by God.",                                                                                                                    vimeoId: "1205525119" },
  { id: 2,  title: "Known in Heaven, Feared in Hell",              date: "2026-06-21", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Revelation 3:14–21",    scriptureBook: "Revelation",     topics: ["Spiritual Reputation", "Lukewarmness", "Fatherhood"],       description: "On Father's Day, the pastor preaches from Christ's letter to Laodicea, challenging believers to trade their obsession with earthly reputation for a standing that matters in heaven. He calls fathers — and the whole church — to buy gold refined by fire, receive the righteousness of Christ, and become spiritually dangerous to the enemy.",                                                                        vimeoId: "1203572426" },
  { id: 3,  title: "Strengthened in Your Innermost Being",         date: "2026-06-14", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Ephesians 3:14–21",     scriptureBook: "Ephesians",      topics: ["Inner Man", "Holy Spirit", "Rooted in Love"],               description: "Drawing from Paul's apostolic prayer in Ephesians 3, the pastor explains how the Holy Spirit desires to fortify believers from the inside out — sharpening reason, tenderizing conscience, and strengthening the will — so that they become rooted and grounded in Christ's love and filled with the fullness of God.",                                                                                                   vimeoId: "1201471152" },
  { id: 4,  title: "What Fellowship Looks Like When God Shows Up", date: "2026-06-07", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "1 John 1:1–7",          scriptureBook: "1 John",         topics: ["Testimony", "Koinonia", "Walking in the Light"],            description: "Three congregation members share testimonies of miraculous provision and healing before the pastor opens 1 John 1 to show that proclaiming what Jesus has done produces genuine spirit-filled koinonia. He warns that walking in spiritual darkness while claiming fellowship with God is self-deception — and invites the church toward a community marked by testimony, obedience, and love.",                         vimeoId: "1199455723" },
  { id: 5,  title: "Koinonia Is More Than a Church Picnic",        date: "2026-05-31", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Acts 2:42",             scriptureBook: "Acts",           topics: ["Koinonia", "Generosity", "Community"],                      description: "After celebrating a building fund milestone of $466,000 — a God-multiplied answer to prayer — the pastor draws from Acts 2 and Pentecost to challenge the congregation toward authentic koinonia: a spirit-filled fellowship where vertical awe of God produces horizontal love, and where conversations edify rather than commiserate.",                                                                                   vimeoId: "1197417995" },
  // ── Leadership Lessons (Apr–May 2026) ───────────────────────────
  { id: 6,  title: "The Outpouring We've Been Waiting For",        date: "2026-05-24", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Acts 2:1–21",           scriptureBook: "Acts",           topics: ["Holy Spirit", "Unity", "Revival"],                          description: "On Pentecost Sunday, the pastor preaches from Acts 2, tracing the first outpouring of the Holy Spirit and the conditions that preceded it — one accord, consecration, and singular devotion to Jesus. He draws a direct line between spiritual unity and spiritual empowerment, urging the church to leave its distractions at the foot of the cross and hunger together for a fresh filling of the Spirit.",             vimeoId: "1195662706" },
  { id: 7,  title: "Leaders Right the Ship",                       date: "2026-05-17", speaker: "Pastor Josh Eldridge",      series: "Leadership Lessons",   scripture: "1 Samuel 7:1–12",       scriptureBook: "1 Samuel",       topics: ["Repentance", "National Revival", "Spiritual Leadership"],   description: "Drawing from 1 Samuel 7 and Samuel's call for Israel to abandon idols and return wholeheartedly to God, the pastor draws direct parallels to America's spiritual condition on a national day of rededication. He challenges the church to move beyond empty ceremony into genuine heart change, arguing that national transformation must begin with personal self-governance and a true return to the Lord.",                 vimeoId: "1193299134" },
  { id: 8,  title: "Fear Not, Stand Firm, See God",                date: "2026-05-10", speaker: "Pastor Josh Eldridge",      series: "Leadership Lessons",   scripture: "Exodus 14:13",          scriptureBook: "Exodus",         topics: ["Fear", "Faith", "God's Deliverance"],                       description: "From Exodus 14, the pastor unpacks Moses' command to 'fear not, stand firm, and see the salvation of the Lord,' showing how Israel's panic at the Red Sea mirrors the enemy's strategy against believers today. Using Psalm 46 and the story of Jehoshaphat, he calls leaders to move off their heels and onto their toes in faith, reframing every enemy advance as the moment of God's decisive action.",                vimeoId: "1191275216" },
  { id: 9,  title: "Who Made Your Mouth?",                         date: "2026-05-03", speaker: "Pastor Josh Eldridge",      series: "Leadership Lessons",   scripture: "Exodus 4:1–16",         scriptureBook: "Exodus",         topics: ["Identity in Christ", "Calling", "Insecurity"],             description: "Walking through Moses' string of excuses in Exodus 4 and God's patient, unyielding responses, the pastor challenges believers to replace self-deprecating insecurity with 'Godfidence' — confidence grounded in what God says rather than personal inadequacy. He draws on Romans 8:31 to call leaders to stop arguing their insufficiency and instead take God at his word, stepping into their calling regardless of felt qualifications.", vimeoId: "1189259673" },
  { id: 10, title: "Don't Walk Past the Burning Bush",             date: "2026-04-26", speaker: "Pastor Josh Eldridge",      series: "Leadership Lessons",   scripture: "Exodus 3:1–10",         scriptureBook: "Exodus",         topics: ["Encountering God", "Presence of God", "Spiritual Attentiveness"], description: "From Exodus 3 and Moses' deliberate choice to turn aside toward the burning bush, the pastor teaches that leaders must make intentional, routine space to encounter the living God amid the noise of modern life. He warns that divine appointments and commissioning moments pass unnoticed when believers are too distracted to stop, and calls the church to develop a practice of drawing near that goes beyond desperation into daily surrender.", vimeoId: "1187068201" },
  { id: 11, title: "His Favor Is Upon Me",                         date: "2026-04-19", speaker: "Pastor Josh Eldridge",      series: "Leadership Lessons",   scripture: "Exodus 2:11–14",        scriptureBook: "Exodus",         topics: ["Leadership", "God's Favor", "Identity in Christ"],         description: "Opening this leadership series from Exodus 2 and Proverbs 2, the pastor traces Moses's first forty years — raised as Egyptian royalty, then exiled to Midian — to draw three principles: cultivating awareness of God's favor, developing the right mentality, and choosing humility over pride. He argues that biblical leadership means making God the hero and ourselves the guide.",                                        vimeoId: "1184948253" },
  // ── Next Level Project (Mar–Apr 2026) ───────────────────────────
  { id: 12, title: "The Veil Has Been Torn",                       date: "2026-04-05", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Matthew 27:50–51",      scriptureBook: "Matthew",        topics: ["Resurrection", "God's Presence", "Access to God"],         description: "On Resurrection Sunday, the pastor traces God's unrelenting pursuit of humanity from Eden through the tabernacle to the moment the temple veil tore in two at Christ's death in Matthew 27, showing that every barrier between God and people has been permanently removed. He challenges the congregation to stop living as outer-court Christians and to fully inhabit the all-access relationship the torn veil now makes possible.", vimeoId: "1180667152" },
  { id: 13, title: "Five Loaves, Two Fish, One God",               date: "2026-03-29", speaker: "Pastor Josh Eldridge",      series: "Next Level Project",   scripture: "John 6:5–13",           scriptureBook: "John",           topics: ["Faith", "Generosity", "Provision"],                        description: "Drawing on the feeding of the 5,000 in Mark 6 and John 6, the pastor calls the congregation to bring whatever little they have to Jesus with eyes of faith rather than eyes of lack, trusting God to multiply it beyond natural expectation. He applies this principle directly to the church's lower-level building project while framing it as the essential posture for every area of the believer's life.",                  vimeoId: "1178596448" },
  { id: 14, title: "Willing Hearts Build God's House",             date: "2026-03-22", speaker: "Pastor Josh Eldridge",      series: "Next Level Project",   scripture: "Exodus 35:20–36:7",     scriptureBook: "Exodus",         topics: ["Generosity", "Craftsmanship", "Freewill Offering"],        description: "From Exodus 35–36, the pastor highlights the Israelites' freewill offerings to build the tabernacle — given from stirred hearts, not compulsion — as the model for how the church should approach its own building campaign. He calls the congregation to a heart of generosity, Spirit-anointed craftsmanship, and the expectation that work done in God's will always results in more than enough.",                          vimeoId: "1176258279" },
  { id: 15, title: "We Are Well Able",                             date: "2026-03-15", speaker: "Pastor Josh Eldridge",      series: "Next Level Project",   scripture: "Numbers 13:17–33",      scriptureBook: "Numbers",        topics: ["Faith", "Fear", "Overcoming Doubt"],                       description: "Walking through Numbers 13, the pastor contrasts Caleb and Joshua's faith-filled minority report with the fear-driven majority who spent forty days letting facts erode the word of God, ultimately seeing themselves as grasshoppers before giants. He calls the congregation to filter every circumstance through the character of God — not to ignore the facts, but to refuse to let them displace faith.",                    vimeoId: "1174533492" },
  { id: 16, title: "Cheerful Givers, Open Hands",                  date: "2026-03-08", speaker: "Pastor Christine Disibio",  series: "Next Level Project",   scripture: "2 Corinthians 9:6–15",  scriptureBook: "2 Corinthians",  topics: ["Generosity", "Stewardship", "Faith"],                      description: "The pastor unpacks 2 Corinthians 9 to show that biblical giving flows from seeing every resource as a blessing from God rather than personal property. Using the church's building campaign as the backdrop, she calls the congregation to become cheerful, open-handed conduits of God's provision rather than holders of what they've earned.",                                                                                 vimeoId: "1171801290" },
  { id: 17, title: "Living Stones, New Space",                     date: "2026-03-01", speaker: "Pastor Josh Eldridge",      series: "Next Level Project",   scripture: "1 Peter 2:4–5",         scriptureBook: "1 Peter",        topics: ["Building Campaign", "Equipping the Church", "Living Stones"], description: "Pastor Josh launches the Next Level Project — developing 17,000 square feet beneath the sanctuary — while insisting that no building matters unless it builds people. Drawing from 1 Peter 2 and Ephesians 4, he presents the facility as a tool to equip living stones for ministry and calls the congregation to joyful, faith-filled generosity.",                                                                          vimeoId: "1170007846" },
  // ── Feb 2026 ─────────────────────────────────────────────────────
  { id: 18, title: "Father to the Fatherless",                     date: "2026-02-22", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "James 1:27",            scriptureBook: "James",          topics: ["Foster Care", "Orphans", "Compassion in Action"],          description: "Pastor Josh launches Cornerstone's Foster the City initiative, calling the church to be God's answer to the foster care crisis across New England. Drawing from Psalm 68, James 1, and Luke 4, he frames foster care as an act of biblical justice, and a church family shares their firsthand testimony of fostering and adoption.",                                                                                           vimeoId: "1167439262" },
  { id: 19, title: "Spiritual Maturity Produces Stability",        date: "2026-02-15", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Ephesians 4:11–16",     scriptureBook: "Ephesians",      topics: ["Spiritual Maturity", "Discernment", "Spiritual Stability"], description: "Pastor Josh teaches from Ephesians 4 and Hebrews 5 that spiritual maturity is the believer's surest defense against deception and division. He challenges the church to pursue Christlikeness rather than spiritual infancy, outlining three pathways to growth: giving no provision to the flesh, taking personal responsibility for formation, and making faith the operating system of daily life.",                      vimeoId: "1165710217" },
  { id: 20, title: "They Overcame by the Blood",                   date: "2026-02-08", speaker: "Pastor Christine Disibio",  series: null,                   scripture: "Revelation 12:7–12",    scriptureBook: "Revelation",     topics: ["Spiritual Warfare", "Deception", "Overcoming"],            description: "Pastor Christine opens in Revelation 12 to frame the cosmic battle between the kingdom of light and the kingdom of darkness, then traces Israel's conquest of Jericho to show how God's people overcome by the blood of the Lamb and the word of testimony. She calls the church to reject the enemy's deception, reclaim stolen ground, and align with heaven's agenda in a defining hour for New England.",                  vimeoId: "1163491840" },
  { id: 21, title: "Overcome by the Blood and Your Word",          date: "2026-02-01", speaker: "Pastor Christine Disibio",  series: null,                   scripture: "Revelation 12:11",      scriptureBook: "Revelation",     topics: ["Spiritual Warfare", "Testimony", "Blood of Christ"],       description: "Drawing from Revelation 12 and the Israelites' journey to the promised land, this message explores how believers overcome the enemy's deception through the blood of the Lamb and the spoken word of their testimony. The stories of the twelve spies and Joshua's conquest of Jericho illustrate the difference between faithless fear and Spirit-filled declaration.",                                                          vimeoId: "1161208296" },
  // ── Jan 2026 ─────────────────────────────────────────────────────
  { id: 22, title: "Meditate on His Word Day and Night",           date: "2026-01-18", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Joshua 1:8",            scriptureBook: "Joshua",         topics: ["Meditation", "Word of God", "Abiding in Christ"],          description: "Continuing in Joshua chapter 1, this message invites the congregation into the daily practice of meditating on Scripture, walking through Psalm 103 and Colossians 1 as a live demonstration. The pastor teaches that alignment with God's word — not striving — is the source of strength, courage, and lasting fruit.",                                                                                                    vimeoId: "1156529973" },
  { id: 23, title: "Walk Differently in His Authority",            date: "2026-01-11", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Joshua 1:3",            scriptureBook: "Joshua",         topics: ["Spiritual Authority", "Kingdom Advancement", "Identity in Christ"], description: "Rooted in the Hebrew meaning of 'tread' in Joshua 1:3, this message teaches that every place believers step, ground must bend under the delegated authority of Jesus. The promised land becomes a picture of the heart, home, and community — territory taken through active faith rather than passive waiting.",                                                                                                              vimeoId: "1153667593" },
  { id: 24, title: "From Hearing About God to Seeing Him",         date: "2026-01-04", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "Job 42:5",              scriptureBook: "Job",            topics: ["Encounter with God", "Revelation", "Spiritual Experience"], description: "Using Job 42:5 as its anchor, this New Year's message calls the church to move beyond accumulated knowledge into personal encounter with the living God. The sermon contrasts the Pharisees who knew scripture yet missed the incarnate Christ with Job, who moved from hearing about God to beholding him directly.",                                                                                                           vimeoId: "1151647996" },
  // ── Dec 2025 ─────────────────────────────────────────────────────
  { id: 25, title: "You Have the Material for Miracles",           date: "2025-12-28", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "John 6:5–13",           scriptureBook: "John",           topics: ["Faith", "Provision", "Miracles"],                          description: "From the feeding of the five thousand in John 6, this end-of-year message contrasts Philip's defeated calculation with Andrew's willingness to bring what little he had to Jesus. The sermon calls the church to enter the new year posturing themselves in faith — offering inadequate resources and trusting Jesus to multiply what they bring.",                                                                              vimeoId: "1150277732" },
  { id: 26, title: "Peace on Earth",                               date: "2025-12-21", speaker: "Pastor Josh Eldridge",      series: "Immanuel",             scripture: "Isaiah 9:6–7",          scriptureBook: "Isaiah",         topics: ["Christmas", "Peace", "Hope"],                              description: "Isaiah prophesied a peace that governments and policy could never produce. Pastor Christine unpacks the Prince of Peace and what his reign means for us here and now.",                                                                                                                                                                                                                                                     vimeoId: "1148819604" },
  { id: 27, title: "Prepare the Way",                              date: "2025-12-14", speaker: "Pastor Christine Disibio",  series: "Immanuel",             scripture: "Isaiah 40:3–5",         scriptureBook: "Isaiah",         topics: ["Advent", "Repentance", "Hope"],                            description: "Advent is not just waiting — it's preparing. This message looks at what it means to make the crooked places straight in our own hearts before the Lord arrives.",                                                                                                                                                                                                                                                          vimeoId: "1147457738" },
  { id: 28, title: "Light Has Come",                               date: "2025-12-07", speaker: "Pastor Josh Eldridge",      series: "Immanuel",             scripture: "John 1:1–14",           scriptureBook: "John",           topics: ["Advent", "Incarnation", "Identity"],                       description: "The Word became flesh and dwelt among us. Pastor Josh unpacks the stunning reality of the incarnation and why it changes everything about how we understand God.",                                                                                                                                                                                                                                                          vimeoId: "1146741973" },
  // ── The Grateful Life (Nov 2025) ─────────────────────────────────
  { id: 29, title: "Overflow",                                     date: "2025-11-30", speaker: "Pastor Josh Eldridge",      series: "The Grateful Life",    scripture: "Colossians 2:6–7",      scriptureBook: "Colossians",     topics: ["Gratitude", "Discipleship", "Renewal"],                    description: "Gratitude is not a posture we manufacture — it's the overflow of a life rooted in Christ. This message explores what it looks like to walk in him, built up in faith, and abounding in thanksgiving.",                                                                                                                                                                                                                     vimeoId: "1142311636" },
  { id: 30, title: "A Table in the Wilderness",                    date: "2025-11-23", speaker: "Pastor Josh Eldridge",      series: "The Grateful Life",    scripture: "Psalm 23:5",            scriptureBook: "Psalms",         topics: ["Gratitude", "Providence", "Hope"],                         description: "A Thanksgiving message on the God who sets a table in the middle of our hardest seasons. Gratitude doesn't wait for the battle to be over — it begins in the middle of it.",                                                                                                                                                                                                                                               vimeoId: "1140478824" },
  { id: 31, title: "1000 Reasons",                                 date: "2025-11-09", speaker: "Pastor Josh Eldridge",      series: "The Grateful Life",    scripture: "Psalm 103:1–5",         scriptureBook: "Psalms",         topics: ["Gratitude", "Worship", "Praise"],                          description: "David commands his own soul to bless the Lord. This message is an invitation into the discipline of counting — and discovering that the reasons to praise God always outnumber the reasons to despair.",                                                                                                                                                                                                                    vimeoId: "1135456123" },
  { id: 32, title: "The Gift of Today",                            date: "2025-11-02", speaker: "Pastor Josh Eldridge",      series: "The Grateful Life",    scripture: "James 4:13–15",         scriptureBook: "James",          topics: ["Gratitude", "Humility", "Purpose"],                        description: "You do not know what tomorrow will bring. Pastor Josh explores the theology of contingency in James 4 — and why acknowledging God's sovereignty over our days is a form of worship.",                                                                                                                                                                                                                                       vimeoId: "1133163360" },
  // ── Unshakeable (Oct 2025) ───────────────────────────────────────
  { id: 33, title: "The Rock That Cannot Move",                    date: "2025-10-26", speaker: "Pastor Josh Eldridge",      series: "Unshakeable",          scripture: "Matthew 7:24–27",       scriptureBook: "Matthew",        topics: ["Faith", "Obedience", "Perseverance"],                      description: "Two builders, two foundations, one storm. Jesus' parable of the wise and foolish builders is not about comfort — it's about survival. What you build on determines whether you stand.",                                                                                                                                                                                                                                    vimeoId: "1130984860" },
  { id: 34, title: "Standing Firm",                                date: "2025-10-19", speaker: "Pastor Josh Eldridge",      series: "Unshakeable",          scripture: "Ephesians 6:10–13",     scriptureBook: "Ephesians",      topics: ["Spiritual Warfare", "Faith", "Prayer"],                    description: "Put on the full armor of God. Pastor Christine unpacks Paul's military metaphor and calls the church into the kind of alert, praying, Spirit-filled stance that holds ground in the battle.",                                                                                                                                                                                                                               vimeoId: "1129037488" },
  { id: 35, title: "When the Ground Shifts",                       date: "2025-10-12", speaker: "Pastor Christine Disibio",  series: "Unshakeable",          scripture: "Psalm 46:1–3",          scriptureBook: "Psalms",         topics: ["Faith", "Trust", "Trials"],                                description: "Even if the earth gives way and the mountains fall into the sea — God is our refuge. This message is for everyone who has felt the ground shift beneath them.",                                                                                                                                                                                                                                                             vimeoId: "1126863290" },
  { id: 36, title: "The Anchor of Hope",                           date: "2025-10-05", speaker: "Pastor Josh Eldridge",      series: "Unshakeable",          scripture: "Hebrews 6:19–20",       scriptureBook: "Hebrews",        topics: ["Hope", "Faith", "Perseverance"],                           description: "An anchor holds when the storm comes. Pastor Josh walks through the Hebrews 6 image of hope as an anchor for the soul — firm and secure, entering the inner sanctuary.",                                                                                                                                                                                                                                                   vimeoId: "1124859675" },
  // ── Sep 2025 ─────────────────────────────────────────────────────
  { id: 37, title: "Walking in Step",                              date: "2025-09-21", speaker: "Pastor Christine Disibio",  series: null,                   scripture: "Galatians 5:25",        scriptureBook: "Galatians",      topics: ["Holy Spirit", "Discipleship", "Obedience"],                description: "If we live by the Spirit, let us also keep in step with the Spirit. This message explores what it means to move through ordinary life in moment-by-moment dependence on the Holy Spirit.",                                                                                                                                                                                                                                  vimeoId: "1121037198" },
  { id: 38, title: "One Body, Many Parts",                         date: "2025-09-14", speaker: "Pastor Josh Eldridge",      series: null,                   scripture: "1 Corinthians 12:12–27", scriptureBook: "1 Corinthians", topics: ["Community", "Spiritual Gifts", "Unity"],                   description: "The church is not a collection of individuals — it's a body. Pastor Christine unpacks the diversity and interdependence of the body of Christ and what it means when every part plays its role.",                                                                                                                                                                                                                           vimeoId: "1118820976" },
  // ── Summer in the Psalms (Aug 2025) ─────────────────────────────
  { id: 39, title: "My Refuge and My Fortress",                    date: "2025-08-31", speaker: "Pastor Josh Eldridge",      series: "Summer in the Psalms", scripture: "Psalm 91:1–2",          scriptureBook: "Psalms",         topics: ["Trust", "Protection", "Faith"],                            description: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. A deep dive into Psalm 91's promise of divine protection for those who make God their dwelling place.",                                                                                                                                                                                                                            vimeoId: "1115222159" },
  { id: 40, title: "Create in Me a Clean Heart",                   date: "2025-08-24", speaker: "Pastor Josh Eldridge",      series: "Summer in the Psalms", scripture: "Psalm 51:10–12",        scriptureBook: "Psalms",         topics: ["Repentance", "Renewal", "Holy Spirit"],                    description: "David's confession after his failure is one of the most honest prayers in Scripture. Pastor Josh walks through Psalm 51 — a model for what genuine repentance and restoration look like.",                                                                                                                                                                                                                                  vimeoId: "1113089070" },
  { id: 41, title: "The Lord Is My Shepherd",                      date: "2025-08-17", speaker: "Pastor Josh Eldridge",      series: "Summer in the Psalms", scripture: "Psalm 23:1–4",          scriptureBook: "Psalms",         topics: ["Providence", "Peace", "Trust"],                            description: "Six verses. Six promises. Psalm 23 is not a poem about dying peacefully — it's a declaration of confident trust in the Shepherd who guides, restores, and accompanies us through every valley.",                                                                                                                                                                                                                           vimeoId: "1111013558" },
  { id: 42, title: "Taste and See",                                date: "2025-08-10", speaker: "Pastor Josh Eldridge",      series: "Summer in the Psalms", scripture: "Psalm 34:8",            scriptureBook: "Psalms",         topics: ["Faith", "Worship", "Identity"],                            description: "Oh taste and see that the Lord is good. Pastor Christine unpacks the invitation of Psalm 34 — a call to experiential, not just intellectual, faith. God wants to be known, not just understood.",                                                                                                                                                                                                                          vimeoId: "1109134699" },
  { id: 43, title: "In the Shadow of His Wings",                   date: "2025-08-03", speaker: "Pastor Christine Disibio",  series: "Summer in the Psalms", scripture: "Psalm 63:7",            scriptureBook: "Psalms",         topics: ["Prayer", "Worship", "Rest"],                               description: "David writes from the wilderness — thirsty, exhausted, yet his soul clings to God. This message explores what it means to find satisfaction in God when everything else has run dry.",                                                                                                                                                                                                                                     vimeoId: "1107277729" },
  // ── Free Indeed (Jun–Jul 2025) ───────────────────────────────────
  { id: 44, title: "No Longer Slaves",                             date: "2025-07-27", speaker: "Pastor Christine Disibio",  series: "Free Indeed",          scripture: "Romans 8:14–17",        scriptureBook: "Romans",         topics: ["Identity", "Holy Spirit", "Freedom"],                      description: "You did not receive a spirit of slavery to fall back into fear — you received the Spirit of adoption. This message traces the shift from slavery to sonship and what it means to cry out 'Abba, Father.'",                                                                                                                                                                                                                 vimeoId: "1105188981" },
  { id: 45, title: "The Chains Are Gone",                          date: "2025-07-20", speaker: "Pastor Josh Eldridge",      series: "Free Indeed",          scripture: "Acts 16:25–34",         scriptureBook: "Acts",           topics: ["Freedom", "Praise", "Faith"],                              description: "Paul and Silas sang at midnight in a prison cell — and the chains fell off. Pastor Christine explores what midnight praise looks like and how the freedom we declare in worship becomes the freedom we walk in.",                                                                                                                                                                                                           vimeoId: "1103586046" },
  { id: 46, title: "Free to Serve",                                date: "2025-07-06", speaker: "Pastor Josh Eldridge",      series: "Free Indeed",          scripture: "Galatians 5:13–14",     scriptureBook: "Galatians",      topics: ["Freedom", "Service", "Love"],                              description: "You were called to freedom — but do not use that freedom as an opportunity for the flesh. The paradox of Christian freedom is that we are most free when we love and serve one another.",                                                                                                                                                                                                                                   vimeoId: "1099674516" },
  { id: 47, title: "The Door Is Open",                             date: "2025-06-29", speaker: "Pastor Josh Eldridge",      series: "Free Indeed",          scripture: "John 10:9–10",          scriptureBook: "John",           topics: ["Salvation", "Freedom", "Evangelism"],                      description: "Guest speaker Jeff Henderson brings a message on the open invitation of Jesus — the gate that leads to life, the thief that comes to steal, and what abundant life actually looks like.",                                                                                                                                                                                                                                   vimeoId: "1097703821" },
  { id: 48, title: "Whom the Son Sets Free",                       date: "2025-06-22", speaker: "Pastor Christine Disibio",  series: "Free Indeed",          scripture: "John 8:36",             scriptureBook: "John",           topics: ["Freedom", "Identity", "Truth"],                            description: "If the Son sets you free, you will be free indeed. This message explores the difference between the counterfeit freedom the world offers and the genuine, lasting freedom that comes through knowing the truth.",                                                                                                                                                                                                           vimeoId: "1095633513" },
  // ── Known and Loved (May–Jun 2025) ──────────────────────────────
  { id: 49, title: "You Are Seen",                                 date: "2025-06-15", speaker: "Pastor Josh Eldridge",      series: "Known and Loved",      scripture: "Genesis 16:13–14",      scriptureBook: "Genesis",        topics: ["Identity", "Faith", "Healing"],                            description: "Hagar, alone and forgotten, encounters a God who sees her. Pastor Christine unpacks this often-overlooked story — a message for anyone who has ever felt invisible to God or to others.",                                                                                                                                                                                                                                   vimeoId: "1093905131" },
  { id: 50, title: "Named and Known",                              date: "2025-06-08", speaker: "Pastor Josh Eldridge",      series: "Known and Loved",      scripture: "Isaiah 43:1",           scriptureBook: "Isaiah",         topics: ["Identity", "Belonging", "Community"],                      description: "Fear not, for I have redeemed you; I have called you by name, you are mine. This message unpacks the identity-defining declaration of Isaiah 43 and what it means to be named by God.",                                                                                                                                                                                                                                   vimeoId: "1092504332" },
  { id: 51, title: "The Father's Delight",                         date: "2025-06-01", speaker: "Pastor Josh Eldridge",      series: "Known and Loved",      scripture: "Zephaniah 3:17",        scriptureBook: "Zephaniah",      topics: ["Identity", "Love", "Worship"],                             description: "The Lord your God is in your midst — a mighty one who will save; he will rejoice over you with gladness. Pastor Josh explores one of Scripture's most stunning images: God singing over his people.",                                                                                                                                                                                                                       vimeoId: "1090158039" },
  { id: 52, title: "Nothing Can Separate Us",                      date: "2025-05-25", speaker: "Pastor Josh Eldridge",      series: "Known and Loved",      scripture: "Romans 8:38–39",        scriptureBook: "Romans",         topics: ["Love", "Identity", "Security"],                            description: "Neither death nor life, neither angels nor demons — nothing in all creation can separate us from the love of God. A message on the unbreakable security of belonging to Christ.",                                                                                                                                                                                                                                           vimeoId: "1088170030" },
  { id: 53, title: "Chosen Before the Foundation",                 date: "2025-05-18", speaker: "Pastor Josh Eldridge",      series: "Known and Loved",      scripture: "Ephesians 1:4–6",       scriptureBook: "Ephesians",      topics: ["Identity", "Grace", "Worship"],                            description: "Before the foundation of the world, God chose us in him to be holy and blameless. Pastor Christine unpacks the doctrine of election not as theological puzzle, but as the most personal love letter ever written.",                                                                                                                                                                                                         vimeoId: "1085908572" },
  // ── The Way of the Cross (Mar–May 2025) ─────────────────────────
  { id: 54, title: "The Woman Who Watched",                        date: "2025-05-11", speaker: "Pastor Avi Mizrachi",       series: "The Way of the Cross", scripture: "John 19:25–27",         scriptureBook: "John",           topics: ["Faithfulness", "Service", "Discipleship"],                 description: "A Mother's Day message on Mary standing at the foot of the cross. This message reflects on the faithfulness of those who stay when it costs them everything.",                                                                                                                                                                                                                                                             vimeoId: "1083645463" },
  { id: 55, title: "Resurrection Power",                           date: "2025-04-27", speaker: "Pastor Josh Eldridge",      series: "The Way of the Cross", scripture: "Philippians 3:10–11",   scriptureBook: "Philippians",    topics: ["Resurrection", "Transformation", "Hope"],                  description: "Paul wanted to know Christ and the power of his resurrection. This message explores how the same power that raised Jesus from the dead is active in the lives of those who are in him.",                                                                                                                                                                                                                                    vimeoId: "1080703165" },
  { id: 56, title: "He Is Risen",                                  date: "2025-04-20", speaker: "Pastor Josh Eldridge",      series: "The Way of the Cross", scripture: "Luke 24:1–12",          scriptureBook: "Luke",           topics: ["Resurrection", "Easter", "Hope"],                          description: "An Easter Sunday message on the empty tomb. The stone was rolled away not to let Jesus out — but to let us look in. What the disciples found on that Sunday morning changes everything.",                                                                                                                                                                                                                                   vimeoId: "1077295122" },
  { id: 57, title: "It Is Finished",                               date: "2025-04-13", speaker: "Pastor Josh Eldridge",      series: "The Way of the Cross", scripture: "John 19:28–30",         scriptureBook: "John",           topics: ["Atonement", "Grace", "Salvation"],                         description: "Tetelestai — it is finished. Pastor Christine unpacks the final word of Jesus on the cross and what it means that nothing remains to be done for our salvation.",                                                                                                                                                                                                                                                           vimeoId: "1075803507" },
  { id: 58, title: "Hosanna",                                      date: "2025-04-06", speaker: "Pastor Josh Eldridge",      series: "The Way of the Cross", scripture: "Mark 11:1–10",          scriptureBook: "Mark",           topics: ["Worship", "Salvation", "Discipleship"],                    description: "Palm Sunday: the crowd shouts Hosanna — save us now. This message explores the tension between the kingdom the crowds expected and the kingdom Jesus came to establish.",                                                                                                                                                                                                                                                   vimeoId: "1073352129" },
  { id: 59, title: "Betrayal and Grace",                           date: "2025-03-30", speaker: "Bob Hazlett",               series: "The Way of the Cross", scripture: "Luke 22:47–53",         scriptureBook: "Luke",           topics: ["Forgiveness", "Grace", "Discipleship"],                    description: "Judas betrayed Jesus with a kiss. Jesus called him friend. This message reflects on the stunning grace of a Savior who knew what was coming and loved anyway.",                                                                                                                                                                                                                                                             vimeoId: "1071114201" },
  { id: 60, title: "The Cost of Following",                        date: "2025-03-23", speaker: "Pastor Christine Disibio",  series: "The Way of the Cross", scripture: "Luke 9:23–26",          scriptureBook: "Luke",           topics: ["Discipleship", "Sacrifice", "Identity"],                   description: "Take up your cross daily and follow me. Not weekly, not occasionally — daily. This message unpacks the radical, ordinary, costly invitation of Jesus to walk the way of the cross.",                                                                                                                                                                                                                                        vimeoId: "1069285446" }
];

let allSermons = [];
let activeFilters = { search: '', series: '', speaker: '', topic: '', book: '' };

function loadSermons() {
  allSermons = SERMON_DATA;
  populateFilters();
  renderSermons();
}

function populateFilters() {
  const series   = [...new Set(allSermons.map(s => s.series).filter(Boolean))].sort();
  const speakers = [...new Set(allSermons.map(s => s.speaker))].sort();
  const topics   = [...new Set(allSermons.flatMap(s => s.topics))].sort();
  const books    = [...new Set(allSermons.map(s => s.scriptureBook))].sort();

  fillSelect('filter-series',  series,   'All Series');
  fillSelect('filter-speaker', speakers, 'All Speakers');
  fillSelect('filter-topic',   topics,   'All Topics');
  fillSelect('filter-book',    books,    'All Scripture');
}

function fillSelect(id, values, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
}

function getFiltered() {
  return allSermons.filter(s => {
    const q = activeFilters.search.toLowerCase();
    const matchSearch = !q ||
      s.title.toLowerCase().includes(q) ||
      s.speaker.toLowerCase().includes(q) ||
      (s.series || '').toLowerCase().includes(q) ||
      s.scripture.toLowerCase().includes(q) ||
      s.topics.some(t => t.toLowerCase().includes(q)) ||
      s.description.toLowerCase().includes(q);
    const matchSeries  = !activeFilters.series  || s.series === activeFilters.series;
    const matchSpeaker = !activeFilters.speaker || s.speaker === activeFilters.speaker;
    const matchTopic   = !activeFilters.topic   || s.topics.includes(activeFilters.topic);
    const matchBook    = !activeFilters.book    || s.scriptureBook === activeFilters.book;
    return matchSearch && matchSeries && matchSpeaker && matchTopic && matchBook;
  });
}

function renderSermons() {
  const filtered = getFiltered();
  const grid = document.getElementById('sermons-grid');
  const count = document.getElementById('filter-results');
  if (!grid) return;

  count.textContent = `${filtered.length} sermon${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <p class="label">No results</p>
        <p class="body-text">Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  const gradients = [
    'linear-gradient(135deg, #1a1d2c 0%, #2a2040 100%)',
    'linear-gradient(135deg, #0f1a1a 0%, #1a3030 100%)',
    'linear-gradient(135deg, #1a160a 0%, #332a10 100%)',
    'linear-gradient(135deg, #1a0f0f 0%, #2a1818 100%)',
    'linear-gradient(135deg, #0a1a1a 0%, #103028 100%)',
  ];

  grid.innerHTML = filtered.map((s, i) => `
    <article class="sermon-card" style="cursor:pointer;" data-id="${s.id}">
      <div class="sermon-thumb">
        <div class="sermon-thumb-placeholder" style="background:${gradients[i % gradients.length]}"></div>
        ${s.series ? `<span class="sermon-series-badge">${s.series}</span>` : ''}
        <div class="sermon-play-btn">
          <div class="sermon-play-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="sermon-body">
        <div class="sermon-meta">
          <span class="sermon-speaker">${s.speaker}</span>
          <span class="sermon-date">${formatDate(s.date)}</span>
        </div>
        <h3 class="sermon-title">${s.title}</h3>
        <div class="sermon-scripture">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          ${s.scripture}
        </div>
        <p class="sermon-description">${s.description}</p>
        <div class="sermon-topics">
          ${s.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');

  renderActiveFilters();

  grid.querySelectorAll('.sermon-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const sermon = allSermons.find(s => s.id === parseInt(card.dataset.id));
      if (sermon) openVideoModal(sermon);
    });
  });
}

function renderActiveFilters() {
  const wrap = document.getElementById('active-filters');
  if (!wrap) return;
  const chips = [];

  if (activeFilters.series)  chips.push({ key: 'series',  label: activeFilters.series });
  if (activeFilters.speaker) chips.push({ key: 'speaker', label: activeFilters.speaker });
  if (activeFilters.topic)   chips.push({ key: 'topic',   label: activeFilters.topic });
  if (activeFilters.book)    chips.push({ key: 'book',    label: activeFilters.book });

  if (chips.length === 0) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = chips.map(c => `
    <span class="active-filter-chip" data-key="${c.key}">
      ${c.label} <span class="chip-x">×</span>
    </span>
  `).join('') + `<span class="clear-filters">Clear all</span>`;

  wrap.querySelectorAll('.active-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.key;
      activeFilters[key] = '';
      const sel = document.getElementById(`filter-${key}`);
      if (sel) sel.value = '';
      updateSelectStates();
      renderSermons();
    });
  });

  wrap.querySelector('.clear-filters')?.addEventListener('click', clearAllFilters);
}

function clearAllFilters() {
  activeFilters = { search: '', series: '', speaker: '', topic: '', book: '' };
  document.getElementById('filter-search').value = '';
  ['filter-series', 'filter-speaker', 'filter-topic', 'filter-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  updateSelectStates();
  renderSermons();
}

function updateSelectStates() {
  ['filter-series', 'filter-speaker', 'filter-topic', 'filter-book'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id.replace('filter-', '');
    el.classList.toggle('active', !!activeFilters[key]);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openVideoModal(sermon) {
  const backdrop = document.getElementById('video-modal-backdrop');
  document.getElementById('video-modal-iframe').src =
    `https://player.vimeo.com/video/${sermon.vimeoId}?autoplay=1&color=3689C5&title=0&byline=0&portrait=0`;
  document.getElementById('modal-series').textContent = sermon.series || '';
  document.getElementById('modal-title').textContent = sermon.title;
  document.getElementById('modal-speaker').innerHTML =
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${sermon.speaker}`;
  document.getElementById('modal-scripture').innerHTML =
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> ${sermon.scripture}`;
  document.getElementById('modal-date').innerHTML =
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatDate(sermon.date)}`;
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const backdrop = document.getElementById('video-modal-backdrop');
  backdrop.classList.remove('open');
  document.getElementById('video-modal-iframe').src = '';
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  loadSermons();

  document.getElementById('video-modal-close')?.addEventListener('click', closeVideoModal);
  document.getElementById('video-modal-backdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeVideoModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeVideoModal();
  });

  document.getElementById('filter-search')?.addEventListener('input', e => {
    activeFilters.search = e.target.value;
    renderSermons();
  });

  ['series', 'speaker', 'topic', 'book'].forEach(key => {
    document.getElementById(`filter-${key}`)?.addEventListener('change', e => {
      activeFilters[key] = e.target.value;
      updateSelectStates();
      renderSermons();
    });
  });
});
