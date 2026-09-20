// The Heavens Declare — starfield canvas, shooting stars, blur reveals
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    if (reduced) el.classList.add('in'); else io.observe(el);
  });
  if (reduced) return;

  // ── Starfield ──────────────────────────────────────────────
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], meteors = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.min(220, Math.floor(W * H / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.2,
      base: Math.random() * 0.5 + 0.25,
      tw: Math.random() * 0.02 + 0.004,
      ph: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.6 + 0.4,
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  function spawnMeteor() {
    if (document.hidden) return;
    const x = Math.random() * W * 0.7 + W * 0.2;
    meteors.push({ x, y: Math.random() * H * 0.3, vx: -(Math.random() * 4 + 5), vy: Math.random() * 2.4 + 2.2, life: 1 });
    setTimeout(spawnMeteor, Math.random() * 14000 + 8000);
  }
  setTimeout(spawnMeteor, 5000);

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let t = 0;
  function frame() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = s.base + Math.sin(t * s.tw + s.ph) * 0.25;
      const y = (s.y - scrollY * 0.06 * s.depth) % H;
      ctx.globalAlpha = Math.max(0.05, a);
      ctx.fillStyle = '#EDF4FA';
      ctx.beginPath();
      ctx.arc(s.x, y < 0 ? y + H : y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= 0.016;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
      grad.addColorStop(0, 'rgba(237,244,250,' + (0.85 * m.life) + ')');
      grad.addColorStop(1, 'rgba(127,196,240,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  frame();
})();
