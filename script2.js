/* PAD / MO 추가 스크립트. 기존 script.js 다음에 연결하세요. */
(() => {
  'use strict';
  if (window.__portfolioResponsive2) return;
  window.__portfolioResponsive2 = true;
  function init() {
    const root = document.querySelector('.portfolio');
    if (!root) return;
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
