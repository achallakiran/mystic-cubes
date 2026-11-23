// Deterministic cube generator: a saying (and its id) always yields the same cube.
(function (root) {
  var FILL = 'EEEEEAAAAIIIIOOOUUTTTNNNSSSRRRLLDDHHCCMMPPBBGGFFWWYYKVJXZQ';
  var TIERS = [
    { id: 1, name: 'Seed', n: 4, diag: 0, cross: 1, decoys: 0, ov: 1, same: true, desc: 'small cube · short sayings' },
    { id: 2, name: 'Path', n: 5, diag: 2, cross: 3, decoys: 0, ov: 1, same: true, desc: 'larger cube · longer sayings' },
    { id: 3, name: 'Peak', n: 5, diag: 4, cross: 5, decoys: 3, ov: 2, same: false, desc: 'longest sayings · decoy words' }
  ];
  function hash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tokenize(text) {
    return text.split(/\s+/).filter(Boolean).map(function (raw) {
      var core = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
      return { raw: raw, core: core, hunted: core.length >= 3 };
    });
  }
  function huntedList(tokens) {
    var seen = {}, out = [];
    tokens.forEach(function (t) { if (t.hunted && !seen[t.core]) { seen[t.core] = 1; out.push(t.core); } });
    return out;
  }
  function placer(geo) {
    var cache = {};
    return function (L) {
      if (cache[L]) return cache[L];
      var out = [];
      for (var s = 0; s < geo.cells.length; s++) for (var d = 0; d < 8; d++) {
        var seq = geo.walk(s, geo.DIRS[d], L);
        if (seq.length === L) out.push({ seq: seq, diag: d >= 4, cross: geo.crosses(seq) });
      }
      return (cache[L] = out);
    };
  }
  function fits(grid, seq, w, maxOv) {
    var ov = 0;
    for (var k = 0; k < w.length; k++) { var g = grid[seq[k]]; if (g && g !== w[k]) return -1; if (g) ov++; }
    return ov <= maxOv ? ov : -1;
  }
  function buildCube(saying, geo, tier) {
    var tokens = tokenize(saying.text), words = huntedList(tokens);
    var order = words.slice().sort(function (a, b) { return b.length - a.length || (a < b ? -1 : 1); });
    var total = geo.cells.length, pl = placer(geo);
    for (var attempt = 0; attempt < 800; attempt++) {
      var R = rng((hash(saying.id) + attempt * 7919) >>> 0);
      var grid = new Array(total).fill(''), place = {}, dn = tier.diag, cn = tier.cross, ok = true;
      for (var wi = 0; wi < order.length && ok; wi++) {
        var w = order[wi];
        var all = pl(w.length).filter(function (p) { return fits(grid, p.seq, w, tier.ov) >= 0; });
        if (!all.length) { ok = false; break; }
        var pool = all;
        if (dn > 0) { var x = all.filter(function (p) { return p.diag; }); if (x.length) pool = x; }
        if (cn > 0) { var y = pool.filter(function (p) { return p.cross; }); if (y.length) pool = y; }
        if (cn <= 0 && tier.same) { var z = pool.filter(function (p) { return !p.cross; }); if (z.length) pool = z; }
        var pick = pool[Math.floor(R() * pool.length)];
        for (var k = 0; k < w.length; k++) grid[pick.seq[k]] = w[k];
        if (pick.diag && dn > 0) dn--;
        if (pick.cross && cn > 0) cn--;
        place[w] = pick.seq.slice();
      }
      if (!ok) continue;
      for (var d = 0; d < tier.decoys; d++) {
        var cand = words.filter(function (q) { return q.length >= 4; });
        if (!cand.length) break;
        var base = cand[Math.floor(R() * cand.length)], ix = Math.floor(R() * base.length), ch = FILL[Math.floor(R() * FILL.length)];
        if (ch === base[ix]) continue;
        var dec = base.slice(0, ix) + ch + base.slice(ix + 1);
        if (words.indexOf(dec) >= 0) continue;
        var dp = pl(dec.length).filter(function (p) { return fits(grid, p.seq, dec, 1) >= 0; });
        if (dp.length) { var dpk = dp[Math.floor(R() * dp.length)]; for (var j = 0; j < dec.length; j++) grid[dpk.seq[j]] = dec[j]; }
      }
      for (var i = 0; i < total; i++) if (!grid[i]) grid[i] = FILL[Math.floor(R() * FILL.length)];
      return { letters: grid.join(''), place: place, words: words, tokens: tokens, attempt: attempt };
    }
    return null;
  }

  // ---------- view helpers (turntable: yaw then pitch) ----------
  function viewFor(geo, idx) {
    var p = geo.cells[idx].p, N = geo.N;
    var x = (p[0] - N) / N, y = (p[1] - N) / N, z = (p[2] - N) / N;
    var yaw = (Math.abs(x) < 1e-9 && Math.abs(z) < 1e-9) ? null : Math.atan2(-x, z);
    var pitch = Math.atan2(y, Math.hypot(x, z));
    return { yaw: yaw, pitch: Math.max(-1.45, Math.min(1.45, pitch)) };
  }

  // ---------- tutorial cube: FIND, LINE, DOWN, SLANT, CROSS ----------
  var TUT_WORDS = ['FIND', 'LINE', 'DOWN', 'SLANT', 'CROSS'];
  function buildTutorial(geo) {
    var pl = placer(geo), total = geo.cells.length;
    function sideOnly(seq) { return seq.every(function (c) { return geo.cells[c].a !== 1; }); }
    function dl(seq) { var a = geo.cells[seq[0]].p, b = geo.cells[seq[1]].p; return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; }
    function ltr(seq) {
      var v = viewFor(geo, seq[(seq.length - 1) >> 1]); if (v.yaw === null) return false;
      function sx(i) { var p = geo.cells[i].p, N = geo.N; return Math.cos(v.yaw) * (p[0] - N) / N + Math.sin(v.yaw) * (p[2] - N) / N; }
      return sx(seq[0]) < sx(seq[seq.length - 1]) - 0.2;
    }
    var F = {
      FIND: function (s) { return !geo.crosses(s) && sideOnly(s) && dl(s)[1] === 0 && ltr(s); },
      LINE: function (s) { return !geo.crosses(s) && sideOnly(s) && dl(s)[1] === 0 && ltr(s); },
      DOWN: function (s) { var d = dl(s); return !geo.crosses(s) && sideOnly(s) && d[0] === 0 && d[2] === 0 && d[1] < 0; },
      SLANT: function (s) { var d = dl(s); return !geo.crosses(s) && sideOnly(s) && d[1] !== 0 && (d[0] !== 0 || d[2] !== 0) && ltr(s); },
      CROSS: function (s) { return geo.crosses(s) && sideOnly(s) && s.every(function (c) { return geo.cells[c].p[1] === geo.cells[s[0]].p[1]; }) && ltr(s); }
    };
    for (var attempt = 0; attempt < 3000; attempt++) {
      var R = rng(4242 + attempt), grid = new Array(total).fill(''), place = {}, ok = true;
      for (var wi = 0; wi < TUT_WORDS.length && ok; wi++) {
        var w = TUT_WORDS[wi];
        var all = pl(w.length).filter(function (p) { return F[w](p.seq) && fits(grid, p.seq, w, 0) >= 0; });
        if (!all.length) { ok = false; break; }
        var pick = all[Math.floor(R() * all.length)];
        for (var k = 0; k < w.length; k++) grid[pick.seq[k]] = w[k];
        place[w] = pick.seq.slice();
      }
      if (!ok) continue;
      for (var i = 0; i < total; i++) if (!grid[i]) grid[i] = FILL[Math.floor(R() * FILL.length)];
      return { letters: grid.join(''), place: place, words: TUT_WORDS.slice(), tokens: tokenize('Find line down slant cross'), attempt: attempt };
    }
    return null;
  }
  var api = { TIERS: TIERS, tokenize: tokenize, huntedList: huntedList, buildCube: buildCube, buildTutorial: buildTutorial, viewFor: viewFor, hash: hash, rng: rng, TUT_WORDS: TUT_WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MCGen = api;
})(typeof window !== 'undefined' ? window : this);
