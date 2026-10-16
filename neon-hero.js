/* ===== LIQUID NEON SHADER — hero background (vanilla recreation of the
   21st.dev "liquid-neon-shader" concept) =====
   WebGL fragment-shader liquid plasma in the brand palette
   (purple #8B5CF6 → pink #EC4899 → orange #F97316) on near-black.
   Ambient only: darker at the edges so hero text stays readable.
   Falls back to a 2D canvas blob field when WebGL is unavailable, and to a
   static CSS gradient when the user prefers reduced motion. */
(function () {
  'use strict';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }',
    '  return v;',
    '}',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
    '  float t = u_time * 0.07;',
    '  vec2 p = uv * 1.7;',
    '  vec2 q = vec2(fbm(p + vec2(t, -t * 0.7)), fbm(p + vec2(-t * 0.6, t)));',
    '  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + t * 0.35),',
    '                fbm(p + 2.0 * q + vec2(8.3, 2.8) - t * 0.28));',
    '  float f = fbm(p + 2.5 * r);',
    '  vec3 purple = vec3(0.545, 0.361, 0.965);',
    '  vec3 pink   = vec3(0.925, 0.286, 0.600);',
    '  vec3 orange = vec3(0.976, 0.451, 0.086);',
    '  vec3 neon = mix(purple, pink, smoothstep(0.30, 0.62, r.x));',
    '  neon = mix(neon, orange, smoothstep(0.55, 0.88, r.y));',
    '  float bands = smoothstep(0.32, 0.78, f);',
    '  float line = smoothstep(0.025, 0.0, abs(f - 0.55));',
    '  vec3 col = vec3(0.012, 0.008, 0.030);',
    '  col += neon * (bands * 0.50 + line * 0.85);',
    '  float vig = smoothstep(1.25, 0.20, length(uv));',
    '  col *= mix(0.30, 1.0, vig);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var VERT = [
    'attribute vec2 a_pos;',
    'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  function initGL(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) return null;
    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT);
    var fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return {
      gl: gl,
      uRes: gl.getUniformLocation(prog, 'u_res'),
      uTime: gl.getUniformLocation(prog, 'u_time'),
      draw: function (w, h, t) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(this.uRes, w, h);
        gl.uniform1f(this.uTime, t);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  /* 2D fallback: slowly drifting neon blobs on near-black */
  function init2D(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var blobs = [];
    var palette = [[139, 92, 246], [236, 72, 153], [249, 115, 22], [139, 92, 246], [236, 72, 153]];
    for (var i = 0; i < 7; i++) {
      blobs.push({
        c: palette[i % palette.length],
        x: Math.random(), y: Math.random(),
        r: 0.25 + Math.random() * 0.35,
        sx: 0.0004 + Math.random() * 0.0009,
        sy: 0.0003 + Math.random() * 0.0008,
        ph: Math.random() * Math.PI * 2
      });
    }
    return {
      draw: function (w, h, t) {
        ctx.fillStyle = '#03020a';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          var bx = (b.x + Math.sin(t * b.sx * 60 + b.ph) * 0.18) * w;
          var by = (b.y + Math.cos(t * b.sy * 60 + b.ph) * 0.18) * h;
          var br = b.r * Math.min(w, h);
          var g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          g.addColorStop(0, 'rgba(' + b.c[0] + ',' + b.c[1] + ',' + b.c[2] + ',0.34)');
          g.addColorStop(1, 'rgba(' + b.c[0] + ',' + b.c[1] + ',' + b.c[2] + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  function init() {
    var hero = document.getElementById('hero');
    if (!hero || hero.querySelector('.neon-hero-canvas')) return;

    // Reduced motion: static gradient only, no canvas/loop.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hero.classList.add('neon-static');
      return;
    }

    var canvas = document.createElement('canvas');
    canvas.className = 'neon-hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);

    var renderer = initGL(canvas) || init2D(canvas);
    if (!renderer) { hero.classList.add('neon-static'); canvas.remove(); return; }

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, running = true, rafId = 0;
    var startT = performance.now();

    function resize() {
      var r = hero.getBoundingClientRect();
      w = Math.max(2, Math.floor(r.width * dpr));
      h = Math.max(2, Math.floor(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    resize();
    window.addEventListener('resize', resize);

    function introActive() {
      return document.body.classList.contains('vapour-lock');
    }

    function frame(now) {
      rafId = 0;
      if (!running) return;
      if (!introActive() && !document.hidden) {
        renderer.draw(w, h, (now - startT) / 1000);
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
