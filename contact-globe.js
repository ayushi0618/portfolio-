// Animated wireframe globe for the contact section (Contact with Globe style, built from scratch).
// Pure canvas: rotating meridians + flattened parallels. Pauses off-screen and for reduced motion.
(function () {
  var canvas = document.getElementById('contact-globe');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 14;
  var rot = 0.6;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.stroke();
    for (var i = 0; i < 12; i++) {
      var a = rot + (i * Math.PI) / 12;
      var rx = Math.max(1, R * Math.abs(Math.cos(a)));
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2);
      ctx.strokeStyle = Math.cos(a) >= 0 ? 'rgba(0, 0, 0, 0.30)' : 'rgba(0, 0, 0, 0.10)';
      ctx.stroke();
    }
    [-60, -30, 0, 30, 60].forEach(function (deg) {
      var lat = (deg * Math.PI) / 180;
      var y = cy + R * Math.sin(lat);
      var rx = R * Math.cos(lat);
      ctx.beginPath();
      ctx.ellipse(cx, y, rx, Math.max(1, rx * 0.30), 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.stroke();
    });
  }

  function frame() {
    if (visible && !reduced) {
      rot += 0.0035;
      draw();
      requestAnimationFrame(frame);
    }
  }

  draw();
  if (!reduced) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) requestAnimationFrame(frame);
      }).observe(canvas);
    }
    requestAnimationFrame(frame);
  }
})();
