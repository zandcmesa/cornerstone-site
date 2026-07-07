// Nav scroll behavior + mobile menu
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    // Close mobile menu on scroll
    if (nav.classList.contains('menu-open')) {
      nav.classList.remove('menu-open');
      const menuBtn = nav.querySelector('.nav-menu-btn');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  const menuBtn = nav.querySelector('.nav-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });
    // Close drawer when a mobile link is clicked
    nav.querySelectorAll('.nav-mobile-links a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// Mark active nav link (desktop + mobile)
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile-links a').forEach(link => {
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

// ─── Contact modal ────────────────────────────────────────────
(function () {
  // Inject modal + toast stack HTML once
  const modalHTML = `
<div class="contact-modal-backdrop" id="contact-modal-backdrop">
  <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
    <div class="contact-modal-header">
      <div style="width:32px"></div>
      <div class="contact-modal-title" id="contact-modal-title">Contact Us</div>
      <button class="contact-modal-close" id="contact-modal-close" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="contact-modal-body">
      <p class="contact-form-note">Fields marked with a <span>*</span> are required</p>
      <form id="contact-form" novalidate>
        <div class="contact-field">
          <label for="cf-type">Inquiry Type<span class="req">*</span></label>
          <select id="cf-type" name="type" required>
            <option value="" disabled selected></option>
            <option value="General">General</option>
            <option value="Prayer">Prayer</option>
            <option value="Testimony">Testimony</option>
          </select>
        </div>
        <div class="contact-field">
          <label for="cf-name">Name<span class="req">*</span></label>
          <input type="text" id="cf-name" name="name" required autocomplete="name">
        </div>
        <div class="contact-field">
          <label for="cf-email">Email<span class="req">*</span></label>
          <input type="email" id="cf-email" name="email" required autocomplete="email">
        </div>
        <div class="contact-field">
          <label for="cf-message">Message<span class="req">*</span></label>
          <textarea id="cf-message" name="message" required></textarea>
        </div>
        <div class="contact-form-actions">
          <button type="submit" class="contact-submit" id="contact-submit">Send Message</button>
        </div>
      </form>
    </div>
  </div>
</div>
<div class="toast-stack" id="toast-stack"></div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const backdrop = document.getElementById('contact-modal-backdrop');
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const toastStack = document.getElementById('toast-stack');

  // Store field values for retry pre-fill
  let savedValues = {};

  function openContactModal(prefill) {
    if (prefill) {
      document.getElementById('cf-type').value = prefill.type || '';
      document.getElementById('cf-name').value = prefill.name || '';
      document.getElementById('cf-email').value = prefill.email || '';
      document.getElementById('cf-message').value = prefill.message || '';
    }
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeContactModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('contact-modal-close').addEventListener('click', closeContactModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeContactModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeContactModal();
  });

  // Toast system
  function showToast({ type, message, onRetry }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSVG = type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    const retryHTML = onRetry
      ? `<button class="toast-retry">Try again</button>`
      : '';

    toast.innerHTML = `
      <span class="toast-icon">${iconSVG}</span>
      <div class="toast-content">
        <span class="toast-msg">${message}${retryHTML}</span>
      </div>
      <button class="toast-dismiss" aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;

    toastStack.appendChild(toast);

    function dismiss() {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }

    toast.querySelector('.toast-dismiss').addEventListener('click', dismiss);

    if (onRetry) {
      toast.querySelector('.toast-retry').addEventListener('click', () => {
        dismiss();
        openContactModal(savedValues);
      });
    }

    if (type === 'success') {
      setTimeout(dismiss, 4000);
    }
  }

  // Form submit
  form.addEventListener('submit', e => {
    e.preventDefault();

    savedValues = {
      type: document.getElementById('cf-type').value,
      name: document.getElementById('cf-name').value,
      email: document.getElementById('cf-email').value,
      message: document.getElementById('cf-message').value,
    };

    // Simple required field check
    if (!savedValues.type || !savedValues.name || !savedValues.email || !savedValues.message) {
      showToast({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    // Mock submit — simulate network delay then randomly succeed/fail for demo realism
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      closeContactModal();

      // Always succeed in the demo (comment out and use Math.random() to demo error path)
      const success = true;
      if (success) {
        form.reset();
        savedValues = {};
        showToast({ type: 'success', message: 'Message sent — we\'ll be in touch.' });
      } else {
        showToast({
          type: 'error',
          message: 'Something went wrong.',
          onRetry: true,
        });
      }
    }, 1200);
  });

  // Wire up all contact modal triggers
  document.querySelectorAll('[data-contact-modal]').forEach(el => {
    el.addEventListener('click', () => openContactModal());
  });
}());
