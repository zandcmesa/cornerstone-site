const EVENTS_DATA = {
  'high-praise-dance': {
    title: 'High Praise Dance',
    dateMonth: 'Oct', dateDay: '8',
    time: 'Thursdays', location: 'Cornerstone Church',
    label: 'Registration Open',
    description: `High Praise Dance is Cornerstone's worship dance ministry — expressing praise to God through movement. A new session begins Thursday, October 8, and is open to all skill levels, from first-timers to experienced dancers.\n\nRegister through Church Center to save your spot.`,
    hasRegistration: true, ctaText: 'Register on Church Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/registrations/events/3895209',
    gradient: 'linear-gradient(135deg,#1a0f1a,#2a1a2a)', wikiKeyword: null,
  },
  'youth-group': {
    title: 'Youth Group Relaunch',
    dateMonth: 'Oct', dateDay: '21',
    time: 'Wednesdays · 6–8pm', location: 'Cornerstone Church',
    label: 'Youth Ministry',
    description: `Youth Group is back. Beginning Wednesday, October 21, students gather every week from 6 to 8pm for worship, friendship, and real conversations about faith.\n\nNo sign-up needed — just show up. Bring a friend.`,
    hasRegistration: false, ctaText: null, pcoUrl: null,
    gradient: 'linear-gradient(135deg,#0a1a2a,#102840)', wikiKeyword: null,
  },
  'kingdom-kids-volunteer': {
    title: 'Kingdom Kids Volunteer',
    dateMonth: 'Every', dateDay: 'Sun',
    time: 'Sundays · 10am', location: 'Cornerstone Church',
    label: 'Children\'s Ministry',
    description: `Kingdom Kids is Cornerstone's children's ministry serving kids from infancy through 5th grade during Sunday morning service. We need volunteers to help create a safe, fun, and faith-building environment for the next generation.\n\nWhether you're great with toddlers or older kids, there's a place for you. Sign up through Church Center to join the team.`,
    hasRegistration: true, ctaText: 'Sign Up on Church Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/registrations/events/1733161',
    gradient: 'linear-gradient(135deg,#0f1a0f,#1a301a)', wikiKeyword: 'Sunday school',
  },
};

window.PCO_UI = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = text => esc(text).replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const paragraphs = text => String(text || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${linkify(p).replace(/\n/g, '<br>')}</p>`).join('');
  const ORDINAL = { first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', last: 'Last' };

  const compactTime = t => String(t)
    .replace(/(\d{1,2}):00/g, '$1')
    .replace(/\s*([ap])\.?\s?m\.?/gi, (m, p) => p.toLowerCase() + 'm')
    .replace(/\s*[\u2013\u2014-]\s*/g, '\u2013')
    .replace(/(\d)(am|pm)\u2013(\d[\d:]*)\2/g, '$1\u2013$3$2');

  const brief = text => {
    let t = String(text == null ? '' : text).trim();
    if (!t) return '';
    t = t
      .replace(/^meets\s+/i, '')
      .replace(/^(weekly|bi-?weekly|monthly)\s+on\s+/i, (m, f) => /week/i.test(f) && !/bi/i.test(f) ? '' : f + ' \u00b7 ')
      .replace(/^(?:the\s+)?(first|second|third|fourth|fifth|last)\s+(\w+day)\s+of\s+(?:every|the)\s+month/i, (m, o, d) => ORDINAL[o.toLowerCase()] + ' ' + d + ' monthly')
      .replace(/^(\d+(?:st|nd|rd|th))\s+(\w+day)\s+of\s+the\s+month/i, '$1 $2 monthly')
      .replace(/^every\s+(\w+day)/i, '$1s')
      .replace(/^every\s+/i, '')
      .replace(/\s*,?\s+depending on .*$/i, '')
      .replace(/\s+from\s+/i, ' \u00b7 ')
      .replace(/\s*@\s*/g, ' \u00b7 ');
    t = compactTime(t).replace(/\s{2,}/g, ' ').trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  return {
    esc, linkify, paragraphs, brief,
    CLOCK: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    PIN: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };
}());
(function () {
  const { esc, brief, CLOCK, PIN } = window.PCO_UI;
  const LABELS = { rhythm: 'Weekly Gathering', event: 'Upcoming Event', signup: 'Registration Open' };

  function row(e) {
    EVENTS_DATA[e.id] = {
      title: e.title, dateMonth: e.dateMonth, dateDay: e.dateDay, time: e.time, location: e.location,
      label: e.kind === 'signup' && !e.startsAt ? 'Next Step' : LABELS[e.kind],
      description: e.description || 'See Church Center for full details.',
      ctaText: e.pcoUrl ? (e.kind === 'rhythm' ? 'View on Church Center' : e.ctaText === 'Sign Up' ? 'Sign Up on Church Center' : 'Register on Church Center') : null,
      pcoUrl: e.pcoUrl || null,
    };
    const primary = e.kind === 'signup' || e.ctaText === 'Register';
    const dayStyle = e.dateDay.length > 2 ? ' style="font-size:18px;line-height:1.4;"' : '';
    return '<div class="event-row">' +
      '<div class="event-date-block"><div class="event-date-month">' + esc(e.dateMonth) + '</div><div class="event-date-day"' + dayStyle + '>' + esc(e.dateDay) + '</div></div>' +
      '<div class="event-info"><div class="event-info-title">' + esc(e.title) + '</div>' +
      '<div class="event-info-meta"><span>' + CLOCK + ' ' + esc(brief(e.time)) + '</span><span>' + PIN + ' ' + esc(e.location) + '</span></div></div>' +
      '<button class="btn ' + (primary ? 'btn-primary' : 'btn-outline') + ' btn-sm" data-event-id="' + esc(e.id) + '">' + esc(e.ctaText || 'Details') + '</button></div>';
  }

  function fill(selector, items, emptyText) {
    document.querySelectorAll(selector).forEach(list => {
      const limit = parseInt(list.dataset.pcoLimit) || items.length;
      const slice = items.slice(0, limit);
      list.innerHTML = slice.length ? slice.map(row).join('') : '<p class="body-text" style="color:var(--text-muted);">' + esc(emptyText) + '</p>';
      if (window.Blocks) window.Blocks.scan(list.parentElement || list);
    });
  }

  function render(snap) {
    fill('[data-pco-rhythms]', snap.rhythms, 'Weekly gatherings will appear here.');
    const now = Date.now();
    fill('[data-pco-events]', snap.events.filter(e => !e.startsAt || new Date(e.startsAt).getTime() > now), 'No upcoming events yet. Check back soon.');
    fill('[data-pco-next-steps]', snap.nextSteps, 'Nothing open right now.');
    document.querySelectorAll('[data-pco-month]').forEach(el => {
      el.textContent = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
    });
  }

  if (window.PCO) window.PCO.onData(render);
}());

const eventBackdrop = document.getElementById('event-modal-backdrop');
if (eventBackdrop) {
  const eventMonth       = document.getElementById('event-modal-month');
  const eventDay         = document.getElementById('event-modal-day');
  const eventLabel       = document.getElementById('event-modal-label');
  const eventTitle       = document.getElementById('event-modal-title');
  const eventTime        = document.getElementById('event-modal-time');
  const eventLocation    = document.getElementById('event-modal-location');
  const eventDescription = document.getElementById('event-modal-description');
  const eventFooter      = document.getElementById('event-modal-footer');
  const eventFooterNote  = document.getElementById('event-modal-footer-note');
  const eventCta         = document.getElementById('event-modal-cta');

  function openEventModal(eventId) {
    const e = EVENTS_DATA[eventId];
    if (!e) return;

    eventMonth.textContent = e.dateMonth;
    eventDay.textContent = e.dateDay;
    eventLabel.textContent = e.label;
    eventTitle.textContent = e.title;
    eventTime.textContent = window.PCO_UI.brief(e.time);
    eventLocation.textContent = e.location;
    eventDescription.innerHTML = window.PCO_UI.paragraphs(e.description);

    if (e.ctaText && e.pcoUrl) {
      eventFooter.style.display = '';
      eventFooterNote.textContent = 'Opens Planning Center in a new tab.';
      eventCta.textContent = e.ctaText;
      eventCta.href = e.pcoUrl;
    } else {
      eventFooter.style.display = 'none';
    }

    eventBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeEventModal() {
    eventBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('event-modal-close').addEventListener('click', closeEventModal);
  eventBackdrop.addEventListener('click', e => {
    if (e.target === eventBackdrop) closeEventModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && eventBackdrop.classList.contains('open')) closeEventModal();
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-event-id]');
    if (btn) openEventModal(btn.dataset.eventId);
  });
}

function fetchAnnouncementImages() {
  document.querySelectorAll('.wiki-thumb[data-wiki]').forEach(async img => {
    if (img.closest('.sermon-thumb')) return;
    const article = img.dataset.wiki;
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`);
      if (!res.ok) return;
      const data = await res.json();
      const src = data.originalimage?.source || data.thumbnail?.source;
      if (src) { img.src = src; img.onload = () => img.classList.add('loaded'); }
    } catch {}
  });
}
fetchAnnouncementImages();
