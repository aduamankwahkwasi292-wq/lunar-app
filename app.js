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

  /* fade each part in as it arrives */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* the video: the full tour or the one-minute version, in one player (neither downloads until play) */
  const video = $('#video');
  const choices = $$('.segmented button');
  for (const b of choices) {
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      choices.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      video.pause();
      video.poster = b.dataset.poster;
      video.src = b.dataset.video;
      $('#video-meta').textContent = b.dataset.meta;
    });
  }

  /* a bigger look at any screenshot (arrows and Esc work) */
  const box = $('#lightbox');
  const shots = $$('[data-full]');
  let cur = null;
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
  const step = (d) => open(shots[(shots.indexOf(cur) + d + shots.length) % shots.length]);
  shots.forEach((s) => s.addEventListener('click', () => open(s)));
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

  /* keep the download buttons on the newest MrSOLIS release (the HTML's link works without this) */
  const REPO = 'aduamankwahkwasi292-wq/lunar';
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((rel) => {
      // MrSOLIS 3 or later only (the builds are still named Lunar-Setup-<version>.exe), never Lunar 1
      const major = parseInt(String(rel.tag_name || '').replace(/^v/i, ''), 10) || 0;
      const asset = (rel.assets || []).find((a) => /^(MrSOLIS|Lunar).*Setup.*\.exe$/i.test(a.name)
        && (/^MrSOLIS/i.test(a.name) || major >= 3)) || null;
      if (asset) $$('[data-dl]').forEach((el) => { el.href = asset.browser_download_url; });
    })
    .catch(() => { /* keep the page's own link */ });
})();
