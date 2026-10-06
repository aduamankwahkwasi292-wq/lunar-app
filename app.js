/* Lunar site — small, dependency-free. Everything degrades gracefully without JS. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav shadow on scroll ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ---------- videos: play when visible, always user-pausable ---------- */
  const ICONS = {
    pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  };
  const videos = $$('video');
  for (const v of videos) {
    const btn = $('[data-toggle]', v.parentElement);
    const setBtn = (playing) => {
      if (!btn) return;
      $('span', btn).textContent = playing ? 'Pause' : 'Play';
      btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      $('svg', btn).innerHTML = playing ? ICONS.pause : ICONS.play;
    };
    v.addEventListener('play', () => setBtn(true));
    v.addEventListener('pause', () => setBtn(false));
    if (btn) {
      btn.addEventListener('click', () => {
        if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); }
        else { v.dataset.userPaused = '1'; v.pause(); }
      });
    }
    if (reduceMotion) { v.controls = true; if (btn) btn.hidden = true; }
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.userPaused) { v.preload = 'auto'; v.play().catch(() => {}); }
        } else {
          v.pause();
        }
      }
    }, { threshold: 0.35 });
    videos.forEach((v) => vio.observe(v));
  }

  /* ---------- quiet starfield ---------- */
  const cv = $('#stars');
  if (cv && cv.getContext) {
    const cx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, stars = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.width = Math.floor(innerWidth * dpr);
      h = cv.height = Math.floor(innerHeight * dpr);
      const n = Math.min(150, Math.floor((innerWidth * innerHeight) / 12000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: Math.random(),
        r: (Math.random() * 1.1 + 0.25) * dpr, t: Math.random() * 6.28,
      }));
    };
    const draw = (animate) => {
      cx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (animate) { s.t += 0.012; s.y += (0.015 + s.z * 0.035) * dpr; if (s.y > h) { s.y = 0; s.x = Math.random() * w; } }
        const tw = 0.55 + 0.45 * Math.sin(s.t);
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, 6.2832);
        cx.fillStyle = `rgba(190,208,245,${(tw * (0.16 + s.z * 0.4)).toFixed(3)})`;
        cx.fill();
      }
    };
    resize();
    addEventListener('resize', () => { resize(); draw(false); });
    if (reduceMotion) { draw(false); }
    else {
      const loop = () => { if (!document.hidden) draw(true); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- copy checksum ---------- */
  const copyBtn = $('#copy-sha');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const el = $('#sha');
      const text = el.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        try { document.execCommand('copy'); } catch (__) { /* user can copy manually */ }
      }
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
    });
  }

  /* ---------- keep the download button on the newest release ----------
     The HTML ships with the v1.0.0 link so it works with no JS or if GitHub's API is
     unreachable; when a newer release is published this swaps in its file, size and checksum. */
  const REPO = 'aduamankwahkwasi292-wq/lunar-app';
  const fmtSize = (b) => (b >= 2 ** 30 ? (b / 2 ** 30).toFixed(1) + ' GB' : Math.round(b / 2 ** 20) + ' MB');
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((rel) => {
      const asset = (rel.assets || []).find((a) => /^Lunar-Setup-.+\.exe$/i.test(a.name));
      if (!asset) return;
      $$('[data-dl]').forEach((el) => { el.href = asset.browser_download_url; });
      $$('[data-version]').forEach((el) => { el.textContent = String(rel.tag_name || '').replace(/^v/i, ''); });
      $$('[data-size]').forEach((el) => { el.textContent = fmtSize(asset.size); });
      $$('[data-filename]').forEach((el) => { el.textContent = asset.name; });
      const sha = $('#sha');
      if (sha && typeof asset.digest === 'string' && asset.digest.startsWith('sha256:')) sha.textContent = asset.digest.slice(7);
    })
    .catch(() => { /* keep the static defaults */ });
})();
