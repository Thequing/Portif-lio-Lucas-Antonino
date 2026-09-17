const MOBILE_MAX = 1023;

function promote(video) {
  if (video.dataset.loaded === 'true') return;
  const wantSmall = window.innerWidth <= MOBILE_MAX;
  for (const source of video.querySelectorAll('source[data-src]')) {
    let url = source.dataset.src;
    // MP4 is the only format shipped: VP9 measured larger than H.264 for this
    // material, so WebM was dropped rather than served as the bigger option.
    if (wantSmall && url.endsWith('-1280.mp4')) {
      url = url.replace('-1280.mp4', '-720.mp4');
    }
    source.src = url;
    source.removeAttribute('data-src');
  }
  video.dataset.loaded = 'true';
  video.load();
}

// Autoplay is refused on iOS in Low Power Mode and under Data Saver, both
// plausible on a phone that has been at a convention all day. Left alone the
// clip is a still poster that reads as broken. Mark the figure so CSS shows a
// play badge, and let a tap on it start the clip — that tap is a user gesture,
// so the same play() call succeeds.
function tryPlay(video) {
  video.play().then(
    () => { video.closest('.shot')?.removeAttribute('data-blocked'); },
    () => { markBlocked(video); }
  );
}

function markBlocked(video) {
  const shot = video.closest('.shot');
  if (!shot || shot.dataset.blocked) return;
  shot.dataset.blocked = 'true';
  if (!shot.querySelector('.play')) {
    const badge = document.createElement('div');
    badge.className = 'play';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<span>&#9654;</span>';
    shot.appendChild(badge);
  }
  // Not `once`: play() on an already-playing video is a no-op, and a retry
  // after a refused tap costs nothing.
  shot.addEventListener('click', () => tryPlay(video));
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
          tryPlay(video);
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px', threshold: 0.1 }
  );

  for (const video of videos) observer.observe(video);
}
