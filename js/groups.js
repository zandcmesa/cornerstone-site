const GROUPS_DATA = {
  'kingdom-kids': {
    name: 'Kingdom Kids',
    category: "Children's Ministry",
    schedule: 'Sundays · During Service',
    location: 'Cornerstone Church — Kids Wing',
    leader: 'Kingdom Kids Team',
    enrollment: 'open',
    ctaText: 'Connect on Planning Center',
    description: `Kingdom Kids is Cornerstone's children's ministry for kids from birth through 5th grade. Each Sunday, kids experience age-appropriate worship, Bible teaching, and community during the main service. Our nursery cares for infants and toddlers, while our elementary programming helps kids build a foundation of faith through interactive lessons and small group discussion.\n\nKingdom Kids runs concurrently with the Sunday morning service at 10:00am. No registration is required for Sunday attendance — just check in at the kids wing when you arrive. Use Planning Center to stay connected, receive updates, and get involved in the parent community.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/cornerstone-kid-s-parents',
    gradient: 'linear-gradient(135deg,#1a1d2c,#2a2040)',
    image: 'images/kingdom-kids.png',
  },
  'youth-group': {
    name: 'Youth Group',
    category: 'Ministries',
    schedule: 'Wednesdays · 6:00pm',
    location: 'Cornerstone Church',
    leader: 'Youth Ministry Team',
    enrollment: 'open',
    ctaText: 'Join This Group',
    description: `Cornerstone Youth is a weekly gathering for middle and high school students — a space for authentic worship, relevant teaching, and real friendships. Wednesday nights are built around community: students eat together, worship together, and dig into Scripture in small groups.\n\nWe believe teenagers are not the future of the church — they're the church right now. Youth Group is open to all middle and high schoolers in the East Longmeadow area. No signup required to attend, but connect on Planning Center to stay in the loop.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/youth-group',
    gradient: 'linear-gradient(135deg,#0f1a1a,#1a3030)',
    image: null,
  },
  'young-adults': {
    name: 'Young Adults',
    category: 'Ministries',
    schedule: 'Select Fridays · 7:00pm',
    location: 'Cornerstone Church',
    leader: 'Young Adults Team',
    enrollment: 'open',
    ctaText: 'Join This Group',
    description: `Cornerstone Young Adults is a community for college students and young professionals navigating their 20s and 30s. Gathering on select Friday nights, it's a space for real conversation about faith, purpose, and life — with worship, teaching, and time to connect with people in the same season.\n\nCheck the events page for upcoming Friday dates. New faces are always welcome — no signup required to attend. Connect on Planning Center to get notified about upcoming gatherings.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/young-adults',
    gradient: 'linear-gradient(135deg,#1a0a1a,#2a1030)',
    image: 'images/cornerstone-young-adults.png',
  },
  'high-praise-dance': {
    name: 'High Praise Dance',
    category: 'Ministries',
    schedule: 'Rehearsal schedule varies',
    location: 'Cornerstone Church',
    leader: 'High Praise Dance Ministry',
    enrollment: 'open',
    ctaText: 'Get Involved',
    description: `High Praise Dance is a worship dance ministry that expresses praise through movement — an offering of creativity and skill to God. The ministry leads at special services and events throughout the year, and hosts an annual summer dance camp open to all ages.\n\nNo professional experience required — just a heart for worship and a willingness to learn. Connect on Planning Center to get in touch with the team, learn about the next rehearsal cycle, or register for the summer camp.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/high-praise-dance',
    gradient: 'linear-gradient(135deg,#1a160a,#332a10)',
    image: 'images/high-praise-dance.png',
  },
  'worship-team': {
    name: 'Worship Team',
    category: 'Ministries',
    schedule: 'Sundays · Rehearsal TBD',
    location: 'Cornerstone Church',
    leader: 'Cornerstone Worship',
    enrollment: 'open',
    ctaText: 'Audition on Planning Center',
    description: `The Worship Team leads Cornerstone's Sunday morning services in song — a rotating team of musicians and vocalists who prepare weekly to create space for the congregation to encounter God.\n\nAuditions are currently open for vocalists and instrumentalists. If you have musical experience and a desire to serve, connect with us through Planning Center. Team members commit to regular rehearsals and a rotating Sunday schedule.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/ministries/worship-team',
    gradient: 'linear-gradient(135deg,#1a0f0f,#2a1818)',
    image: null,
  },
  'hospitality-team': {
    name: 'Hospitality Team',
    category: 'Serve at Cornerstone',
    schedule: 'Sundays · Rotating schedule',
    location: 'Cornerstone Church',
    leader: 'Hospitality Team',
    enrollment: 'open',
    ctaText: 'Sign Up to Serve',
    description: `The Hospitality Team is the first face people see when they walk through Cornerstone's doors — greeters, ushers, and the people who make sure every guest feels genuinely welcomed. It's a simple role with real impact: first impressions matter.\n\nTeam members serve on a rotating Sunday schedule. No special skills required — just a warm presence and a love for people. Sign up through Planning Center to get connected and receive your first serve date.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-at-cornerstone/hospitality-team',
    gradient: 'linear-gradient(135deg,#0a1a1a,#103028)',
    image: null,
  },
  'media-production': {
    name: 'Media & Production',
    category: 'Serve at Cornerstone',
    schedule: 'Sundays · Setup from 8:30am',
    location: 'Cornerstone Church',
    leader: 'Media & Production Team',
    enrollment: 'open',
    ctaText: 'Sign Up to Serve',
    description: `The Media & Production Team runs the technical side of Sunday services — sound, video, graphics, and live streaming for our online audience. This team keeps everything running smoothly so the rest of the church can focus on worship.\n\nWe're looking for people with any level of technical interest — whether you're an experienced audio engineer or just curious about how it all works, there's a role for you. Training is provided. Sign up through Planning Center to connect with the team.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-at-cornerstone/media-and-production',
    gradient: 'linear-gradient(135deg,#1a1d2c,#2a2040)',
    image: null,
  },
  'prayer-team': {
    name: 'Prayer Team',
    category: 'Serve at Cornerstone',
    schedule: 'Wed 7pm · Thu 12pm · Fri 7pm',
    location: 'Cornerstone Church & Remote',
    leader: 'Prayer Coordinators',
    enrollment: 'open',
    ctaText: 'Join This Group',
    description: `The Prayer Team is the intercession engine behind everything Cornerstone does. Members commit to regular prayer for the church, the pastoral staff, the community, and the region — and gather for corporate prayer throughout the week.\n\nPrayer times include Wednesday evenings at 7:00pm, Thursday afternoons at 12:00pm, and Friday evenings at 7:00pm. This is a flexible commitment — join when you can, grow as you go. Connect on Planning Center to be added to the prayer network.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-at-cornerstone/prayer-team',
    gradient: 'linear-gradient(135deg,#1a160a,#332a10)',
    image: null,
  },
  'christinas-house': {
    name: "Christina's House",
    category: 'Serve in Our Community',
    schedule: 'Opportunities vary',
    location: 'East Longmeadow, MA',
    leader: 'Community Outreach Team',
    enrollment: 'open',
    ctaText: 'Sign Up to Serve',
    description: `Christina's House provides transitional housing and support services for women and families experiencing housing crisis in the greater Springfield area. Cornerstone partners with this ministry through volunteer service, donation drives, and ongoing prayer.\n\nServe opportunities include move-in days, meal prep, and relational support. Sign up through Planning Center to be notified when the next serve opportunity opens — no prior experience needed.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-in-the-community/christinas-house',
    gradient: 'linear-gradient(135deg,#0a1a1a,#103028)',
    image: null,
  },
  'hills-food-fair': {
    name: 'Hills Food Fair',
    category: 'Serve in Our Community',
    schedule: 'Monthly · Dates vary',
    location: 'East Longmeadow, MA',
    leader: 'Community Outreach Team',
    enrollment: 'open',
    ctaText: 'Sign Up to Serve',
    description: `Hills Food Fair is a monthly food distribution that serves families in need across the East Longmeadow area. Volunteers help stock shelves, organize distributions, and connect with neighbors who rely on this resource.\n\nThis is one of Cornerstone's most tangible community touchpoints — a practical way to serve the neighborhood you live in. Sign up through Planning Center for the next available date.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-in-the-community/hills-food-fair',
    gradient: 'linear-gradient(135deg,#1a1d2c,#2a2040)',
    image: null,
  },
  'between-bridges': {
    name: 'Between Bridges',
    category: 'Serve in Our Community',
    schedule: 'Opportunities vary',
    location: 'Springfield, MA',
    leader: 'Community Outreach Team',
    enrollment: 'open',
    ctaText: 'Sign Up to Serve',
    description: `Between Bridges works to connect people experiencing homelessness with stable housing, community resources, and long-term support. Cornerstone's partnership involves regular volunteer teams, financial support, and relationship-based outreach in the Springfield area.\n\nThis is relational, on-the-ground work that requires a steady presence. Sign up through Planning Center to attend an orientation or join the next serve team.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/serve-in-the-community/between-bridges',
    gradient: 'linear-gradient(135deg,#1a160a,#332a10)',
    image: null,
  },
  'irreplaceable-book-study': {
    name: '"Irreplaceable" Book Study',
    category: 'Unique Groups',
    schedule: 'Tuesdays · 7:00pm · July – August',
    location: 'Cornerstone Church',
    leader: 'Study Facilitators',
    enrollment: 'open',
    ctaText: 'Join This Group',
    description: `A summer book study running through July and August. Open to all — no prior sign-up required. Drop in any Tuesday night at 7:00pm.\n\nThis is a low-commitment, open-door gathering. Come once, come every week — the door is always open. Connect on Planning Center to stay updated on discussion materials and any schedule changes.`,
    pcoUrl: 'https://cornerstonechurchma.churchcenter.com/groups/unique-groups/irreplaceable-book-study',
    gradient: 'linear-gradient(135deg,#1a1d2c,#2a204a)',
    image: null,
  },
};

// Group detail modal
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
    groupLeader.textContent = g.leader;

    // Enrollment badge
    const labels = { open: 'Open to Join', full: 'Currently Full', closed: 'Enrollment Closed' };
    groupEnrollment.textContent = labels[g.enrollment] || '';
    groupEnrollment.className = `group-modal-enrollment enrollment-${g.enrollment}`;

    // Description
    groupDescription.innerHTML = g.description
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('');

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

  document.querySelectorAll('[data-group-id]').forEach(el => {
    el.addEventListener('click', () => openGroupModal(el.dataset.groupId));
  });
}
