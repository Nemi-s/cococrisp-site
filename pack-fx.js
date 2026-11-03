/* CocoCrisp pack hover/tap effect (v7):
   lift -> slow 360 spin (eases around the back so the label can be read, with zoom)
   -> pouch tears open (jagged edge, foil lining) -> real chips tumble out and settle in a pile.
   Pure CSS + Web Animations API, no libraries. Back label text comes from back-label.js. */
(function () {
  if (!('animate' in Element.prototype)) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var VER = '7', NCHIP = 6;
  var TEAR = 9.6;            // % from top of the pouch image where it tears
  var SPIN_DELAY = 250, SPIN_MS = 2750, TEAR_AT = 3000, CHIPS_AT = 3170;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // spin angle profile: slow start, slow drift across the back (180deg), slow finish
  var A = 0.82;
  function angle(u) { return 360 * (u - (A / (4 * Math.PI)) * Math.sin(4 * Math.PI * u)); }
  function easeIO(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  // jagged tear line, shared by body, flap, edge and foil
  function tearPoints() {
    var pts = [], n = 26;
    for (var i = 0; i <= n; i++) {
      var x = i / n * 100, y = TEAR + (i % 2 ? rnd(-0.55, -0.15) : rnd(0.1, 0.5)) + Math.sin(i * 0.9) * 0.18;
      if (i === 0 || i === n) y = TEAR;
      pts.push([x, y]);
    }
    return pts;
  }
  function poly(pts) { return 'polygon(' + pts.map(function (p) { return p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%'; }).join(',') + ')'; }

  var measureCtx = null;
  function measure(t, s, w) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = w + ' ' + s + 'px Jost, system-ui, sans-serif';
    return measureCtx.measureText(t).width;
  }
  function buildLabel(fig, slug) {
    var box = fig.querySelector('.pk-label');
    if (!box || !window.CocoBackLabel) return;
    var r = window.CocoBackLabel.buildBackLabel(slug, { measure: measure });
    box.innerHTML = '<svg viewBox="0 0 1300 ' + Math.ceil(r.height) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Back of pack label">' + r.svg + '</svg>';
  }

  function foilSVG(pts) {
    // foil box covers 4%..13% of pouch height; convert tear pts (back wall edge sits ~2.4% higher)
    var top = 4, h = 9, d = 'M0,100 ';
    pts.forEach(function (p) { d += 'L' + p[0].toFixed(2) + ',' + ((p[1] - 3.4 - top) / h * 100).toFixed(2) + ' '; });
    d += 'L100,100 Z';
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="fl" x1="0" x2="1"><stop offset="0" stop-color="#9a9ea3"/><stop offset=".12" stop-color="#e9ebec"/><stop offset=".27" stop-color="#b5b9bd"/>' +
      '<stop offset=".43" stop-color="#f6f7f7"/><stop offset=".58" stop-color="#a8adb2"/><stop offset=".74" stop-color="#e4e6e8"/><stop offset=".9" stop-color="#bfc3c6"/><stop offset="1" stop-color="#8e9297"/></linearGradient>' +
      '<linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop offset=".08" stop-color="#1b140e" stop-opacity="0"/><stop offset=".4" stop-color="#1b140e" stop-opacity=".5"/><stop offset=".6" stop-color="#0e0906" stop-opacity=".95"/></linearGradient></defs>' +
      '<path d="' + d + '" fill="url(#fl)"/><path d="' + d + '" fill="url(#fd)"/></svg>';
  }
  function edgeSVG(pts) {
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ');
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + d + '" fill="none" stroke="rgba(60,50,40,.35)" stroke-width="1.1" vector-effect="non-scaling-stroke" transform="translate(0,.25)"/>' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
  }

  function setup(fig) {
    var slug = fig.getAttribute('data-fx');
    var card = fig.closest('.prod') || fig.parentNode;
    var lift = fig.querySelector('.pk-lift'), zoom = fig.querySelector('.pk-zoom'), spin = fig.querySelector('.pk-spin'),
        top = fig.querySelector('.pk-top'), body = fig.querySelector('.pk-body'), foil = fig.querySelector('.pk-foil'),
        edge = fig.querySelector('.pk-edge'), floor = fig.querySelector('.pk-floor'), chipsBox = fig.querySelector('.pk-chips');
    var shades = fig.querySelectorAll('.pk-shade'), sheens = fig.querySelectorAll('.pk-sheen');
    var state = { anims: [], chips: [], timers: [], playing: false, token: 0 };

    var pts = tearPoints(), bodyPoly = poly([[0, 100]].concat(pts.map(function (p) { return [p[0], p[1]]; })).concat([[100, 100]]));
    var topPoly = poly([[0, 0], [100, 0]].concat(pts.slice().reverse()));
    body.style.setProperty('--tear', bodyPoly); top.style.clipPath = topPoly; top.style.webkitClipPath = topPoly;
    foil.innerHTML = foilSVG(pts); edge.innerHTML = edgeSVG(pts);
    // masks so light/shade only fall on the pouch
    fig.querySelectorAll('[data-mask]').forEach(function (el) {
      var u = 'url(' + el.getAttribute('data-mask') + ')';
      el.style.webkitMaskImage = u; el.style.maskImage = u;
    });

    // preload chips when the card gets near the viewport
    var chipSrc = [];
    for (var i = 1; i <= NCHIP; i++) chipSrc.push('img/chips/' + slug + '-' + i + '.webp?v=' + VER);
    var loaded = false;
    function preload() { if (loaded) return; loaded = true; chipSrc.forEach(function (s) { var im = new Image(); im.src = s; }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { preload(); io.disconnect(); } }, { rootMargin: '300px' });
      io.observe(fig);
    } else preload();

    function clearAll() {
      state.timers.forEach(clearTimeout); state.timers = [];
      state.anims.forEach(function (a) { a.cancel(); });
      state.chips.forEach(function (c) { c.remove(); });
      state.anims = []; state.chips = [];
    }
    function later(fn, ms) { state.timers.push(setTimeout(fn, ms)); }

    function spinAnims() {
      // viewport-aware zoom so the back label is readable
      var r = lift.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      var w = r.width * 1.09, h = r.height * 1.09;
      var Z = clamp(330 / w, 1.15, 2.4); Z = Math.min(Z, 0.94 * vh / h, 0.96 * vw / w); Z = Math.max(Z, 1);
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2 - r.height * 0.07;
      var dx = 0, dy = 0, hw = w * Z / 2, hh = h * Z / 2;
      if (cy - hh < 10) dy = 10 - (cy - hh); if (cy + hh > vh - 10) dy = (vh - 10) - (cy + hh);
      if (cx - hw < 8) dx = 8 - (cx - hw); if (cx + hw > vw - 8) dx = (vw - 8) - (cx + hw);
      dx /= 1.09; dy /= 1.09;
      var N = 64, kS = [], kZ = [], kSh = [], kSn = [], kF = [];
      for (var i = 0; i <= N; i++) {
        var u = i / N, th = angle(easeIO(u) * 0.12 + u * 0.88), c = Math.cos(th * Math.PI / 180);
        var b = Math.pow(Math.max(0, -c), 1.6), off = u;
        kS.push({ transform: 'rotateY(' + th.toFixed(2) + 'deg)', offset: off });
        var zz = 1 + (Z - 1) * b;  // zoom via layout size (not transform) so text re-rasters crisply
        kZ.push({ left: ((1 - zz) / 2 * 100 + dx * b / r.width * 100).toFixed(3) + '%', top: ((1 - zz) / 2 * 100 + dy * b / r.height * 100).toFixed(3) + '%',
                  width: (zz * 100).toFixed(3) + '%', height: (zz * 100).toFixed(3) + '%', offset: off });
        kSh.push({ opacity: (Math.pow(1 - Math.abs(c), 1.4) * 0.42).toFixed(3), offset: off });
        kSn.push({ backgroundPosition: (130 - (th % 180) / 180 * 160).toFixed(1) + '% 0', offset: off });
        kF.push({ transform: 'translateX(-50%) scale(' + (0.55 + 0.6 * Math.abs(c) + 0.5 * b * (Z - 1) / 1.4).toFixed(3) + ',1.3)', opacity: (0.45 + 0.25 * Math.abs(c)).toFixed(2), offset: off });
      }
      var o = { duration: SPIN_MS, delay: SPIN_DELAY, easing: 'linear', fill: 'both' };
      state.anims.push(spin.animate(kS, o), zoom.animate(kZ, o), floor.animate(kF, o));
      shades.forEach(function (s) { state.anims.push(s.animate(kSh, o)); });
      sheens.forEach(function (s) { state.anims.push(s.animate(kSn, o)); });
    }

    function tear(token) {
      if (token !== state.token) return;
      fig.classList.add('torn');
      state.anims.push(top.animate([
        { transform: 'translate(0,0) rotate(0deg)', offset: 0 },
        { transform: 'translate(0.5%,-1.6%) rotate(-5deg)', offset: 0.35 },
        { transform: 'translate(2.5%,-5.5%) rotate(-14deg)', offset: 0.8 },
        { transform: 'translate(2.2%,-5%) rotate(-12.5deg)', offset: 1 }
      ], { duration: 460, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' }));
      state.anims.push(foil.animate([{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 300, delay: 60, easing: 'ease-out', fill: 'both' }));
      state.anims.push(edge.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'both' }));
    }

    // physics-sampled chip flight: gravity arc, tumble, bounce, settle on the surface
    function launchChips(token) {
      if (token !== state.token) return;
      var fr = fig.getBoundingClientRect(), mr = foil.getBoundingClientRect();
      var W = fr.width, H = fr.height, g = 3.4 * H;  // px/s^2 scaled to card
      var mx = mr.left - fr.left + mr.width / 2, my = mr.top - fr.top + mr.height * 0.62;
      var cxp = (lift.getBoundingClientRect().left - fr.left) + lift.getBoundingClientRect().width / 2;
      var land = [[-0.21, 0.872], [0.19, 0.882], [-0.07, 0.9], [0.07, 0.866], [0.28, 0.905], [-0.01, 0.888]];
      var order = [0, 1, 2, 3, 4, 5].sort(function () { return Math.random() - 0.5; });
      for (var k = 0; k < NCHIP; k++) {
        var idx = order[k], L = land[k];
        var el = document.createElement('div'); el.className = 'pk-chip';
        var im = document.createElement('img'); im.src = chipSrc[idx]; im.alt = ''; im.decoding = 'async'; el.appendChild(im);
        var sh = document.createElement('div'); sh.className = 'pk-cshadow';
        chipsBox.appendChild(sh); chipsBox.appendChild(el); state.chips.push(el, sh);
        var cw = W * rnd(0.2, 0.245), ch = cw * 0.8;
        el.style.width = cw.toFixed(1) + 'px'; el.style.zIndex = String(Math.round(L[1] * 100) + (k === 5 ? 20 : 0));
        sh.style.width = (cw * 0.9).toFixed(1) + 'px'; sh.style.height = (cw * 0.22).toFixed(1) + 'px';
        var x0 = mx + rnd(-0.25, 0.25) * mr.width - cw / 2, y0 = my - ch / 2;
        var ex = clamp(cxp + L[0] * W - cw / 2 + rnd(-0.03, 0.03) * W, -cw * 0.15, W - cw * 0.85);
        var ey = H * L[1] - ch / 2 - (k === 5 ? H * 0.03 : 0);
        var apex = H * rnd(0.17, 0.27), vy = -Math.sqrt(2 * g * apex);
        // time to reach ey: y0 + vy t + g t^2/2 = ey
        var dyv = ey - y0, tf = (-vy + Math.sqrt(vy * vy + 2 * g * dyv)) / g;
        var vx = (ex - x0) / tf;
        var wz = rnd(260, 560) * (Math.random() < 0.5 ? -1 : 1), rz0 = rnd(-40, 40);
        var rxEnd = rnd(24, 40), ryEnd = rnd(-14, 14), rx0 = rnd(-30, 30), ry0 = rnd(-40, 40);
        var turnsX = Math.random() < 0.6 ? 360 : 0, turnsY = Math.random() < 0.4 ? 360 * (Math.random() < 0.5 ? -1 : 1) : 0;
        var bounceH = H * rnd(0.018, 0.03), tb = 2 * Math.sqrt(2 * bounceH / g), slide = vx * 0.12, tSettle = 0.12;
        var total = tf + tb + tSettle, steps = Math.ceil(total * 40), kf = [], ks = [];
        var rzLand = rz0 + wz * tf;
        for (var s = 0; s <= steps; s++) {
          var t = s / steps * total, x, y, rz, rx, ry, sc, sop;
          if (t <= tf) {
            var q = t / tf;
            x = x0 + vx * t; y = y0 + vy * t + g * t * t / 2;
            rz = rz0 + wz * t; rx = rx0 + (rxEnd + turnsX - rx0) * q; ry = ry0 + (ryEnd + turnsY - ry0) * q;
            sc = 0.7 + 0.3 * Math.min(1, q * 1.8);
          } else if (t <= tf + tb) {
            var tt = t - tf, q2 = tt / tb;
            x = ex + slide * q2; y = ey - (Math.sqrt(2 * g * bounceH) * tt - g * tt * tt / 2);
            rz = rzLand + wz * 0.06 * q2; rx = rxEnd + turnsX + Math.sin(q2 * Math.PI) * -12; ry = ryEnd + turnsY; sc = 1;
          } else {
            var q3 = (t - tf - tb) / tSettle;
            x = ex + slide + slide * 0.15 * q3; y = ey + Math.sin(q3 * Math.PI) * -bounceH * 0.12;
            rz = rzLand + wz * 0.06; rx = rxEnd + turnsX; ry = ryEnd + turnsY; sc = 1;
          }
          var hgt = Math.max(0, (ey - y)) / (H * 0.5);
          sop = t < 0.06 ? 0 : clamp(0.55 * (1 - hgt), 0, 0.55);
          kf.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) perspective(500px) rotateZ(' + rz.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')',
                    opacity: t < 0.05 ? (t / 0.05).toFixed(2) : 1, offset: s / steps });
          ks.push({ transform: 'translate(' + (x + cw * 0.05).toFixed(1) + 'px,' + (ey + ch * 0.32).toFixed(1) + 'px) scale(' + (1.4 - 0.4 * (1 - hgt)).toFixed(3) + ')', opacity: sop.toFixed(3), offset: s / steps });
        }
        var opt = { duration: total * 1000, delay: k * 60, easing: 'linear', fill: 'both' };
        state.anims.push(el.animate(kf, opt), sh.animate(ks, opt));
      }
    }

    function play() {
      if (state.playing) return;
      clearAll(); state.playing = true; var token = ++state.token;
      fig.classList.add('lifted'); card.classList.add('fx-on');
      if (reduce) return;
      spinAnims();
      later(function () { tear(token); }, TEAR_AT);
      later(function () { launchChips(token); }, CHIPS_AT);
    }

    function reset() {
      if (!state.playing) return;
      state.playing = false; state.token++;
      state.timers.forEach(clearTimeout); state.timers = [];
      fig.classList.remove('lifted');
      var chips = state.chips; state.chips = [];
      chips.forEach(function (c) {
        var f = c.animate([{ opacity: getComputedStyle(c).opacity }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
        f.onfinish = function () { c.remove(); };
      });
      var anims = state.anims; state.anims = [];
      var pending = 0;
      function done() { if (--pending <= 0 && !state.playing) { fig.classList.remove('torn'); card.classList.remove('fx-on'); } }
      anims.forEach(function (a) {
        var tg = a.effect && a.effect.target;
        if (!tg || tg.classList.contains('pk-chip') || tg.classList.contains('pk-cshadow')) { return; }
        var t = a.currentTime || 0, delay = a.effect.getTiming().delay || 0;
        if (t <= delay) { a.cancel(); return; }
        pending++;
        a.updatePlaybackRate(tg === spin || tg === zoom || tg === floor || tg.classList.contains('pk-shade') || tg.classList.contains('pk-sheen') ? -3.2 : -2.2);
        a.onfinish = function () { a.cancel(); done(); };
        state.anims.push(a);
      });
      if (!pending) { pending = 1; setTimeout(done, 450); }
    }

    // mouse / pen hover
    fig.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') play(); });
    fig.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') reset(); });
    // touch: tap toggles
    var lastType = '';
    fig.addEventListener('pointerdown', function (e) { lastType = e.pointerType; });
    fig.addEventListener('click', function () {
      if (lastType !== 'touch') return;
      if (state.playing) reset(); else { document.querySelectorAll('figure.pack').forEach(function (f) { if (f !== fig && f._fx) f._fx.reset(); }); play(); }
    });
    // keyboard
    fig.addEventListener('focus', function () { if (lastType !== 'touch') play(); });
    fig.addEventListener('blur', reset);
    fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (state.playing) reset(); play(); } });
    fig._fx = { play: play, reset: reset };

    var build = function () { buildLabel(fig, slug); };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('400 40px Jost'), document.fonts.load('600 40px Jost')]).then(build, build);
    } else build();
  }

  // tap outside resets on touch devices
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    document.querySelectorAll('figure.pack').forEach(function (f) { if (!f.contains(e.target) && f._fx) f._fx.reset(); });
  }, { passive: true });

  document.querySelectorAll('figure.pack[data-fx]').forEach(setup);
})();
