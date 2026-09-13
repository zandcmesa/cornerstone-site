// Design B: Sanctuary Type — Monumental fade-in

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion.matches) {
    const heroElements = document.querySelectorAll('.hero-eyebrow, .hero-scripture, .hero-details');
    heroElements.forEach(el => {
      el.style.opacity = '1';
    });
  }
})();
