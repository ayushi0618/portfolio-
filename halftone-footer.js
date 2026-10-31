/* ============================================================
   Halftone Wordmark Footer — vanilla port of
   halftone-wordmark-footer.tsx (React + canvas, no dependencies).

   The footer wordmark is printed as a field of halftone dots, each
   sized by how much of the letter covers its cell. Moving the
   pointer across it parts the dots on springs and warms their
   colour; clicking fires a shock ring through the word. Pure
   helpers (hwfHex / hwfRadius / hwfStep / hwfWarmth / hwfFitSize)
   are identical to the component's, so the motion matches exactly.
   Content lives in the footer markup; behaviour lives here.
   ============================================================ */
(function () {
  'use strict';

  /* --- pure helpers, identical to the component's --- */

  /** Hex -> [r, g, b] in 0-255, or null for anything that isn't #rgb / #rrggbb. */
  function hwfHex(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
  function hwfRadius(coverage, gap) {
    var c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
    return Math.sqrt(c) * gap * 0.56;
  }

  /**
   * One step of a dot's spring back to home, plus the push from a pointer
   * at (px, py) within radius r. Returns [x, y, vx, vy].
   */
  function hwfStep(x, y, vx, vy, hx, hy, px, py, r) {
    var dx = x - px;
    var dy = y - py;
    var d2 = dx * dx + dy * dy;
    if (r > 0 && d2 < r * r) {
      var d = Math.sqrt(d2) + 0.001;
      var f = (1 - d / r) * 2.6;
      vx += (dx / d) * f;
      vy += (dy / d) * f;
    }
    vx = (vx + (hx - x) * 0.05) * 0.84;
    vy = (vy + (hy - y) * 0.05) * 0.84;
    return [x + vx, y + vy, vx, vy];
  }

  /** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
  function hwfWarmth(x, y, hx, hy, span) {
    var d = Math.hypot(x - hx, y - hy);
    return span > 0 ? Math.min(1, d / span) : 0;
  }

  /** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
  function hwfFitSize(measured, width) {
    return measured > 0 ? (width / measured) * 100 : 0;
  }

  /* --- footer effect --- */

  function init() {
    var root = document.getElementById('hwf-root');
    if (!root) return;
    var canvas = root.querySelector('canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var colors = {
      background: root.getAttribute('data-bg') || '#0c0c0b',
      ink: root.getAttribute('data-ink') || '#e9e4da',
      warm: root.getAttribute('data-warm') || '#e9762b'
    };
    var wordmark = root.getAttribute('data-wordmark') || 'ayushi';
    var dotGap = parseFloat(root.getAttribute('data-dot-gap') || '6');
    var radius = parseFloat(root.getAttribute('data-radius') || '80');
    var crop = parseFloat(root.getAttribute('data-crop') || '0.2');
    var grain = parseFloat(root.getAttribute('data-grain') || '0.5');
    var fontFamily = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
    var fontWeight = 800;
    var interactive = true;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w = 0;
    var h = 0;
    var dpr = 1;
    var px = -1e5;
    var py = -1e5;
    var raf = 0;
    var visible = true;
    var awake = true;
    var ring = { x: 0, y: 0, t: -1 };
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    var dots = new Float32Array(0);
    var count = 0;
    var grainTile = null;
    var ink = hwfHex(colors.ink) || [233, 228, 218];
    var warm = hwfHex(colors.warm) || [233, 118, 43];

    function layout() {
      var rect = root.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Set the word once, at a size that fills the width, on a 1x mask.
      var mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      var m = mask.getContext('2d', { willReadFrequently: true });
      if (!m) return;
      var face = fontWeight + ' 100px ' + fontFamily;
      m.font = face;
      var word = wordmark || ' ';
      var fit = hwfFitSize(m.measureText(word).width, w * 1.02);
      m.font = fontWeight + ' ' + fit + 'px ' + fontFamily;
      var box = m.measureText(word);
      var cap = box.actualBoundingBoxAscent || fit * 0.72;
      var c = Math.max(0, Math.min(0.6, crop));
      m.fillStyle = '#000';
      m.textBaseline = 'alphabetic';
      m.fillText(word, (w - box.width) / 2, h + cap * c);
      var img = m.getImageData(0, 0, w, h).data;

      var gap = Math.max(3, dotGap);
      var cols = Math.ceil(w / gap);
      var rows = Math.ceil(h / gap);
      var tmp = [];
      for (var gy = 0; gy < rows; gy++) {
        for (var gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3x3 sample of the cell.
          var sum = 0;
          for (var sy = 0; sy < 3; sy++) {
            for (var sx = 0; sx < 3; sx++) {
              var x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
              var y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          var cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          var hx = gx * gap + gap / 2;
          var hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap));
        }
      }
      dots = new Float32Array(tmp);
      count = tmp.length / 7;

      // A fixed tile of print grain, drawn once and laid over every frame.
      grainTile = document.createElement('canvas');
      grainTile.width = 256;
      grainTile.height = 256;
      var g = grainTile.getContext('2d');
      if (g) {
        var id = g.createImageData(256, 256);
        for (var i = 0; i < id.data.length; i += 4) {
          var v = Math.random() * 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
        }
        g.putImageData(id, 0, 0);
      }
      awake = true;
    }

    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, w, h);

      var r = interactive && !reduced ? Math.max(0, radius) : 0;
      var ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      var ringR = ringAge * 0.9;
      var moving = false;
      for (var i = 0; i < count; i++) {
        var j = i * 7;
        var x = dots[j];
        var y = dots[j + 1];
        var vx = dots[j + 2];
        var vy = dots[j + 3];
        var hx = dots[j + 4];
        var hy = dots[j + 5];
        if (!reduced) {
          if (ringAge < 900) {
            var dx = hx - ring.x;
            var dy = hy - ring.y;
            var dd = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var band = 1 - Math.min(1, Math.abs(dd - ringR) / 26);
            if (band > 0) {
              var f = band * 3.2 * (1 - ringAge / 900);
              vx += (dx / dd) * f;
              vy += (dy / dd) * f;
            }
          }
          var s = hwfStep(x, y, vx, vy, hx, hy, px, py, r);
          x = s[0];
          y = s[1];
          vx = s[2];
          vy = s[3];
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
          else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }
          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }
        var k = hwfWarmth(x, y, hx, hy, 28);
        ctx.fillStyle =
          k > 0.02
            ? 'rgb(' +
              Math.round(ink[0] + (warm[0] - ink[0]) * k) + ',' +
              Math.round(ink[1] + (warm[1] - ink[1]) * k) + ',' +
              Math.round(ink[2] + (warm[2] - ink[2]) * k) + ')'
            : colors.ink;
        ctx.beginPath();
        ctx.arc(x, y, dots[j + 6], 0, 6.2832);
        ctx.fill();
      }

      if (grainTile && grain > 0) {
        ctx.globalAlpha = Math.min(1, grain) * 0.09;
        ctx.globalCompositeOperation = 'overlay';
        var pattern = ctx.createPattern(grainTile, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      // Sleep once everything is home and nothing is pushing.
      awake = moving || ringAge < 900 || px > -1e4;
    }

    function loop(now) {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    }
    function wake() {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    }

    function toLocal(e) {
      var b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    }
    function onMove(e) {
      if (!interactive) return;
      var p = toLocal(e);
      px = p[0];
      py = p[1];
      wake();
    }
    function onLeave() {
      px = -1e5;
      py = -1e5;
      wake();
    }
    function onDown(e) {
      if (!interactive || reduced) return;
      if (e.target.closest('a,button')) return;
      var p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    }

    layout();
    draw(performance.now());
    wake();

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    var ro = new ResizeObserver(function () {
      layout();
      wake();
    });
    ro.observe(root);
    var io = new IntersectionObserver(function (entries) {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);
    // A web font that lands late re-sets the word in its real face.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        layout();
        wake();
      });
    }

    var up = root.querySelector('.hwf-up');
    if (up) {
      up.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
