// Nav scroll behavior
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mark active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Hero video cross-fade
const heroVideoA = document.querySelector('.hero-video-a');
const heroVideoB = document.querySelector('.hero-video-b');
if (heroVideoA && heroVideoB) {
  const HOLD_MS = 9000;
  const FADE_MS = 2500;
  let current = 'a';
  heroVideoA.addEventListener('canplay', function() {
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow) eyebrow.classList.add('highlight-in');
  }, { once: true });

  setTimeout(function crossfade() {
    if (current === 'a') {
      heroVideoA.style.opacity = '0';
      heroVideoB.style.opacity = '1';
      current = 'b';
    } else {
      heroVideoB.style.opacity = '0';
      heroVideoA.style.opacity = '1';
      current = 'a';
    }
    setTimeout(crossfade, HOLD_MS + FADE_MS);
  }, HOLD_MS);
}

// Sermon thumbnail color placeholders (cycling palette)
const placeholderGradients = [
  'linear-gradient(135deg, #1a1d2c 0%, #2a2040 100%)',
  'linear-gradient(135deg, #0f1a1a 0%, #1a3030 100%)',
  'linear-gradient(135deg, #1a160a 0%, #332a10 100%)',
  'linear-gradient(135deg, #1a0f0f 0%, #2a1818 100%)',
  'linear-gradient(135deg, #0a1a1a 0%, #103028 100%)',
];
document.querySelectorAll('.sermon-thumb-placeholder').forEach((el, i) => {
  el.style.background = placeholderGradients[i % placeholderGradients.length];
});

// PCO modal
const pcoBackdrop = document.getElementById('pco-modal-backdrop');
if (pcoBackdrop) {
  const pcoIframe = document.getElementById('pco-modal-iframe');
  const pcoTitle = document.getElementById('pco-modal-title');
  const pcoLoading = document.getElementById('pco-modal-loading');
  const pcoFallback = document.getElementById('pco-modal-fallback');
  const pcoFallbackLink = document.getElementById('pco-modal-fallback-link');

  // These paths block cross-origin iframing (X-Frame-Options: SAMEORIGIN)
  const NON_EMBEDDABLE = ['/groups', '/registrations', '/sign-ups'];

  function openPCOModal(url, title) {
    const isEmbeddable = !NON_EMBEDDABLE.some(p => url.includes(p));

    pcoTitle.textContent = title;
    pcoIframe.classList.remove('loaded');

    if (isEmbeddable) {
      pcoLoading.style.display = 'flex';
      pcoFallback.style.display = 'none';
      pcoIframe.src = url;
    } else {
      pcoLoading.style.display = 'none';
      pcoFallback.style.display = 'flex';
      pcoFallbackLink.href = url;
      pcoIframe.src = '';
    }

    pcoBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePCOModal() {
    pcoBackdrop.classList.remove('open');
    pcoIframe.src = '';
    pcoIframe.classList.remove('loaded');
    document.body.style.overflow = '';
  }

  pcoIframe.addEventListener('load', () => {
    if (pcoIframe.src) {
      pcoLoading.style.display = 'none';
      pcoIframe.classList.add('loaded');
    }
  });

  document.getElementById('pco-modal-close').addEventListener('click', closePCOModal);
  pcoBackdrop.addEventListener('click', e => {
    if (e.target === pcoBackdrop) closePCOModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pcoBackdrop.classList.contains('open')) closePCOModal();
  });

  document.querySelectorAll('[data-pco-url]').forEach(el => {
    el.addEventListener('click', () => {
      openPCOModal(el.dataset.pcoUrl, el.dataset.pcoTitle || '');
    });
  });
}
