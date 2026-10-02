(function () {
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.lucide) window.lucide.createIcons();

  /* ---------- Language PL / RU ---------- */
  var RU = window.I18N_RU || {};
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var attrNodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n-attr]'));
  var plText = new Map();
  var plAttr = new Map();

  nodes.forEach(function (el) { plText.set(el, el.innerHTML); });
  attrNodes.forEach(function (el) {
    var saved = {};
    el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var attr = pair.split(':')[0].trim();
      saved[attr] = el.getAttribute(attr);
    });
    plAttr.set(el, saved);
  });

  function readLang() {
    var param = new URLSearchParams(location.search).get('lang');
    if (param === 'pl' || param === 'ru') return param;
    try { return localStorage.getItem('lang') || 'pl'; } catch (e) { return 'pl'; }
  }

  function setLang(lang) {
    doc.lang = lang;
    doc.setAttribute('data-lang', lang);
    nodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = lang === 'ru' && RU[key] ? RU[key] : plText.get(el);
    });
    attrNodes.forEach(function (el) {
      var saved = plAttr.get(el);
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = parts[1].trim();
        el.setAttribute(attr, lang === 'ru' && RU[key] ? RU[key] : saved[attr]);
      });
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
    keepShortWords();
  }

  /* Polish and Russian typography: one-letter words never end a line */
  function keepShortWords() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var tag = n.parentNode && n.parentNode.nodeName;
        return tag === 'SCRIPT' || tag === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var re = /(^|[\s(„«])([a-zA-ZąćęłńóśźżА-Яа-яЁё])\s+/g;
    var n;
    while ((n = walker.nextNode())) {
      if (re.test(n.nodeValue)) {
        re.lastIndex = 0;
        n.nodeValue = n.nodeValue.replace(re, '$1$2\u00A0');
      }
      re.lastIndex = 0;
    }
  }

  document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang-btn')); });
  });
  setLang(readLang());

  /* ---------- Header ---------- */
  var header = document.querySelector('.site-header');
  var mbar = document.querySelector('.mbar');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (mbar) mbar.classList.toggle('is-visible', y > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.burger');
  function closeMenu() {
    if (!header) return;
    header.classList.remove('menu-open');
    document.body.classList.remove('menu-locked');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-locked', open);
      if (open) header.classList.add('is-scrolled');
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) { if (mq.matches) closeMenu(); });
    document.querySelectorAll('.menu-panel a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Muted autoplay videos in view ---------- */
  var autoVideos = document.querySelectorAll('video[data-autoplay]');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  if ('IntersectionObserver' in window && !reduceMotion && !saveData) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    autoVideos.forEach(function (v) { vo.observe(v); });
  }

  /* ---------- Product hover preview ---------- */
  document.querySelectorAll('.product').forEach(function (card) {
    var v = card.querySelector('video');
    if (!v || reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    card.addEventListener('mouseenter', function () {
      card.classList.add('is-playing');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    card.addEventListener('mouseleave', function () {
      card.classList.remove('is-playing');
      v.pause();
    });
  });

  /* ---------- Mobile rails: dots + keyboard ---------- */
  var mobileMq = window.matchMedia('(max-width: 767px)');
  document.querySelectorAll('[data-rail]').forEach(function (rail) {
    var items = Array.prototype.slice.call(rail.children);
    if (items.length < 2) return;
    var dots = document.createElement('div');
    dots.className = 'rail-dots';
    var buttons = items.map(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + ' / ' + items.length);
      b.addEventListener('click', function () {
        rail.scrollTo({ left: item.offsetLeft - rail.offsetLeft - parseFloat(getComputedStyle(rail).scrollPaddingLeft || 0), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      dots.appendChild(b);
      return b;
    });
    rail.insertAdjacentElement('afterend', dots);

    var ticking = false;
    function update() {
      ticking = false;
      var railLeft = rail.getBoundingClientRect().left;
      var best = 0, bestDist = Infinity;
      items.forEach(function (item, i) {
        var d = Math.abs(item.getBoundingClientRect().left - railLeft - 16);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) best = items.length - 1;
      buttons.forEach(function (b, i) { b.setAttribute('aria-current', String(i === best)); });
    }
    rail.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    function applyMode() {
      if (mobileMq.matches) rail.setAttribute('tabindex', '0');
      else rail.removeAttribute('tabindex');
      update();
    }
    mobileMq.addEventListener('change', applyMode);
    applyMode();
  });

  /* ---------- Reels scroll buttons ---------- */
  document.querySelectorAll('[data-reels]').forEach(function (wrap) {
    var track = wrap.querySelector('.reels');
    var prev = wrap.querySelector('[data-scroll="prev"]');
    var next = wrap.querySelector('[data-scroll="next"]');
    function step() { var r = track.querySelector('.reel'); return r ? r.getBoundingClientRect().width + 16 : 300; }
    function update() {
      if (prev) prev.disabled = track.scrollLeft < 8;
      if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Lightbox with sound ---------- */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbVideo = lb.querySelector('video');
    var lbClose = lb.querySelector('.close');
    var lastFocus = null;
    function openLb(src, poster) {
      lastFocus = document.activeElement;
      lbVideo.src = src;
      if (poster) lbVideo.poster = poster;
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var p = lbVideo.play(); if (p && p.catch) p.catch(function () {});
      lbClose.focus();
    }
    function closeLb() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      lbVideo.pause();
      lbVideo.removeAttribute('src');
      lbVideo.load();
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openLb(el.getAttribute('data-lightbox'), el.getAttribute('data-poster'));
      });
    });
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb();
      if (e.key === 'Tab' && lb.classList.contains('is-open')) {
        e.preventDefault();
        (document.activeElement === lbClose ? lbVideo : lbClose).focus();
      }
    });
  }

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
