import { t } from './i18n.js';

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

function badge(shot) {
  if (shot.querySelector('.play')) return;
  const el = document.createElement('div');
  el.className = 'play';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span>&#9654;</span>';
  shot.appendChild(el);
}

function markBlocked(video) {
  const shot = video.closest('.shot');
  if (!shot || shot.dataset.blocked) return;
  shot.dataset.blocked = 'true';
  badge(shot);
  label(video);
}

// Every clip is also a pause button, the way a game pauses on a tap. The same
// handler plays a clip whose autoplay was refused, so the blocked badge needs
// no listener of its own. A clip the visitor paused stays paused when it
// scrolls back into view.
function label(video) {
  const shot = video.closest('.shot');
  const name = video.getAttribute('aria-label') || '';
  shot?.setAttribute('aria-label', `${t(video.paused ? 'clip.play' : 'clip.pause')}: ${name}`);
}

function makeToggle(video) {
  const shot = video.closest('.shot');
  if (!shot) return;
  shot.setAttribute('role', 'button');
  shot.tabIndex = 0;
  label(video);
  const toggle = () => {
    if (video.paused) {
      delete shot.dataset.paused;
      delete video.dataset.userPaused;
      tryPlay(video);
    } else {
      video.pause();
      video.dataset.userPaused = 'true';
      shot.dataset.paused = 'true';
      badge(shot);
    }
  };
  shot.addEventListener('click', toggle);
  shot.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    toggle();
  });
  video.addEventListener('play', () => label(video));
  video.addEventListener('pause', () => label(video));
  document.addEventListener('langchange', () => label(video));
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
          if (!video.dataset.userPaused) tryPlay(video);
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px', threshold: 0.1 }
  );

  for (const video of videos) {
    // The title screen's attract video is scenery, not a clip to control.
    if (!video.hasAttribute('data-hero')) makeToggle(video);
    observer.observe(video);
  }
}
