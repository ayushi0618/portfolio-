/* ============================================================
   ANALYTICS IN MOTION — scroll-triggered chart animations
   Counts, bars and the donut animate once, when the section scrolls
   into view. Pure vanilla JS; respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  function init() {
    var section = document.getElementById('analytics');
    if (!section) return;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) section.classList.add('an-no-motion');

    function fmt(value, el) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var text = value.toFixed(decimals);
      if (el.getAttribute('data-format') === 'comma') {
        var parts = text.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        text = parts.join('.');
      }
      return (el.getAttribute('data-prefix') || '') + text +
        (el.getAttribute('data-suffix') || '');
    }

    function animateCount(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = fmt(target, el); return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased, el);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function run() {
      section.querySelectorAll('.an-count').forEach(animateCount);
      section.querySelectorAll('.an-bar-fill').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-width') + '%';
      });
      section.querySelectorAll('.an-donut-arc').forEach(function (arc) {
        var pct = parseFloat(arc.getAttribute('data-pct'));
        if (isNaN(pct)) return;
        var c = 2 * Math.PI * 70;
        arc.style.strokeDasharray = c.toFixed(2);
        arc.style.strokeDashoffset = (c * (1 - pct / 100)).toFixed(2);
      });
    }

    if (!window.IntersectionObserver) { run(); return; }
    var seen = false;
    var obs = new IntersectionObserver(function (entries) {
      if (seen) return;
      if (entries.some(function (e) { return e.isIntersecting; })) {
        seen = true;
        run();
        obs.disconnect();
      }
    }, { threshold: 0.25 });
    obs.observe(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
