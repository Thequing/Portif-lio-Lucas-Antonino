const NEUTRAL = '#8b8b99';

export function initScroll() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Progress rail
  gsap.to('.rail span', {
    height: '100%',
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  // Accent cross-fade: each project owns the accent while it holds the viewport middle
  for (const section of document.querySelectorAll('.project')) {
    const accent = section.dataset.accent;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => gsap.to(':root', { '--accent': accent, duration: 0.5 }),
      onEnterBack: () => gsap.to(':root', { '--accent': accent, duration: 0.5 }),
      onLeave: () => gsap.to(':root', { '--accent': NEUTRAL, duration: 0.5 }),
      onLeaveBack: () => gsap.to(':root', { '--accent': NEUTRAL, duration: 0.5 }),
    });
  }

  // Generic reveal for anything marked
  for (const el of document.querySelectorAll('[data-reveal]')) {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  }

  // Marquee, driven continuously and skewed by scroll velocity
  const marquee = document.querySelector('.marquee-inner');
  if (marquee) {
    const loop = gsap.to(marquee, {
      xPercent: -50,
      repeat: -1,
      duration: 20,
      ease: 'none',
    });
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const skew = gsap.utils.clamp(-12, 12, self.getVelocity() / 220);
        gsap.to(marquee, { skewX: skew, duration: 0.4, overwrite: true });
        loop.timeScale(1 + Math.abs(skew) / 6);
      },
    });
  }
}
