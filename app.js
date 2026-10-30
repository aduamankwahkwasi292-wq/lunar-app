/* MrSOLIS 3 website — small and dependency-free. The page works without it; this adds the niceties. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav background once the page scrolls */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* reveal sections as they come into view */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* the tour: show one part of the app at a time */
  const tabs = $$('.tab');
  for (const t of tabs) {
    t.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      const want = t.dataset.filter;
      $$('.gallery .card').forEach((c) => { c.hidden = want !== 'all' && !c.dataset.part.split(' ').includes(want); });
    });
  }

  /* a bigger look at any screenshot (arrows and Esc work) */
  const box = $('#lightbox');
  const shots = $$('[data-full]');
  let cur = null;
  const visible = () => shots.filter((s) => !s.closest('[hidden]'));
  const open = (el) => {
    cur = el;
    $('img', box).src = el.dataset.full;
    $('img', box).alt = el.dataset.caption || '';
    $('figcaption', box).textContent = el.dataset.caption || '';
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.x', box).focus();
  };
  const close = () => { box.hidden = true; document.body.style.overflow = ''; if (cur) cur.focus(); };
  const step = (d) => {
    const list = visible();
    if (list.length) open(list[(list.indexOf(cur) + d + list.length) % list.length]);
  };
  shots.forEach((s) => {
    s.addEventListener('click', () => open(s));
    if (s.tagName !== 'BUTTON') {             // the framed screenshots are role="button" divs: Enter and Space open them too
      s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(s); } });
    }
  });
  if (box) {
    $('.x', box).addEventListener('click', close);
    $('.prev', box).addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
    $('.next', box).addEventListener('click', (e) => { e.stopPropagation(); step(1); });
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  /* the starfield: the same quiet sky as the app */
  const cv = $('#stars');
  if (cv && cv.getContext) {
    const cx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, stars = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.width = Math.floor(innerWidth * dpr);
      h = cv.height = Math.floor(innerHeight * dpr);
      const n = Math.min(160, Math.floor((innerWidth * innerHeight) / 11000));
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), r: (Math.random() * 1.0 + 0.25) * dpr, t: Math.random() * 6.28 }));
    };
    const draw = (animate) => {
      cx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (animate) s.t += 0.01;
        cx.globalAlpha = (0.18 + s.z * 0.5) * (animate ? 0.7 + 0.3 * Math.sin(s.t) : 1);
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, 6.2832);
        cx.fillStyle = '#fff';
        cx.fill();
      }
    };
    resize();
    addEventListener('resize', () => { resize(); draw(false); });
    if (reduceMotion) draw(false);
    else {
      let last = 0;
      const loop = (t) => { if (!document.hidden && t - last > 90) { draw(true); last = t; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* keep the download button on the newest MrSOLIS release (the HTML's link works without this) */
  const REPO = 'aduamankwahkwasi292-wq/lunar';
  const fmtSize = (b) => (b >= 2 ** 30 ? (b / 2 ** 30).toFixed(1) + ' GB' : Math.round(b / 2 ** 20) + ' MB');
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((rel) => {
      // MrSOLIS 3 or later only (the builds are still named Lunar-Setup-<version>.exe), never Lunar 1
      const major = parseInt(String(rel.tag_name || '').replace(/^v/i, ''), 10) || 0;
      const asset = (rel.assets || []).find((a) => /^(MrSOLIS|Lunar).*Setup.*\.exe$/i.test(a.name)
        && (/^MrSOLIS/i.test(a.name) || major >= 3)) || null;
      if (!asset) return;
      $$('[data-dl]').forEach((el) => { el.href = asset.browser_download_url; });
      $$('[data-size]').forEach((el) => { el.textContent = fmtSize(asset.size); });
      $$('[data-version]').forEach((el) => { el.textContent = String(rel.tag_name || '').replace(/^v/i, ''); });
    })
    .catch(() => { /* keep the page's own link */ });
})();
