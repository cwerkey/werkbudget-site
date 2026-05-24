// werkBudget marketing site — scroll-driven interactions.
// No frameworks, no build step. Two patterns:
//   1. fade-in on viewport entry via IntersectionObserver
//   2. scroll-scrubbed scenes via requestAnimationFrame, writing
//      a 0..1 --p custom property the CSS animates against.

(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- nav: add .scrolled after first 8px ----------
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------- fade-in observer ----------
  const fadeEls = document.querySelectorAll('[data-fade]');
  if (fadeEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    fadeEls.forEach(el => io.observe(el));
  }

  // ---------- count-up numbers ----------
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length) {
    const fmt = (n) => Math.round(n).toLocaleString();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const to = Number(el.dataset.count);
        if (prefersReduced) { el.textContent = fmt(to); io.unobserve(el); return; }
        const dur = 1100;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(to * eased);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => io.observe(el));
  }

  // ---------- envelope fill on view (sets --fill) ----------
  const envFills = document.querySelectorAll('[data-fill]');
  if (envFills.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--fill', e.target.dataset.fill);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    envFills.forEach(el => io.observe(el));
  }

  // ---------- hero device parallax/tilt on scroll + mousemove ----------
  const device = document.querySelector('.device');
  if (device && !prefersReduced) {
    let tx = 0, ty = 0, lift = 0;
    const onScroll = () => {
      const r = device.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1..1 across the viewport
      const center = (r.top + r.height / 2) - vh / 2;
      const t = Math.max(-1, Math.min(1, center / (vh / 2)));
      tx = -t * 6;                  // tilt up to 6deg as it moves down
      lift = -Math.abs(t) * 8;      // small lift toward center
      device.style.setProperty('--tilt-x', tx.toFixed(2));
      device.style.setProperty('--lift', lift.toFixed(2));
    };
    const onMouse = (e) => {
      const r = device.getBoundingClientRect();
      const mx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      ty = Math.max(-1, Math.min(1, mx)) * 6;
      device.style.setProperty('--tilt-y', ty.toFixed(2));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });
  }

  // ---------- per-scene scrub hooks ----------
  // Paycheck-flow scene: three phases route the paycheck into Rent
  // (goal-fill), Iceland fund (10% rule), then Groceries (remainder).
  // Each phase has its own scroll window so the bars fill sequentially
  // instead of all at once; phases overlap slightly so the scene never
  // feels paused. Paycheck card amount counts down as money flows out.
  const flowScenes = [];
  document.querySelectorAll('[data-paycheck-flow]').forEach(scene => {
    const PAYCHECK = 3200;
    const phases = [
      { i: 0, start: 0.06, end: 0.36, target: 1800 },
      { i: 1, start: 0.32, end: 0.56, target: 320  },
      { i: 2, start: 0.52, end: 0.90, target: 1080 },
    ];
    const fmt = n => '$' + Math.round(n).toLocaleString();
    const ease = c => 1 - Math.pow(1 - c, 3);
    const paths   = phases.map(ph => scene.querySelector(`[data-stream-path="${ph.i}"]`));
    const targets = phases.map(ph => scene.querySelector(`[data-target="${ph.i}"]`));
    const amts    = phases.map(ph => scene.querySelector(`[data-fill-amt="${ph.i}"]`));
    const payAmt  = scene.querySelector('[data-pay-amt]');
    const payCard = scene.querySelector('.pay-card');
    const apply = (p) => {
      let distributed = 0;
      phases.forEach((ph, idx) => {
        const raw = (p - ph.start) / (ph.end - ph.start);
        const local = Math.max(0, Math.min(1, raw));
        const eased = ease(local);
        const v = ph.target * eased;
        distributed += v;
        if (paths[idx])   paths[idx].style.setProperty('--local', local.toFixed(4));
        if (targets[idx]) {
          targets[idx].style.setProperty('--local', local.toFixed(4));
          targets[idx].classList.toggle('lit', local >= 1);
        }
        if (amts[idx]) amts[idx].textContent = fmt(v);
      });
      if (payAmt) payAmt.textContent = '+' + fmt(Math.max(0, PAYCHECK - distributed));
      if (payCard) payCard.classList.toggle('spent', distributed >= PAYCHECK - 1);
    };
    flowScenes.push({ scene, apply });
  });

  // ---------- scroll-scrubbed scenes: write 0..1 --p ----------
  const scrubs = document.querySelectorAll('[data-scrub]');
  if (scrubs.length && !prefersReduced) {
    let rafId = null;
    const update = () => {
      const vh = window.innerHeight;
      scrubs.forEach(el => {
        const r = el.getBoundingClientRect();
        const total = r.height - vh;
        if (total <= 0) return;
        const p = Math.max(0, Math.min(1, -r.top / total));
        el.style.setProperty('--p', p.toFixed(4));
      });
      flowScenes.forEach(({ scene, apply }) => {
        const r = scene.getBoundingClientRect();
        const total = r.height - vh;
        if (total <= 0) return;
        const p = Math.max(0, Math.min(1, -r.top / total));
        apply(p);
      });
      rafId = null;
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  } else {
    scrubs.forEach(el => el.style.setProperty('--p', '1'));
    flowScenes.forEach(({ apply }) => apply(1));
  }
})();
