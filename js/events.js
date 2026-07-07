const EVENTS_DATA = {
  'church-at-the-park': {
    title: 'Church at the Park',
    dateMonth: 'Jul', dateDay: '26',
    time: 'Morning', location: 'East Longmeadow, MA',
    label: 'Community Event',
    description: `Church at the Park is our annual community gathering — a morning of service, connection, and celebration outside. We'll be collecting non-perishable food donations for the local food pantry. Bring a can, bring a friend, and come ready to serve.\n\nThis is a free event open to everyone in the community. No registration required — just show up, meet your neighbors, and be part of something good.`,
    hasRegistration: false, ctaText: null, pcoUrl: null,
    gradient: 'linear-gradient(135deg,#1a2a1a,#2a402a)', wikiKeyword: 'City park',
  },
  'breakfast-mizrachi': {
    title: 'Breakfast with Avi & Chaya Mizrachi',
    dateMonth: 'Aug', dateDay: '1',
    time: 'Morning', location: 'Cornerstone Church',
    label: 'Special Event',
    description: `Join us for a special morning with Avi and Chaya Mizrachi, founders of the Dugit Messianic Outreach Center in Tel Aviv, Israel — one of Cornerstone's long-term global mission partners.\n\nAvi and Chaya will share what God is doing in Israel and among the Jewish people. This is a rare opportunity to hear firsthand from the field. Registration is required — space is limited.`,
    hasRegistration: true, ctaText: 'Register on Planning Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/registrations',
    gradient: 'linear-gradient(135deg,#1a1a2c,#252540)', wikiKeyword: 'Tel Aviv',
  },
  'irreplaceable-study': {
    title: '"Irreplaceable" Book Study',
    dateMonth: 'Jul–Aug', dateDay: 'Tue',
    time: 'Tuesdays · 7:00pm', location: 'Cornerstone Church',
    label: 'Recurring · Drop-in',
    description: `A summer book study meeting every Tuesday evening through July and August. Open to all — no prior sign-up required. Drop in any Tuesday at 7:00pm.\n\nThis is a low-commitment, open-door gathering. Come once, come every week — the door is always open. Connect on Planning Center to stay updated on discussion materials and schedule changes.`,
    hasRegistration: false, ctaText: 'Connect on Planning Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/unique-groups/irreplaceable-book-study',
    gradient: 'linear-gradient(135deg,#1a160a,#332a10)', wikiKeyword: 'Reading (process)',
  },
  'dance-camp': {
    title: 'High Praise Dance Camp',
    dateMonth: 'Aug', dateDay: '10–14',
    time: 'Aug 10–14 · All Day', location: 'Cornerstone Church',
    label: 'Multi-day Event',
    description: `A five-day summer dance camp celebrating worship through movement. Open to all ages and all skill levels — from first-timers to experienced dancers. Registration is now open and spots are limited.\n\nThe camp runs Monday through Friday, August 10–14. Each day combines technique, choreography, and worship — led by the High Praise Dance Ministry team. Register through Planning Center to secure your spot.`,
    hasRegistration: true, ctaText: 'Register on Planning Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/registrations',
    gradient: 'linear-gradient(135deg,#1a0f1a,#2a1a2a)', wikiKeyword: 'Liturgical dance',
  },
  'young-adults': {
    title: 'Young Adults',
    dateMonth: 'Jul & Aug', dateDay: 'Fri',
    time: 'Select Fridays · 7:00pm', location: 'Cornerstone Church',
    label: 'Ministry Gathering',
    description: `Cornerstone Young Adults gathers on select Friday nights through the summer — a space for college students and young professionals to connect around faith, worship, and honest conversation.\n\nFriday dates vary — check Planning Center for the current schedule. No signup required to attend.`,
    hasRegistration: false, ctaText: 'View on Planning Center',
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/young-adults',
    gradient: 'linear-gradient(135deg,#1a0a1a,#2a1030)', wikiKeyword: null,
  },
};

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
    eventTime.textContent = e.time;
    eventLocation.textContent = e.location;
    eventDescription.innerHTML = e.description
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('');

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

  document.querySelectorAll('[data-event-id]').forEach(el => {
    el.addEventListener('click', () => openEventModal(el.dataset.eventId));
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
