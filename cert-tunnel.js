/* ============================================================
   Certifications tunnel — vanilla port of perspective-tunnel-hero.
   The original hijacks wheel events inside a 100svh React hero; this
   version is scroll-linked instead, so it sits as a normal section
   below Tech Arsenal without trapping page scroll. Cards fly the
   same golden-angle spiral (staggered, smoothed) and link to their
   credential pages. Without JS (or with reduced motion) the cards
   simply render as a grid.
   ============================================================ */
(function () {
  'use strict';
  var stage = document.getElementById('certTunnelStage');
  if (!stage) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var plane = document.getElementById('certTunnelPlane');
  if (!plane) return;
  var anchorTitle = stage.querySelector('.cert-tunnel-anchor-title');
  var cards = Array.prototype.slice.call(plane.querySelectorAll('.cert-tunnel-card'));
  var total = cards.length;
  if (!total) return;

  // Per-card spiral params, mirroring the original component.
  var params = cards.map(function (el, i) {
    var golden = i * 137.5 * Math.PI / 180;
    return {
      el: el,
      cos: Math.cos(golden),
      sin: Math.sin(golden),
      rx: 0.28 + (i % 3) * 0.08,
      ry: 0.26 + (i % 2) * 0.09,
      rot: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      start: (i / total) * 0.45,
      span: 0.55
    };
  });

  var dims = { w: window.innerWidth, h: window.innerHeight };
  window.addEventListener('resize', function () {
    dims.w = window.innerWidth;
    dims.h = window.innerHeight;
  });

  // Pointer parallax, smoothed; desktop pointers only.
  var px = 0, py = 0, tx = 0, ty = 0;
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function scrollProgress() {
    var r = stage.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh - r.top) / (vh + r.height);
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // Piecewise opacity from the original: [0, 0.18, 0.82, 0.98] -> [0, 1, 1, 0].
  function opacityAt(t) {
    if (t <= 0) return 0;
    if (t < 0.18) return t / 0.18;
    if (t < 0.82) return 1;
    if (t < 0.98) return 1 - (t - 0.82) / 0.16;
    return 0;
  }

  function calcPart(value) {
    return value < 0 ? '- ' + (-value) + 'px' : '+ ' + value + 'px';
  }

  var smooth = 0;
  var running = false;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    var target = scrollProgress();
    smooth += (target - smooth) * 0.12;
    px += (tx - px) * 0.08;
    py += (ty - py) * 0.08;

    var mobile = window.innerWidth < 768;
    var farZ = mobile ? -1200 : -1700;
    var nearZ = mobile ? 350 : 500;
    var pan = mobile ? 20 : 45;

    params.forEach(function (c, i) {
      var local = (smooth - c.start) / c.span;
      local = local < 0 ? 0 : local > 1 ? 1 : local;
      var z = farZ + (nearZ - farZ) * local;
      var cardW = mobile
        ? Math.max(130, Math.min(180, dims.w * 0.38))
        : Math.max(180, Math.min(270, dims.w * 0.18));
      var ox = c.cos * (dims.w * c.rx) - px * pan;
      var oy = c.sin * (dims.h * c.ry) - py * pan;
      c.el.style.width = cardW + 'px';
      c.el.style.opacity = opacityAt(local);
      c.el.style.zIndex = String(i + 1);
      c.el.style.transform =
        'translate3d(calc(-50% ' + calcPart(ox) + '), calc(-50% ' + calcPart(oy) + '), ' + z + 'px) rotateZ(' + c.rot + 'deg)';
    });

    if (anchorTitle) {
      var s = smooth < 0.5 ? 0.7 + (smooth / 0.5) * 0.3 : 1 + ((smooth - 0.5) / 0.5) * 0.35;
      var ao;
      if (smooth < 0.12) ao = 0.25 + (smooth / 0.12) * 0.75;
      else if (smooth > 0.85) ao = Math.max(0, 1 - (smooth - 0.85) / 0.15);
      else ao = 1;
      anchorTitle.style.transform = 'scale(' + s + ')';
      anchorTitle.style.opacity = ao;
    }
  }

  stage.classList.add('is-tunnel');
  var io = new IntersectionObserver(function (entries) {
    running = entries[0] ? entries[0].isIntersecting : true;
    if (running) requestAnimationFrame(frame);
  }, { threshold: 0 });
  io.observe(stage);
})();
