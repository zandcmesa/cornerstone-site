// ─── Accessible modal helper ──────────────────────────────────
// Shared by every modal on the site: adds the backdrop's .open class,
// moves focus into the dialog, keeps Tab inside it, makes the rest of
// the page inert, closes on Escape, and returns focus to the trigger.
window.A11yModal = (function () {
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
  const stack = [];

  function focusables(root) {
    return Array.from(root.querySelectorAll(FOCUSABLE)).filter(el => !el.dataset.sentinel && el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]'));
  }

  // Invisible tab stops at both ends of the dialog. Focus leaving an embedded
  // iframe (where keydown can't be observed) lands on one of these and is
  // wrapped back to the opposite end of the dialog.
  function addSentinels(dialog) {
    if (dialog.dataset.sentinels) return;
    dialog.dataset.sentinels = '1';
    ['start', 'end'].forEach(where => {
      const s = document.createElement('span');
      s.tabIndex = 0;
      s.className = 'focus-sentinel';
      s.dataset.sentinel = where;
      if (where === 'start') dialog.prepend(s); else dialog.append(s);
    });
    dialog.addEventListener('focusin', e => {
      const where = e.target.dataset && e.target.dataset.sentinel;
      if (!where) return;
      const items = focusables(dialog);
      if (!items.length) { dialog.focus(); return; }
      (where === 'start' ? items[items.length - 1] : items[0]).focus();
    });
  }

  function onKeydown(e) {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (top.onEscape) top.onEscape(); else close(top.backdrop);
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables(top.dialog);
    if (!items.length) { e.preventDefault(); top.dialog.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    const inside = top.dialog.contains(active);
    if (e.shiftKey && (!inside || active === first || active === top.dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (!inside || active === last)) { e.preventDefault(); first.focus(); }
  }

  function setInert(backdrop, on) {
    // Walk from the backdrop up to <body>, making every sibling at each level inert,
    // so the modal stays usable wherever it sits in the DOM.
    let node = backdrop;
    while (node && node.parentElement) {
      Array.from(node.parentElement.children).forEach(el => {
        if (el === node || el.tagName === 'SCRIPT') return;
        if (on) {
          if (!el.hasAttribute('inert')) { el.setAttribute('inert', ''); el.dataset.a11yInert = '1'; }
        } else if (el.dataset.a11yInert) {
          el.removeAttribute('inert');
          delete el.dataset.a11yInert;
        }
      });
      node = node.parentElement;
      if (node === document.body) break;
    }
  }

  function open(backdrop, opts) {
    opts = opts || {};
    if (stack.some(s => s.backdrop === backdrop)) return;
    const dialog = backdrop.querySelector('[role="dialog"]') || backdrop.firstElementChild;
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    addSentinels(dialog);
    const entry = { backdrop, dialog, onEscape: opts.onEscape, trigger: document.activeElement };
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    setInert(backdrop, true);
    if (!stack.length) document.addEventListener('keydown', onKeydown, true);
    stack.push(entry);
    let target = null;
    if (typeof opts.initialFocus === 'string') target = dialog.querySelector(opts.initialFocus);
    else if (opts.initialFocus) target = opts.initialFocus;
    requestAnimationFrame(() => { (target || dialog).focus(); });
  }

  function close(backdrop) {
    const i = stack.findIndex(s => s.backdrop === backdrop);
    backdrop.classList.remove('open');
    if (i === -1) return;
    const entry = stack.splice(i, 1)[0];
    if (!stack.length) {
      setInert(backdrop, false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown, true);
    }
    const t = entry.trigger;
    if (t && typeof t.focus === 'function' && t !== document.body && document.contains(t)) t.focus();
  }

  function isOpen(backdrop) { return stack.some(s => s.backdrop === backdrop); }

  return { open, close, isOpen };
}());

// Nav scroll behavior + mobile menu
const nav = document.querySelector('.nav');
if (nav) {
  const menuBtn = nav.querySelector('.nav-menu-btn');
  const drawer = nav.querySelector('.nav-mobile-drawer');

  function setMenu(open, returnFocus) {
    nav.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if (!open && returnFocus && menuBtn && drawer && drawer.contains(document.activeElement)) menuBtn.focus();
  }

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    // Close mobile menu on scroll
    if (nav.classList.contains('menu-open')) setMenu(false, true);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
    // Close drawer when a mobile link is clicked
    nav.querySelectorAll('.nav-mobile-links a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });
    // Escape closes the drawer and returns focus to the menu button
    nav.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('menu-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    // Tabbing out of the drawer closes it so focus never lands behind it
    nav.addEventListener('focusout', e => {
      if (nav.classList.contains('menu-open') && e.relatedTarget && !nav.contains(e.relatedTarget)) setMenu(false);
    });
  }
}

// Mark active nav link (desktop + mobile)
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});

// Links that open a new tab say so to screen reader users
document.querySelectorAll('a[target="_blank"]').forEach(a => {
  if (a.querySelector('.sr-only')) return;
  const label = a.getAttribute('aria-label');
  if (label) {
    if (!/new tab/i.test(label)) a.setAttribute('aria-label', label + ' (opens in a new tab)');
  } else {
    a.insertAdjacentHTML('beforeend', '<span class="sr-only"> (opens in a new tab)</span>');
  }
});

// Hero video cross-fade + pause control
const heroVideoA = document.querySelector('.hero-video-a');
const heroVideoB = document.querySelector('.hero-video-b');
if (heroVideoA && heroVideoB) {
  const HOLD_MS = 9000;
  const FADE_MS = 2500;
  let current = 'a';
  let playing = true;
  heroVideoA.addEventListener('canplay', function() {
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow) eyebrow.classList.add('highlight-in');
  }, { once: true });

  setTimeout(function crossfade() {
    if (playing) {
      if (current === 'a') {
        heroVideoA.style.opacity = '0';
        heroVideoB.style.opacity = '1';
        current = 'b';
      } else {
        heroVideoB.style.opacity = '0';
        heroVideoA.style.opacity = '1';
        current = 'a';
      }
    }
    setTimeout(crossfade, HOLD_MS + FADE_MS);
  }, HOLD_MS);

  const toggle = document.querySelector('[data-hero-video-toggle]');
  const label = toggle ? toggle.querySelector('.hero-video-toggle-label') : null;
  function setPlaying(on) {
    playing = on;
    [heroVideoA, heroVideoB].forEach(v => {
      if (on) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    });
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(!on));
      if (label) label.textContent = on ? 'Pause video' : 'Play video';
    }
  }
  if (toggle) toggle.addEventListener('click', () => setPlaying(!playing));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
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
    pcoIframe.title = title ? title + ' – Planning Center' : 'Planning Center';

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

    window.A11yModal.open(pcoBackdrop, { onEscape: closePCOModal, initialFocus: isEmbeddable ? null : '#pco-modal-fallback-link' });
  }

  function closePCOModal() {
    window.A11yModal.close(pcoBackdrop);
    pcoIframe.src = '';
    pcoIframe.classList.remove('loaded');
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

  document.querySelectorAll('[data-pco-url]').forEach(el => {
    el.addEventListener('click', () => {
      openPCOModal(el.dataset.pcoUrl, el.dataset.pcoTitle || '');
    });
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPCOModal(el.dataset.pcoUrl, el.dataset.pcoTitle || '');
        }
      });
    }
  });
}

// ─── Contact modal ────────────────────────────────────────────
(function () {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mnpnwblr';
  const modalHTML = `
<div class="contact-modal-backdrop" id="contact-modal-backdrop">
  <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" tabindex="-1">
    <div class="contact-modal-header">
      <div style="width:32px"></div>
      <h2 class="contact-modal-title" id="contact-modal-title">Contact Us</h2>
      <button type="button" class="contact-modal-close" id="contact-modal-close" aria-label="Close contact form">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="contact-modal-body">
      <p class="contact-form-note" id="contact-form-note">Fields marked with a <span aria-hidden="true">*</span><span class="sr-only">star</span> are required</p>
      <form id="contact-form" novalidate aria-describedby="contact-form-note">
        <div class="contact-field">
          <label for="cf-type">Inquiry Type<span class="req" aria-hidden="true">*</span></label>
          <select id="cf-type" name="type" required aria-required="true">
            <option value="" disabled selected>Select one</option>
            <option value="General">General</option>
            <option value="Prayer">Prayer</option>
            <option value="Testimony">Testimony</option>
          </select>
        </div>
        <div class="contact-field">
          <label for="cf-name">Name<span class="req" aria-hidden="true">*</span></label>
          <input type="text" id="cf-name" name="name" required aria-required="true" autocomplete="name">
        </div>
        <div class="contact-field">
          <label for="cf-email">Email<span class="req" aria-hidden="true">*</span></label>
          <input type="email" id="cf-email" name="email" required aria-required="true" autocomplete="email">
        </div>
        <div class="contact-field">
          <label for="cf-message">Message<span class="req" aria-hidden="true">*</span></label>
          <textarea id="cf-message" name="message" required aria-required="true"></textarea>
        </div>
        <input type="text" id="cf-gotcha" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;" aria-hidden="true">
        <div class="contact-form-actions">
          <button type="submit" class="contact-submit" id="contact-submit">Send Message</button>
        </div>
      </form>
    </div>
  </div>
</div>
<div class="toast-stack" id="toast-stack" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const backdrop = document.getElementById('contact-modal-backdrop');
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const toastStack = document.getElementById('toast-stack');
  const FIELDS = ['cf-type', 'cf-name', 'cf-email', 'cf-message'];

  // Store field values for retry pre-fill
  let savedValues = {};

  function openContactModal(prefill) {
    if (prefill) {
      document.getElementById('cf-type').value = prefill.type || '';
      document.getElementById('cf-name').value = prefill.name || '';
      document.getElementById('cf-email').value = prefill.email || '';
      document.getElementById('cf-message').value = prefill.message || '';
    }
    window.A11yModal.open(backdrop, { onEscape: closeContactModal, initialFocus: '#cf-type' });
  }

  function closeContactModal() {
    window.A11yModal.close(backdrop);
  }

  document.getElementById('contact-modal-close').addEventListener('click', closeContactModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeContactModal(); });

  // Toast system
  function showToast({ type, message, onRetry }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSVG = type === 'success'
      ? `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12.01" y1="16" x2="12.01" y2="16"/></svg>`;

    const retryHTML = onRetry
      ? `<button type="button" class="toast-retry">Try again</button>`
      : '';

    toast.innerHTML = `
      <span class="toast-icon">${iconSVG}</span>
      <div class="toast-content">
        <span class="toast-msg">${message}${retryHTML}</span>
      </div>
      <button type="button" class="toast-dismiss" aria-label="Dismiss notification">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

    // Simple required field check: flag empty fields and focus the first one
    let firstEmpty = null;
    FIELDS.forEach(id => {
      const el = document.getElementById(id);
      const empty = !el.value;
      el.setAttribute('aria-invalid', empty ? 'true' : 'false');
      if (empty && !firstEmpty) firstEmpty = el;
    });
    if (firstEmpty) {
      showToast({ type: 'error', message: 'Please fill in all required fields.' });
      firstEmpty.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        type: savedValues.type,
        name: savedValues.name,
        email: savedValues.email,
        message: savedValues.message,
        _subject: 'Website ' + savedValues.type + ' inquiry from ' + savedValues.name,
        _gotcha: document.getElementById('cf-gotcha').value,
      }),
    })
      .then(r => { if (!r.ok) throw new Error(r.status); })
      .then(() => {
        closeContactModal();
        form.reset();
        FIELDS.forEach(id => document.getElementById(id).removeAttribute('aria-invalid'));
        savedValues = {};
        showToast({ type: 'success', message: 'Message sent — we\'ll be in touch.' });
      })
      .catch(() => {
        closeContactModal();
        showToast({ type: 'error', message: 'Something went wrong.', onRetry: true });
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });

  // Wire up all contact modal triggers
  document.querySelectorAll('[data-contact-modal]').forEach(el => {
    el.addEventListener('click', () => openContactModal());
  });

  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = newsletterForm.querySelector('button');
      const params = new URLSearchParams(new FormData(newsletterForm));
      const cb = 'mcCallback' + Date.now();
      params.set('c', cb);

      btn.disabled = true;
      btn.textContent = 'Subscribing…';

      const script = document.createElement('script');
      const cleanup = () => {
        delete window[cb];
        script.remove();
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      };

      window[cb] = data => {
        cleanup();
        if (data.result === 'success') {
          newsletterForm.reset();
          showToast({ type: 'success', message: 'You\'re subscribed — check your inbox to confirm.' });
        } else {
          // Mailchimp returns HTML in msg; strip tags for the toast
          const msg = String(data.msg || '').replace(/<[^>]*>/g, '');
          showToast({ type: 'error', message: /already subscribed/i.test(msg) ? 'That email is already subscribed.' : 'Something went wrong. Try again.' });
        }
      };
      script.onerror = () => {
        cleanup();
        showToast({ type: 'error', message: 'Something went wrong. Try again.' });
      };

      script.src = newsletterForm.dataset.mcAction + '&' + params.toString();
      document.body.appendChild(script);
    });
  }
}());

// ─── Tooltip + one-line chip rows ─────────────────────────────
// window.Tooltip.show(anchor, html, { pin }) / hide(force). One shared
// element; .truncate titles show their full text on hover/focus, and
// [data-chip-row] lists collapse to one line with a +N chip that lists
// the rest. Works on content rendered later (MutationObserver), so
// script order doesn't matter.
window.Tooltip = (function () {
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.id = 'site-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  let anchor = null, pinned = false, held = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function position() {
    const r = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 8, pad = 12;
    let top = r.top - t.height - gap;
    const below = top < pad;
    tip.classList.toggle('is-below', below);
    if (below) top = r.bottom + gap;
    const left = Math.max(pad, Math.min(r.left + r.width / 2 - t.width / 2, window.innerWidth - t.width - pad));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  }

  // opts.pin: stays until clicked again / outside tap / Escape. opts.focus: stays until blur.
  function show(el, html, opts) {
    const pin = !!(opts && opts.pin), focus = !!(opts && opts.focus);
    if (anchor === el && !tip.hidden) { pinned = pinned || pin; held = held || pin || focus; return; }
    if (anchor) anchor.removeAttribute('aria-describedby');
    anchor = el; pinned = pin; held = pin || focus;
    tip.innerHTML = html;
    tip.classList.remove('is-visible');
    tip.hidden = false;
    el.setAttribute('aria-describedby', tip.id);
    position();
    void tip.offsetWidth;
    tip.classList.add('is-visible');
  }

  function hide(force) {
    if (!anchor || (held && !force)) return;
    anchor.removeAttribute('aria-describedby');
    anchor = null; pinned = false; held = false;
    tip.classList.remove('is-visible');
    tip.hidden = true;
  }

  function onMove() { if (!anchor) return; if (held) position(); else hide(); }
  document.addEventListener('scroll', onMove, { capture: true, passive: true });
  window.addEventListener('resize', onMove);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(true); });
  document.addEventListener('pointerdown', e => { if (anchor && !anchor.contains(e.target)) hide(true); });
  document.documentElement.addEventListener('mouseleave', () => hide());

  // Truncated titles: the card's title button stretches over the whole card,
  // so test the pointer against the title's own box rather than the event target.
  function textEl(title) { return title.querySelector('.card-btn') || title; }
  function isTruncated(title) { const t = textEl(title); return t.scrollWidth > t.clientWidth + 1; }
  let raf = 0;
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const scope = e.target.closest ? e.target.closest('.has-card-btn, .truncate') : null;
      const title = scope && (scope.matches('.truncate') ? scope : scope.querySelector('.truncate'));
      if (title) {
        const r = title.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside && isTruncated(title)) { show(title, esc(textEl(title).textContent.trim())); return; }
      }
      if (anchor && anchor.classList.contains('truncate')) hide();
    });
  });
  document.addEventListener('focusin', e => {
    const title = e.target.closest && e.target.closest('.truncate');
    if (title && isTruncated(title)) show(title, esc(textEl(title).textContent.trim()), { focus: true });
  });
  document.addEventListener('focusout', e => {
    if (anchor && e.target.closest && e.target.closest('.truncate') === anchor) hide(true);
  });

  // Chip rows
  function fit(row) {
    const old = row.querySelector('.chip-more-item');
    if (old) old.remove();
    const chips = Array.from(row.children);
    chips.forEach(c => c.classList.remove('is-overflow'));
    if (chips.length < 2 || row.clientWidth === 0) return;
    const top = chips[0].offsetTop;
    if (chips[chips.length - 1].offsetTop === top) return;

    const item = document.createElement('li');
    item.className = 'chip-more-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = (chips[0].className.split(' ')[0] || 'chip') + ' chip-more';
    item.appendChild(btn);
    row.appendChild(item);

    const hidden = [];
    for (let i = chips.length - 1; i >= 0; i--) {
      hidden.unshift(chips[i]);
      chips[i].classList.add('is-overflow');
      btn.textContent = '+' + hidden.length;
      if (item.offsetTop === top) break;
    }
    const n = hidden.length;
    btn.setAttribute('aria-label', n + ' more topic' + (n === 1 ? '' : 's'));
    const html = '<ul class="' + esc(row.className) + '">' + hidden.map(c => '<li class="' + esc(c.className.replace('is-overflow', '').trim()) + '">' + esc(c.textContent.trim()) + '</li>').join('') + '</ul>';

    btn.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') show(btn, html); });
    btn.addEventListener('pointerleave', () => { if (anchor === btn) hide(); });
    btn.addEventListener('focus', () => show(btn, html, { focus: true }));
    btn.addEventListener('blur', () => { if (anchor === btn) hide(true); });
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (anchor === btn && pinned) hide(true); else show(btn, html, { pin: true });
    });
  }

  const widths = new WeakMap();
  const ro = new ResizeObserver(entries => {
    entries.forEach(en => {
      const w = Math.round(en.contentRect.width);
      if (widths.get(en.target) === w) return;
      widths.set(en.target, w);
      fit(en.target);
    });
  });
  function scan(root) {
    const rows = root.querySelectorAll ? Array.from(root.querySelectorAll('[data-chip-row]')) : [];
    if (root.matches && root.matches('[data-chip-row]')) rows.unshift(root);
    rows.forEach(row => {
      if (!row.dataset.chipRowReady) { row.dataset.chipRowReady = '1'; ro.observe(row); }
      fit(row);
    });
  }
  new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n); })))
    .observe(document.body, { childList: true, subtree: true });
  scan(document);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => document.querySelectorAll('[data-chip-row]').forEach(fit));

  return { show, hide, fit };
}());
