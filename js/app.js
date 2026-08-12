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
    const items = sourceItems || (month ? (byYearMonth[year]?.[month] || []) : (byYear[year] || []));

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

  function momentScene({ year, month = null, index, source = 'month', chapter, tone = '', stamp = '', label = '' }) {
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
      chapter,
      tone,
      stamp,
      label: label || moment.title,
      moment,
      monthConfig,
      items: selectItems(year, month, moment)
    };
  }

  function chapterScene(key) {
    const data = cinema.chapters?.[key] || {};
    return {
      id: `chapter-${key}`,
      type: 'chapter',
      chapter: key,
      label: data.title || key,
      data
    };
  }

  function buildScenes() {
    const openingItems = selectItems(2026, null, {
      mediaDates: ['2026-05-29', '2026-05-30', '2026-07-05']
    });

    const flow = [
      { id: 'intro', type: 'intro', label: 'một câu chuyện về em' },
      { id: 'opening', type: 'opening', chapter: 'opening', label: 'ở hiện tại', data: cinema.opening || {}, items: openingItems },
      { id: 'rewind', type: 'rewind', chapter: 'opening', label: 'rewind', data: cinema.rewind || {} },

      chapterScene('beginning'),
      { id: 'first-date', type: 'date-reveal', chapter: 'beginning', label: '14.01.2023', data: cinema.firstDate || {} },
      momentScene({ year: 2023, index: 0, source: 'prologue', chapter: 'beginning', tone: 'origin' }),

      chapterScene('closer'),
      momentScene({ year: 2024, index: 0, source: 'prologue', chapter: 'closer' }),
      momentScene({ year: 2024, index: 1, source: 'prologue', chapter: 'closer' }),
      { id: 'relationship-date', type: 'date-reveal', chapter: 'closer', label: '03.03.2024', data: cinema.relationshipDate || {}, relationship: true },
      momentScene({ year: 2024, index: 2, source: 'prologue', chapter: 'closer', tone: 'relationship', stamp: 'CHÚNG MÌNH' }),

      chapterScene('album'),
      momentScene({ year: 2024, month: 3, index: 0, chapter: 'album' }),
      momentScene({ year: 2024, month: 3, index: 1, chapter: 'album' }),
      momentScene({ year: 2024, month: 3, index: 2, chapter: 'album' }),
      momentScene({ year: 2024, month: 3, index: 3, chapter: 'album' }),
      momentScene({ year: 2024, month: 3, index: 4, chapter: 'album' }),
      momentScene({ year: 2024, month: 4, index: 0, chapter: 'album' }),
      momentScene({ year: 2024, month: 4, index: 1, chapter: 'album', tone: 'trip' }),

      chapterScene('ordinary'),
      momentScene({ year: 2024, month: 5, index: 0, chapter: 'ordinary', tone: 'thesis' }),
      { id: 'without-me', type: 'interlude', chapter: 'ordinary', label: 'có những ngày trong ảnh không có anh', data: cinema.interludes?.withoutMe || {}, tone: 'quiet' },
      momentScene({ year: 2024, month: 6, index: 0, chapter: 'ordinary', tone: 'quiet' }),
      momentScene({ year: 2024, month: 6, index: 1, chapter: 'ordinary' }),
      momentScene({ year: 2024, month: 7, index: 0, chapter: 'ordinary' }),

      chapterScene('firsts'),
      momentScene({ year: 2024, month: 8, index: 0, chapter: 'firsts' }),
      momentScene({ year: 2024, month: 8, index: 1, chapter: 'firsts', stamp: 'FIRST BIRTHDAY' }),
      momentScene({ year: 2024, month: 8, index: 2, chapter: 'firsts' }),
      momentScene({ year: 2024, month: 9, index: 0, chapter: 'firsts' }),
      momentScene({ year: 2024, month: 10, index: 0, chapter: 'firsts', tone: 'thesis' }),
      momentScene({ year: 2024, month: 12, index: 0, chapter: 'firsts' }),
      momentScene({ year: 2024, month: 12, index: 1, chapter: 'firsts', stamp: 'FIRST CHRISTMAS' }),
      momentScene({ year: 2025, month: 1, index: 0, chapter: 'firsts', stamp: 'FIRST TẾT' }),
      momentScene({ year: 2025, month: 2, index: 0, chapter: 'firsts' }),
      momentScene({ year: 2025, month: 3, index: 0, chapter: 'firsts', stamp: 'ONE YEAR' }),

      chapterScene('life'),
      momentScene({ year: 2025, month: 3, index: 1, chapter: 'life', tone: 'thesis' }),
      momentScene({ year: 2025, month: 4, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 5, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 6, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 8, index: 0, chapter: 'life', stamp: 'BIRTHDAY · AGAIN' }),
      momentScene({ year: 2025, month: 8, index: 1, chapter: 'life', tone: 'trip' }),
      momentScene({ year: 2025, month: 9, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 10, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 11, index: 0, chapter: 'life' }),
      momentScene({ year: 2025, month: 12, index: 0, chapter: 'life' }),
      momentScene({ year: 2026, month: 1, index: 0, chapter: 'life' }),
      momentScene({ year: 2026, month: 2, index: 0, chapter: 'life' }),
      { id: 'taxua-interlude', type: 'interlude', chapter: 'life', label: 'một khoảng lặng', data: cinema.interludes?.taxua || {}, tone: 'pause' },
      momentScene({ year: 2026, month: 3, index: 0, chapter: 'life', tone: 'pause' }),
      momentScene({ year: 2026, month: 4, index: 0, chapter: 'life' }),

      chapterScene('present'),
      momentScene({ year: 2026, month: 5, index: 0, chapter: 'present', tone: 'callback' }),
      momentScene({ year: 2026, month: 7, index: 0, chapter: 'present', tone: 'callback' }),

      config.reflection ? { id: 'reflection', type: 'text', chapter: 'present', label: 'và rồi cứ như vậy…', data: config.reflection } : null,
      config.birthday?.preface ? { id: 'birthday-preface', type: 'text', chapter: 'present', label: 'hôm nay là sinh nhật em', data: config.birthday.preface, birthdayPreface: true } : null,
      { id: 'callback', type: 'callback', chapter: 'present', label: 'điểm bắt đầu', data: cinema.callback || {} },
      { id: 'birthday', type: 'birthday', chapter: 'present', label: 'happy birthday' },
      { id: 'future', type: 'future', chapter: 'present', label: 'one more thing' }
    ];

    return flow.filter(Boolean);
  }

  const scenes = buildScenes();
  const chapterStarts = {};
  const chapterOrder = [];

  scenes.forEach((scene, index) => {
    if (scene.type === 'chapter' && scene.chapter) {
      chapterStarts[scene.chapter] = index;
      chapterOrder.push(scene.chapter);
    }
  });

  const chapterTitles = Object.fromEntries(
    chapterOrder.map(key => [key, cinema.chapters?.[key]?.title || key])
  );

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
      <p class="tiny">Em xem từng chút một nha.</p>
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
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <h2>${escapeHTML(x.title)}</h2>
      ${mediaBlock}
      <div class="opening-copy">${(x.paragraphs || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      ${navButtons({ nextText: x.cta || 'Tìm ngược lại' })}
    </div></div>`;
  }

  function renderRewind(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell rewind-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
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

  function renderChapter(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell chapter-scene" data-chapter="${escapeAttr(scene.chapter || '')}"><div class="scene-inner narrow">
      <div class="chapter-number" aria-hidden="true">${escapeHTML(x.number || '')}</div>
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <h2>${escapeHTML(x.title)}</h2>
      ${x.lead ? `<p class="chapter-lead">${escapeHTML(x.lead)}</p>` : ''}
      ${navButtons({ nextText: 'Vào chương này' })}
    </div></div>`;
  }

  function renderDateReveal(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell date-reveal-scene${scene.relationship ? ' relationship-date-scene' : ''}"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <div class="date-reveal-title">${escapeHTML(x.title)}</div>
      <p class="date-reveal-lead">${escapeHTML(x.lead)}</p>
      ${navButtons({ nextText: scene.relationship ? 'Đi qua ngày này' : 'Xem bức ảnh đầu tiên' })}
    </div></div>`;
  }

  function renderInterlude(scene) {
    const x = scene.data || {};
    return `<div class="scene-shell interlude-scene${scene.tone ? ` tone-${escapeAttr(scene.tone)}` : ''}"><div class="scene-inner narrow">
      <p class="eyebrow">${escapeHTML(x.eyebrow)}</p>
      <h2>${escapeHTML(x.title)}</h2>
      ${x.lead ? `<p class="interlude-lead">${escapeHTML(x.lead)}</p>` : ''}
      ${navButtons({ nextText: 'Đi tiếp' })}
    </div></div>`;
  }

  function renderMoment(scene) {
    const moment = scene.moment || {};
    const items = scene.items || [];
    const caption = moment.caption || moment.title || '';
    const chapterTitle = chapterTitles[scene.chapter] || '';

    const mediaBlock = items.length ? `
      <div class="moment-media">
        <div class="media-rail">${items.map((item, index) => mediaCard(item, index, items.length, caption)).join('')}</div>
        ${items.length > 1 ? `<div class="timeline-dots" aria-hidden="true">${items.map(() => '<span class="timeline-dot"></span>').join('')}</div>` : ''}
        <p class="swipe-hint">← vuốt để xem hết ảnh →</p>
      </div>` : '';

    return `<div class="scene-shell moment-scene${scene.tone ? ` tone-${escapeAttr(scene.tone)}` : ''}" data-year="${scene.year}"${scene.month ? ` data-month="${scene.month}"` : ''}><div class="scene-inner">
      <div class="moment-head">
        <p class="eyebrow moment-context">${escapeHTML(chapterTitle)}</p>
        ${scene.stamp ? `<div class="cinema-stamp">${escapeHTML(scene.stamp)}</div>` : ''}
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
    if (scene.type === 'chapter') return renderChapter(scene);
    if (scene.type === 'date-reveal') return renderDateReveal(scene);
    if (scene.type === 'interlude') return renderInterlude(scene);
    if (scene.type === 'moment') return renderMoment(scene);
    if (scene.type === 'text') return renderTextScene(scene);
    if (scene.type === 'callback') return renderCallback(scene);
    if (scene.type === 'birthday') return renderBirthday();
    if (scene.type === 'future') return renderFuture();
    return '';
  }

  function activeChapterForScene(index) {
    const scene = scenes[index];
    if (scene.chapter && scene.chapter !== 'opening') return scene.chapter;

    let active = null;
    for (const key of chapterOrder) {
      if (chapterStarts[key] <= index) active = key;
    }
    return active;
  }

  function updateChrome() {
    const scene = scenes[current];
    chrome.classList.toggle('hidden', current === 0);
    progressBar.style.width = `${((current + 1) / scenes.length) * 100}%`;
    chapterLabel.textContent = scene.label || '';
    const active = activeChapterForScene(current);

    document.querySelectorAll('[data-jump-chapter]').forEach(button => {
      button.classList.toggle('active', button.dataset.jumpChapter === active);
    });
  }

  function buildChapterNav() {
    chapterNav.setAttribute('aria-label', 'Chọn chương');
    chapterNav.innerHTML = chapterOrder.map(key => {
      const data = cinema.chapters?.[key] || {};
      const title = data.title || key;
      return `<button class="year-pill chapter-pill" type="button" data-jump-chapter="${escapeAttr(key)}" aria-label="${escapeAttr(title)}">${escapeHTML(data.number || '·')}</button>`;
    }).join('');
  }

  function renderCurrent({ animate = true, backwards = false } = {}) {
    sceneRoot.innerHTML = render(scenes[current]);
    const shell = sceneRoot.firstElementChild;
    if (animate) shell?.classList.add(backwards ? 'entering-back' : 'entering');
    updateChrome();
    preloadNext();
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
      chrome.classList.remove('hidden');
      music.volume = .28;
      music.play().then(() => musicToggle.classList.remove('muted')).catch(() => musicToggle.classList.add('muted'));
      burst(8);
    }
    goTo(1);
  }

  function restart() {
    closeLightbox();
    current = 0;
    started = false;
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
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    const video = lightboxMedia.querySelector('video');
    if (video) video.pause();
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

    const chapterButton = event.target.closest('[data-jump-chapter]');
    if (chapterButton) goTo(chapterStarts[chapterButton.dataset.jumpChapter]);
  });

  musicToggle.addEventListener('click', () => {
    if (music.paused) music.play().then(() => musicToggle.classList.remove('muted')).catch(() => {});
    else {
      music.pause();
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

  buildChapterNav();
  renderCurrent({ animate: false });

  // Review/debug helper in DevTools.
  window.__BIRTHDAY_STORY__ = {
    scenes,
    goTo,
    chapterStarts,
    renderAt(index) {
      if (index < 0 || index >= scenes.length) return;
      current = index;
      transitioning = false;
      renderCurrent({ animate: false });
    }
  };
})();
