(function () {
  var GA_ID = 'G-B1VETEFTP4';

  // Defined before the hostname gate so calls are safe no-ops off the live domain.
  window.csTrack = function (name, params) {
    if (window.gtag) window.gtag('event', name, params || {});
  };

  function classify(href) {
    if (/churchcenter\.com\/giving/.test(href)) return 'give_click';
    if (/churchcenter\.com\/(registrations|sign-ups)/.test(href)) return 'registration_click';
    if (/churchcenter\.com\/groups/.test(href)) return 'group_click';
    if (/^tel:/.test(href)) return 'phone_click';
    if (/^mailto:/.test(href)) return 'email_click';
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var name = classify(a.getAttribute('href') || '');
    if (!name) return;
    window.csTrack(name, {
      link_url: a.href,
      link_text: (a.textContent || '').trim().slice(0, 100),
    });
  });

  if (!/(^|\.)cornerstonechurchma\.com$/.test(location.hostname)) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();
