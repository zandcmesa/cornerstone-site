// Building Blocks motion engine — scroll reveals, hero choreography,
// hairline dividers, parallax. No dependencies, works on file://.
// Load last, after any script that injects content.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  var root = document.documentElement;
  root.classList.add('reveals-on');

  // ─── Scroll reveals ─────────────────────────────────────────
  var STAGGER_MS = 90;
  var STAGGER_CAP = 540;

  function applyStagger(scope) {
    (scope || document).querySelectorAll('[data-reveal-stagger]').forEach(function (group) {
      var i = 0;
      Array.prototype.forEach.call(group.children, function (child) {
        if (child.dataset.staggered) return;
        child.dataset.staggered = '1';
        if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
        var delay = Math.min(i * STAGGER_MS, STAGGER_CAP);
        if (delay) child.style.setProperty('--reveal-delay', delay + 'ms');
        i++;
      });
    });
  }

  function release(el) {
    // Once settled, drop the reveal styles entirely so transforms
    // don't fight hover states elsewhere in the CSS.
    el.removeAttribute('data-reveal');
    el.classList.remove('is-revealed');
    el.style.removeProperty('--reveal-delay');
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      var cs = getComputedStyle(el);
      var ms = (parseFloat(cs.transitionDelay) + parseFloat(cs.transitionDuration)) * 1000;
      el.classList.add('is-revealed');
      setTimeout(function () { release(el); }, (ms || 700) + 100);
    });
  }, { rootMargin: '0px 0px -70px 0px', threshold: 0.05 });

  function observeReveals(scope) {
    applyStagger(scope);
    (scope || document).querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.dataset.observed) return;
      el.dataset.observed = '1';
      if (el.getBoundingClientRect().bottom < 0) { release(el); return; }
      io.observe(el);
    });
  }

  // ─── Divider draw-in ────────────────────────────────────────
  var dio = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      dio.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.divider-top, .divider-bottom').forEach(function (el) {
    dio.observe(el);
  });

  // ─── Hero choreography ──────────────────────────────────────
  var hero = document.querySelector('.hero');
  if (hero) {
    hero.querySelectorAll('.hero-arc [stroke]').forEach(function (el) {
      el.setAttribute('pathLength', '1');
    });
    var wrap = hero.querySelector('.hero-video-wrap');
    if (wrap) wrap.classList.add('kenburns');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('hero-in'); });
    });
  }

  // ─── Parallax ───────────────────────────────────────────────
  var pEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (pEls.length && window.innerWidth > 768) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var mid = window.innerHeight / 2;
      pEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var r = el.getBoundingClientRect();
        var applied = el._py || 0;
        var center = r.top + r.height / 2 - applied;
        var y = Math.round((mid - center) * speed);
        if (y !== applied) {
          el._py = y;
          el.style.setProperty('--parallax-y', y + 'px');
        }
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  observeReveals();

  // For content injected after load: Blocks.scan(container)
  window.Blocks = { scan: observeReveals };
})();
