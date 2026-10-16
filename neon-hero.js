/* ===== LIQUID NEON SHADER — hero background (SDF metaballs) =====
   True liquid-neon look: 7 glowing neon blobs defined by signed distance
   functions, smooth-min blended so they visibly MERGE and SEPARATE as they
   drift. Bright core -> crystal rim highlight -> colored glow falloff -> black.
   Brand palette: purple #a855f7, pink #ec4899, orange #f97316 on pure black.
   WebGL2 (#version 300 es) preferred; GLSL ES 1.00 fallback for plain WebGL.
   Ambient only: vignette + center scrim keep the hero text readable.
   Falls back to a 2D canvas blob field when WebGL is unavailable, and to a
   static CSS gradient when the user prefers reduced motion. */
(function () {
  'use strict';

  /* Shared SDF-metaball body. OUTC is the output target: `O` under WebGL2
     (declared in the header) or gl_FragColor under WebGL1 via macro. */
  var FRAG_BODY = [
    'uniform vec2 u_res;',
    'uniform float u_time;',
    '',
    '#define NB 7',
    '',
    'float smin(float a, float b, float k){',
    '  float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0);',
    '  return mix(b, a, h) - k*h*(1.0 - h);',
    '}',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;',
    '  float t = u_time * 0.14;',
    '',
    '  vec3 cols[NB];',
    '  cols[0] = vec3(0.659, 0.333, 0.969);', // #a855f7 purple
    '  cols[1] = vec3(0.925, 0.286, 0.600);', // #ec4899 pink
    '  cols[2] = vec3(0.976, 0.451, 0.086);', // #f97316 orange
    '  cols[3] = vec3(0.659, 0.333, 0.969);',
    '  cols[4] = vec3(0.925, 0.286, 0.600);',
    '  cols[5] = vec3(0.976, 0.451, 0.086);',
    '  cols[6] = vec3(0.545, 0.361, 0.965);',
    '',
    '  float d = 100000.0;',
    '  vec3 bcol = vec3(0.0);',
    '  float bw = 0.0;',
    '  for (int i = 0; i < NB; i++) {',
    '    float fi = float(i);',
    '    float px = 0.60 * sin(t*(0.21 + 0.031*fi) + 1.7*fi);',
    '    float py = 0.36 * sin(t*(0.17 + 0.043*fi) + 2.3*fi + 1.1);',
    '    float r  = 0.16 + 0.028*fi + 0.030*sin(t*(0.50 + 0.11*fi) + 3.1*fi);',
    '    float di = length(uv - vec2(px, py)) - r;',
    '    d = smin(d, di, 0.16);',                // merge / separate smoothly
    '    float w = exp(-6.0 * max(di, 0.0));',    // per-blob color weight
    '    bcol += cols[i] * w;',
    '    bw += w;',
    '  }',
    '  bcol /= max(bw, 0.0001);',
    '',
    '  float core = 1.0 - smoothstep(-0.05, 0.03, d);',       // bright liquid core
    '  float rim  = 1.0 - smoothstep(0.0, 0.045, abs(d));', // crystal edge
    '  float glow = exp(-5.0 * max(d, 0.0));',               // neon falloff
    '',
    '  vec3 col = vec3(0.0);',
    '  col += bcol * core * 1.15;',
    '  col += vec3(1.0, 0.98, 1.0) * pow(rim, 2.0) * 0.85;',
    '  col += bcol * glow * 0.45;',
    '  col += bcol * exp(-1.6 * max(d, 0.0)) * 0.10;', // faint ambient haze
    '',
    '  float vig = 1.0 - smoothstep(0.25, 1.25, length(uv));', // vignette
    '  col *= mix(0.25, 1.0, vig);',
    '  float scrim = 1.0 - smoothstep(0.05, 0.55, abs(uv.y - 0.03));', // text scrim
    '  col *= mix(1.0, 0.55, scrim * 0.8);',
    '',
    '  OUTC = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var FRAG_300 = '#version 300 es\nprecision highp float;\nout vec4 O;\n#define OUTC O\n' + FRAG_BODY;
  var FRAG_100 = 'precision highp float;\n#define OUTC gl_FragColor\n' + FRAG_BODY;

  var VERT_300 = '#version 300 es\nin vec2 a_pos;\nvoid main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';
  var VERT_100 = 'attribute vec2 a_pos;\nvoid main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

  function initGL(canvas) {
    // Prefer WebGL2; fall back to WebGL1 with the GLSL ES 1.00 shader.
    var attempts = [
      { ctx: 'webgl2', vs: VERT_300, fs: FRAG_300 },
      { ctx: 'webgl', vs: VERT_100, fs: FRAG_100 },
      { ctx: 'experimental-webgl', vs: VERT_100, fs: FRAG_100 }
    ];
    for (var a = 0; a < attempts.length; a++) {
      var gl = null;
      try { gl = canvas.getContext(attempts[a].ctx, { antialias: false, alpha: false }); } catch (e) { gl = null; }
      if (!gl) continue;
      var prog = buildProgram(gl, attempts[a].vs, attempts[a].fs);
      if (prog) return makeRenderer(gl, prog);
    }
    return null;
  }

  function buildProgram(gl, vsSrc, fsSrc) {
    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (window.console && console.warn) console.warn('[neon-hero] shader compile failed:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, vsSrc);
    var fs = shader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.console && console.warn) console.warn('[neon-hero] program link failed');
      return null;
    }
    gl.useProgram(prog);
    return prog;
  }

  function makeRenderer(gl, prog) {
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

  /* 2D fallback: slowly drifting neon blobs on pure black */
  function init2D(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var blobs = [];
    var palette = [[168, 85, 247], [236, 72, 153], [249, 115, 22], [168, 85, 247], [236, 72, 153]];
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
        ctx.fillStyle = '#000000';
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
