const PCO_WORKER_URL = '';

window.PCO = (function () {
  const url = window.PCO_WORKER_URL || PCO_WORKER_URL;
  const listeners = [];
  let data = typeof PCO_SNAPSHOT !== 'undefined' && PCO_SNAPSHOT && PCO_SNAPSHOT.syncedAt ? PCO_SNAPSHOT : null;

  function sameData(a, b) {
    const strip = o => JSON.stringify({ ...o, syncedAt: null });
    return strip(a) === strip(b);
  }

  function onData(fn) {
    listeners.push(fn);
    if (data) fn(data);
  }

  if (url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(url, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(live => {
        if (!live || !live.syncedAt) return;
        if (data && sameData(data, live)) return;
        data = live;
        listeners.forEach(fn => fn(data));
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }

  return { onData, sameData };
}());
