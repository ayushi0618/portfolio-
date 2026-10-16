/* ============================================================
   VAPOUR TEXT INTRO — canvas particle text effect
   "Hi" / "I'm" / "Ayushi": vapour particles converge to form
   the text, hold, then vaporize upward as the overlay fades.
   Recreated from the 21st.dev vapour-text-effect concept in
   vanilla JS (this site is static HTML/CSS/JS, not React).
   ============================================================ */
(function () {
  'use strict';

  var overlay = document.getElementById('vapour-intro');
  var canvas = document.getElementById('vapour-canvas');
  if (!overlay || !canvas || !canvas.getContext) return;

  // Respect users who prefer no motion — skip the intro entirely.
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function teardown() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.body.classList.remove('vapour-lock');
  }

  if (reduceMotion) { teardown(); return; }

  var ctx = canvas.getContext('2d');
  var vw = window.innerWidth, vh = window.innerHeight;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = vw * DPR;
  canvas.height = vh * DPR;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  ctx.scale(DPR, DPR);

  document.body.classList.add('vapour-lock');

  /* ---------- timeline (seconds) ---------- */
  var LINE_DELAYS = [0.15, 0.45, 0.80];
  var CONVERGE = 1.55;
  var HOLD_UNTIL = 3.70;
  var DISPERSE_UNTIL = 4.65;
  var OVERLAY_FADE_AT = 4.25;
  var OVERLAY_FADE_LEN = 0.55;
  var MAX_PARTICLES = 6500;

  /* ---------- layout ---------- */
  var base = Math.min(vw, vh);
  var sBig = Math.max(64, Math.min(170, base * 0.24));
  var sSmall = Math.max(30, Math.min(72, sBig * 0.44));
  var lines = [
    { text: 'Hi',     size: sSmall, font: '300', color: '#ffffff' },
    { text: "I'm",    size: sSmall, font: '300', color: '#ffffff' },
    { text: 'Ayushi', size: sBig,   font: '800', gradient: true   }
  ];
  var cx = vw / 2;
  var cy = vh / 2 - sBig * 0.18;
  var gapY = sBig * 0.28;
  var ys = [cy - sSmall * 1.15 - gapY, cy - sSmall * 0.35 - gapY * 0.2, cy + sBig * 0.35];

  /* ---------- sample text pixels into particles ---------- */
  var off = document.createElement('canvas');
  off.width = canvas.width; off.height = canvas.height;
  var octx = off.getContext('2d');
  octx.scale(DPR, DPR);
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';

  var particles = [];
  var scatterR = Math.max(vw, vh) * 0.62;

  lines.forEach(function (line, li) {
    octx.clearRect(0, 0, vw, vh);
    octx.font = line.font + ' ' + line.size + 'px Inter, "Segoe UI", sans-serif';
    if (line.gradient) {
      var g = octx.createLinearGradient(cx - sBig * 2.2, 0, cx + sBig * 2.2, 0);
      g.addColorStop(0, '#8B5CF6');
      g.addColorStop(0.5, '#EC4899');
      g.addColorStop(1, '#F97316');
      octx.fillStyle = g;
    } else {
      octx.fillStyle = line.color;
    }
    octx.fillText(line.text, cx, ys[li]);

    // pick a sampling gap that keeps the particle budget
    var img = octx.getImageData(0, 0, off.width, off.height);
    var data = img.data, w = off.width;
    var gap = 3;
    while (true) {
      var count = 0;
      for (var y = 0; y < off.height; y += gap) {
        for (var x = 0; x < off.width; x += gap) {
          if (data[(y * w + x) * 4 + 3] > 128) count++;
        }
      }
      if (count <= MAX_PARTICLES || gap > 12) break;
      gap += 2;
    }

    for (var y = 0; y < off.height; y += gap) {
      for (var x = 0; x < off.width; x += gap) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] > 128) {
          var r = Math.floor(data[idx]), gg = Math.floor(data[idx + 1]), b = Math.floor(data[idx + 2]);
          var a = Math.random() * Math.PI * 2;
          var d = scatterR * (0.35 + Math.random() * 0.65);
          particles.push({
            tx: x / DPR, ty: y / DPR,
            sx: cx + Math.cos(a) * d, sy: cy + Math.sin(a) * d,
            x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
            color: 'rgb(' + r + ',' + gg + ',' + b + ')',
            r: 1 + Math.random() * 2.1,
            delay: LINE_DELAYS[li] + Math.random() * 0.45,
            dur: CONVERGE * (0.85 + Math.random() * 0.35),
            wob: Math.random() * Math.PI * 2,
            wobAmp: 14 + Math.random() * 26,
            vx: 0, vy: 0, alpha: 1,
            dispersed: false
          });
        }
      }
    }
  });

  /* ---------- ambient mist sprites ---------- */
  var mist = [];
  for (var m = 0; m < 34; m++) {
    mist.push({
      x: Math.random() * vw, y: Math.random() * vh,
      r: 60 + Math.random() * 130,
      vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 10,
      a: 0.028 + Math.random() * 0.05,
      hue: Math.random() < 0.5 ? '139,92,246' : '236,72,153'
    });
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInQuad(t) { return t * t; }

  var start = null, skipped = false, done = false, fadeStarted = false;

  function requestSkip() {
    if (done || skipped) return;
    skipped = true;
  }

  overlay.addEventListener('click', requestSkip);
  window.addEventListener('keydown', requestSkip);

  function beginFade(now) {
    overlay.classList.add('vapour-fading');
    fadeStarted = true;
    // hand the fade length to CSS, remove after
    setTimeout(teardown, OVERLAY_FADE_LEN * 1000 + 120);
    done = true;
  }

  function frame(ts) {
    if (done) return;
    if (!start) start = ts;
    var t = (ts - start) / 1000;
    if (skipped) t = Math.max(t, OVERLAY_FADE_AT); // jump to exit phase

    ctx.clearRect(0, 0, vw, vh);

    // ambient mist
    for (var i = 0; i < mist.length; i++) {
      var mi = mist[i];
      mi.x += mi.vx / 60; mi.y += mi.vy / 60;
      if (mi.x < -mi.r) mi.x = vw + mi.r; if (mi.x > vw + mi.r) mi.x = -mi.r;
      if (mi.y < -mi.r) mi.y = vh + mi.r; if (mi.y > vh + mi.r) mi.y = -mi.r;
      var grad = ctx.createRadialGradient(mi.x, mi.y, 0, mi.x, mi.y, mi.r);
      grad.addColorStop(0, 'rgba(' + mi.hue + ',' + mi.a + ')');
      grad.addColorStop(1, 'rgba(' + mi.hue + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(mi.x, mi.y, mi.r, 0, 6.2832); ctx.fill();
    }

    var allSettled = true;

    for (var p = 0; p < particles.length; p++) {
      var pt = particles[p];
      var x, y, alpha;

      if (t < HOLD_UNTIL && !skipped) {
        // converge: vapour condenses into text
        var lt = (t - pt.delay) / pt.dur;
        if (lt <= 0) {
          x = pt.sx; y = pt.sy; alpha = 0;
          allSettled = false;
        } else if (lt < 1) {
          var e = easeOutCubic(lt);
          var wobble = Math.sin(pt.wob + lt * 9) * pt.wobAmp * (1 - e);
          x = pt.sx + (pt.tx - pt.sx) * e + wobble * 0.4;
          y = pt.sy + (pt.ty - pt.sy) * e + wobble;
          alpha = Math.min(1, lt * 2.5);
          allSettled = false;
        } else {
          x = pt.tx; y = pt.ty; alpha = 1;
        }
        pt.x = x; pt.y = y; // keep x/y synced for the disperse phase
      } else {
        // vaporize: drift upward and dissolve
        if (!pt.dispersed) {
          pt.vx = (Math.random() - 0.5) * 90;
          pt.vy = -(50 + Math.random() * 190);
          pt.dispersed = true;
        }
        var dt = 1 / 60;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        pt.vx *= 0.985; pt.vy *= 0.985;
        var ft = (t - HOLD_UNTIL) / (DISPERSE_UNTIL - HOLD_UNTIL);
        if (skipped) ft = Math.min(1, ft + 0.6);
        alpha = Math.max(0, 1 - easeInQuad(Math.max(0, Math.min(1, ft))));
        x = pt.x; y = pt.y;
        if (alpha > 0) allSettled = false;
      }
      pt.alpha = alpha;

      if (alpha <= 0.004) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(x, y, pt.r, 0, 6.2832); ctx.fill();
      // soft vapour halo around a subset of particles
      if ((p & 7) === 0) {
        ctx.globalAlpha = alpha * 0.07;
        ctx.beginPath(); ctx.arc(x, y, pt.r * 7, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (t >= OVERLAY_FADE_AT && !fadeStarted) beginFade();

    if (!done) requestAnimationFrame(frame);
  }

  // Wait for Inter so the canvas samples the real font (with a safety timeout)
  var fontsReady = (document.fonts && document.fonts.load)
    ? Promise.race([
        document.fonts.load('800 100px Inter').then(function () { return document.fonts.ready; }),
        new Promise(function (res) { setTimeout(res, 1800); })
      ])
    : Promise.resolve();

  fontsReady.then(function () {
    requestAnimationFrame(frame);
    // reveal the skip hint shortly after the intro begins
    setTimeout(function () {
      var hint = overlay.querySelector('.vapour-skip-hint');
      if (hint) hint.classList.add('visible');
    }, 1600);
  });
})();
