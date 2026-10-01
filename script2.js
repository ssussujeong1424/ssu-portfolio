/* PAD / MO 추가 스크립트. 기존 script.js 다음에 연결하세요. */
(() => {
  'use strict';
  if (window.__portfolioResponsive2) return;
  window.__portfolioResponsive2 = true;
  function init() {
    const root = document.querySelector('.portfolio');
    if (!root) return;
    const syncDesktopScale = () => root.style.setProperty('--desktop-scale', Math.min(1, innerWidth / 1920));
    syncDesktopScale();
    window.addEventListener('resize', syncDesktopScale);
    const query = matchMedia('(max-width: 1024px)');
    const changes = [];
    function group(parentSelector, selector, name) {
      const parent = root.querySelector(parentSelector);
      if (!parent) return;
      const nodes = Array.from(parent.children).filter(el => el.matches(selector));
      if (!nodes.length) return;
      const wrapper = document.createElement('div');
      wrapper.className = `r2-group ${name}`;
      const markers = nodes.map(node => {
        const marker = document.createComment('responsive2 original position');
        node.before(marker);
        return [node, marker];
      });
      nodes[0].before(wrapper);
      nodes.forEach(node => wrapper.append(node));
      changes.push(() => {
        markers.forEach(([node, marker]) => { marker.replaceWith(node); });
        wrapper.remove();
      });
    }
    function update() {
      if (query.matches && !root.classList.contains('responsive2')) {
        root.classList.add('responsive2');
        group('.aesop-intro', '.device', 'r2-aesop-devices');
        group('.homfit-intro', '.device', 'r2-homfit-devices');
        group('.aesop-case', '.aesop-laptop-shot,.dot-a,.dot-b', 'r2-hero-scene');
        group('.aesop-case', '.aesop-forest,.aesop-forest-video,.aesop-green-blob,.aesop-leaf', 'r2-forest-scene');
        group('.aesop-case', '.detail-pc-shot,.detail-pad-shot,.detail-mo-shot', 'r2-detail-scene');
        const stars = root.querySelector('.detail-stars');
        const detailScene = root.querySelector('.r2-detail-scene');
        if (stars && detailScene) {
          const marker = document.createComment('responsive stars original position');
          stars.before(marker);
          detailScene.append(stars);
          changes.push(() => marker.replaceWith(stars));
        }
        group('.aesop-case', '.promo-pc-shot,.promo-mo-1,.promo-mo-2', 'r2-promo-scene');
        group('.homfit-case', '.homfit-product-mo,.homfit-grid-pad,.column-grid,.grid-system-label,.grid-label-curve,.grid-copy', 'r2-grid-scene');
        group('.homfit-case', '.homfit-hero-pad,.homfit-hero-mo,.hero-copy', 'r2-banner-scene');
        group('.homfit-case', '.homfit-pad4,.homfit-horizontal,.swipe-copy,.swipe-arrow', 'r2-swipe-scene');
      } else if (!query.matches && root.classList.contains('responsive2')) {
        changes.splice(0).reverse().forEach(undo => undo());
        root.classList.remove('responsive2');
      }
    }
    update();
    query.addEventListener('change', update);
    // Native touch scrolling remains available; mouse dragging must not open a card.
    const cards = root.querySelector('.detail-cards');
    if (cards) {
      let drag = null;
      let suppressClick = false;
      cards.addEventListener('pointerdown', event => {
        if (innerWidth > 768 || event.pointerType !== 'mouse' || event.button !== 0) return;
        suppressClick = false;
        drag = { id:event.pointerId, x:event.clientX, scroll:cards.scrollLeft, moved:false };
      });
      cards.addEventListener('pointermove', event => {
        if (!drag || event.pointerId !== drag.id) return;
        const distance = event.clientX - drag.x;
        if (!drag.moved && Math.abs(distance) < 8) return;
        drag.moved = true;
        cards.setPointerCapture(event.pointerId);
        cards.classList.add('is-dragging');
        cards.scrollLeft = drag.scroll - distance;
        event.preventDefault();
      });
      const finishDrag = event => {
        if (!drag || event.pointerId !== drag.id) return;
        suppressClick = drag.moved;
        if (cards.hasPointerCapture(event.pointerId)) cards.releasePointerCapture(event.pointerId);
        cards.classList.remove('is-dragging');
        drag = null;
      };
      window.addEventListener('pointerup', finishDrag);
      window.addEventListener('pointercancel', finishDrag);
      cards.addEventListener('dragstart', event => { if (innerWidth <= 768) event.preventDefault(); });
      cards.addEventListener('click', event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }, true);
    }
    // Preserve the navigation's document position while pinning it to the viewport.
    const mobileNav = root.querySelector('.statusbar');
    if (mobileNav) {
      const navSpace = document.createElement('div');
      navSpace.className = 'r2-nav-space';
      navSpace.setAttribute('aria-hidden', 'true');
      mobileNav.before(navSpace);
      let navFrame = 0;
      const syncNav = () => {
        navFrame = 0;
        const pinned = query.matches && navSpace.getBoundingClientRect().top <= 0;
        mobileNav.classList.toggle('r2-is-fixed', pinned);
        navSpace.style.height = pinned ? `${mobileNav.getBoundingClientRect().height}px` : '0px';
      };
      const queueNav = () => { if (!navFrame) navFrame = requestAnimationFrame(syncNav); };
      window.addEventListener('scroll', queueNav, { passive:true });
      window.addEventListener('resize', queueNav);
      window.addEventListener('load', queueNav);
      query.addEventListener('change', queueNav);
      new ResizeObserver(queueNav).observe(mobileNav);
      syncNav();
    }
    // 작은 화면에서는 고정 메뉴 높이를 포함해 앵커를 이동합니다.
    root.querySelectorAll('.statusbar__links a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        if (!query.matches) return;
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const menu = root.querySelector('.statusbar');
        const offset = menu ? menu.getBoundingClientRect().height : 0;
        window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset - 12), behavior: 'auto' });
        history.replaceState(null, '', link.hash);
      }, true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
