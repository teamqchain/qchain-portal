(function () {
  var splash = document.getElementById('qp-splash');
  if (!splash) return;
  var logo = document.getElementById('qp-logo');
  var start = performance.now();
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var minMs = reduce ? 0 : 4000; // timeline must reach phase 6
  var flutterReady = false;
  var ending = false;

  if (reduce) splash.classList.add('qp-static');
  else trails();

  window.addEventListener('flutter-first-frame', function () {
    flutterReady = true;
    tryEnd();
  }, { once: true });

  // Click to skip: jump to the final frame, hand off once Flutter is up.
  splash.addEventListener('click', function () {
    minMs = 0;
    splash.classList.add('qp-static');
    tryEnd();
  });

  setTimeout(tryEnd, minMs);

  // Flutter slow to boot: hold the logo with a pulse, never remove early.
  setTimeout(function () {
    if (!ending) splash.classList.add('qp-wait');
  }, 15000);

  // Phases 1-2: the globe sits still in the centre. Two white trails fly in
  // from opposite sides and circle it on the logo's two orbit ellipses, like
  // electrons around an atom, then slow down and close into the full orbits.
  // Coordinates are the logo SVG's inner group units.
  function trails() {
    var canvas = document.getElementById('qp-trails');
    var svg = logo.querySelector('svg');
    var ctx = canvas.getContext('2d');
    var OX = 543.71876, OY = -640.02708, VB = 95.597107;
    // Globe (ball): fades in as the trails reach the middle; must match #qp-globe in splash.css.
    var G_X = 563.55, G_Y = -624.998, G_R = 10.9, G_START = 0.85, G_DUR = 0.6;
    var T_START = 0.3, T_FLY = 1.0, T_SETTLE = 1.9, T_END = 2.4, T_FADE = 2.4, T_GONE = 2.52;
    // Orbit ellipses fitted from the SVG outlines. side: start angle on the ellipse.
    var LINES = [
      { side: Math.PI, w: 0.85, cx: 562.638, cy: -624.178, rx: 22.535, ry: 5.627, rot: 40.45 },
      { side: 0,       w: 0.85, cx: 565.642, cy: -623.76,  rx: 19.899, ry: 5.459, rot: -30.95 }
    ];
    var outQuint = function (u) { return 1 - Math.pow(1 - u, 5); };
    var inOut = function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
    var clamp = function (u) { return u < 0 ? 0 : u > 1 ? 1 : u; };
    var lerp = function (a, b, u) { return a + (b - a) * u; };

    // Head angle phi(t): steady orbit speed, then eases to a stop at T_END.
    var DT = 0.002, W = 8, phiTab = [0];
    for (var t = DT; t <= T_GONE + DT; t += DT) {
      var w = t < T_SETTLE ? W : W * Math.pow(1 - clamp((t - T_SETTLE) / (T_END - T_SETTLE)), 2);
      phiTab.push(phiTab[phiTab.length - 1] + (t > T_START ? w * DT : 0));
    }
    var phi = function (t) { return phiTab[Math.min(phiTab.length - 1, Math.max(0, Math.round(t / DT)))]; };
    // Time at which the head passed angle offset a (inverse of phi).
    var timeAt = function (a) {
      var lo = 0, hi = phiTab.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (phiTab[mid] < a) lo = mid + 1; else hi = mid; }
      if (lo === 0) return 0;
      var p0 = phiTab[lo - 1], p1 = phiTab[lo];
      return (lo - 1 + (p1 > p0 ? clamp((a - p0) / (p1 - p0)) : 1)) * DT; // interpolate: smooth entry curve
    };
    // Trail length in radians: comet tail while orbiting, full ellipse once settled.
    var trailLen = function (t) {
      return lerp(1.8, Math.PI * 2, inOut(clamp((t - T_SETTLE) / (T_END - T_SETTLE))));
    };

    var start = performance.now();
    function frame(now) {
      if (splash.classList.contains('qp-static') || !splash.isConnected) { canvas.remove(); return; }
      var t = (now - start) / 1000;
      if (t > T_GONE) { canvas.remove(); return; }
      var dpr = window.devicePixelRatio || 1;
      var vw = innerWidth, vh = innerHeight;
      if (canvas.width !== Math.round(vw * dpr)) { canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      if (t < T_START) { requestAnimationFrame(frame); return; }

      var box = svg.getBoundingClientRect();
      var k = box.width / VB; // px per unit
      // Scale of the orbit when the head was there: starts past the screen edge.
      var m0 = Math.hypot(vw, vh) / (5 * k) + 1;
      var reach = function (tt) { return lerp(m0, 1, outQuint(clamp((tt - T_START) / (T_FLY - T_START)))); };
      var taper = lerp(1, 0.04, inOut(clamp((t - T_SETTLE) / (T_END - T_SETTLE))));
      var fade = 1 - clamp((t - T_FADE) / (T_GONE - T_FADE));
      var head = phi(t), len = Math.min(trailLen(t), head + 0.001), N = 240, BANDS = 12, per = N / BANDS;
      // Once the ball is in, trails pass behind it: clip out its disc (grows with its scale-in).
      ctx.save();
      if (t > G_START) {
        var g = 0.5 + 0.5 * outQuint(clamp((t - G_START) / G_DUR));
        ctx.beginPath();
        ctx.rect(0, 0, vw, vh);
        ctx.arc(box.left + (G_X - OX) * k, box.top + (G_Y - OY) * k, G_R * k * g, 0, Math.PI * 2);
        ctx.clip('evenodd');
      }
      ctx.strokeStyle = '#fff';
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';

      LINES.forEach(function (L) {
        var r = L.rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), pts = [];
        ctx.lineWidth = Math.max(1, L.w * k);
        for (var j = 0; j <= N; j++) {
          var a = head - len + (len * j) / N; // angle offset travelled by the head
          var m = reach(timeAt(a)), s = L.side + a;
          var ex = L.rx * m * Math.cos(s), ey = L.ry * m * Math.sin(s);
          pts.push([box.left + (L.cx + ex * c - ey * sn - OX) * k, box.top + (L.cy + ex * sn + ey * c - OY) * k]);
        }
        // Alpha bands (one polyline each) so the tail fades without seams.
        for (var b = 0; b < BANDS; b++) {
          var q0 = Math.floor(b * per), q1 = Math.min(N, Math.ceil((b + 1) * per));
          ctx.globalAlpha = fade * Math.min(1, ((b + 1) / BANDS) / taper);
          ctx.beginPath();
          ctx.moveTo(pts[q0][0], pts[q0][1]);
          for (var q = q0 + 1; q <= q1; q++) ctx.lineTo(pts[q][0], pts[q][1]);
          ctx.stroke();
        }
      });
      ctx.restore();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function tryEnd() {
    if (ending || !flutterReady || performance.now() - start < minMs) return;
    ending = true;
    waitForRect(0);
  }

  // The sidebar reports its logo rect in a post-frame callback; give it a moment.
  function waitForRect(tries) {
    var r = window.__qportalLogoRect;
    if (r || tries >= 10) settle(r);
    else setTimeout(function () { waitForRect(tries + 1); }, 50);
  }

  function settle(r) {
    splash.classList.remove('qp-wait');
    splash.classList.add('qp-static');
    var dur = reduce ? 400 : 700;
    var ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
    var anim;

    if (r && r.w > 0 && !reduce) {
      var b = logo.getBoundingClientRect();
      var k = r.w / b.width;
      anim = logo.animate([
        { transform: 'none' },
        { transform: 'translate(' + (r.x - b.left) + 'px,' + (r.y - b.top) + 'px) scale(' + k + ')' }
      ], { duration: dur, easing: ease, fill: 'forwards' });
      // Reveal the dashboard late in the move so the real logo is covered until we land.
      splash.animate([
        { backgroundColor: 'rgba(10,10,10,1)' },
        { backgroundColor: 'rgba(10,10,10,0)' }
      ], { duration: dur * 0.55, delay: dur * 0.45, easing: 'ease-out', fill: 'forwards' });
    } else {
      // Small screens (sidebar in drawer) or reduced motion: just fade out.
      anim = splash.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: reduce ? 400 : 500, easing: 'ease-out', fill: 'forwards' });
    }
    anim.onfinish = function () { splash.remove(); };
  }
})();
