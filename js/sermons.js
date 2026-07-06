const SERMON_DATA = [
  { id: 1, title: "The River of His Presence", date: "2026-06-29", speaker: "Pastor Josh Eldridge", series: "Abiding Revival", scripture: "John 7:37–39", scriptureBook: "John", topics: ["Holy Spirit", "Revival", "Prayer"], description: "What does it mean to live from a place of overflow? Pastor Josh explores the invitation of Jesus to drink deeply of the Spirit and become rivers of living water in our communities.", vimeoId: "1001" },
  { id: 2, title: "When the Fire Falls", date: "2026-06-22", speaker: "Pastor Christine Disibio", series: "Abiding Revival", scripture: "Acts 2:1–4", scriptureBook: "Acts", topics: ["Holy Spirit", "Revival", "Worship"], description: "The outpouring at Pentecost wasn't a one-time event — it was a pattern. Pastor Christine unpacks what it looks like to create the conditions for revival in our personal lives and as a church.", vimeoId: "1002" },
  { id: 3, title: "Rooted and Abiding", date: "2026-06-15", speaker: "Pastor Josh Eldridge", series: "Abiding Revival", scripture: "John 15:1–8", scriptureBook: "John", topics: ["Discipleship", "Prayer", "Obedience"], description: "Fruitfulness is not the result of effort — it's the overflow of abiding. This message explores the vine-and-branch relationship Jesus describes and what it means to remain in him daily.", vimeoId: "1003" },
  { id: 4, title: "The Weight of His Glory", date: "2026-06-08", speaker: "Dr. Lynn Lucas", series: "Abiding Revival", scripture: "Isaiah 6:1–8", scriptureBook: "Isaiah", topics: ["Worship", "Identity", "Holy Spirit"], description: "An encounter with God's glory changes everything. Dr. Lynn Lucas walks through Isaiah's vision and what it means when the holiness of God invades our ordinary lives.", vimeoId: "1004" },
  { id: 5, title: "Pray Until Something Happens", date: "2026-06-01", speaker: "Pastor Josh Eldridge", series: "Abiding Revival", scripture: "Luke 18:1–8", scriptureBook: "Luke", topics: ["Prayer", "Faith", "Perseverance"], description: "The parable of the persistent widow is not a lesson in nagging God — it's an invitation into a life of relentless, faith-filled prayer. Pastor Josh unpacks the posture behind the petition.", vimeoId: "1005" },
  { id: 6, title: "Focused on What Matters", date: "2026-05-25", speaker: "Pastor Josh Eldridge", series: "Focused. Faithful. Fervent.", scripture: "Philippians 3:12–16", scriptureBook: "Philippians", topics: ["Purpose", "Discipleship", "Obedience"], description: "Paul's single-minded pursuit of Christ offers a framework for a life that doesn't drift. This message calls us to the kind of focused living that produces lasting fruit.", vimeoId: "1006" },
  { id: 7, title: "Faithful in the Small Things", date: "2026-05-18", speaker: "Pastor Christine Disibio", series: "Focused. Faithful. Fervent.", scripture: "Matthew 25:14–23", scriptureBook: "Matthew", topics: ["Faithfulness", "Discipleship", "Service"], description: "God is not impressed by scale — he is moved by faithfulness. Pastor Christine explores the theology of small things and why everyday obedience is the training ground for greater impact.", vimeoId: "1007" },
  { id: 8, title: "The Fervent Prayer", date: "2026-05-11", speaker: "Pastor Josh Eldridge", series: "Focused. Faithful. Fervent.", scripture: "James 5:16–18", scriptureBook: "James", topics: ["Prayer", "Faith", "Healing"], description: "Elijah was a man just like us — and his prayers moved heaven and earth. This message digs into what made his prayer effective and how we can pray with the same fervency.", vimeoId: "1008" },
  { id: 9, title: "Running the Race", date: "2026-05-04", speaker: "Jeff Henderson", series: "Focused. Faithful. Fervent.", scripture: "Hebrews 12:1–3", scriptureBook: "Hebrews", topics: ["Faith", "Perseverance", "Community"], description: "Guest speaker Jeff Henderson brings a message on the long obedience of faith — what it means to run with endurance, fix our eyes on Jesus, and not grow weary in the race.", vimeoId: "1009" },
  { id: 10, title: "Set Apart", date: "2026-04-27", speaker: "Pastor Josh Eldridge", series: "Focused. Faithful. Fervent.", scripture: "Romans 12:1–2", scriptureBook: "Romans", topics: ["Identity", "Transformation", "Obedience"], description: "Living sacrifice. Renewed mind. Non-conformity to the patterns of this world. Paul's call in Romans 12 is a blueprint for a life that is fully consecrated to God.", vimeoId: "1010" },
  { id: 11, title: "The Rhythm of Rest", date: "2026-04-20", speaker: "Pastor Christine Disibio", series: "Rhythms of a Revivalist", scripture: "Matthew 11:28–30", scriptureBook: "Matthew", topics: ["Rest", "Grace", "Renewal"], description: "Revival doesn't come from exhaustion — it comes from rest in God. Pastor Christine unpacks the counterintuitive truth that sustainable fruitfulness flows from the rhythm of yoke-bearing with Jesus.", vimeoId: "1011" },
  { id: 12, title: "Fasting as a Lifestyle", date: "2026-04-13", speaker: "Pastor Josh Eldridge", series: "Rhythms of a Revivalist", scripture: "Isaiah 58:6–9", scriptureBook: "Isaiah", topics: ["Fasting", "Prayer", "Revival"], description: "The fast God chooses is not a religious discipline — it's a posture of heart. This message explores Isaiah 58 and what it means to fast in a way that loosens chains and breaks bondage.", vimeoId: "1012" },
  { id: 13, title: "Solitude and the Saturated Soul", date: "2026-04-06", speaker: "Pastor Josh Eldridge", series: "Rhythms of a Revivalist", scripture: "Mark 1:35", scriptureBook: "Mark", topics: ["Prayer", "Renewal", "Discipleship"], description: "Jesus regularly withdrew to lonely places and prayed. In a world that rewards noise, this message makes the case for solitude as one of the most radical spiritual practices available to us.", vimeoId: "1013" },
  { id: 14, title: "The Table and the Towel", date: "2026-03-30", speaker: "Pastor Christine Disibio", series: "Rhythms of a Revivalist", scripture: "John 13:1–17", scriptureBook: "John", topics: ["Service", "Humility", "Community"], description: "On the night of his betrayal, Jesus took a towel and washed feet. Pastor Christine unpacks the radical servant-leadership of the upper room and what it means to pick up the towel in our own lives.", vimeoId: "1014" },
  { id: 15, title: "The Lowly Way", date: "2026-03-23", speaker: "Pastor Josh Eldridge", series: "Humility", scripture: "Philippians 2:3–11", scriptureBook: "Philippians", topics: ["Humility", "Identity", "Service"], description: "The mind of Christ is the mind of humility. This message traces the kenosis of Philippians 2 — the self-emptying of God in Christ — and calls us into the same posture of downward mobility.", vimeoId: "1015" },
  { id: 16, title: "Pride's Long Shadow", date: "2026-03-16", speaker: "Dr. Lynn Lucas", series: "Humility", scripture: "Proverbs 16:18", scriptureBook: "Proverbs", topics: ["Humility", "Wisdom", "Repentance"], description: "Dr. Lynn Lucas examines the anatomy of pride — how it enters quietly, grows subtly, and ultimately destroys relationships, callings, and communities — and what genuine humility looks like in its place.", vimeoId: "1016" },
  { id: 17, title: "Small and Sent", date: "2026-03-09", speaker: "Pastor Josh Eldridge", series: "Humility", scripture: "1 Corinthians 1:26–31", scriptureBook: "1 Corinthians", topics: ["Humility", "Identity", "Evangelism"], description: "God does not choose the strong to shame the weak — he chooses the weak to shame the strong. A liberating reminder that faithfulness, not impressiveness, is what God is after.", vimeoId: "1017" },
  { id: 18, title: "Bread of Life", date: "2026-03-02", speaker: "Pastor Christine Disibio", series: "Spiritual Feast", scripture: "John 6:35", scriptureBook: "John", topics: ["Identity", "Faith", "Scripture"], description: "Jesus doesn't just give bread — he is bread. Pastor Christine explores the I AM declaration of John 6 and what it means to be truly satisfied in Christ in a world of endless appetites.", vimeoId: "1018" },
  { id: 19, title: "Feasting on the Word", date: "2026-02-23", speaker: "Pastor Josh Eldridge", series: "Spiritual Feast", scripture: "Psalm 119:103", scriptureBook: "Psalms", topics: ["Scripture", "Discipleship", "Renewal"], description: "The Psalmist says God's words are sweeter than honey. This message makes a case for Scripture not as religious duty but as genuine spiritual sustenance — and gives practical handles for a life saturated in God's word.", vimeoId: "1019" },
  { id: 20, title: "When the Table Is Prepared", date: "2026-02-16", speaker: "Pastor Josh Eldridge", series: "Spiritual Feast", scripture: "Psalm 23:5", scriptureBook: "Psalms", topics: ["Hope", "Faith", "Identity"], description: "God prepares a table in the presence of our enemies — not after the battle, but in the middle of it. A word of stubborn hope for those walking through difficult seasons.", vimeoId: "1020" },
  { id: 21, title: "The Worship We Owe", date: "2026-02-09", speaker: "Pastor Josh Eldridge", series: "Worship", scripture: "Romans 12:1", scriptureBook: "Romans", topics: ["Worship", "Identity", "Obedience"], description: "True worship is not what happens on Sunday morning — it's what we do with our bodies Monday through Saturday. This message reframes worship as the reasonable response to grace.", vimeoId: "1021" },
  { id: 22, title: "Spirit and Truth", date: "2026-02-02", speaker: "Pastor Christine Disibio", series: "Worship", scripture: "John 4:23–24", scriptureBook: "John", topics: ["Worship", "Holy Spirit", "Truth"], description: "Jesus tells the woman at the well that the Father seeks worshipers who worship in Spirit and in truth. What does it mean to bring both the heart and the mind to God?", vimeoId: "1022" },
  { id: 23, title: "A Sacrifice of Praise", date: "2026-01-26", speaker: "Pastor Josh Eldridge", series: "Worship", scripture: "Hebrews 13:15", scriptureBook: "Hebrews", topics: ["Worship", "Faith", "Perseverance"], description: "The sacrifice of praise is not praise when everything is good — it's praise when everything is hard. This message explores the act of offering worship even in the wilderness and what it produces in us.", vimeoId: "1023" },
  { id: 24, title: "Glory in the Ordinary", date: "2026-01-19", speaker: "Dr. Lynn Lucas", series: "Worship", scripture: "Colossians 3:17", scriptureBook: "Colossians", topics: ["Worship", "Purpose", "Discipleship"], description: "Whatever you do, do it in the name of the Lord Jesus. Dr. Lynn Lucas explores the revolutionary idea that our work, our meals, our conversations — all of it — can be acts of worship.", vimeoId: "1024" }
];

let allSermons = [];
let activeFilters = { search: '', series: '', speaker: '', topic: '', book: '' };

function loadSermons() {
  allSermons = SERMON_DATA;
  populateFilters();
  renderSermons();
}

function populateFilters() {
  const series   = [...new Set(allSermons.map(s => s.series))].sort();
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
      s.series.toLowerCase().includes(q) ||
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
    <article class="sermon-card">
      <div class="sermon-thumb">
        <div class="sermon-thumb-placeholder" style="background:${gradients[i % gradients.length]}"></div>
        <span class="sermon-series-badge">${s.series}</span>
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

document.addEventListener('DOMContentLoaded', () => {
  loadSermons();

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
