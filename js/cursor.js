export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const { gsap } = window;

  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  const x = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); });

  for (const target of document.querySelectorAll('a, button')) {
    target.addEventListener('pointerenter', () =>
      gsap.to(ring, { scale: 2.2, duration: 0.3 })
    );
    target.addEventListener('pointerleave', () =>
      gsap.to(ring, { scale: 1, duration: 0.3 })
    );
  }
}
