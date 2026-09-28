// Plays an Aseprite sprite sheet (horizontal strip, JSON-array data with tags)
// on an element's background. Frame count, durations and tags all come from
// the exported JSON, so an edit in Aseprite needs only a re-export.
//
// The continue screen's KuroNeko: nothing, then she peeks over the wall,
// blinks, pops up — the "intro" tag, played once when the screen comes into
// view — then "wave" loops while she is on screen.
export async function initSprite({ reducedMotion }) {
  const el = document.querySelector('.waver .sprite[data-sheet]');
  if (!el) return;

  let data;
  try {
    const res = await fetch(el.dataset.sheet);
    data = await res.json();
  } catch {
    return; // CSS already shows a still, mid-wave frame
  }

  const frames = data.frames.map((f) => ({ x: f.frame.x, ms: f.duration }));
  const fw = data.frames[0].frame.w;
  const sheetW = data.meta.size.w;
  const tag = (name) => data.meta.frameTags.find((t) => t.name === name);
  const intro = tag('intro');
  const wave = tag('wave');
  if (!intro || !wave) return;

  el.style.backgroundSize = `${(sheetW / fw) * 100}% 100%`;
  const show = (i) => {
    el.style.backgroundPosition = `${sheetW > fw ? (frames[i].x / (sheetW - fw)) * 100 : 0}% 0`;
  };

  // Reduced motion: a still of her waving, eyes open.
  if (reducedMotion) return show(wave.from);

  show(intro.from);
  let i = intro.from;
  let timer = 0;
  let visible = false;

  function step() {
    show(i);
    const ms = frames[i].ms;
    i = i >= wave.to ? wave.from : i + 1;
    // Offscreen, the loop stops; it resumes where it was when she is back.
    if (visible) timer = setTimeout(step, ms);
  }

  // She starts once the whole sprite is on screen, so the entrance is seen.
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && e.intersectionRatio >= 0.99;
    clearTimeout(timer);
    if (visible) step();
  }, { threshold: [0, 1] });
  io.observe(el);
}
