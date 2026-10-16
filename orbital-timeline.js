/* ===== RADIAL ORBITAL TIMELINE (vanilla recreation of 21st.dev radial-orbital-timeline) =====
   Nodes orbit a central hub on a gentle ring; activating a node reveals its milestone card.
   Data is verified from index.html content — no invented roles. */
(function () {
  'use strict';

  var MILESTONES = [
    {
      icon: '🎓',
      title: 'B.Tech, Computer Science Engineering',
      org: 'Babu Banarasi Das Institute of Technology (affiliated to Dr. A.P.J. Abdul Kalam Technical University)',
      date: '2023 — 2027',
      status: 'in-progress',
      desc: 'CGPA 8.0/10. Core CS foundation: DSA (150+ LeetCode), DBMS, Operating Systems, Computer Networks, OOP.'
    },
    {
      icon: '🏆',
      title: 'Smart India Hackathon — Internal Winner',
      org: 'University-level hackathon',
      date: '2026',
      status: 'completed',
      desc: 'Won the internal Smart India Hackathon round with a full-stack product built under time pressure.'
    },
    {
      icon: '🎬',
      title: '"Code Like Lily" YouTube Channel',
      org: 'YouTube • @liliescodes',
      date: 'Oct 2026 — Present',
      status: 'in-progress',
      desc: 'Animated coding explainers and interview-prep content — DSA visualized, AI topics, and build-in-public dev journey.'
    },
    {
      icon: '🎯',
      title: 'Open to SDE Roles',
      org: 'New-grad / entry-level',
      date: 'Graduating 2027',
      status: 'upcoming',
      desc: 'Looking for full-stack / software engineering roles where I can ship production systems from day one.'
    }
  ];

  var STATUS_LABEL = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'upcoming': 'Upcoming'
  };

  var SECTION_ID = 'journey';

  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  // Short caption for the node badge: first 4-digit year found, else first word.
  function shortYear(date) {
    var m = date.match(/\b(19|20)\d{2}\b/);
    return m ? m[0] : date.split(' ')[0];
  }

  function init() {
    if (document.getElementById(SECTION_ID)) return; // already built

    var about = document.getElementById('about');
    var section = el('section');
    section.className = 'journey';
    section.id = SECTION_ID;
    section.setAttribute('aria-label', 'Career journey timeline');

    var inner = el('div', 'journey-inner');
    inner.appendChild(el('h2', 'chrome-text reveal', 'MY JOURNEY'));
    inner.appendChild(el('p', 'journey-sub reveal delay-1',
      'Four milestones, one orbit — hover or tap a node to see the story.'));

    /* ---- desktop orbital stage ---- */
    var stage = el('div', 'orbital-stage reveal delay-2');
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', 'Orbital journey timeline');

    var orbitRing = el('div', 'orbital-ring'); // visual ring
    stage.appendChild(orbitRing);

    var spinner = el('div', 'orbital-spinner');
    stage.appendChild(spinner);

    var hub = el('div', 'orbital-hub', '<span aria-hidden="true">✦</span><span class="orbital-hub-label">Journey</span>');
    stage.appendChild(hub);

    var nodes = [];
    var n = MILESTONES.length;
    MILESTONES.forEach(function (m, i) {
      // Chronological order: start at top (-90deg), go clockwise.
      var angle = -90 + (360 / n) * i;
      var btn = el('button', 'orbital-node orbital-node--' + m.status);
      btn.type = 'button';
      btn.setAttribute('aria-label', m.title + ', ' + m.date + ', ' + STATUS_LABEL[m.status]);
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.setAttribute('data-index', String(i));
      btn.innerHTML = '<span class="orbital-node-icon" aria-hidden="true">' + m.icon + '</span>' +
        '<span class="orbital-node-year" aria-hidden="true">' + shortYear(m.date) + '</span>';
      // The slot is a static anchor at the ring's start angle (see CSS); the
      // spinner carries it around the orbit while the node counter-rotates
      // (independent `rotate` property) to stay upright. --orbit-r (radius)
      // is defined in CSS.
      var wrapper = el('span', 'orbital-slot');
      wrapper.style.setProperty('--start', angle + 'deg');
      wrapper.appendChild(btn);
      spinner.appendChild(wrapper);
      nodes.push(btn);
    });

    /* ---- detail card ---- */
    var card = el('article', 'orbital-card');
    card.setAttribute('aria-live', 'polite');
    inner.appendChild(stage);

    function renderCard(i) {
      var m = MILESTONES[i];
      card.innerHTML =
        '<span class="orbital-card-status orbital-card-status--' + m.status + '">' +
        (m.status === 'completed' ? '✓ ' : m.status === 'in-progress' ? '● ' : '○ ') +
        STATUS_LABEL[m.status] + '</span>' +
        '<h3>' + m.title + '</h3>' +
        '<p class="orbital-card-org">' + m.org + '</p>' +
        '<p class="orbital-card-date">' + m.date + '</p>' +
        '<p class="orbital-card-desc">' + m.desc + '</p>';
    }

    function select(i, focusCard) {
      nodes.forEach(function (b, j) {
        b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
        b.classList.toggle('is-active', j === i);
      });
      renderCard(i);
      // flash the card so activation is unmistakable
      card.classList.remove('orbital-card-flash');
      void card.offsetWidth;
      card.classList.add('orbital-card-flash');
      if (focusCard) card.focus();
    }

    nodes.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i, false); });
      b.addEventListener('mouseenter', function () { select(i, false); });
      b.addEventListener('focus', function () { select(i, false); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          var ni = (i + 1) % nodes.length;
          nodes[ni].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          var pi = (i - 1 + nodes.length) % nodes.length;
          nodes[pi].focus();
        }
      });
    });

    card.tabIndex = -1;
    card.className += ' reveal delay-3';
    inner.appendChild(card);

    /* ---- mobile fallback list (same data) ---- */
    var list = el('ul', 'orbital-list');
    MILESTONES.forEach(function (m) {
      var li = el('li', 'orbital-list-item orbital-list-item--' + m.status);
      li.innerHTML =
        '<span class="orbital-list-icon" aria-hidden="true">' + m.icon + '</span>' +
        '<div><span class="orbital-card-status orbital-card-status--' + m.status + '">' +
        (m.status === 'completed' ? '✓ ' : m.status === 'in-progress' ? '● ' : '○ ') +
        STATUS_LABEL[m.status] + '</span>' +
        '<h3>' + m.title + '</h3>' +
        '<p class="orbital-list-meta">' + m.org + ' • ' + m.date + '</p>' +
        '<p class="orbital-list-desc">' + m.desc + '</p></div>';
      list.appendChild(li);
    });
    inner.appendChild(list);

    section.appendChild(inner);

    // Insert right after the About section, before Services.
    var anchor = about && about.nextElementSibling;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor);
    } else if (about) {
      about.parentNode.insertBefore(section, about.nextSibling);
    } else {
      document.body.insertBefore(section, document.body.firstChild);
    }

    select(0, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
