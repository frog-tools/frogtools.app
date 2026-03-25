// Scroll-triggered fade-in animations
function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.project-card, .value, .cta, .about-content > p'
  );

  targets.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach(el => observer.observe(el));
}

// Shrink header on scroll
function initHeaderShrink() {
  const header = document.querySelector('.site-header');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.style.boxShadow = window.scrollY > 20
          ? '0 2px 16px rgba(0,0,0,0.08)'
          : 'none';
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Smooth scroll for anchor links (fallback for older browsers)
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initHeaderShrink();
  initSmoothScroll();
});
