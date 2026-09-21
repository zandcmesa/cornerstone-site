// Design C: Sunday Pulse — Infinite ticker and photo mosaic

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  if (prefersReducedMotion.matches) {
    const tickerContents = document.querySelectorAll('.ticker-content');
    tickerContents.forEach(ticker => {
      ticker.style.animation = 'none';
    });
  }

  const photoTiles = document.querySelectorAll('.photo-tile');
  
  if (!prefersReducedMotion.matches && photoTiles.length > 0) {
    photoTiles.forEach((tile, index) => {
      tile.style.animationDelay = `${index * 0.1}s`;
    });
  }
})();
