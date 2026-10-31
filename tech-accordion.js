/* Tech Arsenal accordion — single active panel, hover/click/focus to
   expand. Mirrors the reference image accordion's activeIndex state;
   the last panel (Data Analytics & BI) starts active. */
(function () {
  'use strict';

  function init() {
    var panels = document.querySelectorAll('[data-ta-panel]');
    if (!panels.length) return;
    function activate(panel) {
      panels.forEach(function (p) { p.classList.remove('ta-active'); });
      panel.classList.add('ta-active');
    }
    panels.forEach(function (panel) {
      panel.addEventListener('mouseenter', function () { activate(panel); });
      panel.addEventListener('click', function () { activate(panel); });
      panel.addEventListener('focus', function () { activate(panel); });
      panel.setAttribute('tabindex', '0');
      panel.setAttribute('role', 'button');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
