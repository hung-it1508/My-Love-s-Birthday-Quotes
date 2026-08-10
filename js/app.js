(() => {
  const media = window.MEDIA_LIBRARY || [];
  const config = window.STORY_CONFIG || {};

  const sceneRoot = document.getElementById('sceneRoot');
  const progressBar = document.getElementById('progressBar');
  const chapterLabel = document.getElementById('chapterLabel');
  const yearNav = document.getElementById('yearNav');
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

  const monthNames = {
    1: 'Tháng Một', 2: 'Tháng Hai', 3: 'Tháng Ba', 4: 'Tháng Tư', 5: 'Tháng Năm', 6: 'Tháng Sáu',
    7: 'Tháng Bảy', 8: 'Tháng Tám', 9: 'Tháng Chín', 10: 'Tháng Mười', 11: 'Tháng Mười Một', 12: 'Tháng Mười Hai'
  };

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

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      return;
    }

    try {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => { });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch (err) {
      console.log("Fullscreen không được hỗ trợ:", err);
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

  function buildScenes() {
    const scenes = [{ id: 'intro', type: 'intro', label: 'một câu chuyện về em' }];
    const years = Object.keys(config.years || {}).map(Number).sort((a, b) => a - b);

    years.forEach(year => {
      const yearConfig = config.years[String(year)] || config.years[year] || {};
      scenes.push({ id: `year-${year}`, type: 'year', year, label: String(year), data: yearConfig });

      (yearConfig.moments || []).forEach((moment, index) => {
        scenes.push({
          id: `${year}-prologue-${index}`,
          type: 'moment',
          year,
          month: null,
          label: moment.date ? `${year} · ${moment.date}` : String(year),
          moment,
          items: selectItems(year, null, moment),
          monthConfig: null,
          isFirstInMonth: false
        });
      });

      const months = Object.keys(yearConfig.months || {}).map(Number).sort((a, b) => a - b);
      months.forEach(month => {
        const monthConfig = yearConfig.months[String(month)] || yearConfig.months[month] || {};
        const monthItems = byYearMonth[year]?.[month] || [];
        const used = new Set();
        const sections = monthConfig.sections || [];

        sections.forEach((moment, index) => {
          const items = selectItems(year, month, moment, monthItems).filter(item => !used.has(item.filename));
          items.forEach(item => used.add(item.filename));
          scenes.push({
            id: `${year}-${String(month).padStart(2, '0')}-${index}`,
            type: 'moment',
            year,
            month,
            label: `${monthNames[month]} ${year}`,
            moment,
            items,
            monthConfig,
            isFirstInMonth: index === 0
          });
        });

        const remaining = monthItems.filter(item => !used.has(item.filename));
        if (remaining.length) {
          scenes.push({
            id: `${year}-${String(month).padStart(2, '0')}-extra`,
            type: 'moment',
            year,
            month,
            label: `${monthNames[month]} ${year}`,
            moment: {
              date: 'Những ngày khác',
              title: 'Vẫn còn vài khoảnh khắc anh muốn giữ lại',
              paragraphs: [
                'Không phải bức ảnh nào cũng cần một câu chuyện dài đi kèm.',
                'Có những tấm chỉ cần nhìn lại là anh nhớ: à, lúc đó trong những ngày của mình vẫn có em.'
              ],
              caption: 'Một khoảnh khắc khác trong tháng mà anh vẫn muốn giữ lại.'
            },
            items: remaining,
            monthConfig,
            isFirstInMonth: sections.length === 0
          });
        }
      });
    });

    if (config.reflection) {
      scenes.push({ id: 'reflection', type: 'text', label: 'và rồi cứ như vậy…', data: config.reflection });
    }

    if (config.birthday?.preface) {
      scenes.push({ id: 'birthday-preface', type: 'text', label: 'hôm nay là sinh nhật em', data: config.birthday.preface, birthdayPreface: true });
    }

    scenes.push({ id: 'birthday', type: 'birthday', label: 'happy birthday' });
    scenes.push({ id: 'future', type: 'future', label: 'one more thing' });
    return scenes;
  }

  const scenes = buildScenes();
  const yearStartIndex = {};
  scenes.forEach((scene, index) => {
    if (scene.type === 'year') yearStartIndex[scene.year] = index;
  });

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
      <p class="tiny">Không cần vội. Cứ xem từng chút một thôi.</p>
    </div></div>`;
  }

  function renderYear(scene) {
    const y = scene.data || {};
    return `<div class="scene-shell year-scene" data-year="${scene.year}"><div class="scene-inner narrow">
      <div class="year-number" aria-hidden="true">${scene.year}</div>
      <p class="eyebrow">${escapeHTML(y.eyebrow)}</p>
      <h2>${escapeHTML(y.title)}</h2>
      <div class="story-lines">${(y.intro || []).map(text => `<p>${escapeHTML(text)}</p>`).join('')}</div>
      ${navButtons({ nextText: 'Đi vào những ngày của năm này' })}
    </div></div>`;
  }

  function mediaCard(item, index, total, caption = '') {
    const src = escapeAttr(item.src);
    const date = item.date || '';
    const inner = item.type === 'video'
      ? `<video src="${src}" muted playsinline preload="metadata"></video><span class="play-badge">▶</span>`
      : `<img src="${src}" alt="Kỷ niệm ${escapeAttr(date)}" loading="lazy" decoding="async">`;

    return `<button class="media-card" type="button"
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

  function renderMoment(scene) {
    const moment = scene.moment || {};
    const month = scene.month;
    const monthConfig = scene.monthConfig || {};
    const items = scene.items || [];
    const caption = moment.caption || moment.title || '';
    const context = month
      ? `${monthConfig.title || monthNames[month]} · ${monthConfig.subtitle || ''}`
      : (moment.eyebrow || `một mảnh của ${scene.year}`);

    const mediaBlock = items.length ? `
      <div class="moment-media">
        <p class="moment-media-label">${items.length > 1 ? `${items.length} khoảnh khắc` : 'một khoảnh khắc'} anh muốn giữ lại</p>
        <div class="media-rail">${items.map((item, index) => mediaCard(item, index, items.length, caption)).join('')}</div>
        ${items.length > 1 ? `<div class="timeline-dots" aria-hidden="true">${items.map(() => '<span class="timeline-dot"></span>').join('')}</div>` : ''}
        <p class="swipe-hint">← vuốt để xem hết ảnh →</p>
      </div>` : '';

    return `<div class="scene-shell moment-scene" data-year="${scene.year}"${month ? ` data-month="${month}"` : ''}><div class="scene-inner">
      <div class="moment-head">
        <span class="year-badge">${scene.year}${month ? ` · ${String(month).padStart(2, '0')}` : ''}</span>
        <p class="eyebrow moment-context">${escapeHTML(context)}</p>
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
      ${navButtons({ nextText: scene.birthdayPreface ? 'Và điều anh muốn chúc em…' : 'Đi tiếp' })}
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
    if (scene.type === 'year') return renderYear(scene);
    if (scene.type === 'moment') return renderMoment(scene);
    if (scene.type === 'text') return renderTextScene(scene);
    if (scene.type === 'birthday') return renderBirthday();
    if (scene.type === 'future') return renderFuture();
    return '';
  }

  function updateChrome() {
    const scene = scenes[current];
    progressBar.style.width = `${((current + 1) / scenes.length) * 100}%`;
    chapterLabel.textContent = scene.label || '';
    document.querySelectorAll('.year-pill').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.jumpYear) === scene.year);
    });
  }

  function buildYearNav() {
    const years = Object.keys(config.years || {}).map(Number).sort((a, b) => a - b);
    yearNav.innerHTML = years.map(year => `<button class="year-pill" type="button" data-jump-year="${year}">${year}</button>`).join('');
  }

  function renderCurrent({ animate = true } = {}) {
    sceneRoot.innerHTML = render(scenes[current]);
    const shell = sceneRoot.firstElementChild;
    if (animate) shell?.classList.add('entering');
    updateChrome();
    preloadNext();
  }

  function goTo(index) {
    if (transitioning || index < 0 || index >= scenes.length || index === current) return;
    transitioning = true;
    const shell = sceneRoot.firstElementChild;
    shell?.classList.add('leaving');
    setTimeout(() => {
      current = index;
      renderCurrent();
      transitioning = false;
    }, 300);
  }

  function preloadNext() {
    const next = scenes[current + 1];
    if (!next?.items?.length) return;
    next.items.slice(0, 3).filter(item => item.type === 'image').forEach(item => {
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
    chrome.classList.add('hidden');
    renderCurrent();
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
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'start') start();
    if (action === 'next') goTo(current + 1);
    if (action === 'prev') goTo(current - 1);
    if (action === 'restart') restart();
    if (action === 'reveal-future') {
      document.getElementById('futureReveal')?.classList.add('show');
      event.target.style.display = 'none';
      burst(32);
    }

    const mediaButton = event.target.closest('.media-card');
    if (mediaButton) openLightbox(mediaButton);

    const yearButton = event.target.closest('[data-jump-year]');
    if (yearButton) goTo(yearStartIndex[Number(yearButton.dataset.jumpYear)]);
  });

  musicToggle.addEventListener('click', () => {
    if (music.paused) music.play().then(() => musicToggle.classList.remove('muted')).catch(() => { });
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

  buildYearNav();
  renderCurrent({ animate: false });

  // Handy for review/debugging from DevTools without changing the experience.
  window.__BIRTHDAY_STORY__ = { scenes, goTo };
})();
