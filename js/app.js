(() => {
  const media = window.MEDIA_LIBRARY || [];
  const config = window.STORY_CONFIG || {};
  const cinema = config.cinema || {};

  const sceneRoot = document.getElementById('sceneRoot');
  const progressBar = document.getElementById('progressBar');
  const chapterLabel = document.getElementById('chapterLabel');
  const chapterNav = document.getElementById('yearNav');
  const chrome = document.getElementById('chrome');
  const music = document.getElementById('music');
  const musicToggle = document.getElementById('musicToggle');
  const particles = document.getElementById('particles');
  const lightbox = document.getElementById('lightbox');
  const lightboxMedia = document.getElementById('lightboxMedia');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  let current = 0;
  let transitioning = false;
  let started = false;

  // Soundtrack only: keep the story/layout untouched and shape the same MP3
  // with gentle volume fades as the viewer moves through the scenes.
  const MUSIC_FLOW = {
    fadeMs: 900,
    defaultVolume: 0.20,
    videoVolume: 0.045,
    byId: {
      opening: 0.14,
      rewind: 0.10,
      'first-date': 0.18,
      'relationship-date': 0.34,
      reflection: 0.17,
      'birthday-preface': 0.20,
      callback: 0.25,
      birthday: 0.38,
      future: 0.28
    },
    byTone: {
      origin: 0.18,
      relationship: 0.32,
      trip: 0.24,
      quiet: 0.13,
      pause: 0.11,
      callback: 0.24
    },
    byYear: {
      2023: 0.18,
      2024: 0.22,
      2025: 0.20,
      2026: 0.19
    }
  };

  let musicWanted = true;
  let musicFadeFrame = null;

  function musicVolumeForScene(scene = scenes?.[current]) {
    if (!scene) return MUSIC_FLOW.defaultVolume;
    if (MUSIC_FLOW.byId[scene.id] != null) return MUSIC_FLOW.byId[scene.id];
    if (scene.tone && MUSIC_FLOW.byTone[scene.tone] != null) return MUSIC_FLOW.byTone[scene.tone];
    if (scene.year && MUSIC_FLOW.byYear[scene.year] != null) return MUSIC_FLOW.byYear[scene.year];
    return MUSIC_FLOW.defaultVolume;
  }

  function fadeMusicTo(target, duration = MUSIC_FLOW.fadeMs) {
    if (!music) return;
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);

    const startVolume = Number.isFinite(music.volume) ? music.volume : 0;
    const safeTarget = Math.max(0, Math.min(1, target));
    const startedAt = performance.now();

    const tick = now => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      music.volume = startVolume + (safeTarget - startVolume) * eased;

      if (progress < 1) musicFadeFrame = requestAnimationFrame(tick);
      else musicFadeFrame = null;
    };

    musicFadeFrame = requestAnimationFrame(tick);
  }

  function syncMusicToScene({ immediate = false } = {}) {
    if (!music || !started) return;
    const target = musicVolumeForScene();
    if (immediate) music.volume = target;
    else fadeMusicTo(target);
  }

  const escapeHTML = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const escapeAttr = escapeHTML;

  const byYear = media.reduce((acc, item) => {
    if (!item.year) return acc;
    acc[item.year] ||= [];
    acc[item.year].push(item);
    return acc;
  }, {});

  const byYearMonth = media.reduce((acc, item) => {
    if (!item.year) return acc;
    acc[item.year] ||= {};
    acc[item.year][item.month] ||= [];
    acc[item.year][item.month].push(item);
    return acc;
  }, {});

  Object.values(byYear).forEach(items => items.sort((a, b) => a.sort.localeCompare(b.sort)));
  Object.values(byYearMonth).forEach(months => {
    Object.values(months).forEach(items => items.sort((a, b) => a.sort.localeCompare(b.sort)));
  });

  function enterFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;

    try {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (err) {
      console.log('Fullscreen không được hỗ trợ:', err);
    }
  }

  function itemKey(item) {
    return `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
  }

  function selectItems(year, month, section, sourceItems) {
    if (!section) return [];
    const needsYearPool = Array.isArray(section.mediaFiles) || Array.isArray(section.mediaDates);
    const items = sourceItems || (needsYearPool
      ? (byYear[year] || [])
      : month ? (byYearMonth[year]?.[month] || []) : (byYear[year] || []));

    if (section.media === 'all') return [...items];

    if (Array.isArray(section.mediaFiles)) {
      const wanted = new Set(section.mediaFiles);
      return items.filter(item => wanted.has(item.filename));
    }

    if (Array.isArray(section.mediaDates)) {
      const wanted = new Set(section.mediaDates);
      return items.filter(item => wanted.has(itemKey(item)));
    }

    if (Array.isArray(section.mediaDays)) {
      const wanted = new Set(section.mediaDays.map(Number));
      return items.filter(item => wanted.has(Number(item.day)));
    }

    return [];
  }

  function getMoment(year, momentIndex) {
    const yearConfig = config.years?.[String(year)] || {};
    return yearConfig.moments?.[momentIndex] || null;
  }

  function getSection(year, month, sectionIndex) {
    const yearConfig = config.years?.[String(year)] || {};
    const monthConfig = yearConfig.months?.[String(month)] || {};
    return {
      moment: monthConfig.sections?.[sectionIndex] || null,
      monthConfig
    };
  }

  function momentScene({ year, month = null, index, source = 'month', tone = '', label = '' }) {
    let moment = null;
    let monthConfig = null;

    if (source === 'prologue') {
      moment = getMoment(year, index);
    } else {
      const result = getSection(year, month, index);
      moment = result.moment;
      monthConfig = result.monthConfig;
    }

    if (!moment) return null;

    return {
      id: source === 'prologue' ? `${year}-prologue-${index}` : `${year}-${String(month).padStart(2, '0')}-${index}`,
      type: 'moment',
      year,
      month,
      tone,
      label: label || moment.title,
      moment,
      monthConfig,
      items: selectItems(year, month, moment)
    };
  }

  function buildScenes() {
    const openingItems = selectItems(2026, null, {
      mediaDates: ['2026-05-29', '2026-05-30', '2026-07-05']
    });

    const flow = [
      { id: 'intro', type: 'intro', label: 'một câu chuyện về em' },
      { id: 'opening', type: 'opening', label: '', data: cinema.opening || {}, items: openingItems },
      { id: 'rewind', type: 'rewind', label: '', data: cinema.rewind || {} },

      { id: 'first-date', type: 'date-reveal', year: 2023, label: '14.01.2023', data: cinema.firstDate || {} },
      momentScene({ year: 2023, index: 0, source: 'prologue', tone: 'origin' }),

      momentScene({ year: 2024, index: 0, source: 'prologue' }),
      momentScene({ year: 2024, index: 1, source: 'prologue' }),
      { id: 'relationship-date', type: 'date-reveal', year: 2024, label: '03.03.2024', data: cinema.relationshipDate || {}, relationship: true },
      momentScene({ year: 2024, index: 2, source: 'prologue', tone: 'relationship' }),

      momentScene({ year: 2024, month: 3, index: 0 }),
      momentScene({ year: 2024, month: 3, index: 1 }),
      momentScene({ year: 2024, month: 3, index: 2 }),
      momentScene({ year: 2024, month: 3, index: 3 }),
      momentScene({ year: 2024, month: 3, index: 4 }),
      momentScene({ year: 2024, month: 4, index: 0 }),
      momentScene({ year: 2024, month: 4, index: 1, tone: 'trip' }),
      momentScene({ year: 2024, month: 5, index: 0 }),
      momentScene({ year: 2024, month: 6, index: 0, tone: 'quiet' }),
      momentScene({ year: 2024, month: 6, index: 1 }),
      momentScene({ year: 2024, month: 7, index: 0 }),
      momentScene({ year: 2024, month: 8, index: 0 }),
      momentScene({ year: 2024, month: 8, index: 1 }),
      momentScene({ year: 2024, month: 8, index: 2 }),
      momentScene({ year: 2024, month: 9, index: 0 }),
      momentScene({ year: 2024, month: 10, index: 0 }),
      momentScene({ year: 2024, month: 12, index: 0 }),
      momentScene({ year: 2024, month: 12, index: 1 }),

      momentScene({ year: 2025, month: 1, index: 0 }),
      momentScene({ year: 2025, month: 2, index: 0 }),
      momentScene({ year: 2025, month: 3, index: 0 }),
      momentScene({ year: 2025, month: 3, index: 1 }),
      momentScene({ year: 2025, month: 4, index: 0 }),
      momentScene({ year: 2025, month: 5, index: 0 }),
      momentScene({ year: 2025, month: 6, index: 0 }),
      momentScene({ year: 2025, month: 8, index: 0 }),
      momentScene({ year: 2025, month: 8, index: 1, tone: 'trip' }),
      momentScene({ year: 2025, month: 9, index: 0 }),
      momentScene({ year: 2025, month: 10, index: 0 }),
      momentScene({ year: 2025, month: 11, index: 0 }),
      momentScene({ year: 2025, month: 12, index: 0 }),

      momentScene({ year: 2026, month: 1, index: 0 }),
      momentScene({ year: 2026, month: 2, index: 0 }),
      momentScene({ year: 2026, month: 3, index: 0, tone: 'pause' }),
      momentScene({ year: 2026, month: 4, index: 0 }),
      momentScene({ year: 2026, month: 5, index: 0, tone: 'callback' }),
      momentScene({ year: 2026, month: 7, index: 0, tone: 'callback' }),

      config.reflection ? { id: 'reflection', type: 'text', label: '', data: config.reflection } : null,
      config.birthday?.preface ? { id: 'birthday-preface', type: 'text', label: '', data: config.birthday.preface, birthdayPreface: true } : null,
      { id: 'callback', type: 'callback', label: '', data: cinema.callback || {} },
      { id: 'birthday', type: 'birthday', label: '' },
      { id: 'future', type: 'future', label: '' }
    ];

    return flow.filter(Boolean);
  }

  const scenes = buildScenes();
  const yearStarts = {};

  scenes.forEach((scene, index) => {
    if (scene.year && yearStarts[scene.year] == null) yearStarts[scene.year] = index;
  });

  const storyYears = Object.keys(yearStarts).map(Number).sort((a, b) => a - b);

  function navButtons({ prev = true, next = true, nextText = 'Đi tiếp' } = {}) {
    return `<nav class="scene-nav">
      ${prev ? '<button class="ghost" type="button" data-action="prev" aria-label="Quay lại">←</button>' : ''}
      ${next ? `<button class="primary" type="button" data-action="next">${escapeHTML(nextText)}</button>` : ''}
    </nav>`;
  }

  function renderIntro() {
    const x = config.intro || {};
    return `<div class="scene-shell intro-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <h1>${escapeHTML(x.title)}</h1>
      <div class="intro-lines">${(x.lines || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      <button class="primary" type="button" data-action="start">${escapeHTML(x.cta || 'Bắt đầu')}</button>
      <p class="tiny">Em xem từng chút một nhé.</p>
    </div></div>`;
  }

  function mediaCard(item, index, total, caption = '', variant = '') {
    const src = escapeAttr(item.src);
    const date = item.date || '';
    const inner = item.type === 'video'
      ? `<video src="${src}" muted playsinline preload="metadata"></video><span class="play-badge">▶</span>`
      : `<img src="${src}" alt="Kỷ niệm ${escapeAttr(date)}" loading="lazy" decoding="async">`;

    return `<button class="media-card${variant ? ` ${escapeAttr(variant)}` : ''}" type="button"
      data-media-src="${src}"
      data-media-type="${escapeAttr(item.type)}"
      data-media-date="${escapeAttr(date)}"
      data-media-caption="${escapeAttr(caption)}"
      aria-label="Mở kỷ niệm ${escapeAttr(date)}">
      <span class="media-frame">${inner}</span>
      <span class="media-meta">
        <span class="media-date">${escapeHTML(date)}</span>
        <span class="media-index">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
      </span>
    </button>`;
  }

  function renderOpening(scene) {
    const x = scene.data || {};
    const items = scene.items || [];
    const mediaBlock = items.length
      ? `<div class="opening-frames">${items.slice(0, 5).map((item, index) => mediaCard(item, index, Math.min(items.length, 5), 'Một trong những bức ảnh gần hiện tại nhất.', 'opening-card')).join('')}</div>`
      : '';

    return `<div class="scene-shell opening-scene"><div class="scene-inner">
      ${x.eyebrow ? `<p class="eyebrow">${escapeHTML(x.eyebrow)}</p>` : ''}
      <h2>${escapeHTML(x.title)}</h2>
      ${mediaBlock}
      <div class="opening-copy">${(x.paragraphs || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      ${navButtons({ nextText: x.cta || 'Tìm ngược lại' })}
    </div></div>`;
  }

  function renderRewind(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell rewind-scene"><div class="scene-inner narrow">
      ${x.eyebrow ? `<p class="eyebrow">${escapeHTML(x.eyebrow)}</p>` : ''}
      <h2>${escapeHTML(x.title)}</h2>
      <div class="rewind-reel" aria-label="Tua ngược từ 2026 về 2023">
        <span>2026</span><span>2025</span><span>2024</span><span>2023</span>
      </div>
      <nav class="scene-nav">
        <button class="ghost" type="button" data-action="prev" aria-label="Quay lại">←</button>
        <button class="primary" type="button" data-action="rewind">${escapeHTML(x.cta || 'Tua ngược')}</button>
      </nav>
    </div></div>`;
  }

  function renderDateReveal(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell date-reveal-scene${scene.relationship ? ' relationship-date-scene' : ''}"><div class="scene-inner narrow">
      ${x.eyebrow ? `<p class="eyebrow">${escapeHTML(x.eyebrow)}</p>` : ''}
      <div class="date-reveal-title">${escapeHTML(x.title)}</div>
      <p class="date-reveal-lead">${escapeHTML(x.lead)}</p>
      ${navButtons({ nextText: scene.relationship ? 'Đi qua ngày này' : 'Xem bức ảnh đầu tiên' })}
    </div></div>`;
  }

  function renderMoment(scene) {
    const moment = scene.moment || {};
    const items = scene.items || [];
    const caption = moment.caption || moment.title || '';

    const mediaBlock = items.length ? `
      <div class="moment-media">
        <div class="media-rail">${items.map((item, index) => mediaCard(item, index, items.length, caption)).join('')}</div>
        ${items.length > 1 ? `<div class="timeline-dots" aria-hidden="true">${items.map(() => '<span class="timeline-dot"></span>').join('')}</div>` : ''}
        <p class="swipe-hint">← vuốt để xem hết ảnh →</p>
      </div>` : '';

    return `<div class="scene-shell moment-scene${scene.tone ? ` tone-${escapeAttr(scene.tone)}` : ''}" data-year="${scene.year}"${scene.month ? ` data-month="${scene.month}"` : ''}><div class="scene-inner">
      <div class="moment-head">
        ${moment.date ? `<div class="moment-date">${escapeHTML(moment.date)}</div>` : ''}
        <h2>${escapeHTML(moment.title)}</h2>
      </div>
      <div class="moment-copy">${(moment.paragraphs || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      ${mediaBlock}
      ${navButtons({ nextText: 'Đi tiếp' })}
    </div></div>`;
  }

  function renderTextScene(scene) {
    const data = scene.data || {};
    return `<div class="scene-shell text-story-scene${scene.birthdayPreface ? ' birthday-preface-scene' : ''}"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(data.eyebrow)}</p>
      <h2>${escapeHTML(data.title)}</h2>
      <div class="story-panel">${(data.paragraphs || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      ${navButtons({ nextText: scene.birthdayPreface ? 'Còn một điều nữa…' : 'Đi tiếp' })}
    </div></div>`;
  }

  function renderCallback(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell callback-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <h2>${escapeHTML(x.title)}</h2>
      <p class="callback-lead">${escapeHTML(x.lead)}</p>
      <div class="callback-line" aria-hidden="true"><span></span><b>14.01.2023</b><span></span><b>?</b></div>
      ${navButtons({ nextText: 'Đến sinh nhật em' })}
    </div></div>`;
  }

  function renderBirthday() {
    const b = config.birthday || {};
    return `<div class="scene-shell birthday-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(b.eyebrow)}</p>
      <h1>${escapeHTML(b.title)}</h1>
      <div class="letter-card">${(b.paragraphs || []).map((paragraph, index) => `<p${index === b.paragraphs.length - 1 ? ' class="signature"' : ''}>${escapeHTML(paragraph)}</p>`).join('')}</div>
      ${navButtons({ nextText: 'Anh còn một thứ nữa…' })}
    </div></div>`;
  }

  function renderFuture() {
    const f = config.future || {};
    const ai = media.find(item => !item.year && item.filename === 'ai-wedding.jpg');
    return `<div class="scene-shell future-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(f.eyebrow)}</p>
      <h2>${escapeHTML(f.title)}</h2>
      <p class="lead">${escapeHTML(f.lead)}</p>
      <button class="heart-button" type="button" data-action="reveal-future" aria-label="Mở bất ngờ">♡</button>
      <div id="futureReveal" class="future-reveal">
        <figure class="future-frame">
          <img src="${escapeAttr(ai?.src || 'assets/media/special/ai-wedding.jpg')}" alt="Một bức ảnh về tương lai của hai đứa">
          <figcaption class="future-punch">${escapeHTML(f.punch)}</figcaption>
        </figure>
        <p class="future-ending">${escapeHTML(f.ending)}</p>
        <p class="year-hero">Happy Birthday, em yêu ♡</p>
      </div>
      ${navButtons({ next: false })}
      <nav class="scene-nav"><button class="text-button" type="button" data-action="restart">Xem lại từ đầu</button></nav>
    </div></div>`;
  }

  function render(scene) {
    if (scene.type === 'intro') return renderIntro();
    if (scene.type === 'opening') return renderOpening(scene);
    if (scene.type === 'rewind') return renderRewind(scene);
    if (scene.type === 'date-reveal') return renderDateReveal(scene);
    if (scene.type === 'moment') return renderMoment(scene);
    if (scene.type === 'text') return renderTextScene(scene);
    if (scene.type === 'callback') return renderCallback(scene);
    if (scene.type === 'birthday') return renderBirthday();
    if (scene.type === 'future') return renderFuture();
    return '';
  }

  function activeYearForScene(index) {
    if (scenes[index]?.year) return scenes[index].year;
    for (let i = index; i >= 0; i -= 1) {
      if (scenes[i]?.year) return scenes[i].year;
    }
    return null;
  }

  function updateChrome() {
    const activeYear = activeYearForScene(current);
    chrome.classList.toggle('hidden', current === 0);
    progressBar.style.width = `${((current + 1) / scenes.length) * 100}%`;
    chapterLabel.textContent = activeYear ? String(activeYear) : '';

    document.querySelectorAll('[data-jump-year]').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.jumpYear) === activeYear);
    });
  }

  function buildYearNav() {
    chapterNav.setAttribute('aria-label', 'Chọn năm');
    chapterNav.innerHTML = storyYears.map(year => {
      const displayYear = year === 2026 ? 'bây giờ' : String(year);
      return `<button class="year-pill" type="button" data-jump-year="${year}" aria-label="Đến năm ${year}">${displayYear}</button>`;
    }).join('');
  }

  function renderCurrent({ animate = true, backwards = false } = {}) {
    sceneRoot.innerHTML = render(scenes[current]);
    const shell = sceneRoot.firstElementChild;
    if (animate) shell?.classList.add(backwards ? 'entering-back' : 'entering');
    updateChrome();
    preloadNext();
    syncMusicToScene();
  }

  function goTo(index) {
    if (transitioning || index < 0 || index >= scenes.length || index === current) return;
    transitioning = true;
    const backwards = index < current;
    const shell = sceneRoot.firstElementChild;
    shell?.classList.add(backwards ? 'leaving-back' : 'leaving');

    setTimeout(() => {
      current = index;
      renderCurrent({ animate: true, backwards });
      transitioning = false;
    }, 300);
  }

  function preloadNext() {
    const next = scenes[current + 1];
    if (!next?.items?.length) return;
    next.items.slice(0, 4).filter(item => item.type === 'image').forEach(item => {
      const image = new Image();
      image.src = item.src;
    });
  }

  function start() {
    enterFullscreen();
    if (!started) {
      started = true;
      musicWanted = true;
      chrome.classList.remove('hidden');
      music.volume = 0;
      music.play().then(() => {
        musicToggle.classList.remove('muted');
        fadeMusicTo(MUSIC_FLOW.byId.opening, 1400);
      }).catch(() => musicToggle.classList.add('muted'));
      burst(8);
    }
    goTo(1);
  }

  function restart() {
    closeLightbox();
    current = 0;
    started = false;
    musicWanted = false;
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);
    musicFadeFrame = null;
    music.pause();
    music.currentTime = 0;
    music.volume = 0;
    musicToggle.classList.add('muted');
    chrome.classList.add('hidden');
    renderCurrent({ animate: false });
  }

  function playRewind(button) {
    if (transitioning || button.disabled) return;
    button.disabled = true;
    const shell = sceneRoot.querySelector('.rewind-scene');
    shell?.classList.add('is-rewinding');

    setTimeout(() => {
      goTo(current + 1);
    }, 1650);
  }

  function openLightbox(button) {
    const src = button.dataset.mediaSrc;
    const type = button.dataset.mediaType;
    const date = button.dataset.mediaDate;
    const caption = button.dataset.mediaCaption || 'Một khoảnh khắc anh muốn giữ lại.';

    lightboxMedia.innerHTML = type === 'video'
      ? `<video src="${escapeAttr(src)}" controls autoplay playsinline></video>`
      : `<img src="${escapeAttr(src)}" alt="Kỷ niệm ${escapeAttr(date)}">`;
    lightboxCaption.innerHTML = `<b>${escapeHTML(date)}</b> · ${escapeHTML(caption)}`;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');

    // Keep dialogue/video audio clear without abruptly stopping the soundtrack.
    if (type === 'video' && musicWanted && !music.paused) fadeMusicTo(MUSIC_FLOW.videoVolume, 450);
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    const video = lightboxMedia.querySelector('video');
    if (video) {
      video.pause();
      if (musicWanted && !music.paused) fadeMusicTo(musicVolumeForScene(), 650);
    }
    setTimeout(() => {
      if (!lightbox.classList.contains('open')) lightboxMedia.innerHTML = '';
    }, 300);
  }

  function burst(amount = 10) {
    for (let i = 0; i < amount; i++) {
      setTimeout(() => {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = Math.random() > .35 ? '♡' : '✦';
        particle.style.left = `${8 + Math.random() * 84}%`;
        particle.style.fontSize = `${11 + Math.random() * 16}px`;
        particle.style.animationDuration = `${4 + Math.random() * 3}s`;
        particle.style.color = Math.random() > .5 ? '#dc6a86' : '#d8a36c';
        particles.appendChild(particle);
        setTimeout(() => particle.remove(), 7600);
      }, i * 45);
    }
  }

  document.addEventListener('click', event => {
    const actionTarget = event.target.closest('[data-action]');
    const action = actionTarget?.dataset.action;

    if (action === 'start') start();
    if (action === 'next') goTo(current + 1);
    if (action === 'prev') goTo(current - 1);
    if (action === 'restart') restart();
    if (action === 'rewind') playRewind(actionTarget);
    if (action === 'reveal-future') {
      document.getElementById('futureReveal')?.classList.add('show');
      actionTarget.style.display = 'none';
      burst(32);
    }

    const mediaButton = event.target.closest('.media-card');
    if (mediaButton) openLightbox(mediaButton);

    const yearButton = event.target.closest('[data-jump-year]');
    if (yearButton) goTo(yearStarts[yearButton.dataset.jumpYear]);
  });

  musicToggle.addEventListener('click', () => {
    if (music.paused) {
      musicWanted = true;
      music.volume = 0;
      music.play().then(() => {
        musicToggle.classList.remove('muted');
        fadeMusicTo(musicVolumeForScene(), 650);
      }).catch(() => {});
    } else {
      musicWanted = false;
      fadeMusicTo(0, 320);
      setTimeout(() => {
        if (!musicWanted) music.pause();
      }, 340);
      musicToggle.classList.add('muted');
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) return closeLightbox();
    if (!started || lightbox.classList.contains('open')) return;
    if (event.key === 'ArrowRight') goTo(current + 1);
    if (event.key === 'ArrowLeft') goTo(current - 1);
  });

  buildYearNav();
  renderCurrent({ animate: false });

  // Review/debug helper in DevTools.
  window.__BIRTHDAY_STORY__ = {
    scenes,
    goTo,
    yearStarts,
    renderAt(index) {
      if (index < 0 || index >= scenes.length) return;
      current = index;
      transitioning = false;
      renderCurrent({ animate: false });
    }
  };
})();
