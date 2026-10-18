/* Watch page: YouTube live embed during the Sunday service window.
 *
 * YouTube's channel live embed (embed/live_stream?channel=…) plays whatever
 * broadcast the channel has live or scheduled. Outside a broadcast it shows a
 * grey "video unavailable" box, so we only mount it around service time and
 * leave the placeholder up the rest of the week. Append #live to the URL to
 * force the embed at any time (handy for testing or an off-schedule stream).
 */
(function () {
  const CHANNEL = 'UCl4J6MR32QrZOfk8M_n7wvA';
  const TZ = 'America/New_York';
  const WINDOW_START = 9 * 60 + 30;   // 9:30am — stream goes live ~5 min before 10
  const WINDOW_END = 12 * 60 + 30;    // 12:30pm — replays run ~2h15m

  const wrap = document.querySelector('[data-watch-embed]');
  if (!wrap) return;

  function nyParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(date);
    const get = type => (parts.find(p => p.type === type) || {}).value;
    return { day: get('weekday'), hour: (+get('hour')) % 24, minute: +get('minute') };
  }

  function isServiceWindow(date) {
    const { day, hour, minute } = nyParts(date || new Date());
    const mins = hour * 60 + minute;
    return day === 'Sun' && mins >= WINDOW_START && mins < WINDOW_END;
  }

  function forced() {
    return location.hash === '#live' || /[?&]live(=|&|$)/.test(location.search);
  }

  let mounted = false;
  function mount() {
    if (mounted) return;
    mounted = true;
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/live_stream?channel=' + CHANNEL + '&rel=0';
    iframe.title = 'Cornerstone Church live stream';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    wrap.replaceChildren(iframe);
    wrap.classList.add('is-live');
    document.querySelectorAll('[data-watch-live-only]').forEach(el => el.hidden = false);
  }

  function check() {
    if (forced() || isServiceWindow()) mount();
  }

  check();
  if (!mounted) {
    // A tab opened before service flips to the stream without a reload.
    const timer = setInterval(() => { check(); if (mounted) clearInterval(timer); }, 60 * 1000);
    window.addEventListener('hashchange', check);
  }

  window.watchIsServiceWindow = isServiceWindow;
})();
