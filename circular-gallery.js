/* ============================================================
   CIRCULAR GALLERY — interactive 3D rotating project ring
   Recreated from the 21st.dev circular-gallery concept in
   vanilla JS (this site is static HTML/CSS/JS, not React).

   8 project cards arranged on a 3D ring (rotateY + translateZ).
   This IS the projects section (the old static list was removed).

   Fixes (16 Oct 2026):
   - CLICKABLE: pointer capture is only taken once a REAL drag
     (>8px) begins. Plain taps never capture the pointer, so
     click events reach the Live/GitHub <a> elements normally.
   - FULL VISIBILITY: ring radius + stage perspective are tuned
     and the card scale compensates the 3D magnification
     (P/(P-r)) so the front card is NEVER clipped by the stage.
   - FULL INFO: every card carries the complete project write-up
     (image, number, title, stack, full description, Live + GitHub
     links) with an expandable "Read more" toggle.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('cg-stage');
  var ring = document.getElementById('cg-ring');
  var dotsWrap = document.getElementById('cg-dots');
  if (!stage || !ring) return;

  /* ---------- project data (full write-ups from the projects section) ---------- */
  var PROJECTS = [
    {
      n: '01', title: 'Trishul — Asset & Maintenance Management',
      stack: 'React 19, Vite, Tailwind, Framer Motion, Node.js, Express, SQLite, Docker',
      desc: 'Full-stack asset and maintenance tracking system developed for workshop operations. Features role-based navigation, QR-based workflow audits, interactive analytics dashboards, database migrations with Drizzle ORM, and secure containerized Docker deployment.',
      img: 'assets/trishul-1.png', alt: 'Trishul 510 Army Base Workshop Portal',
      live: 'https://trishul-eight.vercel.app/admin/analytics',
      repo: 'https://github.com/ayushi0618/kavach-'
    },
    {
      n: '02', title: 'DSA Daily Coach — Interactive Algo Platform',
      stack: 'React.js, TypeScript, Vite, Tailwind CSS, Gemini 2.5, Lucide React',
      desc: 'A comprehensive, interactive platform for mastering Data Structures and Algorithms. Features an interactive problem library filtered by companies/topics, split-pane coding workspace, AI DSA Socratic Tutor (Gemini 2.5), step-by-step animated visual lectures, and gamified progress tracking with mastery badges and streaks.',
      img: 'assets/dsacoach-1.png', alt: 'DSA Daily Coach Profile & Mastery Badges',
      live: 'https://dsa-daily-coach.vercel.app/',
      repo: 'https://github.com/ayushi0618/DSA-daily-coach-'
    },
    {
      n: '03', title: 'Food for Mood — AI-Powered Culinary Recommender',
      stack: 'Node.js, Express.js, Python, MongoDB, Gemini API, WebSockets',
      desc: 'Full-stack AI-driven recipe and meal recommendation platform tailoring dishes to real-time moods, emotions, and cravings. Features real-time notifications with WebSockets, recommendation history analysis, cart and order tracking, and Gemini AI evaluation pipelines.',
      img: 'assets/foodformood-1.png', alt: 'Food for Mood Landing Page with Curated Recipes',
      live: 'https://food-for-mood-v2.vercel.app/',
      repo: 'https://github.com/ayushi0618/food-for-mood-v2'
    },
    {
      n: '04', title: 'Cyber Scanner — Code Vulnerability Auditor',
      stack: 'Python, AST Security Parsing, Node.js, Render Cloud, Security Standards',
      desc: 'Automated code security vulnerability analyzer designed to protect systems from threats. Supports multi-file/folder uploads, AST token analysis for detecting SQL injections and security flaws, real-time scanning analytics, and historical threat logs.',
      img: 'assets/cyberscanner-2.png', alt: 'CyberScanner Threat Detection Overview & Features',
      live: 'https://cyber-scanner.onrender.com/',
      repo: 'https://github.com/ayushi0618/cyber_scanner'
    },
    {
      n: '05', title: 'SnapSplit — Automated Receipt Bill Splitter',
      stack: 'Google Cloud Vision API, Gemini OCR, Supabase, React, PostgreSQL (WIP)',
      desc: 'Smart bill splitting tool utilizing Google Cloud Vision OCR and Gemini pipeline to parse complex restaurant receipts, calculate itemized tax/tip allocations, and instantly sync multi-person expense ledgers into Supabase PostgreSQL. Features instant item breakdown and live settlement tracking.',
      img: 'assets/snapsplit-1.png', alt: 'SnapSplit OCR Receipt Extractor & Multi-Friend Split Engine',
      live: null,
      repo: 'https://github.com/ayushi0618/SnapSplit'
    },
    {
      n: '06', title: 'Multi-Channel Customer Behaviour & Marketing Intelligence',
      stack: 'Data Analytics, Python, SQL, Pandas, Scikit-learn, Tableau (WIP)',
      desc: 'End-to-end data analytics platform aggregating user touchpoints across web, email, and social ad funnels. Performs RFM customer segmentation, predictive lifetime value (CLV) scoring, and conversion anomaly detection for strategic marketing optimization.',
      img: 'assets/marketing-1.png', alt: 'OmniChannel Intelligence & RFM Segmentation Dashboard',
      live: null,
      repo: 'https://github.com/ayushi0618'
    },
    {
      n: '07', title: 'BondPoints.ai — AI-Assisted Social Relationship Tracker',
      stack: 'Node.js, Express, MongoDB Atlas, JWT, Render Cloud',
      desc: 'An AI-assisted social relationship tracker — create personal Bonds with friends, family, or partners, track interaction streaks and shared goals, and earn rewards for meaningful connections. Built on Node.js/Express with MongoDB Atlas, secure JWT authentication, and a rewards dashboard aggregating points per bond.',
      img: 'assets/bondpoints-1.png', alt: 'BondPoints.ai relationship tracker landing',
      live: 'https://bondpoints-ai-1.onrender.com/',
      repo: 'https://github.com/ayushi0618/BondPoints.ai'
    },
    {
      n: '08', title: 'BharatMandi — Agricultural Commodity Price Intelligence',
      stack: 'Python, FastAPI, SQL, React, Recharts, Open Government Data (Agmarknet)',
      desc: 'An indigenous Indian agri-fintech analytics portal tracking wholesale mandi commodity rates across UP and NCR districts. Provides local farmers and traders with real-time price trend alerts, seasonal forecasting, and bilingual mandi comparisons.',
      img: 'assets/bharatmandi-1.png', alt: 'BharatMandi Commodity Rates & Price Forecast Dashboard',
      live: null,
      repo: 'https://github.com/ayushi0618'
    }
  ];

  var N = PROJECTS.length;
  var STEP = 360 / N;
  var DRAG_THRESHOLD = 8; // px — only beyond this do we treat it as a drag

  /* ---------- geometry: radius + perspective tuned so the front card
     is never clipped. card scale compensates the 3D magnification
     mag = persp / (persp - radius). ---------- */
  var radius = 380, persp = 2200, cardW = 300;

  function computeGeometry() {
    var w = stage.clientWidth || 1200;
    if (w < 640) { radius = 280; persp = 1300; cardW = 240; }
    else { radius = 380; persp = 2200; cardW = 300; }
    stage.style.perspective = persp + 'px';
    return cardW;
  }
  function magFactor() { return persp / (persp - radius); }

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
        '<div class="cg-links">' + links +
          '<button type="button" class="cg-more" aria-expanded="false">Read more ▾</button>' +
        '</div>' +
      '</div>';
    ring.appendChild(el);
    cards.push(el);

    el.querySelector('.cg-more').addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = el.classList.toggle('cg-expanded');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.textContent = open ? 'Show less ▴' : 'Read more ▾';
    });

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
  var armed = false, dragging = false, dragMoved = 0, startX = 0, lastX = 0;
  var activePointerId = null;
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

  /* ---------- drag to spin (capture only on REAL drags) ---------- */
  stage.addEventListener('pointerdown', function (e) {
    dragMoved = 0; // always reset: a stale value could eat a plain link click
    // don't arm drags that start on interactive controls
    if (e.target.closest('a, button')) { armed = false; return; }
    armed = true; dragging = false;
    startX = e.clientX; lastX = e.clientX;
    activePointerId = e.pointerId;
  });
  stage.addEventListener('pointermove', function (e) {
    if (!armed || e.pointerId !== activePointerId) return;
    var dx = e.clientX - lastX;
    lastX = e.clientX;
    dragMoved += Math.abs(dx);
    if (!dragging && Math.abs(e.clientX - startX) > DRAG_THRESHOLD) {
      dragging = true;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      stage.classList.add('cg-dragging');
      userHoldUntil = performance.now() + 4000;
    }
    if (dragging) target += dx * 0.25;
  });
  function endDrag(e) {
    if (!armed && !dragging) return;
    if (dragging && e && e.pointerId === activePointerId) {
      try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    armed = false; dragging = false;
    stage.classList.remove('cg-dragging');
    // snap to the nearest card
    var idx = activeIndex();
    var want = -idx * STEP;
    var delta = ((want - target) % 360 + 540) % 360 - 180;
    target += delta;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  // safety net: suppress clicks only when the user actually dragged
  ring.addEventListener('click', function (e) {
    if (dragMoved > DRAG_THRESHOLD) { e.preventDefault(); e.stopPropagation(); }
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
    var mag = magFactor();
    for (var i = 0; i < N; i++) {
      var ang = i * STEP + current;
      var rel = ((ang % 360) + 360) % 360;
      var facing = Math.cos(rel * Math.PI / 180); // 1 = front, -1 = back
      var bright = 0.42 + 0.58 * Math.max(0, facing);
      // compensate 3D magnification so the front card is exactly card-sized
      var scale = ((i === act ? 1.06 : 1) / mag);
      var card = cards[i];
      card.style.transform =
        'rotateY(' + ang + 'deg) translateZ(' + radius + 'px) scale(' + scale.toFixed(4) + ')';
      card.style.opacity = (0.45 + 0.55 * Math.max(0, facing)).toFixed(3);
      card.style.filter = 'brightness(' + bright.toFixed(3) + ')';
      card.style.zIndex = i === act ? 10 : 1;
      card.classList.toggle('cg-active', i === act);
      dots[i].classList.toggle('cg-dot-active', i === act);
    }
    requestAnimationFrame(render);
  }

  /* ---------- resize ---------- */
  function onResize() {
    var cw = computeGeometry();
    for (var i = 0; i < N; i++) {
      cards[i].style.setProperty('--cg-card-w', cw + 'px');
    }
  }
  window.addEventListener('resize', onResize);
  onResize();
  requestAnimationFrame(render);
})();
