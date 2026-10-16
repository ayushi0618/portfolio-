/* ============================================================
   CIRCULAR GALLERY — interactive 3D rotating project ring
   Recreated from the 21st.dev circular-gallery concept in
   vanilla JS (this site is static HTML/CSS/JS, not React).

   8 project cards arranged on a 3D ring (rotateY + translateZ):
   - auto-rotates slowly, pauses on hover / while dragging
   - drag horizontally to spin the ring (pointer events)
   - front card brightens and scales up; side cards dim
   - arrows, dots and keyboard arrows navigate; click a dot to
     bring a project to the front
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('cg-stage');
  var ring = document.getElementById('cg-ring');
  var dotsWrap = document.getElementById('cg-dots');
  if (!stage || !ring) return;

  /* ---------- project data (mirrors the projects list below) ---------- */
  var PROJECTS = [
    {
      n: '01', title: 'Trishul — Asset & Maintenance Management',
      stack: 'React 19, Vite, Tailwind, Framer Motion, Node.js, Express, SQLite, Docker',
      desc: 'Full-stack asset & maintenance tracking with QR audits, analytics dashboards and Docker deployment.',
      img: 'assets/trishul-1.png', alt: 'Trishul 510 Army Base Workshop Portal',
      live: 'https://trishul-eight.vercel.app/admin/analytics',
      repo: 'https://github.com/ayushi0618/kavach-'
    },
    {
      n: '02', title: 'DSA Daily Coach — Interactive Algo Platform',
      stack: 'React.js, TypeScript, Vite, Tailwind CSS, Gemini 2.5, Lucide React',
      desc: 'Interactive DSA platform with AI Socratic tutor, animated visual lectures and gamified streaks.',
      img: 'assets/dsacoach-1.png', alt: 'DSA Daily Coach Profile & Mastery Badges',
      live: 'https://dsa-daily-coach.vercel.app/',
      repo: 'https://github.com/ayushi0618/DSA-daily-coach-'
    },
    {
      n: '03', title: 'Food for Mood — AI-Powered Culinary Recommender',
      stack: 'Node.js, Express.js, Python, MongoDB, Gemini API, WebSockets',
      desc: 'AI recipe recommender tailoring dishes to real-time moods with Gemini and WebSockets.',
      img: 'assets/foodformood-1.png', alt: 'Food for Mood Landing Page with Curated Recipes',
      live: 'https://food-for-mood-v2.vercel.app/',
      repo: 'https://github.com/ayushi0618/food-for-mood-v2'
    },
    {
      n: '04', title: 'Cyber Scanner — Code Vulnerability Auditor',
      stack: 'Python, AST Security Parsing, Node.js, Render Cloud, Security Standards',
      desc: 'Automated code vulnerability analyzer with AST parsing, threat logs and real-time analytics.',
      img: 'assets/cyberscanner-2.png', alt: 'CyberScanner Threat Detection Overview & Features',
      live: 'https://cyber-scanner.onrender.com/',
      repo: 'https://github.com/ayushi0618/cyber_scanner'
    },
    {
      n: '05', title: 'SnapSplit — Automated Receipt Bill Splitter',
      stack: 'Google Cloud Vision API, Gemini OCR, Supabase, React, PostgreSQL',
      desc: 'Smart bill splitter using Vision OCR + Gemini to parse receipts and sync expense ledgers.',
      img: 'assets/snapsplit-1.png', alt: 'SnapSplit OCR Receipt Extractor & Multi-Friend Split Engine',
      live: null,
      repo: 'https://github.com/ayushi0618/SnapSplit'
    },
    {
      n: '06', title: 'Multi-Channel Customer Behaviour & Marketing Intelligence',
      stack: 'Data Analytics, Python, SQL, Pandas, Scikit-learn, Tableau',
      desc: 'RFM segmentation, CLV scoring and anomaly detection across marketing funnels.',
      img: 'assets/marketing-1.png', alt: 'OmniChannel Intelligence & RFM Segmentation Dashboard',
      live: null,
      repo: 'https://github.com/ayushi0618'
    },
    {
      n: '07', title: 'BondPoints.ai — AI-Assisted Social Relationship Tracker',
      stack: 'Node.js, Express, MongoDB Atlas, JWT, Render Cloud',
      desc: 'AI-assisted relationship tracker with bonds, streaks, goals and a rewards dashboard.',
      img: 'assets/bondpoints-1.png', alt: 'BondPoints.ai relationship tracker landing',
      live: 'https://bondpoints-ai-1.onrender.com/',
      repo: 'https://github.com/ayushi0618/BondPoints.ai'
    },
    {
      n: '08', title: 'BharatMandi — Agricultural Commodity Price Intelligence',
      stack: 'Python, FastAPI, SQL, React, Recharts, Open Government Data (Agmarknet)',
      desc: 'Agri-fintech portal tracking mandi commodity rates with forecasts for UP & NCR.',
      img: 'assets/bharatmandi-1.png', alt: 'BharatMandi Commodity Rates & Price Forecast Dashboard',
      live: null,
      repo: 'https://github.com/ayushi0618'
    }
  ];

  var N = PROJECTS.length;
  var STEP = 360 / N;
  var radius = 460;

  function computeRadius() {
    var w = stage.clientWidth || 1200;
    var cardW = w < 640 ? 240 : 300;
    radius = Math.max(260, Math.min(520, w * 0.40));
    return cardW;
  }

  /* ---------- build cards ---------- */
  var cards = [];
  PROJECTS.forEach(function (p, i) {
    var el = document.createElement('article');
    el.className = 'cg-card';
    el.setAttribute('aria-label', p.title);

    var links = '';
    if (p.live) links += '<a href="' + p.live + '" target="_blank" rel="noopener noreferrer" class="cg-link">Live ↗</a>';
    links += '<a href="' + p.repo + '" target="_blank" rel="noopener noreferrer" class="cg-link">GitHub ↗</a>';

    el.innerHTML =
      '<div class="cg-img-wrap"><img src="' + p.img + '" alt="' + p.alt + '" loading="lazy" draggable="false"></div>' +
      '<div class="cg-body">' +
        '<span class="cg-num">' + p.n + '</span>' +
        '<h3 class="cg-title">' + p.title + '</h3>' +
        '<p class="cg-stack">' + p.stack + '</p>' +
        '<p class="cg-desc">' + p.desc + '</p>' +
        '<div class="cg-links">' + links + '</div>' +
      '</div>';
    ring.appendChild(el);
    cards.push(el);

    var dot = document.createElement('button');
    dot.className = 'cg-dot';
    dot.setAttribute('aria-label', 'Show project ' + p.n + ': ' + p.title);
    dot.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  /* ---------- rotation state ---------- */
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0, target = 0;
  var dragging = false, dragMoved = 0, lastX = 0;
  var hovering = false, userHoldUntil = 0;

  function activeIndex() {
    var idx = Math.round(-current / STEP) % N;
    return (idx + N) % N;
  }

  function goTo(i) {
    // rotate the ring so card i comes to the front, taking the shortest path
    var want = -i * STEP;
    var delta = ((want - target) % 360 + 540) % 360 - 180;
    target += delta;
    userHoldUntil = performance.now() + 4000;
  }

  function step(dir) { goTo((activeIndex() + dir + N) % N); }

  document.getElementById('cg-prev').addEventListener('click', function () { step(-1); });
  document.getElementById('cg-next').addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    // only hijack arrows when the gallery is on screen
    var r = stage.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) {
      step(e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  /* ---------- drag to spin ---------- */
  stage.addEventListener('pointerdown', function (e) {
    dragging = true; dragMoved = 0; lastX = e.clientX;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('cg-dragging');
    userHoldUntil = performance.now() + 4000;
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX;
    lastX = e.clientX;
    dragMoved += Math.abs(dx);
    target += dx * 0.25;
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('cg-dragging');
    // snap to the nearest card
    var idx = activeIndex();
    var want = -idx * STEP;
    var delta = ((want - target) % 360 + 540) % 360 - 180;
    target += delta;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  // let link clicks work: suppress them only when the user actually dragged
  ring.addEventListener('click', function (e) {
    if (dragMoved > 8) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  stage.addEventListener('mouseenter', function () { hovering = true; });
  stage.addEventListener('mouseleave', function () { hovering = false; });
  stage.addEventListener('focusin', function () { hovering = true; });
  stage.addEventListener('focusout', function () { hovering = false; });

  /* ---------- render loop ---------- */
  function render() {
    var now = performance.now();
    if (!reduceMotion && !dragging && !hovering && now > userHoldUntil) {
      target += 0.14; // gentle auto-rotation
    }
    current += (target - current) * 0.085;

    var act = activeIndex();
    for (var i = 0; i < N; i++) {
      var ang = i * STEP + current;
      var rel = ((ang % 360) + 360) % 360;
      var facing = Math.cos(rel * Math.PI / 180); // 1 = front, -1 = back
      var bright = 0.42 + 0.58 * Math.max(0, facing);
      var scale = i === act ? 1.06 : 1;
      var card = cards[i];
      card.style.transform =
        'rotateY(' + ang + 'deg) translateZ(' + radius + 'px) scale(' + scale + ')';
      card.style.opacity = (0.45 + 0.55 * Math.max(0, facing)).toFixed(3);
      card.style.filter = 'brightness(' + bright.toFixed(3) + ')';
      card.classList.toggle('cg-active', i === act);
      dots[i].classList.toggle('cg-dot-active', i === act);
    }
    requestAnimationFrame(render);
  }

  /* ---------- resize ---------- */
  function onResize() {
    var cardW = computeRadius();
    for (var i = 0; i < N; i++) {
      cards[i].style.setProperty('--cg-card-w', cardW + 'px');
    }
  }
  window.addEventListener('resize', onResize);
  onResize();
  requestAnimationFrame(render);
})();
