/* ===== EXPERIENCE HOVER PREVIEWS (21st.dev hover-preview pattern) =====
   Hovering a marked project/tech mention in the experience entries shows a
   floating, cursor-following preview card with proof: screenshot image,
   title, one-liner, and tech stack. Desktop hover only (no-op on touch).
   An additional proof layer on top of the proof chips — chips untouched. */
(function () {
  'use strict';

  var PREVIEWS = {
    trishul: {
      img: 'assets/trishul-1.png',
      title: 'Trishul — Asset & Maintenance Management',
      desc: 'End-to-end digital workshop & fleet maintenance platform built during the 510 Army Base Workshop internship.',
      stack: 'React 19 • Vite • Tailwind • Node.js • Express • SQLite • Docker'
    },
    freelance: {
      img: null,
      title: 'Freelance — Fiverr & Upwork',
      desc: 'Live gigs: business landing pages and portfolio sites for real clients.',
      stack: 'React • Tailwind CSS'
    },
    jpmorgan: {
      img: null,
      title: 'J.P. Morgan — Software Engineering Job Simulation',
      desc: 'Forage virtual experience: interfacing with a stock price data feed and displaying data visually for traders.',
      stack: 'Stock price data feed • Data visualization'
    },
    tata: {
      img: null,
      title: 'Tata \u2014 GenAI Powered Data Analytics',
      desc: 'Forage virtual experience: GenAI-powered data analytics job simulation.',
      stack: 'Data Analytics \u2022 GenAI'
    }
  };

  var CARD_W = 300;

  function init() {
    // Desktop hover only.
    if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;

    var card = document.createElement('div');
    card.className = 'exp-hover-card';
    card.setAttribute('aria-hidden', 'true');
    card.style.display = 'none';
    document.body.appendChild(card);

    var hideTimer = 0;

    function show(key, x, y) {
      var p = PREVIEWS[key];
      if (!p) return;
      clearTimeout(hideTimer);
      card.innerHTML =
        (p.img ? '<img class="exp-hover-img" src="' + p.img + '" alt="" loading="lazy">' : '') +
        '<div class="exp-hover-body">' +
        '<div class="exp-hover-title">' + p.title + '</div>' +
        '<div class="exp-hover-desc">' + p.desc + '</div>' +
        '<div class="exp-hover-stack">' + p.stack + '</div>' +
        '</div>';
      position(x, y);
      card.style.display = 'block';
      // retrigger pop-in
      card.classList.remove('exp-hover-in');
      void card.offsetWidth;
      card.classList.add('exp-hover-in');
    }

    function position(x, y) {
      var pad = 16;
      var w = CARD_W;
      var h = card.offsetHeight || 220;
      var left = x + 18;
      var top = y + 18;
      if (left + w + pad > window.innerWidth) left = x - w - 18;
      if (top + h + pad > window.innerHeight) top = y - h - 18;
      if (left < pad) left = pad;
      if (top < pad) top = pad;
      card.style.left = left + 'px';
      card.style.top = top + 'px';
    }

    function hide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { card.style.display = 'none'; }, 120);
    }

    document.querySelectorAll('.exp-hover').forEach(function (el) {
      var key = el.getAttribute('data-preview');
      el.addEventListener('mouseenter', function (e) { show(key, e.clientX, e.clientY); });
      el.addEventListener('mousemove', function (e) {
        if (card.style.display === 'block') position(e.clientX, e.clientY);
      });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () {
        var r = el.getBoundingClientRect();
        show(key, r.left + r.width / 2, r.bottom);
      });
      el.addEventListener('blur', hide);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
