const MOBILE_MAX = 1023;

function promote(video) {
  if (video.dataset.loaded === 'true') return;
  const wantSmall = window.innerWidth <= MOBILE_MAX;
  for (const source of video.querySelectorAll('source[data-src]')) {
    let url = source.dataset.src;
    if (wantSmall && url.endsWith('-1280.mp4')) {
      url = url.replace('-1280.mp4', '-720.mp4');
    }
    // No 720 WebM is generated; drop it on small screens and let MP4 serve.
    if (wantSmall && url.endsWith('.webm')) {
      source.remove();
      continue;
    }
    source.src = url;
    source.removeAttribute('data-src');
  }
  video.dataset.loaded = 'true';
  video.load();
}

export function initMedia({ reducedMotion }) {
  const videos = document.querySelectorAll('video[data-slug]');

  if (reducedMotion) {
    for (const video of videos) {
      promote(video);
      video.setAttribute('controls', '');
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting) {
          promote(video);
          video.play().catch(() => {
            // Autoplay can still be refused; the poster remains, which is fine.
          });
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px', threshold: 0.1 }
  );

  for (const video of videos) observer.observe(video);
}
