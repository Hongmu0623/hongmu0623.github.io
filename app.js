/* app.js — 화면을 그리는 코드. 내용 수정은 content.js에서 하세요. */
(function () {
  'use strict';

  const site = typeof SITE !== 'undefined' ? SITE : {};
  const app = document.getElementById('app');
  const KIND = { post: '글', photo: '사진', video: '영상' };
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

  /* ---------- 도우미 ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toDate = (s) => { const [y, m, d] = String(s || '').split('-').map(Number); return new Date(y || 2000, (m || 1) - 1, d || 1); };
  const fmt = (s) => { const d = toDate(s); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DAYS[d.getDay()]})`; };
  const byDesc = (a, b) => toDate(b.date) - toDate(a.date);
  const md = (t) => (window.marked ? window.marked.parse(t || '') : String(t || '').trim().split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join(''));
  const hue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const ytId = (v) => {
    if (!v) return '';
    const m = String(v).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(v) ? v : '';
  };
  const ytThumb = (v) => { const id = ytId(v.youtube); return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''; };

  // 사진 상자: 파일을 못 찾으면 색 상자와 설명으로 대신 보여 줍니다.
  function media(src, label, o = {}) {
    const cls = ['media'];
    if (!src) cls.push('ph');
    if (o.fixed) cls.push('fixed');
    if (o.play) cls.push('play');
    const img = src ? `<img src="${esc(src)}" alt="${esc(label)}" loading="lazy" onerror="this.parentNode.classList.add('ph');this.remove()">` : '';
    return `<span class="${cls.join(' ')}" style="--h:${hue(label + src)};--r:${o.ratio || '4 / 3'}">${img}<span class="ph-label">${esc(label)}</span></span>`;
  }

  /* ---------- 데이터 정리 ---------- */
  const posts = (typeof POSTS !== 'undefined' ? POSTS : []).slice().sort(byDesc);
  const photos = (typeof PHOTOS !== 'undefined' ? PHOTOS : []).slice().sort(byDesc);
  const videos = (typeof VIDEOS !== 'undefined' ? VIDEOS : []).slice().sort(byDesc);

  const log = [
    ...posts.map((p) => ({ type: 'post', date: p.date, title: p.title, href: `#post-${p.id}`, thumb: p.cover })),
    ...photos.map((p, i) => ({ type: 'photo', date: p.date, title: p.caption, href: `#photo-${i}`, thumb: p.src })),
    ...videos.map((v, i) => ({ type: 'video', date: v.date, title: v.title, href: `#video-${i}`, thumb: ytThumb(v), play: true })),
  ];
  // 기록 번호: 오래된 것부터 No.001
  log.slice().sort((a, b) => toDate(a.date) - toDate(b.date)).forEach((e, i) => { e.no = String(i + 1).padStart(3, '0'); });
  log.sort(byDesc);

  /* ---------- 고정 영역 ---------- */
  document.title = site.title || document.title;
  const setText = (id, t) => { const el = document.getElementById(id); if (el && t) el.textContent = t; };
  setText('site-title', site.title);
  setText('site-tagline', site.tagline);
  setText('site-eyebrow', site.eyebrow);

  const NAV = [
    ['', '전체', log.length],
    ['posts', '글', posts.length],
    ['photos', '사진', photos.length],
    ['videos', '영상', videos.length],
    ['about', '소개', null],
  ];
  document.getElementById('nav').innerHTML = NAV.map(([k, label, n]) =>
    `<a href="#${k}" data-sec="${k}">${label}${n != null ? `<span class="n-count">${n}</span>` : ''}</a>`).join('');

  const links = (site.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
  document.getElementById('foot').innerHTML =
    `<span>© ${new Date().getFullYear()} ${esc(site.author || '')}</span><span class="foot-links">${links}</span>`;

  /* ---------- 화면별 ---------- */
  function entryRow(e) {
    return `<li><a class="entry" href="${e.href}">
      <span class="e-meta"><span class="e-no">No.${e.no}</span><time class="e-date">${fmt(e.date)}</time><span class="kind k-${e.type}">${KIND[e.type]}</span></span>
      <span class="e-title">${esc(e.title)}</span>
      <span class="e-thumb">${media(e.thumb, e.title, { ratio: '1 / 1', play: e.play })}</span>
    </a></li>`;
  }

  function viewHome() {
    const strip = photos.slice(0, 4).map((p, i) =>
      `<a class="strip-item" href="#photo-${i}" aria-label="${esc(p.caption)}">${media(p.src, p.caption, { ratio: '1 / 1', fixed: true })}</a>`).join('');
    return `
      <section class="wrap block">
        <div class="sec-row"><h2 class="sec">최근 기록 <span class="count">${log.length}건</span></h2></div>
        <ol class="log">${log.map(entryRow).join('')}</ol>
      </section>
      ${photos.length ? `<section class="wrap block">
        <div class="sec-row"><h2 class="sec">최근 사진</h2><a class="more" href="#photos">사진 전체 보기 →</a></div>
        <div class="strip">${strip}</div>
      </section>` : ''}`;
  }

  let activeTag = '';
  function postCards() {
    const list = activeTag ? posts.filter((p) => (p.tags || []).includes(activeTag)) : posts;
    return list.map((p) => `<article class="card"><a href="#post-${esc(p.id)}">
      ${media(p.cover, p.title, { ratio: '16 / 10', fixed: true })}
      <div class="card-body">
        <time>${fmt(p.date)}</time>
        <h3>${esc(p.title)}</h3>
        ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
        <ul class="tags">${(p.tags || []).map((t) => `<li>#${esc(t)}</li>`).join('')}</ul>
      </div></a></article>`).join('') || '<p class="empty">이 태그의 글이 아직 없습니다.</p>';
  }
  function viewPosts() {
    const tags = [...new Set(posts.flatMap((p) => p.tags || []))];
    const chip = (t, label) => `<button class="chip" type="button" data-tag="${esc(t)}" aria-pressed="${activeTag === t}">${esc(label)}</button>`;
    return `<section class="wrap block">
      <div class="sec-row"><h2 class="sec">글 <span class="count">${posts.length}편</span></h2></div>
      ${tags.length ? `<div class="chips" id="chips">${chip('', '전체')}${tags.map((t) => chip(t, '#' + t)).join('')}</div>` : ''}
      <div class="cards" id="cards">${postCards()}</div>
    </section>`;
  }

  function viewPost(id) {
    const i = posts.findIndex((p) => p.id === id);
    if (i < 0) return viewMissing();
    const p = posts[i], newer = posts[i - 1], older = posts[i + 1];
    return `<article class="wrap narrow post">
      <a class="back" href="#posts">← 글 목록</a>
      <header>
        <p class="meta"><time>${fmt(p.date)}</time>${(p.tags || []).map((t) => ` · #${esc(t)}`).join('')}</p>
        <h1>${esc(p.title)}</h1>
        ${p.summary ? `<p class="dek">${esc(p.summary)}</p>` : ''}
      </header>
      ${p.cover ? `<figure class="post-cover">${media(p.cover, p.title, { ratio: '16 / 9' })}</figure>` : ''}
      <div class="prose">${md(p.body)}</div>
      <nav class="pager" aria-label="다른 글">
        ${older ? `<a class="prev" href="#post-${esc(older.id)}"><span class="lbl">← 이전 글</span><span class="t">${esc(older.title)}</span></a>` : '<span></span>'}
        ${newer ? `<a class="next" href="#post-${esc(newer.id)}"><span class="lbl">다음 글 →</span><span class="t">${esc(newer.title)}</span></a>` : ''}
      </nav>
    </article>`;
  }

  function viewPhotos() {
    return `<section class="wrap block">
      <div class="sec-row"><h2 class="sec">사진 <span class="count">${photos.length}장</span></h2></div>
      <div class="gallery">${photos.map((p, i) => `<figure class="shot">
        <button class="shot-btn" type="button" data-i="${i}" aria-label="크게 보기: ${esc(p.caption)}">${media(p.src, p.caption, { ratio: p.ratio || (i % 3 === 1 ? '3 / 4' : '4 / 3') })}</button>
        <figcaption><span>${esc(p.caption)}</span><span class="shot-meta">${fmt(p.date)}${p.place ? ' · ' + esc(p.place) : ''}</span></figcaption>
      </figure>`).join('')}</div>
    </section>`;
  }

  function viewVideos() {
    return `<section class="wrap block">
      <div class="sec-row"><h2 class="sec">영상 <span class="count">${videos.length}개</span></h2></div>
      <div class="cards">${videos.map((v, i) => `<article class="card"><a href="#video-${i}">
        ${media(ytThumb(v), v.title, { ratio: '16 / 9', fixed: true, play: true })}
        <div class="card-body"><time>${fmt(v.date)}</time><h3>${esc(v.title)}</h3>${v.note ? `<p>${esc(v.note)}</p>` : ''}</div>
      </a></article>`).join('')}</div>
    </section>`;
  }

  function viewVideo(i) {
    const v = videos[i];
    if (!v) return viewMissing();
    const id = ytId(v.youtube);
    let player;
    if (v.file) player = `<video controls preload="metadata" src="${esc(v.file)}"></video>`;
    else if (id) player = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(v.title)}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
    else player = `<div class="player-empty"><p><strong>영상 자리</strong></p><p>content.js의 <code>youtube</code> 칸에 영상 주소를 넣으면 여기서 재생됩니다.</p></div>`;
    return `<article class="wrap narrow post">
      <a class="back" href="#videos">← 영상 목록</a>
      <header><p class="meta"><time>${fmt(v.date)}</time></p><h1>${esc(v.title)}</h1></header>
      <div class="player">${player}</div>
      ${v.note ? `<div class="prose">${md(v.note)}</div>` : ''}
      ${id ? `<p><a class="more" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">YouTube에서 보기 ↗</a></p>` : ''}
    </article>`;
  }

  function viewAbout() {
    const l = (site.links || []).map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} ↗</a></li>`).join('');
    return `<article class="wrap narrow post">
      <header><h1>소개</h1></header>
      <div class="prose">${md(site.about)}</div>
      ${l ? `<ul class="links">${l}</ul>` : ''}
    </article>`;
  }

  function viewMissing() {
    return `<section class="wrap narrow post"><h1>찾는 페이지가 없습니다</h1>
      <p>주소가 바뀌었거나 지워진 기록입니다. <a class="more" href="#">처음으로 돌아가기</a></p></section>`;
  }

  /* ---------- 주소(#)에 따라 화면 바꾸기 ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    let m, html, sec = '', openPhoto = -1;
    if (!h) html = viewHome();
    else if (h === 'posts') { html = viewPosts(); sec = 'posts'; }
    else if ((m = h.match(/^post-(.+)$/))) { html = viewPost(m[1]); sec = 'posts'; }
    else if (h === 'photos') { html = viewPhotos(); sec = 'photos'; }
    else if ((m = h.match(/^photo-(\d+)$/))) { html = viewPhotos(); sec = 'photos'; openPhoto = +m[1]; }
    else if (h === 'videos') { html = viewVideos(); sec = 'videos'; }
    else if ((m = h.match(/^video-(\d+)$/))) { html = viewVideo(+m[1]); sec = 'videos'; }
    else if (h === 'about') { html = viewAbout(); sec = 'about'; }
    else html = viewMissing();

    app.innerHTML = html;
    // 본문 속 사진도 파일이 없으면 색 상자로 대신
    app.querySelectorAll('.prose img').forEach((img) => {
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        const box = document.createElement('span');
        box.innerHTML = media('', img.alt || '사진', { ratio: '16 / 9' });
        img.replaceWith(box.firstChild);
      }, { once: true });
    });
    document.querySelectorAll('#nav a').forEach((a) => {
      if (a.dataset.sec === sec) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    if (openPhoto >= 0) openLightbox(openPhoto);
  }

  app.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      activeTag = chip.dataset.tag;
      document.querySelectorAll('#chips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.tag === activeTag)));
      document.getElementById('cards').innerHTML = postCards();
      return;
    }
    const shot = e.target.closest('.shot-btn');
    if (shot) openLightbox(+shot.dataset.i);
  });

  /* ---------- 사진 크게 보기 ---------- */
  const lb = document.getElementById('lightbox');
  let lbIndex = 0, lastFocus = null;
  function drawLightbox() {
    const p = photos[lbIndex];
    document.getElementById('lb-media').innerHTML = media(p.src, p.caption, { ratio: p.ratio || '4 / 3' });
    document.getElementById('lb-cap').innerHTML =
      `<span>${esc(p.caption)}</span> <span class="shot-meta">${fmt(p.date)}${p.place ? ' · ' + esc(p.place) : ''} · ${lbIndex + 1} / ${photos.length}</span>`;
  }
  function openLightbox(i) {
    if (!photos[i]) return;
    lbIndex = i; lastFocus = document.activeElement;
    drawLightbox(); lb.hidden = false; document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }
  function closeLightbox() {
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  const step = (d) => { lbIndex = (lbIndex + d + photos.length) % photos.length; drawLightbox(); };
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => step(-1));
  document.getElementById('lb-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  /* ---------- 밝게/어둡게 ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-btn');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  const syncBtn = () => { themeBtn.textContent = isDark() ? '밝은 화면' : '어두운 화면'; };
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) { /* 저장 불가 환경 */ }
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* 무시 */ }
    syncBtn();
  });
  syncBtn();

  window.addEventListener('hashchange', route);
  route();
})();
