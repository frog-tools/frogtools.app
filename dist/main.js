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

// Make whole project card clickable without blocking link hover
function initCardClicks() {
  document.querySelectorAll('.project-card[data-href]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return; // let actual links handle themselves
      window.open(card.dataset.href, '_blank', 'noopener');
    });
  });
}

// Flies buzzing around the page + frog tongue catching
function initFlies() {
  const NUM_FLIES = 4;
  const flies = [];
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const FLY_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="15" rx="4" ry="5" fill="#333"/>
    <circle cx="9" cy="9" r="4" fill="rgba(180,200,220,0.6)" stroke="#555" stroke-width="0.5"/>
    <circle cx="15" cy="9" r="4" fill="rgba(180,200,220,0.6)" stroke="#555" stroke-width="0.5"/>
    <line x1="12" y1="11" x2="8" y2="7" stroke="#444" stroke-width="0.7"/>
    <line x1="12" y1="11" x2="16" y2="7" stroke="#444" stroke-width="0.7"/>
    <line x1="12" y1="13" x2="7" y2="12" stroke="#444" stroke-width="0.5"/>
    <line x1="12" y1="13" x2="17" y2="12" stroke="#444" stroke-width="0.5"/>
  </svg>`;

  // Tongue element (a pink line drawn within the hero)
  const tongueSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tongueSvg.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9998;
  `;
  const tongueLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  tongueLine.setAttribute('stroke', '#e84060');
  tongueLine.setAttribute('stroke-width', '4');
  tongueLine.setAttribute('stroke-linecap', 'round');
  tongueLine.style.display = 'none';
  const tongueTip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  tongueTip.setAttribute('r', '6');
  tongueTip.setAttribute('fill', '#e84060');
  tongueTip.style.display = 'none';
  tongueSvg.appendChild(tongueLine);
  tongueSvg.appendChild(tongueTip);
  hero.appendChild(tongueSvg);

  // Tongue state
  let tongueState = 'idle';
  let tongueProgress = 0;
  let tongueTarget = null;
  let tongueEndX = 0;
  let tongueEndY = 0;
  let tongueCooldown = 3000 + Math.random() * 4000;
  let tongueCooldownTimer = 0;
  const TONGUE_SPEED = 3.5;

  // Get hero-relative position of the frog's mouth
  function getFrogMouthPos() {
    const frogSvg = document.querySelector('.frog-svg');
    if (!frogSvg) return null;
    const frogRect = frogSvg.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    return {
      x: frogRect.left - heroRect.left + (100 / 200) * frogRect.width,
      y: frogRect.top - heroRect.top + (140 / 180) * frogRect.height,
    };
  }

  function getHeroSize() {
    return { w: hero.offsetWidth, h: hero.offsetHeight };
  }

  function spawnFly(fromEdge) {
    const el = document.createElement('div');
    el.innerHTML = FLY_SVG;
    el.style.cssText = `
      position: absolute; top: 0; left: 0;
      pointer-events: none; z-index: 9999;
      will-change: transform; user-select: none;
      transition: opacity 0.3s;
    `;
    hero.appendChild(el);

    const { w, h } = getHeroSize();

    // Always spawn from an edge
    let cx, cy;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { cx = -60; cy = Math.random() * h; }
    else if (edge === 1) { cx = w + 60; cy = Math.random() * h; }
    else if (edge === 2) { cx = Math.random() * w; cy = -60; }
    else { cx = Math.random() * w; cy = h + 60; }

    // Target to drift toward (inside the hero)
    const targetCx = 80 + Math.random() * (w - 160);
    const targetCy = 80 + Math.random() * (h - 160);

    const fly = {
      el, cx, cy,
      targetCx, targetCy,
      rx: 40 + Math.random() * 80,
      ry: 30 + Math.random() * 60,
      speed: 0.8 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      jx: 0, jy: 0,
      driftTimer: 0,
      driftInterval: 5000 + Math.random() * 4000,
      x: cx, y: cy,
      alive: true,
    };
    flies.push(fly);
    return fly;
  }

  for (let i = 0; i < NUM_FLIES; i++) spawnFly(true);

  let last = performance.now();

  function tick(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    const { w, h } = getHeroSize();
    const lerpRate = 1 - Math.pow(0.5, dt / 1500); // smooth ~1.5s half-life

    flies.forEach(fly => {
      if (!fly.alive) return;

      fly.phase += (fly.speed * dt) / 1000;
      fly.jx += (Math.random() - 0.5) * 3;
      fly.jy += (Math.random() - 0.5) * 3;
      fly.jx *= 0.85;
      fly.jy *= 0.85;

      // Smoothly drift cx/cy toward target
      fly.cx += (fly.targetCx - fly.cx) * lerpRate;
      fly.cy += (fly.targetCy - fly.cy) * lerpRate;

      // Pick a new drift target periodically
      fly.driftTimer += dt;
      if (fly.driftTimer >= fly.driftInterval) {
        fly.targetCx = 80 + Math.random() * (w - 160);
        fly.targetCy = 80 + Math.random() * (h - 160);
        fly.driftTimer = 0;
        fly.driftInterval = 5000 + Math.random() * 4000;
      }

      fly.x = fly.cx + Math.cos(fly.phase) * fly.rx + fly.jx;
      fly.y = fly.cy + Math.sin(fly.phase * 1.3) * fly.ry + fly.jy;

      const dx = Math.cos(fly.phase) * fly.rx;
      const scaleX = dx >= 0 ? 1 : -1;
      fly.el.style.transform = `translate(${fly.x}px, ${fly.y}px) scaleX(${scaleX})`;
    });

    // Tongue logic
    const mouth = getFrogMouthPos();
    if (mouth && tongueState === 'idle') {
      tongueCooldownTimer += dt;
      if (tongueCooldownTimer >= tongueCooldown) {
        const aliveFl = flies.filter(f => f.alive);
        if (aliveFl.length > 0) {
          tongueTarget = aliveFl[Math.floor(Math.random() * aliveFl.length)];
          tongueEndX = tongueTarget.x + 12;
          tongueEndY = tongueTarget.y + 12;
          tongueState = 'extending';
          tongueProgress = 0;
          tongueLine.style.display = '';
          tongueTip.style.display = '';
        }
        tongueCooldownTimer = 0;
        tongueCooldown = 3000 + Math.random() * 4000;
      }
    }

    if (tongueState === 'extending') {
      tongueProgress += (TONGUE_SPEED * dt) / 1000;
      if (tongueTarget && tongueTarget.alive) {
        tongueEndX = tongueTarget.x + 12;
        tongueEndY = tongueTarget.y + 12;
      }
      if (tongueProgress >= 1) {
        tongueProgress = 1;
        if (tongueTarget && tongueTarget.alive) {
          tongueTarget.alive = false;
          tongueTarget.el.style.opacity = '0';
          setTimeout(() => {
            tongueTarget.el.remove();
            const idx = flies.indexOf(tongueTarget);
            if (idx !== -1) flies.splice(idx, 1);
            tongueTarget = null;
            spawnFly(true);
          }, 150);
        }
        tongueState = 'retracting';
      }
    }

    if (tongueState === 'retracting') {
      tongueProgress -= (TONGUE_SPEED * dt) / 1000;
      if (tongueProgress <= 0) {
        tongueProgress = 0;
        tongueState = 'idle';
        tongueLine.style.display = 'none';
        tongueTip.style.display = 'none';
      }
    }

    if (tongueState !== 'idle' && mouth) {
      const tipX = mouth.x + (tongueEndX - mouth.x) * tongueProgress;
      const tipY = mouth.y + (tongueEndY - mouth.y) * tongueProgress;
      tongueLine.setAttribute('x1', mouth.x);
      tongueLine.setAttribute('y1', mouth.y);
      tongueLine.setAttribute('x2', tipX);
      tongueLine.setAttribute('y2', tipY);
      tongueTip.setAttribute('cx', tipX);
      tongueTip.setAttribute('cy', tipY);
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initHeaderShrink();
  initSmoothScroll();
  initCardClicks();
  initFlies();
});

