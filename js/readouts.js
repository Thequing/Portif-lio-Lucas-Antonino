// Readouts tally up the first time they come into view, the way a results
// screen counts a score in: stepped, not eased, a dozen frames and done. Only
// plain integers count ("103", "16"); composite values such as "10,000 / 0.06 s"
// or "Enemy combat" are left exactly as written.
export function initReadouts({ reducedMotion }) {
  if (reducedMotion) return;
  const values = [...document.querySelectorAll('.readout-value')].filter((el) => /^\d+$/.test(el.textContent.trim()));
  if (!values.length) return;

  const STEPS = 12;
  const FRAME = 45;

  function tally(el) {
    const target = Number(el.textContent.trim());
    // Screen readers get the final number throughout, not the tally.
    el.setAttribute('aria-label', String(target));
    let step = 0;
    el.textContent = '0';
    const id = setInterval(() => {
      step++;
      el.textContent = String(Math.round((target * step) / STEPS));
      if (step >= STEPS) {
        clearInterval(id);
        el.removeAttribute('aria-label');
        el.classList.add('is-tallied');
      }
    }, FRAME);
  }

  // On desktop a pinned stage is in the viewport before its copy has cut in:
  // the strip is there at opacity 0. Wait until it is actually visible, or the
  // tally would finish unseen.
  function whenShown(el, fn) {
    const strip = el.closest('.readouts') || el;
    const check = () => (getComputedStyle(strip).opacity === '1' ? fn() : setTimeout(check, 100));
    check();
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      whenShown(e.target, () => tally(e.target));
    }
  }, { threshold: 1 });
  values.forEach((v) => io.observe(v));
}
