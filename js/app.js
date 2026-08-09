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
    1:'Tháng Một',2:'Tháng Hai',3:'Tháng Ba',4:'Tháng Tư',5:'Tháng Năm',6:'Tháng Sáu',
    7:'Tháng Bảy',8:'Tháng Tám',9:'Tháng Chín',10:'Tháng Mười',11:'Tháng Mười Một',12:'Tháng Mười Hai'
  };

  const byYearMonth = media.reduce((acc, item) => {
    if (!item.year) return acc;
    acc[item.year] ||= {};
    acc[item.year][item.month] ||= [];
    acc[item.year][item.month].push(item);
    return acc;
  }, {});

  Object.values(byYearMonth).forEach(months => {
    Object.values(months).forEach(items => items.sort((a,b) => a.sort.localeCompare(b.sort)));
  });

  function buildScenes() {
    const scenes = [{ id:'intro', type:'intro', label:'for you' }];
    [2023,2024,2025,2026].forEach(year => {
      scenes.push({ id:`year-${year}`, type:'year', year, label:String(year) });
      const months = Object.keys(byYearMonth[year] || {}).map(Number).sort((a,b)=>a-b);
      months.forEach(month => scenes.push({
        id:`${year}-${String(month).padStart(2,'0')}`,
        type:'month', year, month, label:`${monthNames[month]} ${year}`,
        items:byYearMonth[year][month]
      }));
    });
    scenes.push({ id:'birthday', type:'birthday', label:'happy birthday' });
    scenes.push({ id:'future', type:'future', label:'one more thing' });
    return scenes;
  }

  const scenes = buildScenes();
  const yearStartIndex = {};
  scenes.forEach((s,i) => { if (s.type === 'year') yearStartIndex[s.year] = i; });

  function navButtons({prev=true,next=true,nextText='Tiếp tục'}) {
    return `<nav class="scene-nav">
      ${prev ? '<button class="ghost" type="button" data-action="prev" aria-label="Quay lại">←</button>' : ''}
      ${next ? `<button class="primary" type="button" data-action="next">${nextText}</button>` : ''}
    </nav>`;
  }

  function renderIntro() {
    const x=config.intro;
    return `<div class="scene-shell intro-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${x.eyebrow}</p><h1>${x.title}</h1>
      <div class="intro-lines">${x.lines.map(t=>`<p>${t}</p>`).join('')}</div>
      <button class="primary" type="button" data-action="start">${x.cta}</button>
      <p class="tiny">Không cần vội. Cứ xem từng chút một thôi.</p>
    </div></div>`;
  }

  function renderYear(scene) {
    const y=config.years[scene.year];
    return `<div class="scene-shell year-scene" data-year="${scene.year}"><div class="scene-inner narrow">
      <div class="year-number" aria-hidden="true">${scene.year}</div>
      <p class="eyebrow">${y.eyebrow}</p><h2>${y.title}</h2>
      ${y.hero ? `<div class="year-hero">${y.hero}</div>` : ''}
      <div class="story-lines">${y.intro.map(t=>`<p>${t}</p>`).join('')}</div>
      ${navButtons({nextText:'Mở những ký ức của năm này'})}
    </div></div>`;
  }

  function mediaCard(item,index,total) {
    const fileEsc=item.src.replace(/"/g,'&quot;');
    const date=item.date || '';
    const inner=item.type==='video'
      ? `<video src="${fileEsc}" muted playsinline preload="metadata"></video><span class="play-badge">▶</span>`
      : `<img src="${fileEsc}" alt="Kỷ niệm ${date}" loading="lazy" decoding="async">`;
    return `<button class="media-card" type="button" data-media-src="${fileEsc}" data-media-type="${item.type}" data-media-date="${date}" aria-label="Mở kỷ niệm ${date}">
      <span class="media-frame">${inner}</span>
      <span class="media-meta"><span class="media-date">${date}</span><span class="media-index">${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></span>
    </button>`;
  }

  function renderMonth(scene) {
    const y=config.years[scene.year];
    const m=y.months?.[scene.month] || {};
    const title=m.title || `${monthNames[scene.month]} ${scene.year}`;
    const note=m.note || 'Một vài bức ảnh của chúng mình trong khoảng thời gian này.';
    const ending=m.ending || 'Thêm một mảnh nhỏ trong câu chuyện của hai đứa.';
    const items=scene.items || [];
    return `<div class="scene-shell month-scene" data-year="${scene.year}" data-month="${scene.month}"><div class="scene-inner">
      <div class="month-head">
        <span class="year-badge">${scene.year} · ${String(scene.month).padStart(2,'0')}</span>
        <p class="eyebrow">${monthNames[scene.month].toLowerCase()}</p><h2>${title}</h2>
        <p class="month-note">${note}</p><p class="month-count">${items.length} media trong timeline này</p>
        <p class="swipe-hint">← vuốt để xem hết ảnh →</p>
      </div>
      <div class="media-rail">${items.map((item,i)=>mediaCard(item,i,items.length)).join('')}</div>
      <div class="timeline-dots" aria-hidden="true">${items.map(()=>'<span class="timeline-dot"></span>').join('')}</div>
      <p class="story-ending">${ending}</p>
      ${navButtons({nextText:'Đi tiếp'})}
    </div></div>`;
  }

  function renderBirthday() {
    const b=config.birthday;
    return `<div class="scene-shell birthday-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${b.eyebrow}</p><h1>${b.title}</h1>
      <div class="letter-card">${b.paragraphs.map((p,i)=>`<p${i===b.paragraphs.length-1?' class="signature"':''}>${p}</p>`).join('')}</div>
      ${navButtons({nextText:'Anh còn một thứ nữa...'})}
    </div></div>`;
  }

  function renderFuture() {
    const f=config.future;
    const ai=media.find(x=>!x.year && x.filename==='ai-wedding.jpg');
    return `<div class="scene-shell future-scene"><div class="scene-inner narrow">
      <p class="eyebrow">${f.eyebrow}</p><h2>${f.title}</h2>
      <p class="lead">${f.lead}</p>
      <button class="heart-button" type="button" data-action="reveal-future" aria-label="Mở bất ngờ">♡</button>
      <div id="futureReveal" class="future-reveal">
        <figure class="future-frame"><img src="${ai?.src || 'assets/media/special/ai-wedding.jpg'}" alt="Bức ảnh cưới AI của hai đứa"><figcaption class="future-punch">${f.punch}</figcaption></figure>
        <p class="future-ending">${f.ending}</p>
        <p class="year-hero">Happy Birthday, em yêu ♡</p>
      </div>
      ${navButtons({next:false})}
      <nav class="scene-nav"><button class="text-button" type="button" data-action="restart">Xem lại từ đầu</button></nav>
    </div></div>`;
  }

  function render(scene) {
    if (scene.type==='intro') return renderIntro();
    if (scene.type==='year') return renderYear(scene);
    if (scene.type==='month') return renderMonth(scene);
    if (scene.type==='birthday') return renderBirthday();
    if (scene.type==='future') return renderFuture();
    return '';
  }

  function updateChrome() {
    const scene=scenes[current];
    progressBar.style.width=`${((current+1)/scenes.length)*100}%`;
    chapterLabel.textContent=scene.label || '';
    document.querySelectorAll('.year-pill').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.year)===scene.year);
    });
  }

  function buildYearNav() {
    yearNav.innerHTML=[2023,2024,2025,2026].map(y=>`<button class="year-pill" type="button" data-jump-year="${y}">${y}</button>`).join('');
  }

  function renderCurrent({animate=true}={}) {
    sceneRoot.innerHTML=render(scenes[current]);
    const shell=sceneRoot.firstElementChild;
    if (animate) shell?.classList.add('entering');
    updateChrome();
    preloadNext();
  }

  function goTo(index) {
    if (transitioning || index<0 || index>=scenes.length || index===current) return;
    transitioning=true;
    const shell=sceneRoot.firstElementChild;
    shell?.classList.add('leaving');
    setTimeout(()=>{
      current=index;
      renderCurrent();
      transitioning=false;
    },300);
  }

  function preloadNext() {
    const next=scenes[current+1];
    if (!next || next.type!=='month') return;
    next.items.slice(0,3).filter(x=>x.type==='image').forEach(item=>{ const img=new Image(); img.src=item.src; });
  }

  function start() {
    if (!started) {
      started=true; chrome.classList.remove('hidden'); music.volume=.28;
      music.play().then(()=>musicToggle.classList.remove('muted')).catch(()=>musicToggle.classList.add('muted'));
      burst(8);
    }
    goTo(1);
  }

  function restart() {
    closeLightbox();
    current=0;
    chrome.classList.add('hidden');
    renderCurrent();
  }

  function openLightbox(button) {
    const src=button.dataset.mediaSrc;
    const type=button.dataset.mediaType;
    const date=button.dataset.mediaDate;
    lightboxMedia.innerHTML=type==='video'
      ? `<video src="${src}" controls autoplay playsinline></video>`
      : `<img src="${src}" alt="Kỷ niệm ${date}">`;
    lightboxCaption.innerHTML=`<b>${date}</b> · một mảnh trong timeline của chúng mình`;
    lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden','false');
  }

  function closeLightbox() {
    lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true');
    const v=lightboxMedia.querySelector('video'); if(v) v.pause();
    setTimeout(()=>{ if(!lightbox.classList.contains('open')) lightboxMedia.innerHTML=''; },300);
  }

  function burst(amount=10) {
    for(let i=0;i<amount;i++) setTimeout(()=>{
      const p=document.createElement('span'); p.className='particle'; p.textContent=Math.random()>.35?'♡':'✦';
      p.style.left=`${8+Math.random()*84}%`; p.style.fontSize=`${11+Math.random()*16}px`; p.style.animationDuration=`${4+Math.random()*3}s`; p.style.color=Math.random()>.5?'#dc6a86':'#d8a36c';
      particles.appendChild(p); setTimeout(()=>p.remove(),7600);
    },i*45);
  }

  document.addEventListener('click', e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='start') start();
    if(action==='next') goTo(current+1);
    if(action==='prev') goTo(current-1);
    if(action==='restart') restart();
    if(action==='reveal-future') { document.getElementById('futureReveal')?.classList.add('show'); e.target.style.display='none'; burst(32); }
    const mediaButton=e.target.closest('.media-card'); if(mediaButton) openLightbox(mediaButton);
    const yearButton=e.target.closest('[data-jump-year]'); if(yearButton) goTo(yearStartIndex[Number(yearButton.dataset.jumpYear)]);
  });

  musicToggle.addEventListener('click',()=>{
    if(music.paused) music.play().then(()=>musicToggle.classList.remove('muted')).catch(()=>{});
    else { music.pause(); musicToggle.classList.add('muted'); }
  });
  lightboxClose.addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',e=>{ if(e.target===lightbox) closeLightbox(); });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && lightbox.classList.contains('open')) return closeLightbox();
    if(!started || lightbox.classList.contains('open')) return;
    if(e.key==='ArrowRight') goTo(current+1);
    if(e.key==='ArrowLeft') goTo(current-1);
  });

  buildYearNav();
  renderCurrent({animate:false});
})();
