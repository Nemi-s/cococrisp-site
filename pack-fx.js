/* CocoCrisp pack hover/tap effect: lift -> 360 spin -> tear open -> chips pop out.
   Pure CSS + Web Animations API, no libraries. */
(function () {
  if (!('animate' in Element.prototype)) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // per-flavour chip seasoning: [speck colours], density, base tint
  var SEASON = {
    'classic-salted':  { specks: ['#FFFFFF', '#FFFDF6'], n: 7, light: '#FCF4E2', deep: '#EECF97', edge: '#C48A45' },
    'masala':          { specks: ['#B02E1A', '#C9462A', '#8A2414'], n: 14, light: '#F9E7C6', deep: '#E7B36C', edge: '#B06A2C' },
    'chilli-lime':     { specks: ['#5F8E1C', '#86B52B', '#B9381F'], n: 11, light: '#FBEFD4', deep: '#EBC384', edge: '#B8773A' },
    'jaggery-elaichi': { specks: ['#9A5A18', '#B8742A', '#56722A'], n: 7, light: '#F4DCA8', deep: '#D99E4E', edge: '#A0621F' }
  };
  var SHAPES = [
    'M7 32 C 6 15, 36 5, 66 7 C 86 8, 97 17, 94 28 C 91 40, 64 51, 35 53 C 17 54, 8 45, 7 32 Z',
    'M5 26 C 10 11, 44 4, 72 9 C 89 12, 98 22, 93 33 C 87 44, 58 52, 30 50 C 13 48, 3 39, 5 26 Z',
    'M9 36 C 6 20, 30 7, 60 5 C 82 4, 96 12, 95 24 C 94 37, 70 50, 40 54 C 21 56, 11 48, 9 36 Z'
  ];
  var uid = 0;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function chipSVG(s, k) {
    var id = 'ccg' + (uid++), d = SHAPES[k % SHAPES.length], specks = '';
    for (var i = 0; i < s.n; i++) {
      specks += '<circle cx="' + rnd(20, 82).toFixed(1) + '" cy="' + rnd(18, 44).toFixed(1) + '" r="' + rnd(0.9, 2.1).toFixed(1) +
        '" fill="' + s.specks[i % s.specks.length] + '" opacity="' + rnd(0.65, 0.95).toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 100 62" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0" stop-color="' + s.light + '"/><stop offset="1" stop-color="' + s.deep + '"/></linearGradient></defs>' +
      '<path d="' + d + '" fill="url(#' + id + ')"/>' +
      '<path d="' + d.split(' C ').slice(0, 2).join(' C ') + '" fill="none" stroke="' + s.edge + '" stroke-width="4.2" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M16 44 C 32 49, 58 45, 84 30" fill="none" stroke="' + s.edge + '" stroke-width="1.4" stroke-linecap="round" opacity=".25"/>' +
      '<path d="M22 34 C 38 24, 60 20, 80 22" fill="none" stroke="#FFF8E8" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>' +
      specks + '</svg>';
  }

  function setup(fig) {
    var slug = fig.getAttribute('data-fx'), season = SEASON[slug] || SEASON['classic-salted'];
    var spin = fig.querySelector('.pk-spin'), top = fig.querySelector('.pk-top'),
        mouth = fig.querySelector('.pk-mouth'), chipsBox = fig.querySelector('.pk-chips');
    var state = { anims: [], chips: [], timer: 0, playing: false, token: 0 };

    function clearAll() {
      clearTimeout(state.timer);
      state.anims.forEach(function (a) { a.cancel(); });
      state.chips.forEach(function (c) { c.getAnimations().forEach(function (a) { a.cancel(); }); c.remove(); });
      state.anims = []; state.chips = [];
    }

    function launchChips(token) {
      if (token !== state.token) return;
      var fr = fig.getBoundingClientRect(), mr = mouth.getBoundingClientRect();
      var W = fr.width, H = fr.height;
      var mx = mr.left - fr.left + mr.width / 2, my = mr.top - fr.top + mr.height / 2;
      var N = 5, sides = [-1, 1, -1, 1, 0];
      for (var i = 0; i < N; i++) {
        var el = document.createElement('div');
        el.className = 'pk-chip';
        el.innerHTML = chipSVG(season, i);
        chipsBox.appendChild(el); state.chips.push(el);
        var cw = W * 0.19, ch = cw * 0.62;
        var sx = mx + rnd(-0.18, 0.18) * mr.width - cw / 2, sy = my - ch / 2;
        var side = sides[i], dx = side === 0 ? rnd(-0.06, 0.06) * W : side * rnd(0.2, 0.36) * W;
        var ex = Math.max(-cw * 0.1, Math.min(W - cw * 0.9, sx + dx));
        var ey = H * rnd(0.80, 0.88) - ch / 2;
        var peak = sy - H * rnd(0.14, 0.24);
        var r0 = rnd(-30, 30), r1 = r0 + side * rnd(140, 260) + (side === 0 ? rnd(-90, 90) : 0), rEnd = rnd(-18, 18) + (Math.random() < 0.5 ? 0 : 180);
        var px = sx + (ex - sx) * 0.42;
        var T = function (x, y, r, s) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + r.toFixed(1) + 'deg) scale(' + s + ')'; };
        var a = el.animate([
          { transform: T(sx, sy + ch * 0.6, r0, 0.45), opacity: 0, easing: 'cubic-bezier(.2,.7,.35,1)' },
          { transform: T(sx + (px - sx) * 0.35, sy - (sy - peak) * 0.55, r0 + (r1 - r0) * 0.15, 0.9), opacity: 1, offset: 0.14, easing: 'cubic-bezier(.25,.6,.4,1)' },
          { transform: T(px, peak, r0 + (r1 - r0) * 0.45, 1), opacity: 1, offset: 0.42, easing: 'cubic-bezier(.5,0,.85,.4)' },
          { transform: T(ex, ey, r1, 1), opacity: 1, offset: 0.84, easing: 'cubic-bezier(.3,.6,.4,1)' },
          { transform: T(ex + side * 3, ey - H * 0.018, r1 + side * 8, 1), opacity: 1, offset: 0.92, easing: 'ease-in' },
          { transform: T(ex + side * 4, ey, r1 + side * 10 + (rEnd - r1) * 0, 1), opacity: 1 }
        ], { duration: rnd(820, 980), delay: i * 70, fill: 'both' });
        state.anims.push(a);
      }
    }

    function play() {
      if (state.playing) return;
      clearAll(); state.playing = true; var token = ++state.token;
      fig.classList.add('lifted');
      if (reduce) return;
      state.anims.push(spin.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
        { duration: 860, delay: 260, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'both' }));
      state.anims.push(top.animate([
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: 'translate(0,-5%) rotate(-16deg)', offset: 0.7 },
        { transform: 'translate(0,-4.2%) rotate(-13deg)' }
      ], { duration: 420, delay: 1140, easing: 'cubic-bezier(.3,.7,.3,1.15)', fill: 'both' }));
      state.anims.push(mouth.animate(
        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
        { duration: 260, delay: 1180, easing: 'ease-out', fill: 'both' }));
      state.timer = setTimeout(function () { launchChips(token); }, 1290);
    }

    function reset() {
      if (!state.playing) return;
      state.playing = false; state.token++;
      clearTimeout(state.timer);
      fig.classList.remove('lifted');
      var chips = state.chips; state.chips = [];
      chips.forEach(function (c) {
        var f = c.animate([{ opacity: getComputedStyle(c).opacity }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
        f.onfinish = function () { c.getAnimations().forEach(function (a) { a.cancel(); }); c.remove(); };
      });
      var anims = state.anims; state.anims = [];
      anims.forEach(function (a) {
        if (a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('pk-chip')) return;
        var t = a.currentTime || 0, delay = a.effect.getTiming().delay || 0;
        if (a.playState === 'finished' && a.effect.target === spin) { a.cancel(); return; }
        if (t <= delay) { a.cancel(); return; }
        a.updatePlaybackRate(-2.6);
        a.onfinish = function () { a.cancel(); };
        state.anims.push(a);
      });
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
  }

  // tap outside resets on touch devices
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    document.querySelectorAll('figure.pack').forEach(function (f) { if (!f.contains(e.target) && f._fx) f._fx.reset(); });
  }, { passive: true });

  document.querySelectorAll('figure.pack[data-fx]').forEach(setup);
})();
