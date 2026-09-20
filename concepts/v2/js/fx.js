// Proclamation — kinetic type + hard-wipe reveals
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-stagger').forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal, .reveal-up, .reveal-stagger').forEach(el => io.observe(el));

  // Kinetic hero word: weight + width breathe with scroll
  const kin = document.querySelector('.kinetic');
  if (kin) {
    let ticking = false;
    const update = () => {
      const t = Math.min(window.scrollY / (window.innerHeight * 0.8), 1);
      const wght = 800 - t * 500;
      const wdth = 85 - t * 10;
      kin.style.fontVariationSettings = `"wght" ${wght}, "wdth" ${wdth}`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Letter-stagger intro on the hero title
  const title = document.querySelector('.hero-title');
  if (title) {
    title.style.opacity = '0';
    requestAnimationFrame(() => {
      title.style.transition = 'opacity 0.01s';
      title.style.opacity = '1';
      title.querySelectorAll('.line').forEach((line, i) => {
        line.style.display = 'block';
        line.style.transform = 'translateY(105%)';
        line.style.transition = `transform 0.9s cubic-bezier(0.85,0,0.15,1) ${0.08 + i * 0.12}s`;
        line.parentElement.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => { line.style.transform = 'none'; }));
      });
    });
  }
})();
