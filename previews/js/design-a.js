// Design A: Kibbe Dusk — Parallax scroll reveal

(function() {
  'use strict';

  const heroImage = document.querySelector('.hero-image');
  const heroReveal = document.querySelector('.hero-title-reveal');

  if (!heroImage || !heroReveal) return;

  let ticking = false;

  function updateParallax() {
    const scrolled = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    
    if (scrolled < viewportHeight) {
      const opacity = 1 - (scrolled / viewportHeight) * 0.5;
      const scale = 1 + (scrolled / viewportHeight) * 0.2;
      
      heroImage.style.opacity = opacity;
      heroImage.style.transform = `scale(${scale})`;
      
      const revealOpacity = Math.min(1, scrolled / (viewportHeight * 0.3));
      heroReveal.style.opacity = revealOpacity;
    }
    
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (!prefersReducedMotion.matches) {
    window.addEventListener('scroll', requestTick, { passive: true });
    updateParallax();
  }
})();
