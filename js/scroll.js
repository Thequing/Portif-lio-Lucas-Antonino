// Stage pins, desktop only. The clip enters with a hard horizontal wipe and
// the copy cuts in in two steps — stamp and title first, then the rest — so
// each stage reads like a menu screen coming up, not a card fading in.
export function initScroll() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      for (const stage of document.querySelectorAll('.stage')) {
        const inner = stage.querySelector('.stage-inner');
        const clips = stage.querySelector('.clips');
        const copy = stage.querySelector('.copy');
        if (!inner || !copy) continue;

        const first = [copy.querySelector('.stamp'), copy.querySelector('h2')].filter(Boolean);
        const rest = [...copy.children].filter((el) => !first.includes(el));

        // Dino Girls has no clip: its copy still cuts in, but nothing pins.
        if (!clips) {
          gsap.from(first, { opacity: 0, duration: 0.01, scrollTrigger: { trigger: inner, start: 'top 60%' } });
          gsap.from(rest, { opacity: 0, duration: 0.01, scrollTrigger: { trigger: inner, start: 'top 45%' } });
          continue;
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: inner,
            start: 'top 44px',
            end: '+=100%',
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
          },
        });
        // Positions are fractions of the pin: wipe over the first 40%, stamp and
        // title at 30%, the rest at 50%, then the stage holds for the remainder.
        // The empty tween at 1 fixes the timeline's length, otherwise scrub maps
        // the whole pin onto the last keyed moment and the hold disappears.
        tl.fromTo(clips, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'none' }, 0)
          .from(first, { opacity: 0, duration: 0.01 }, 0.3)
          .from(rest, { opacity: 0, duration: 0.01 }, 0.5)
          .to({}, { duration: 0.01 }, 1);
      }
    },
  });
}
