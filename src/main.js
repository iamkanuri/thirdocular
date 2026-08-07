const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Reveal sections as they enter the viewport. */
const revealEls = document.querySelectorAll('.reveal');

if (prefersReduced || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));
}

if (prefersReduced) {
  /* SMIL ignores prefers-reduced-motion; pause it manually. */
  document.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.());
} else {
  /* Gentle parallax: the iris drifts and dims as you leave the hero. */
  const iris = document.querySelector('.iris-wrap');
  if (iris) {
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          iris.style.transform = `translateY(${y * 0.14}px)`;
          iris.style.opacity = String(Math.max(0, 1 - y / 650));
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* Perception field: clarity resolves noise wherever the cursor looks. */
  if (window.matchMedia('(pointer: fine)').matches) {
    const root = document.documentElement;
    let lx = 0;
    let ly = 0;
    let lensTicking = false;
    window.addEventListener(
      'pointermove',
      (e) => {
        lx = e.clientX;
        ly = e.clientY;
        if (lensTicking) return;
        lensTicking = true;
        requestAnimationFrame(() => {
          root.style.setProperty('--lens-x', `${lx}px`);
          root.style.setProperty('--lens-y', `${ly}px`);
          lensTicking = false;
        });
      },
      { passive: true }
    );
  }
}
