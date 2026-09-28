// Cookieless visit and event counting through GoatCounter. Off until the
// <meta name="goatcounter"> in index.html holds a site endpoint; until then
// nothing is fetched and track() does nothing.
//
// Pageviews come from count.js itself. Events are the actions that answer
// "did the booth work": saving the contact, taking the CV, sharing, following
// an outbound link, and the easter eggs.

const queue = [];
let enabled = false;

function send(name) {
  const gc = window.goatcounter;
  if (gc?.count) gc.count({ path: name, title: name, event: true });
  else queue.push(name);
}

export function track(name) {
  if (enabled) send(name);
}

export function initAnalytics() {
  const endpoint = document.querySelector('meta[name="goatcounter"]')?.content.trim();
  if (!endpoint) return;
  enabled = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = endpoint;
  script.addEventListener('load', () => { while (queue.length) send(queue.shift()); });
  document.head.appendChild(script);

  // One delegated listener: explicit data-track names first, then any link
  // that leaves the site, named by its host so the dashboard stays readable.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track], a[href]');
    if (!el) return;
    if (el.dataset.track) return track(el.dataset.track);
    const href = el.getAttribute('href');
    if (href.startsWith('mailto:')) return track('out/email');
    if (/^https?:/.test(href)) track(`out/${new URL(href).hostname.replace(/^www\./, '')}`);
  });
}
