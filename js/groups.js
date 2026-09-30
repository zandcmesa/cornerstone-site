const GROUPS_DATA = {};

const GROUP_OVERRIDES = {
  '807069':  { name: 'Kingdom Kids', image: 'images/kingdom-kids.png', description: "Kingdom Kids is Cornerstone's children's ministry for kids from birth through 5th grade. Each Sunday, kids experience age-appropriate worship, Bible teaching, and community during the main service.\n\nNo registration is required for Sunday attendance — just check in at the kids wing when you arrive. Join the parents group on Church Center to stay connected." },
  '1711298': { image: 'images/cornerstone-young-adults.png' },
  '1896063': { image: 'images/high-praise-dance.png' },
};

const TYPE_FALLBACK_DESC = {
  'Ministries': "Kids, youth, worship, and more — find where you're called to serve within the church.",
  'Growth Groups': 'Small groups meeting in homes and at the church to grow together in Scripture and friendship.',
  'Unique Groups': 'Specialty gatherings for specific seasons of life, interests, or growth goals.',
};

const GRADIENTS = [
  'linear-gradient(135deg,#1a1d2c,#2a2040)', 'linear-gradient(135deg,#0f1a1a,#1a3030)', 'linear-gradient(135deg,#1a0a1a,#2a1030)',
  'linear-gradient(135deg,#1a160a,#332a10)', 'linear-gradient(135deg,#1a0f0f,#2a1818)', 'linear-gradient(135deg,#0a1a1a,#103028)',
  'linear-gradient(135deg,#0a1a2a,#102840)',
];

(function () {
  const { esc, brief } = window.PCO_UI;
  const gradientFor = id => GRADIENTS[String(id).split('').reduce((n, c) => n + c.charCodeAt(0), 0) % GRADIENTS.length];
  const monogram = name => name.split(/[\s|]+/).filter(w => /^[a-z0-9]/i.test(w) && !/^(and|of|the|at|in|our|for)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const JOIN = { open_signup: 'Open to join', request_to_join: 'Request to join' };
  const PILL = { open: 'Open', full: 'Full', closed: 'Closed' };

  function card(g, typeName) {
    const o = GROUP_OVERRIDES[g.id] || {};
    const name = o.name || g.name;
    GROUPS_DATA[g.id] = {
      name, category: typeName,
      schedule: brief(g.schedule) || 'See Church Center for schedule',
      location: g.location || 'Cornerstone Church',
      enrollment: g.enrollment, strategy: g.strategy,
      ctaText: g.enrollment === 'open' ? (g.strategy === 'open_signup' ? 'Join This Group' : 'Request to Join') : 'View on Church Center',
      description: o.description || g.description || 'See Church Center for details.',
      pcoUrl: g.pcoUrl, gradient: gradientFor(g.id), image: o.image || null,
    };
    const pill = g.enrollment !== 'open' ? '<span class="group-card-pill pill-' + g.enrollment + '">' + PILL[g.enrollment] + '</span>' : '';
    const inner = o.image
      ? ' has-logo" style="background:' + gradientFor(g.id) + ';">' + pill + '<img src="' + esc(o.image) + '" alt="' + esc(name) + '">'
      : '" style="background:' + gradientFor(g.id) + ';">' + pill + '<div class="group-card-monogram">' + esc(monogram(name)) + '</div>';
    return '<div class="group-card" tabindex="0" role="button" data-group-id="' + esc(g.id) + '">' +
      '<div class="group-card-image' + inner + '</div>' +
      '<div class="group-card-body"><div class="group-card-day">' + esc(brief(g.schedule) || (g.enrollment === 'open' && JOIN[g.strategy]) || '') + '</div>' +
      '<div class="group-card-name">' + esc(name) + '</div>' +
      '<div class="group-card-desc">' + esc(o.description || g.description || '') + '</div></div></div>';
  }

  function renderPage(snap) {
    document.querySelectorAll('[data-pco-groups]').forEach(root => {
      root.innerHTML = snap.groupTypes.map(t => {
        const groups = snap.groups.filter(g => g.typeId === t.id);
        const desc = t.description || TYPE_FALLBACK_DESC[t.name] || '';
        return '<div id="' + esc(t.slug) + '">' +
          '<div class="group-category-header" data-reveal><h2 class="group-category-title">' + esc(t.name) + '</h2>' +
          '<span class="group-count-badge">' + groups.length + (groups.length === 1 ? ' group' : ' groups') + '</span></div>' +
          (desc ? '<p class="group-category-desc">' + esc(desc) + '</p>' : '') +
          '<div class="groups-grid" data-reveal-stagger>' + groups.map(g => card(g, t.name)).join('') + '</div></div>';
      }).join('');
      if (window.Blocks) window.Blocks.scan(root);
    });
    document.querySelectorAll('[data-pco-group-count]').forEach(el => { el.textContent = 'View all ' + snap.groups.length + ' groups →'; });
  }

  const ICON = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3689C5" stroke-width="1.5" opacity="0.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  function renderTypeCards(snap) {
    document.querySelectorAll('[data-pco-group-types]').forEach(root => {
      root.innerHTML = snap.groupTypes.map((t, i) =>
        '<a class="group-card" href="groups.html#' + esc(t.slug) + '">' +
        '<div class="group-card-image"><div style="width:100%;height:100%;background:' + GRADIENTS[i % GRADIENTS.length] + ';display:flex;align-items:center;justify-content:center;">' + ICON + '</div></div>' +
        '<div class="group-card-body"><div class="group-card-day">' + t.count + (t.count === 1 ? ' group' : ' groups') + '</div>' +
        '<div class="group-card-name">' + esc(t.name) + '</div>' +
        '<div class="group-card-desc">' + esc(t.description || TYPE_FALLBACK_DESC[t.name] || '') + '</div></div></a>'
      ).join('');
      if (window.Blocks) window.Blocks.scan(root.parentElement || root);
    });
  }

  if (window.PCO) window.PCO.onData(snap => { renderPage(snap); renderTypeCards(snap); });
}());

const groupBackdrop = document.getElementById('group-modal-backdrop');
if (groupBackdrop) {
  const groupBanner      = document.getElementById('group-modal-banner');
  const groupCategory    = document.getElementById('group-modal-category');
  const groupName        = document.getElementById('group-modal-name');
  const groupSchedule    = document.getElementById('group-modal-schedule');
  const groupLocation    = document.getElementById('group-modal-location');
  const groupLeader      = document.getElementById('group-modal-leader');
  const groupEnrollment  = document.getElementById('group-modal-enrollment');
  const groupDescription = document.getElementById('group-modal-description');
  const groupCta         = document.getElementById('group-modal-cta');

  function openGroupModal(groupId) {
    const g = GROUPS_DATA[groupId];
    if (!g) return;

    // Banner
    groupBanner.style.background = g.gradient;
    if (g.image) {
      groupBanner.style.backgroundImage = `url('${g.image}')`;
      groupBanner.style.backgroundSize = 'cover';
      groupBanner.style.backgroundPosition = 'center';
    } else {
      groupBanner.style.backgroundImage = 'none';
    }

    // Header content
    groupCategory.textContent = g.category;
    groupName.textContent = g.name;

    // Meta
    groupSchedule.textContent = g.schedule;
    groupLocation.textContent = g.location;
    groupLeader.parentElement.style.display = 'none';

    // Enrollment badge
    const labels = { open: 'Open to Join', full: 'Currently Full', closed: 'Enrollment Closed' };
    groupEnrollment.textContent = labels[g.enrollment] || '';
    groupEnrollment.className = `group-modal-enrollment enrollment-${g.enrollment}`;

    // Description
    groupDescription.innerHTML = window.PCO_UI.paragraphs(g.description);

    // CTA
    groupCta.textContent = g.ctaText;
    groupCta.href = g.pcoUrl;

    groupBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeGroupModal() {
    groupBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('group-modal-close').addEventListener('click', closeGroupModal);
  groupBackdrop.addEventListener('click', e => {
    if (e.target === groupBackdrop) closeGroupModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && groupBackdrop.classList.contains('open')) closeGroupModal();
  });

  document.addEventListener('click', e => {
    const card = e.target.closest('[data-group-id]');
    if (card) openGroupModal(card.dataset.groupId);
  });
  document.addEventListener('keydown', e => {
    const card = e.target.closest('[data-group-id]');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openGroupModal(card.dataset.groupId); }
  });
}
