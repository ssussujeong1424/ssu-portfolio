// Observe the artwork on small screens; keep the original PC title trigger.
function observeCarouselViewport(observer, title, artwork) {
  const responsive = matchMedia('(max-width:1024px)');
  const update = () => { observer.disconnect(); observer.observe(responsive.matches && artwork ? artwork : title); };
  update();
  responsive.addEventListener('change', update);
}

// Entrance motion: cover / ABOUT / WORKS headings
(function initSectionEntranceMotion(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = Array.from(document.querySelectorAll('[data-motion]'));
  if (!items.length) return;

  items.forEach((item) => {
    const delay = Number(item.dataset.motionDelay || 0);
    item.style.setProperty('--motion-delay', `${delay}ms`);
  });

  if (reduceMotion) {
    items.forEach((item) => item.classList.add('is-motion-in'));
    return;
  }

  // COVER: all text enters from the left with a short stagger as soon as the page opens.
  const coverItems = items.filter((item) => item.closest('#cover'));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      coverItems.forEach((item) => item.classList.add('is-motion-in'));
    });
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-motion-in'));
    return;
  }

  // ABOUT: left and right copy start together; the center elements come down last.
  const about = document.querySelector('#about');
  const aboutItems = items.filter((item) => item.closest('#about'));
  if (about && aboutItems.length) {
    const aboutObserver = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      aboutItems.forEach((item) => item.classList.add('is-motion-in'));
      aboutObserver.disconnect();
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    aboutObserver.observe(about);
  }

  // WORKS badge and each 01–04 heading animate once when their own area reaches the viewport.
  const restItems = items.filter((item) => !item.closest('#cover') && !item.closest('#about'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-motion-in');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px'
  });

  restItems.forEach((item) => observer.observe(item));
})();


// AESOP brand-direction icons: grow slightly, then settle once when the section enters.
(function initBrandIconPulse(){
  const icons = Array.from(document.querySelectorAll('[data-icon-pulse]'));
  if (!icons.length) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  icons.forEach((icon) => {
    icon.style.setProperty('--pulse-delay', `${Number(icon.dataset.pulseDelay || 0)}ms`);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    icons.forEach((icon) => icon.classList.add('is-icon-pulse'));
    return;
  }
  const grid = document.querySelector('.direction-grid');
  if (!grid) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting) return;
    icons.forEach((icon) => icon.classList.add('is-icon-pulse'));
    observer.disconnect();
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  observer.observe(grid);
})();

// CONTACT: type the whole left message one Korean character at a time.
(function initContactTyping(){
  const root = document.querySelector('[data-contact-typing]');
  if (!root) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const blocks = Array.from(root.querySelectorAll('h2, p'));
  blocks.forEach((el) => {
    const h = el.getBoundingClientRect().height;
    if (h) el.style.minHeight = `${h}px`;
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (!nodes.length) return;

  const originals = nodes.map((node) => node.nodeValue);
  nodes.forEach((node) => { node.nodeValue = ''; });

  let started = false;
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const caret = document.createElement('span');
  caret.className = 'typing-caret';
  caret.setAttribute('aria-hidden', 'true');

  async function typeAll(){
    if (started) return;
    started = true;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const chars = Array.from(originals[i]);
      node.parentNode.insertBefore(caret, node.nextSibling);
      const inBody = !!node.parentElement?.closest('.contact-copy > p');
      const speed = inBody ? 46 : 60;
      for (const ch of chars) {
        node.nodeValue += ch;
        await wait(ch === ' ' ? Math.max(18, speed * .42) : speed);
      }
      await wait(inBody ? 95 : 130);
    }
    caret.remove();

    // After the final typing line finishes, emphasize the contact name once.
    const contactName = document.querySelector('[data-contact-name]');
    if (contactName) {
      contactName.classList.remove('is-contact-name-pulse');
      // Force a reflow so the one-shot animation can reliably restart.
      void contactName.offsetWidth;
      contactName.classList.add('is-contact-name-pulse');
    }
  }

  if (!('IntersectionObserver' in window)) {
    typeAll();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0]?.isIntersecting) return;
    observer.disconnect();
    window.setTimeout(typeAll, 180);
  }, { threshold: 0.28, rootMargin: '0px 0px -10% 0px' });
  observer.observe(root);
})();


// v27 — project image reveals.
// AESOP: PC → tablet → mobile, left-to-right sequential reveal.
// HOMFIT RESPONSIVE: keep the center-out reveal.
(function initProjectImageReveals(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAesop(items){
    items.forEach((el) => {
      if (el.dataset.devicePlayed === 'true') return;
      el.dataset.devicePlayed = 'true';
      const delay = Number(el.dataset.deviceDelay || 0);
      if (reduceMotion || typeof el.animate !== 'function') return;
      el.animate([
        { opacity: 0, transform: 'translate3d(-42px,0,0) scale(.985)', clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', clipPath: 'inset(0 0 0 0)' }
      ], {
        duration: 2100,
        delay,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both'
      });
    });
  }

  function revealCenter(items){
    items.forEach((el) => {
      if (el.dataset.devicePlayed === 'true') return;
      el.dataset.devicePlayed = 'true';
      const delay = Number(el.dataset.deviceDelay || 0);
      if (reduceMotion || typeof el.animate !== 'function') return;
      el.animate([
        { opacity: 0, transform: 'scale(.965)', clipPath: 'inset(0 50% 0 50%)' },
        { opacity: 1, transform: 'scale(1)', clipPath: 'inset(0 0 0 0)' }
      ], {
        duration: 2100,
        delay,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both'
      });
    });
  }

  const configs = [
    { selector: '[data-device-reveal="aesop"]', root: '#aesop', play: revealAesop },
    { selector: '[data-device-reveal="homfit"]', root: '#homfit', play: revealAesop },
    { selector: '[data-device-reveal="responsive"]', root: '.responsive-visual', play: revealCenter }
  ];

  configs.forEach(({ selector, root, play }) => {
    const items = Array.from(document.querySelectorAll(selector));
    if (!items.length) return;
    const target = document.querySelector(root) || items[0];
    if (reduceMotion || !('IntersectionObserver' in window)) {
      if (!reduceMotion) play(items);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      play(items);
      observer.disconnect();
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    observer.observe(target);
  });
})();

const resumeModal = document.querySelector('#resumeModal');
const resumeOpen = document.querySelector('[data-resume-open]');
const resumeClose = document.querySelector('[data-resume-close]');

function openResumeModal() {
  if (!resumeModal) return;
  resumeModal.classList.add('is-open');
  resumeModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('resume-open');
  resumeClose?.focus();
}

function closeResumeModal() {
  if (!resumeModal) return;
  resumeModal.classList.remove('is-open');
  resumeModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('resume-open');
  resumeOpen?.focus();
}

resumeOpen?.addEventListener('click', (event) => {
  event.preventDefault();
  openResumeModal();
});

resumeClose?.addEventListener('click', closeResumeModal);

resumeModal?.addEventListener('click', (event) => {
  if (event.target === resumeModal) closeResumeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && resumeModal?.classList.contains('is-open')) {
    closeResumeModal();
  }
});

// Figma 상태바 prototype: 기본 열림 → 화살표 클릭 시 닫힘/열림 전환
const statusbar = document.querySelector('[data-statusbar]');
const statusToggle = document.querySelector('[data-status-toggle]');
let statusbarStickyStart = 0;

function measureStatusbarStickyStart() {
  if (!statusbar) return;
  const wasSticky = statusbar.classList.contains('is-sticky');
  statusbar.classList.remove('is-sticky');
  statusbarStickyStart = statusbar.getBoundingClientRect().top + window.scrollY;
  if (wasSticky) statusbar.classList.add('is-sticky');
}

function updateStatusbarSticky() {
  if (!statusbar) return;
  if (window.innerWidth <= 1024) {
    statusbar.classList.remove('is-sticky');
    return;
  }
  statusbar.classList.toggle('is-sticky', window.scrollY >= statusbarStickyStart);
}

statusToggle?.addEventListener('click', () => {
  if (!statusbar) return;
  const willClose = !statusbar.classList.contains('is-closed');
  statusbar.classList.toggle('is-closed', willClose);
  statusToggle.setAttribute('aria-expanded', String(!willClose));
  statusToggle.setAttribute('aria-label', willClose ? '상태바 열기' : '상태바 닫기');
});

// 상태바 링크는 부드러운 스크롤 없이 해당 섹션으로 즉시 이동
statusbar?.querySelectorAll('.statusbar__links a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const selector = link.getAttribute('href');
    const target = selector ? document.querySelector(selector) : null;
    if (!target) return;
    event.preventDefault();
    const top = window.scrollY + target.getBoundingClientRect().top;
    window.scrollTo({ top, left: 0, behavior: 'auto' });
    if (history.replaceState) history.replaceState(null, '', selector);
  });
});

if (statusbar) {
  measureStatusbarStickyStart();
  updateStatusbarSticky();
  window.addEventListener('scroll', updateStatusbarSticky, { passive: true });
  // Measure after responsive canvas scaling and layout have settled.
  const refreshStatusbar = () => requestAnimationFrame(() => {
    measureStatusbarStickyStart();
    updateStatusbarSticky();
  });
  refreshStatusbar();
  window.addEventListener('load', refreshStatusbar);
  window.addEventListener('resize', refreshStatusbar);
}

// AESOP REDESIGN background word: fixed while its Figma range is on screen, stops before Page Design
(function initAesopRedesignSticky(){
  const range = document.querySelector('.redesign-sticky-range');
  const word = document.querySelector('.redesign-word');
  const portfolio = document.querySelector('.portfolio');
  if (!range || !word) return;

  const STICKY_TOP = 323;
  const DESKTOP_MIN = 1025;

  function reset(){
    word.classList.remove('is-redesign-fixed','is-redesign-ended');
    word.style.left = '218.5px';
    word.style.top = '0px';
    word.style.bottom = 'auto';
  }

  function update(){
    if (window.innerWidth < DESKTOP_MIN) {
      reset();
      return;
    }

    const rangeRect = range.getBoundingClientRect();
    const rangeTop = window.scrollY + rangeRect.top;
    const rangeHeight = range.offsetHeight;
    const wordHeight = word.offsetHeight || 450;
    const start = rangeTop - STICKY_TOP;
    const end = rangeTop + rangeHeight - wordHeight - STICKY_TOP;
    const y = window.scrollY;

    if (y < start) {
      reset();
      return;
    }

    if (y <= end) {
      const portfolioLeft = portfolio ? portfolio.getBoundingClientRect().left : 0;
      word.classList.add('is-redesign-fixed');
      word.classList.remove('is-redesign-ended');
      word.style.left = `${portfolioLeft + 218.5}px`;
      word.style.top = `${STICKY_TOP}px`;
      word.style.bottom = 'auto';
      return;
    }

    word.classList.remove('is-redesign-fixed');
    word.classList.add('is-redesign-ended');
    word.style.left = '218.5px';
    word.style.top = 'auto';
    word.style.bottom = '0px';
  }

  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
})();


// WORKS banner slider: 배너 이미지 + 설명을 한 세트로 이동
(function initWorksBannerSlider(){
  const AUTO_MS = 3400;
  const TRANSITION_MS = 720;
  const EASING = 'cubic-bezier(.22,1,.36,1)';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slideData = [
    {
      image: './img/work-banner.png',
      alt: '여름 세일 배너',
      title: '여름 세일 배너',
      desc: '20% 할인 메시지와 대담한 타이포로 경쾌한 세일 무드를 표현했습니다.'
    },
    {
      image: './img/work-banner-2.png',
      alt: '주얼리 기프트 배너',
      title: '주얼리 기프트 배너',
      desc: '리본과 주얼리의 조화로 선물의 설렘과 우아한 이미지를 담았습니다.'
    },
    {
      image: './img/work-banner-3.png',
      alt: '구두 광고 배너',
      title: '구두 광고 배너',
      desc: '뉴트럴 톤과 여백 중심의 구성으로 키튼힐의 세련된 분위기를 표현했습니다.'
    },
    {
      image: './img/work-banner-4.png',
      alt: '수분크림 홍보 배너',
      title: '수분크림 홍보 배너',
      desc: '청량한 블루 톤과 수분감 있는 비주얼로 제품의 촉촉함을 강조했습니다.'
    }
  ];

  function buildSliderFromLegacyMarkup(){
    const bannerWork = document.querySelector('.banner-work');
    if (!bannerWork) return null;

    let slider = bannerWork.querySelector('[data-banner-slider]');
    if (slider) return slider;

    const oldImage = bannerWork.querySelector('.banner-image');
    const oldCaption = bannerWork.querySelector('.banner-caption');
    if (!oldImage && !oldCaption) return null;

    slider = document.createElement('div');
    slider.className = 'banner-slider';
    slider.setAttribute('data-banner-slider', '');
    slider.setAttribute('aria-label', '배너 디자인 슬라이드');

    const track = document.createElement('div');
    track.className = 'banner-track';
    track.setAttribute('data-banner-track', '');

    slideData.forEach((item) => {
      const slide = document.createElement('figure');
      slide.className = 'banner-slide';
      slide.setAttribute('data-banner-slide', '');

      const img = document.createElement('img');
      img.className = 'banner-slide__image';
      img.src = item.image;
      img.alt = item.alt;
      img.draggable = false;

      const caption = document.createElement('figcaption');
      caption.className = 'banner-slide__caption';
      const title = document.createElement('b');
      title.textContent = item.title;
      const desc = document.createElement('span');
      desc.textContent = item.desc;
      caption.append(title, desc);

      slide.append(img, caption);
      track.append(slide);
    });

    slider.append(track);
    const header = bannerWork.querySelector('.work-title');
    if (header) header.insertAdjacentElement('afterend', slider);
    else bannerWork.prepend(slider);

    oldImage?.remove();
    oldCaption?.remove();
    return slider;
  }

  const slider = document.querySelector('[data-banner-slider]') || buildSliderFromLegacyMarkup();
  if (!slider || slider.dataset.sliderReady === 'true') return;

  const track = slider.querySelector('[data-banner-track]');
  if (!track) return;
  const originals = Array.from(track.querySelectorAll('[data-banner-slide]'));
  if (originals.length < 2) return;

  slider.dataset.sliderReady = 'true';

  // 무한 루프용 양쪽 복제본
  const firstClone = originals[0].cloneNode(true);
  const lastClone = originals[originals.length - 1].cloneNode(true);
  firstClone.removeAttribute('data-banner-slide');
  lastClone.removeAttribute('data-banner-slide');
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.prepend(lastClone);
  track.append(firstClone);

  track.querySelectorAll('img').forEach((img) => { img.draggable = false; });

  let index = 1;
  let timer = 0;
  let normalizeTimer = 0;
  let dragging = false;
  let startX = 0;
  let deltaX = 0;
  let dragWidth = 1;
  let sectionActive = false;

  function setTransform(animate, extraPx = 0){
    track.style.transition = animate && !reduceMotion
      ? `transform ${TRANSITION_MS}ms ${EASING}`
      : 'none';
    track.style.transform = `translate3d(calc(${-index * 100}% + ${extraPx}px),0,0)`;
  }

  function normalizeLoop(){
    if (index === originals.length + 1) {
      index = 1;
      setTransform(false, 0);
    } else if (index === 0) {
      index = originals.length;
      setTransform(false, 0);
    }
  }

  function queueNormalize(){
    window.clearTimeout(normalizeTimer);
    normalizeTimer = window.setTimeout(normalizeLoop, TRANSITION_MS + 60);
  }

  function go(step){
    index += step;
    deltaX = 0;
    setTransform(true, 0);
    queueNormalize();
  }

  let firstAutoPending = true;

  function stopAuto(){
    if (timer) window.clearTimeout(timer);
    timer = 0;
  }

  function startAuto(){
    stopAuto();
    if (!sectionActive || reduceMotion || document.hidden || dragging) return;
    const delay = firstAutoPending ? 1000 : AUTO_MS;
    timer = window.setTimeout(() => {
      firstAutoPending = false;
      go(1);
      startAuto();
    }, delay);
  }

  function clientXFromEvent(event){
    if ('clientX' in event) return event.clientX;
    if (event.touches && event.touches[0]) return event.touches[0].clientX;
    if (event.changedTouches && event.changedTouches[0]) return event.changedTouches[0].clientX;
    return 0;
  }

  function dragStart(event){
    if (event.type === 'mousedown' && event.button !== 0) return;

    // 복제 슬라이드 위치에서 드래그가 시작되면 먼저 실제 슬라이드 위치로 즉시 정규화한다.
    // 이렇게 하면 마지막/첫 슬라이드에서 드래그할 때 트랙 바깥의 흰 화면이 노출되지 않는다.
    window.clearTimeout(normalizeTimer);
    normalizeLoop();

    dragging = true;
    startX = clientXFromEvent(event);
    deltaX = 0;
    dragWidth = slider.getBoundingClientRect().width || 1;
    stopAuto();
    slider.classList.add('is-dragging');
    track.style.transition = 'none';
    if (event.cancelable) event.preventDefault();
  }

  function dragMove(event){
    if (!dragging) return;
    const rawDelta = clientXFromEvent(event) - startX;
    // 한 번의 드래그에서 최대 한 장까지만 노출되게 제한해 복제본 밖의 빈 영역을 막는다.
    deltaX = Math.max(-dragWidth, Math.min(dragWidth, rawDelta));
    setTransform(false, deltaX);
    if (event.cancelable) event.preventDefault();
  }

  function dragEnd(){
    if (!dragging) return;
    const width = slider.getBoundingClientRect().width || 1;
    const threshold = Math.max(45, Math.min(110, width * 0.10));
    const moved = deltaX;
    dragging = false;
    deltaX = 0;
    slider.classList.remove('is-dragging');

    if (moved <= -threshold) go(1);
    else if (moved >= threshold) go(-1);
    else setTransform(true, 0);

    startAuto();
  }

  // 초기에는 정지. 01 번호가 화면에 들어온 뒤부터 자동 재생
  setTransform(false, 0);
  const sectionNumber = slider.closest('.banner-work')?.querySelector('.work-title strong');
  if ('IntersectionObserver' in window && sectionNumber) {
    const observer = new IntersectionObserver((entries) => {
      sectionActive = entries[0]?.isIntersecting || false;
      if (sectionActive) startAuto();
      else stopAuto();
    }, { threshold: 0.15 });
    observeCarouselViewport(observer, sectionNumber, slider);
  } else {
    sectionActive = true;
    startAuto();
  }

  // mouse drag
  slider.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove, { passive:false });
  window.addEventListener('mouseup', dragEnd);

  // touch swipe
  slider.addEventListener('touchstart', dragStart, { passive:false });
  window.addEventListener('touchmove', dragMove, { passive:false });
  window.addEventListener('touchend', dragEnd, { passive:true });
  window.addEventListener('touchcancel', dragEnd, { passive:true });

  slider.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform') normalizeLoop();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  // resize 후에도 % 기준이라 위치 계산이 필요 없음
  window.addEventListener('resize', () => setTransform(false, 0));
})();

// WORKS poster: poster1 → poster2 → poster3 → poster4 → poster1 / fade in-out + thumbnail selection
(function initWorksPosterFade(){
  const root = document.querySelector('[data-poster-slider]');
  if (!root) return;

  const posterImage = root.querySelector('[data-poster-image]');
  const posterCopy = root.querySelector('[data-poster-copy]');
  const thumbs = Array.from(root.querySelectorAll('[data-poster-index]'));
  if (!posterImage || !posterCopy || thumbs.length === 0) return;

  const AUTO_MS = 3800;
  const FADE_MS = 340;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const posters = [
    {
      image: './img/poster-chanel.jpg',
      alt: 'CHANEL LE VERNIS 포스터',
      category: 'BEAUTY POSTER',
      title: 'CHANEL<br>LE VERNIS',
      description: '샤넬 메니큐어의 고급스러운 무드와<br>딥 블루 컬러의 깊이감을 시각적으로 표현한<br>광고 포스터입니다.',
      concept: 'Luxury / Deep Blue / Refined',
      tool: 'Photoshop'
    },
    {
      image: './img/poster-chair.jpg',
      alt: 'Nismaaya Wing Chair 포스터',
      category: 'FURNITURE POSTER',
      title: 'Nismaaya<br>Wing Chair',
      description: '부드러운 컬러와 그래픽으로<br>체어의 형태감을 강조한<br>광고 포스터입니다.',
      concept: 'Soft / Modern / Minimal',
      tool: 'Photoshop'
    },
    {
      image: './img/poster-light.jpg',
      alt: '&Tradition Table Lamp 포스터',
      category: 'INTERIOR POSTER',
      title: '&amp;Tradition<br>Table Lamp',
      description: '따뜻한 빛과 공간의 여백으로<br>편안한 무드를 표현한<br>광고 포스터입니다.',
      concept: 'Warm / Calm / Cozy',
      tool: 'Photoshop'
    },
    {
      image: './img/poster-aircon.jpg',
      alt: 'LG WHISEN Air Conditioner 포스터',
      category: 'PRODUCT POSTER',
      title: 'LG WHISEN<br>Air Conditioner',
      description: '눈내리는 설원과 블루 톤으로<br>시원한 냉방 이미지를 표현한<br>광고 포스터입니다.',
      concept: 'Cool /  Dynamic / Fresh',
      tool: 'Photoshop / Illustrator'
    }
  ];

  posters.forEach((poster) => {
    const preload = new Image();
    preload.src = poster.image;
  });

  let currentIndex = 0;
  let autoTimer = null;
  let transitionToken = 0;
  let sectionActive = false;
  let firstAutoPending = true;

  function updateThumbs(index) {
    thumbs.forEach((button, i) => {
      const active = i === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function renderPoster(index) {
    const poster = posters[index];
    posterImage.src = poster.image;
    posterImage.alt = poster.alt;
    posterCopy.innerHTML = `
      <small>${poster.category}</small><h3>${poster.title}</h3>
      <p>${poster.description}</p>
      <dl>
        <div><dt>CONCEPT</dt><dd>${poster.concept}</dd></div>
        <div><dt>TOOL</dt><dd>${poster.tool}</dd></div>
      </dl>`;
    updateThumbs(index);
  }

  function scheduleNext() {
    window.clearTimeout(autoTimer);
    if (!sectionActive || reduceMotion) return;
    const delay = firstAutoPending ? 1000 : AUTO_MS;
    autoTimer = window.setTimeout(() => {
      firstAutoPending = false;
      showPoster((currentIndex + 1) % posters.length);
    }, delay);
  }

  function showPoster(index, immediate = false) {
    const nextIndex = (index + posters.length) % posters.length;
    window.clearTimeout(autoTimer);

    if (nextIndex === currentIndex && !immediate) {
      scheduleNext();
      return;
    }

    const token = ++transitionToken;

    if (reduceMotion || immediate) {
      currentIndex = nextIndex;
      renderPoster(currentIndex);
      posterImage.classList.remove('is-fading');
      posterCopy.classList.remove('is-fading');
      scheduleNext();
      return;
    }

    posterImage.classList.add('is-fading');
    posterCopy.classList.add('is-fading');

    window.setTimeout(() => {
      if (token !== transitionToken) return;

      currentIndex = nextIndex;
      renderPoster(currentIndex);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== transitionToken) return;
          posterImage.classList.remove('is-fading');
          posterCopy.classList.remove('is-fading');
        });
      });

      window.setTimeout(() => {
        if (token === transitionToken) scheduleNext();
      }, FADE_MS);
    }, FADE_MS);
  }

  thumbs.forEach((button) => {
    button.addEventListener('click', () => {
      firstAutoPending = false;
      showPoster(Number(button.dataset.posterIndex));
    });

    button.addEventListener('keydown', (event) => {
      const index = Number(button.dataset.posterIndex);
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const next = (index + 1) % thumbs.length;
        thumbs[next].focus();
        showPoster(next);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const prev = (index - 1 + thumbs.length) % thumbs.length;
        thumbs[prev].focus();
        showPoster(prev);
      }
    });
  });

  updateThumbs(currentIndex);

  // 02 번호가 화면에 들어온 뒤부터 자동 페이드 재생
  const sectionNumber = root.querySelector('.work-title strong');
  if ('IntersectionObserver' in window && sectionNumber) {
    const observer = new IntersectionObserver((entries) => {
      sectionActive = entries[0]?.isIntersecting || false;
      if (sectionActive) scheduleNext();
      else window.clearTimeout(autoTimer);
    }, { threshold: 0.15 });
    observeCarouselViewport(observer, sectionNumber, root.querySelector('.poster-image'));
  } else {
    sectionActive = true;
    scheduleNext();
  }
})();

// WORKS 03 detail page: Figma hover modal state + centered full-detail popup
(function initDetailPageModal(){
  const root = document.querySelector('[data-detail-work]');
  const exploreButton = root?.querySelector('[data-detail-explore]');
  const openButtons = root ? Array.from(root.querySelectorAll('[data-detail-open]')) : [];
  const modal = document.querySelector('#detailModal');
  const modalImage = modal?.querySelector('[data-detail-modal-image]');
  const closeButton = modal?.querySelector('[data-detail-close]');
  if (!root || !modal || !modalImage || !closeButton || openButtons.length === 0) return;

  const details = [
    { src: './img/detail-page-full-1.jpg', alt: '토마토 프린트 원피스 상세페이지 전체 이미지' },
    { src: './img/detail-page-full-2.jpg', alt: '딥 초콜릿 케이크 상세페이지 전체 이미지' },
    { src: './img/detail-page-full-3.jpg', alt: '노이즈캔슬링 헤드폰 상세페이지 전체 이미지' }
  ];

  details.forEach(({src}) => { const img = new Image(); img.src = src; });
  let lastTrigger = null;

  function setExploreState(active){
    root.classList.toggle('is-explore', active);
    exploreButton?.setAttribute('aria-pressed', String(active));
  }

  exploreButton?.addEventListener('click', () => {
    setExploreState(!root.classList.contains('is-explore'));
  });

  function openDetail(index, trigger){
    const detail = details[index];
    if (!detail) return;
    lastTrigger = trigger || null;
    modalImage.src = detail.src;
    modalImage.alt = detail.alt;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('detail-modal-open');
    const scroller = modal.querySelector('.detail-modal__scroll');
    if (scroller) scroller.scrollTop = 0;
    closeButton.focus();
  }

  function closeDetail(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-modal-open');
    lastTrigger?.focus();
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openDetail(Number(button.dataset.detailOpen), button));
  });

  closeButton.addEventListener('click', closeDetail);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeDetail(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeDetail();
  });
})();

// WORKS 04 popup: popup1 → popup6 / center-scale carousel + clickable indicator
(function initPopupCarousel(){
  const root = document.querySelector('[data-popup-carousel]');
  if (!root) return;

  const cards = Array.from(root.querySelectorAll('[data-popup-index]'));
  const bars = Array.from(root.querySelectorAll('[data-popup-go]'));
  const titleEl = root.querySelector('[data-popup-title]');
  const copyEl = root.querySelector('[data-popup-copy]');
  if (cards.length !== 6 || bars.length !== 6 || !titleEl || !copyEl) return;

  const AUTO_MS = 3700;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const popups = [
    { title: 'NIKE 시즌 프로모션 팝업', copy: '강렬한 핑크 컬러와 대형 타이포로<br>세일의 임팩트를 강조했습니다.' },
    { title: 'NIKE 신제품 팝업', copy: '블랙과 라임 컬러의 대비를 활용해<br>제품의 스포티한 무드를 표현했습니다.' },
    { title: '피치 쉐이크 시즌 프로모션', copy: '피치 컬러와 감각적인 타이포를 활용해<br>상큼하고 경쾌한 분위기를 연출했습니다.' },
    { title: '말차 유자 시즌 프로모션', copy: '싱그러운 컬러와 여백을 활용해<br>청량한 시즌 무드를 표현했습니다.' },
    { title: '카라멜 바나나 디저트 팝업', copy: '부드러운 브라운 톤과 제품 이미지를 중심으로<br>달콤한 디저트 무드를 담았습니다.' },
    { title: '올리브영 할인 프로모션', copy: '선명한 컬러와 큰 타이포로<br>할인 메세지가 돋보이도록 구성했습니다.' }
  ];

  let current = 0;
  let timer = null;
  let sectionActive = false;
  let firstAutoPending = true;

  function normalize(index){
    return (index + cards.length) % cards.length;
  }

  function render(index){
    current = normalize(index);
    const prev = normalize(current - 1);
    const next = normalize(current + 1);

    cards.forEach((card, i) => {
      card.classList.remove('is-prev','is-active','is-next','is-hidden-left','is-hidden-right');
      if (i === prev) card.classList.add('is-prev');
      else if (i === current) card.classList.add('is-active');
      else if (i === next) card.classList.add('is-next');
      else {
        const forwardDistance = normalize(i - current);
        card.classList.add(forwardDistance > 0 && forwardDistance <= 3 ? 'is-hidden-right' : 'is-hidden-left');
      }
      card.setAttribute('aria-current', i === current ? 'true' : 'false');
    });

    bars.forEach((bar, i) => {
      const active = i === current;
      bar.classList.toggle('is-active', active);
      bar.setAttribute('aria-selected', String(active));
    });

    // 설명은 움직임 없이 내용만 교체
    titleEl.textContent = popups[current].title;
    copyEl.innerHTML = popups[current].copy;
  }

  function stopAuto(){
    window.clearTimeout(timer);
    timer = null;
  }

  function schedule(){
    stopAuto();
    if (!sectionActive || reduceMotion || document.hidden) return;
    const delay = firstAutoPending ? 1000 : AUTO_MS;
    timer = window.setTimeout(() => {
      firstAutoPending = false;
      render(current + 1);
      schedule();
    }, delay);
  }

  function select(index){
    firstAutoPending = false;
    render(index);
    schedule();
  }

  // 인디케이터 클릭으로 해당 팝업 이동
  bars.forEach((bar) => {
    bar.addEventListener('click', () => select(Number(bar.dataset.popupGo)));
  });

  // 팝업 이미지 클릭 시 해당 팝업을 가운데로 이동
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      select(Number(card.dataset.popupIndex));
    });
  });

  // 첫 화면은 처음부터 피그마 위치에 고정하고, 이후 전환만 애니메이션
  render(0);
  requestAnimationFrame(() => root.classList.add('is-ready'));

  // 04 번호가 화면에 들어온 뒤부터 자동 재생
  const sectionNumber = root.querySelector('.work-title strong');
  if ('IntersectionObserver' in window && sectionNumber) {
    const observer = new IntersectionObserver((entries) => {
      sectionActive = entries[0]?.isIntersecting || false;
      if (sectionActive) schedule();
      else stopAuto();
    }, { threshold: 0.15 });
    observeCarouselViewport(observer, sectionNumber, root.querySelector('.popup-stack'));
  } else {
    sectionActive = true;
    schedule();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto();
    else schedule();
  });
})();

// v29 — HOMFIT 12-column grid: columns drop from top; arches draw from the label outward.
(function initHomfitGridReveal(){
  const grid = document.querySelector('.column-grid');
  const curves = Array.from(document.querySelectorAll('.grid-label-curve'));
  if (!grid || !curves.length) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  grid.classList.add('grid-reveal-ready');
  Array.from(grid.children).forEach((column, index) => column.style.setProperty('--grid-delay', (index * 45) + 'ms'));
  curves.forEach((curve) => {
    curve.classList.add('grid-curve-ready');
    const path = curve.querySelector('path');
    if (path && typeof path.getTotalLength === 'function') {
      const len = Math.ceil(path.getTotalLength());
      path.style.setProperty('--curve-length', String(len));
    }
  });

  function play(){
    grid.classList.add('is-grid-in');
    curves.forEach((curve) => curve.classList.add('is-grid-curve-in'));
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    play();
    return;
  }

  const target = document.querySelector('.grid-system-label') || grid;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    play();
    observer.disconnect();
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  observer.observe(target);
})();


// v33 — HOMFIT mobile swipe arrow draws/reveals from left to right.
(function initHomfitSwipeArrowReveal(){
  const arrow = document.querySelector('.swipe-arrow');
  if (!arrow) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  arrow.classList.add('swipe-arrow-reveal-ready');

  const play = () => arrow.classList.add('is-swipe-arrow-in');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    play();
    return;
  }

  const target = document.querySelector('.swipe-copy') || arrow;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    play();
    observer.disconnect();
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });

  observer.observe(target);
})();


// v36 — AESOP Page Design motion refinements.
// Best Seller image wipes open left → right, while its copy drops in from above.
// Product List image unfolds downward while the right copy drops in at the same time.
(function initAesopPageDesignReveals(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const best = document.querySelector('[data-best-wipe]');
  if (best && !reduceMotion) {
    const playBest = () => {
      if (best.dataset.motionPlayed === 'true') return;
      best.dataset.motionPlayed = 'true';
      if (typeof best.animate !== 'function') return;
      best.animate([
        { opacity: .12, clipPath: 'inset(0 100% 0 0)', transform: 'translate3d(-20px,0,0)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'translate3d(0,0,0)' }
      ], {
        duration: 1750,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both'
      });
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        playBest();
        io.disconnect();
      }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
      io.observe(best);
    } else {
      playBest();
    }
  }

  const productImage = document.querySelector('.product-list-composite[data-product-drop]');
  const productCopy = document.querySelector('.note-product[data-product-drop]');
  if ((productImage || productCopy) && !reduceMotion) {
    const playProduct = () => {
      if (productImage && productImage.dataset.motionPlayed !== 'true') {
        productImage.dataset.motionPlayed = 'true';
        if (typeof productImage.animate === 'function') {
          productImage.animate([
            {
              opacity: 0,
              clipPath: 'inset(0 0 100% 0)',
              transform: 'translate3d(0,-54px,0)',
              transformOrigin: '50% 0%'
            },
            {
              opacity: .82,
              clipPath: 'inset(0 0 36% 0)',
              transform: 'translate3d(0,-10px,0)',
              transformOrigin: '50% 0%'
            },
            {
              opacity: 1,
              clipPath: 'inset(0 0 0 0)',
              transform: 'translate3d(0,0,0)',
              transformOrigin: '50% 0%'
            }
          ], {
            duration: 1500,
            easing: 'cubic-bezier(.22,1,.36,1)',
            fill: 'both'
          });
        }
      }

      if (productCopy && productCopy.dataset.motionPlayed !== 'true') {
        productCopy.dataset.motionPlayed = 'true';
        if (typeof productCopy.animate === 'function') {
          productCopy.animate([
            { opacity: 0, transform: 'translate3d(0,-38px,0)' },
            { opacity: 1, transform: 'translate3d(0,0,0)' }
          ], {
            duration: 1150,
            delay: 0,
            easing: 'cubic-bezier(.22,1,.36,1)',
            fill: 'both'
          });
        }
      }
    };

    const target = productImage || productCopy;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        playProduct();
        io.disconnect();
      }, { threshold: .14, rootMargin: '0px 0px -8% 0px' });
      io.observe(target);
    } else {
      playProduct();
    }
  }
})();

// v38 — AESOP Main Page motion refinements.
// 1) New-product composition spreads outward from the center; its right copy drops in.
// 2) Hero left circle + copy and right circle spread outward together.
(function initAesopMainPageRevealsV38(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const canAnimate = typeof Element !== 'undefined' && Element.prototype && typeof Element.prototype.animate === 'function';
  if (!canAnimate) return;

  function observeOnce(target, play, options = {}){
    if (!target) return;
    if (!('IntersectionObserver' in window)) { play(); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, {
      threshold: options.threshold ?? 0.15,
      rootMargin: options.rootMargin ?? '0px 0px -8% 0px'
    });
    io.observe(target);
  }

  // New product section: entrance animation intentionally disabled (v40).

  // Hero banner: left circle + its copy + right circle expand from the center at the same time.
  const heroCircles = Array.from(document.querySelectorAll('[data-aesop-hero-circle]'));
  const heroCopy = document.querySelector('[data-aesop-hero-slide]');
  const heroTarget = document.querySelector('.aesop-laptop-shot') || heroCopy;
  observeOnce(heroTarget, () => {
    heroCircles.forEach((el) => {
      if (el.dataset.v38Played === 'true') return;
      el.dataset.v38Played = 'true';
      el.animate([
        { opacity: 0, transform: 'scale(.18)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 1750,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'both'
      });
    });

    if (heroCopy && heroCopy.dataset.v38Played !== 'true') {
      heroCopy.dataset.v38Played = 'true';
      heroCopy.animate([
        { opacity: 0, transform: 'translate3d(-72px,0,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ], {
        duration: 1650,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'both'
      });
    }
  });
})();


// v46 — HOMFIT Brand Story center-out reveal + robust AESOP video playback.
(function initRequestedV46Patch(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function observeOnce(target, play){
    if (!target) return;
    if (!('IntersectionObserver' in window)) { play(); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      play();
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    io.observe(target);
  }

  // Brand Story: animate only the background image. Text stays static so it can never be clipped.
  const storyBg = document.querySelector('.homfit-story-bg[data-homfit-story-reveal]');
  if (storyBg && !reduceMotion && typeof storyBg.animate === 'function') {
    observeOnce(storyBg, () => {
      if (storyBg.dataset.v49Played === 'true') return;
      storyBg.dataset.v49Played = 'true';
      storyBg.animate([
        { opacity: 0, clipPath: 'inset(0 50% 0 50%)', transform: 'scaleX(.97)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'scaleX(1)' }
      ], {
        duration: 1500,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'both'
      });
    });
  }

  // Video: force the HTML autoplay-safe state in JS too, then retry when media/page becomes ready.
  const forestVideo = document.querySelector('[data-aesop-forest-video]');
  if (forestVideo) {
    forestVideo.muted = true;
    forestVideo.defaultMuted = true;
    forestVideo.autoplay = true;
    forestVideo.loop = true;
    forestVideo.playsInline = true;
    forestVideo.volume = 0;

    const tryPlay = () => {
      try {
        const promise = forestVideo.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      } catch (_) {}
    };

    // Force a fresh media load so replacing the mp4 in an existing project also takes effect.
    try { forestVideo.load(); } catch (_) {}
    if (forestVideo.readyState >= 2) tryPlay();
    forestVideo.addEventListener('loadeddata', tryPlay, { once: true });
    forestVideo.addEventListener('canplay', tryPlay, { once: true });
    setTimeout(tryPlay, 250);
    setTimeout(tryPlay, 1000);
    window.addEventListener('pageshow', tryPlay);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
  }
})();


// v48 — CONTACT phone/e-mail click-to-copy with a small confirmation popup.
(function initContactCopy(){
  const triggers = Array.from(document.querySelectorAll('[data-copy-text]'));
  const toast = document.querySelector('[data-copy-toast]');
  if (!triggers.length || !toast) return;

  let toastTimer = 0;

  function showToast(message){
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1700);
  }

  async function copyText(value){
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    helper.style.top = '0';
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (_) {
      copied = false;
    }
    helper.remove();
    return copied;
  }

  triggers.forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyText || button.textContent.trim();
      try {
        const copied = await copyText(value);
        showToast(copied ? '내용이 복사되었습니다.' : '복사하지 못했습니다.');
      } catch (_) {
        showToast('복사하지 못했습니다.');
      }
    });
  });
})();
