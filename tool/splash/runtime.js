(function () {
  var splash = document.getElementById('qp-splash');
  if (!splash) return;
  var logo = document.getElementById('qp-logo');
  var video = document.getElementById('qp-video');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD_MS = 800; // finished logo stays centred so users can read it
  var animDone = false;
  var flutterReady = false;
  var ending = false;

  // The video is decoded off the main thread, so it stays smooth while Flutter boots.
  // Its last frame is the static logo below, which we swap in for the hand-off.
  function finishAnim() {
    if (animDone) return;
    animDone = true;
    splash.classList.add('qp-static');
    if (video) video.pause();
    setTimeout(function () { holdDone = true; tryEnd(); }, reduce ? 0 : HOLD_MS);
  }
  var holdDone = false;

  if (reduce || !video) {
    finishAnim();
  } else {
    video.addEventListener('ended', finishAnim);
    var sources = video.querySelectorAll('source');
    if (sources.length) sources[sources.length - 1].addEventListener('error', finishAnim);
    var played = video.play();
    if (played && played.catch) played.catch(finishAnim); // autoplay blocked
    setTimeout(finishAnim, 9000); // video stalled: never block the app on it
  }

  window.addEventListener('flutter-first-frame', function () {
    flutterReady = true;
    tryEnd();
  }, { once: true });

  // Click to skip: jump to the final frame, hand off once Flutter is up.
  splash.addEventListener('click', function () { holdDone = true; finishAnim(); tryEnd(); });

  // Flutter slow to boot: hold the logo with a pulse, never remove early.
  setTimeout(function () {
    if (!ending) splash.classList.add('qp-wait');
  }, 15000);

  function tryEnd() {
    if (ending || !flutterReady || !holdDone) return;
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
