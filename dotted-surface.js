/* ===== DOTTED SURFACE — hero background =====
   Animated 3D dotted wave in the spirit of 21st.dev's "dotted-surface":
   a grid of dots on a plane, displaced by layered sine waves so the field
   flows like water. Vanilla canvas 2D with a manual perspective projection
   (no Three.js dependency). Monochrome white dots on the dark hero; dot
   size and alpha follow wave height, and the field fades out toward the
   hero edges. Gentle pointer parallax. Pauses when the hero scrolls out of
   view, when the tab is hidden, and during the vapour intro. Reduced motion
   gets a single static frame. */
(function () {
  'use strict';

  var TILT = 1.02;    // plane tilt around the X axis (~58 deg)
  var CAM = 26;       // camera distance, world units
  var X_RANGE = 14;   // world half-width of the dot plane
  var Z_RANGE = 9;    // world half-depth of the dot plane
  var AMP = 1.7;      // approx wave amplitude, for height normalization

  function wave(x, z, t) {
    return Math.sin(x * 0.32 + t * 1.05) * 0.55
         + Math.sin(z * 0.27 - t * 0.75) * 0.40
         + Math.sin((x + z) * 0.16 + t * 0.45) * 0.50
         + Math.sin((x - z) * 0.22 - t * 0.60) * 0.25;
  }

  function init() {
    var hero = document.getElementById('hero');
    if (!hero || hero.querySelector('.dot-surface-canvas')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'dot-surface-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    if (!ctx) { hero.classList.add('neon-static'); canvas.remove(); return; }

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, nx = 0, nz = 0;
    var cosT = Math.cos(TILT), sinT = Math.sin(TILT);

    // Gentle pointer parallax, eased toward the pointer each frame.
    var mx = 0, my = 0, tx = 0, ty = 0;

    function resize() {
      var r = hero.getBoundingClientRect();
      W = Math.max(2, r.width);
      H = Math.max(2, r.height);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      nx = Math.max(60, Math.min(120, Math.round(W / 16)));
      nz = Math.max(36, Math.min(72, Math.round(H / 16)));
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
      ty = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
    }, { passive: true });

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;

      var cx = W / 2 + mx * W * 0.03;
      var cy = H * 0.54 + my * H * 0.03;
      var zoom = W / 26;
      var maxR = Math.sqrt(cx * cx + cy * cy);

      for (var j = 0; j < nz; j++) {
        var z = -Z_RANGE + (2 * Z_RANGE * j) / (nz - 1);
        for (var i = 0; i < nx; i++) {
          var x = -X_RANGE + (2 * X_RANGE * i) / (nx - 1);
          var y = wave(x, z, t);

          // Tilt around X, then perspective project.
          var y1 = y * cosT - z * sinT;
          var z1 = y * sinT + z * cosT;
          var depth = CAM + z1;
          if (depth <= 0.1) continue;
          var s = CAM / depth;

          var sx = cx + x * s * zoom;
          var sy = cy - y1 * s * zoom;
          if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue;

          var hn = (y / AMP + 1) / 2;
          hn = hn < 0 ? 0 : hn > 1 ? 1 : hn;

          // Melt the field into black toward the hero edges.
          var dx = sx - cx, dy = sy - cy;
          var edge = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / (maxR * 0.95));
          edge = edge * edge;

          var a = (0.10 + 0.62 * hn) * (0.25 + 0.75 * edge);
          if (a < 0.02) continue;
          var rad = (0.9 + 1.5 * hn) * s;
          if (rad < 0.4) continue;

          ctx.beginPath();
          ctx.arc(sx, sy, rad, 0, 6.2832);
          ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.fill();
        }
      }
    }

    // Reduced motion: one static frame, no loop.
    if (reduceMotion) {
      hero.classList.add('neon-static');
      draw(1.4);
      return;
    }

    var rafId = 0, running = true;
    var startT = performance.now();

    function introActive() {
      return document.body.classList.contains('vapour-lock');
    }

    function frame(now) {
      rafId = 0;
      if (!running) return;
      if (!introActive() && !document.hidden) {
        draw((now - startT) / 1000);
      }
      rafId = requestAnimationFrame(frame);
    }

    // Pause when the hero scrolls out of view.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !rafId) { rafId = requestAnimationFrame(frame); }
        else if (!vis && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      }, { threshold: 0.02 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      else if (!document.hidden && !rafId && running) { rafId = requestAnimationFrame(frame); }
    });

    rafId = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
