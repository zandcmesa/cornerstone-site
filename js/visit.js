(function () {
  var tour = document.querySelector('[data-visit-tour]');
  if (!tour) return;
  var tabs = Array.prototype.slice.call(tour.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(tour.querySelectorAll('[role="tabpanel"]'));

  function select(i, focus) {
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, j) {
      p.classList.toggle('is-active', j === i);
      p.hidden = j !== i;
    });
    if (focus) tabs[i].focus();
    if (tabs[i].scrollIntoView && window.innerWidth <= 900) {
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i); });
    tab.addEventListener('keydown', function (e) {
      var n = tabs.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
      else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      else if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
    });
  });

  select(0);
})();
