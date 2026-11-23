// Mystic Cubes — game: scenes, cube rendering, controls, reveal, screens, tutorial, saving.
(function () {
'use strict';
var G = window.MCGen, SAYINGS = window.SAYINGS, Snd = window.Snd, mk = window.makeGeometry;
var W = 390, H = 760;
function $(id) { return document.getElementById(id); }
var stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d'), scale = 1, q = 1, sceneCv = {};
function fit() {
  scale = Math.min(innerWidth / 390, innerHeight / 760, 1.5);
  stage.style.transform = 'scale(' + scale + ')';
  q = Math.min(window.devicePixelRatio || 1, 3) * scale;
  cv.width = Math.round(W * q); cv.height = Math.round(H * q); sceneCv = {};
}
addEventListener('resize', fit); fit();

/* ---------- saving ---------- */
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function today() { if (window.__fakeToday) return window.__fakeToday; var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
var KEY = 'mystic-cubes-v1', SAVE;
function load() {
  try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {}
  return { v: 1, cubes: {}, hints: { n: 2, day: today() }, tutorial: false, sound: true, active: null };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) {} }
SAVE = load();
function refill() {
  var t = today(), h = SAVE.hints;
  if (h.day !== t) {
    var days = Math.round((Date.parse(t) - Date.parse(h.day)) / 864e5);
    if (days > 0) h.n = Math.min(5, h.n + days);
    h.day = t; save();
  }
  updateHint();
}
var geos = { 4: mk(4), 5: mk(5) };
var byId = {}; SAYINGS.forEach(function (s) { byId[s.id] = s; });

/* ---------- math ---------- */
function rx(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
function ry(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
function mul(A, B) { var o = new Array(9); for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) o[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return o; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function wrapPi(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

/* ---------- camera ---------- */
var CX = 195, CY = 372, K = 80, CD = 7, yaw = -0.6, pitch = 0.5, R = mul(rx(pitch), ry(yaw));
function setView(y, p) { R = mul(rx(p), ry(y)); }
function camStart() { CX = 195; CY = 350; K = 100; }
function camPlay() { CX = 195; CY = 372; K = 80; }
function projN(nx, ny, nz) {
  var x = R[0] * nx + R[1] * ny + R[2] * nz, y = R[3] * nx + R[4] * ny + R[5] * nz, z = R[6] * nx + R[7] * ny + R[8] * nz;
  var sc = CD / (CD - z);
  return { x: CX + K * x * sc, y: CY - K * y * sc, z: z, sc: sc };
}
function projD(P, N) { return projN((P[0] - N) / N, (P[1] - N) / N, (P[2] - N) / N); }
var FA = [0, 0, 1, 1, 2, 2], FS = [1, -1, 1, -1, 1, -1];
var TINT = ['255,252,244', '250,249,242', '255,250,238', '247,247,241', '255,251,240', '248,246,238'];
function facing(f) {
  var a = FA[f], s = FS[f], nx = R[a] * s, ny = R[3 + a] * s, nz = R[6 + a] * s;
  var vx = -nx, vy = -ny, vz = CD - nz, l = Math.hypot(vx, vy, vz);
  return (nx * vx + ny * vy + nz * vz) / l;
}
function facePt(f, su, sv) { var a = FA[f], u = (a + 1) % 3, v = (a + 2) % 3, p = [0, 0, 0]; p[a] = FS[f]; p[u] = su; p[v] = sv; return projN(p[0], p[1], p[2]); }

/* ---------- palettes & scenes ---------- */
var COLORS = ['#f0c05a', '#5fc4a3', '#f2a3c0', '#7db7f0', '#b9a6f0', '#f29e6b', '#9ad66f', '#e8e08a', '#7fd6e8', '#d9a0e8', '#c6d98a', '#8fb4f2'];
var TRAD = { jp: 'Japan', pali: 'Pali', cn: 'China' };
var TRAD_COL = { jp: '#e9a9a0', pali: '#f0c27a', cn: '#9bb8b0' };
var PAL = {
  jp: { sky: ['#2a2858', '#3b3470', '#5a4585', '#8a5a8e', '#c27a8e', '#e8a79a'], sun: '#f3e2b8', m1: '#3a2f6b', m2: '#2b2559', ground: '#231f4a', stone: ['#e2b98f', '#c99a7a', '#a87a6a'], part: '#f2a3c0' },
  pali: { sky: ['#10303f', '#184556', '#256068', '#4f8470', '#d4a45a', '#f0c88a'], sun: '#f8e6b0', m1: '#1d4a54', m2: '#143a45', ground: '#0f2f3a', stone: ['#e8d3a0', '#cdb583', '#a98f6a'], part: '#f0e08a' },
  cn: { sky: ['#26324a', '#3a4a64', '#596b82', '#8493a2', '#b4bec0', '#dcdacc'], sun: '#f6f0dc', m1: '#46586c', m2: '#2f3f55', ground: '#222d42', stone: ['#d8c8a0', '#b8a780', '#948566'], part: '#e8efe9' }
};
function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); }
function paintScene(key) {
  var P = PAL[key], sc = document.createElement('canvas'); sc.width = Math.round(W * q); sc.height = Math.round(H * q);
  var c = sc.getContext('2d'); c.setTransform(q, 0, 0, q, 0, 0);
  var g = c.createLinearGradient(0, 0, 0, 640), st = [0, 0.2, 0.4, 0.62, 0.82, 1];
  for (var i = 0; i < 6; i++) g.addColorStop(st[i], P.sky[i]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  var r = G.rng(77);
  if (key !== 'cn') { c.fillStyle = '#f3e2b8'; for (i = 0; i < 38; i++) { c.globalAlpha = 0.25 + r() * 0.5; c.beginPath(); c.arc(r() * W, r() * 330, 0.8 + r() * 1.1, 0, 6.3); c.fill(); } c.globalAlpha = 1; }
  var sx = key === 'pali' ? 95 : 300, sy = key === 'pali' ? 190 : 150;
  c.fillStyle = P.sun; c.globalAlpha = 0.16; c.beginPath(); c.arc(sx, sy, 52, 0, 6.3); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(sx, sy, 32, 0, 6.3); c.fill();
  poly(c, [[0, 610], [40, 540], [95, 575], [160, 500], [235, 580], [300, 520], [390, 590], [390, 660], [0, 660]], P.m1);
  if (key === 'jp') { poly(c, [[130, 650], [255, 455], [380, 650]], P.m2); poly(c, [[236, 482], [255, 455], [274, 482], [264, 488], [255, 479], [246, 488]], 'rgba(244,234,213,.85)'); }
  else poly(c, [[0, 640], [70, 585], [140, 620], [215, 560], [300, 615], [390, 570], [390, 660], [0, 660]], P.m2);
  c.fillStyle = P.sky[5]; c.globalAlpha = 0.22; c.fillRect(0, 585, W, 60); c.globalAlpha = 1;
  c.fillStyle = P.ground; c.fillRect(0, 622, W, 140);
  c.fillStyle = P.stone[0]; c.fillRect(105, 560, 180, 12); c.fillStyle = P.stone[1]; c.fillRect(80, 572, 230, 14); c.fillStyle = P.stone[2]; c.fillRect(55, 586, 280, 20);
  var m = P.stone[0];
  if (key === 'jp') {
    c.fillStyle = m; c.fillRect(30, 552, 6, 54); c.fillRect(70, 552, 6, 54); c.fillRect(22, 544, 62, 7); c.fillRect(30, 560, 46, 5);
    c.fillRect(331, 580, 18, 26); c.fillRect(335, 558, 10, 22); poly(c, [[324, 558], [356, 558], [340, 542]], m);
  } else if (key === 'pali') {
    c.fillStyle = m; c.beginPath(); c.arc(56, 606, 34, Math.PI, 0); c.fill(); c.fillRect(46, 560, 20, 8); c.fillRect(54, 530, 4, 30); c.fillRect(48, 540, 16, 3);
    c.fillStyle = '#f2a3c0'; [[-9, -0.5], [0, 0], [9, 0.5]].forEach(function (p) { c.save(); c.translate(340 + p[0], 598); c.rotate(p[1]); c.beginPath(); c.ellipse(0, -10, 7, 17, 0, 0, 6.3); c.fill(); c.restore(); });
  } else {
    c.fillStyle = m; for (i = 0; i < 4; i++) { var w = 40 - i * 7, y = 604 - i * 22; c.fillRect(56 - w / 2 + 4, y - 16, w - 8, 16); poly(c, [[56 - w / 2 - 6, y - 14], [56 + w / 2 + 6, y - 14], [56 + w / 2 - 2, y - 24], [56 - w / 2 + 2, y - 24]], P.stone[1]); }
    c.fillStyle = '#3d5a4a'; c.fillRect(336, 584, 5, 22); for (i = 0; i < 3; i++) poly(c, [[338 - 24 + i * 5, 590 - i * 18], [338 + 24 - i * 5, 590 - i * 18], [338, 566 - i * 18]], '#3d5a4a');
  }
  return sc;
}
var parts = []; (function () { var r = G.rng(5); for (var i = 0; i < 16; i++) parts.push({ x: r() * W, y: r() * 600, vy: 0.12 + r() * 0.25, ph: r() * 6, r: 1.4 + r() * 2.2 }); })();

/* ---------- state ---------- */
var mode = 'start', curTrad = 'jp', cube = null, tut = null, anim = null, emerge = null, picks = [], startCubes = [], sel = null, pickTier = 1, pickFrom = 'play';
var vyaw = 0, vpitch = 0, touched = false, drag = null, hover = -1, drawn = [], FD = [0, 0, 0, 0, 0, 0], now = 0;
var RING = 160, R2 = 182;
var CUBE_COLS = ['246,190,184', '176,222,200', '172,202,244', '244,220,150', '204,186,240', '248,200,150'];

function setMode(m) {
  mode = m; stage.dataset.m = m === 'emerge' ? 'play' : m;
  ['start', 'tier', 'pickcap', 'done', 'cards', 'detail'].forEach(function (id) { $(id).classList.remove('on'); });
  var map = { start: 'start', tier: 'tier', pick: 'pickcap', done: 'done', cards: 'cards' };
  if (map[m]) $(map[m]).classList.add('on');
  bskip.style.display = m === 'tut' ? 'block' : 'none';
  if (m !== 'tut') { capOff(); $('finger').classList.remove('on'); }
}
var bskip = document.createElement('button');
bskip.id = 'bskip'; bskip.textContent = 'SKIP';
bskip.style.cssText = 'position:absolute;left:24px;bottom:30px;font-size:12px;letter-spacing:.3em;color:#b9b2d6;display:none;z-index:3;padding:8px';
stage.appendChild(bskip);

/* ---------- cube drawing ---------- */
function quad(c) { ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y); for (var i = 1; i < 4; i++) ctx.lineTo(c[i].x, c[i].y); ctx.closePath(); }
function pathPoints(geo, seq) {
  var pts = [], N = geo.N;
  for (var k = 0; k < seq.length; k++) {
    var cell = geo.cells[seq[k]];
    if (k > 0) {
      var e = geo.edgePoint(seq[k - 1], seq[k]);
      if (e) { var pe = projD(e, N); pts.push({ x: pe.x, y: pe.y, front: FD[geo.cells[seq[k - 1]].f] > 0 || FD[cell.f] > 0 }); }
    }
    var pp = projD(cell.p, N); pts.push({ x: pp.x, y: pp.y, front: FD[cell.f] > 0 });
  }
  return pts;
}
function strokeRuns(pts, w, col, aF, aB, al) {
  ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
  var run = [pts[0]], f = pts[0].front;
  function flush() {
    ctx.globalAlpha = (f ? aF : aB) * al; ctx.beginPath(); ctx.moveTo(run[0].x, run[0].y);
    if (run.length === 1) ctx.lineTo(run[0].x + 0.01, run[0].y);
    for (var i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
    ctx.stroke();
  }
  for (var i = 1; i < pts.length; i++) { var p = pts[i]; if (p.front !== f) { run.push(p); flush(); run = [p]; f = p.front; } else run.push(p); }
  flush(); ctx.globalAlpha = 1;
}
var _grain = null;
function grainPat() {
  if (_grain) return _grain;
  var g = document.createElement('canvas'); g.width = g.height = 96; var c = g.getContext('2d'), r = G.rng(11), i;
  for (i = 0; i < 520; i++) { c.fillStyle = 'rgba(120,92,70,' + (0.05 + r() * 0.09) + ')'; c.fillRect(r() * 96, r() * 96, 1 + r(), 1); }
  for (i = 0; i < 380; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.4) + ')'; c.fillRect(r() * 96, r() * 96, 1, 1); }
  c.lineWidth = 0.6; for (i = 0; i < 34; i++) { var x = r() * 96, y = r() * 96, a = r() * 6.3, l = 3 + r() * 6; c.strokeStyle = 'rgba(110,85,70,' + (0.05 + r() * 0.06) + ')'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  _grain = ctx.createPattern(g, 'repeat'); return _grain;
}
var FONT = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif",Georgia,"Times New Roman",serif';
function drawCube(o) {
  var geo = o.geo, N = geo.N, f, order = [0, 1, 2, 3, 4, 5], al = o.alpha == null ? 1 : o.alpha;
  for (f = 0; f < 6; f++) FD[f] = facing(f);
  order.sort(function (a, b) { return FD[a] - FD[b]; });
  order.forEach(function (f) {
    var vis = smooth(FD[f] * 2.2), c = [facePt(f, -1, -1), facePt(f, 1, -1), facePt(f, 1, 1), facePt(f, -1, 1)], front = FD[f] > 0;
    var a_ = FA[f], s_ = FS[f], dl = -0.35 * R[a_] * s_ + 0.65 * R[3 + a_] * s_ + 0.65 * R[6 + a_] * s_, lt = clamp(dl * 0.5 + 0.55, 0, 1);
    var lum = o.col ? 0.5 + 0.5 * lt : 0.84 + 0.16 * lt, rgb = (o.col || TINT[f]).split(',').map(function (v) { return Math.round(v * lum); }).join(',');
    quad(c); ctx.globalAlpha = al; ctx.fillStyle = 'rgba(' + rgb + ',' + (o.col ? 0.97 : 0.10 + 0.84 * vis) + ')'; ctx.fill();
    if (vis > 0.02) {
      if (!o.col) { ctx.globalAlpha = al * vis * 0.6; ctx.fillStyle = grainPat(); quad(c); ctx.fill(); }
      var gg = ctx.createLinearGradient(c[0].x, c[0].y, c[2].x, c[2].y); gg.addColorStop(0, 'rgba(255,255,255,.22)'); gg.addColorStop(0.55, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(90,70,130,.14)');
      ctx.globalAlpha = al * (o.col ? 1 : vis); ctx.fillStyle = gg; quad(c); ctx.fill();
    }
    if (!o.noGrid) {
      ctx.lineWidth = 0.8; ctx.strokeStyle = front ? 'rgba(45,42,92,' + (0.05 + 0.09 * vis) + ')' : 'rgba(244,234,213,.06)';
      for (var k = 1; k < N; k++) {
        var s = -1 + 2 * k / N, a = facePt(f, s, -1), b = facePt(f, s, 1), a2 = facePt(f, -1, s), b2 = facePt(f, 1, s);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      }
    }
    quad(c); ctx.lineWidth = 1.2; ctx.strokeStyle = front ? 'rgba(45,42,92,' + (0.14 + 0.3 * vis) + ')' : 'rgba(244,234,213,.22)'; ctx.stroke();
  });
  ctx.globalAlpha = 1;
  if (o.noLetters) return;
  var sw = 0.6 * (2 * K / N) * 1.08, t = performance.now(), i;
  (o.found || []).forEach(function (fo) {
    var a = smooth((t - (fo.t0 || 0)) / 500); strokeRuns(pathPoints(geo, fo.seq), sw, COLORS[fo.ci % COLORS.length], 0.62 * a, 0.22 * a, al);
  });
  if (o.flash) { var a2 = 1 - (t - o.flash.t0) / 650; if (a2 > 0) strokeRuns(pathPoints(geo, o.flash.seq), sw * 0.8, '#d9453b', 0.6 * a2, 0.25 * a2, al); }
  drawn.length = 0;
  var items = [];
  for (var c = 0; c < geo.cells.length; c++) { var cell = geo.cells[c], p = projD(cell.p, N); items.push({ c: c, x: p.x, y: p.y, z: p.z, sc: p.sc, fac: FD[cell.f] }); }
  items.sort(function (a, b) { return a.z - b.z; });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2d2a5c';
  for (i = 0; i < items.length; i++) {
    var it = items[i], px = (2 * K / N) * it.sc * (Math.max(it.fac, 0.25) * 0.5 + 0.5); it.px = px;
    ctx.globalAlpha = al * (o.letterFade == null ? 1 : o.letterFade) * (it.fac <= 0 ? 0.08 : 0.08 + 0.92 * smooth((it.fac - 0.06) / 0.44));
    ctx.font = '600 ' + (px * 0.58).toFixed(1) + 'px ' + FONT;
    if (it.fac > 0.3) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(o.letters[it.c], it.x, it.y + px * 0.03 + 1); }
    ctx.fillStyle = '#25224f'; ctx.fillText(o.letters[it.c], it.x, it.y + px * 0.03);
    drawn.push(it);
  }
  ctx.globalAlpha = 1;
  for (i = 0; i < items.length; i++) {
    it = items[i];
    if (it.c === o.startCell && it.fac > 0) {
      ctx.strokeStyle = '#2d2a5c'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t / 240);
      ctx.beginPath(); ctx.arc(it.x, it.y, it.px * 0.5 + 1.5 * Math.sin(t / 240), 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (it.c === o.hintCell && it.fac > 0) {
      ctx.strokeStyle = '#e0a63a'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t / 200);
      ctx.beginPath(); ctx.arc(it.x, it.y, it.px * 0.55 + 2 * Math.sin(t / 200), 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (it.c === hover && it.fac > 0.2 && !drag) {
      ctx.strokeStyle = '#2d2a5c'; ctx.lineWidth = 1; ctx.globalAlpha = 0.25 * smooth(it.fac * 2);
      ctx.beginPath(); ctx.arc(it.x, it.y, it.px * 0.46, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
}
function ringDot() { return { x: CX + RING * Math.sin(yaw), y: CY - RING * Math.cos(yaw) }; }
function tiltDot() { return { x: CX + R2 * Math.cos(pitch), y: CY - R2 * Math.sin(pitch) }; }
function drawControls() {
  ctx.lineCap = 'round'; ctx.strokeStyle = '#f3e2b8';
  ctx.globalAlpha = 0.3; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(CX, CY, RING, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.arc(CX, CY, R2, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = '#f3e2b8'; ctx.globalAlpha = 0.5;
  for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(CX + RING * Math.sin(i * Math.PI / 2), CY - RING * Math.cos(i * Math.PI / 2), 3, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(CX + R2 * Math.cos(i * Math.PI / 2), CY - R2 * Math.sin(i * Math.PI / 2), 2.4, 0, 6.3); ctx.fill(); }
  var a = ringDot(), b = tiltDot(), dr = drag && drag.type;
  ctx.globalAlpha = dr === 'ring' ? 0.4 : 0.22; ctx.beginPath(); ctx.arc(a.x, a.y, dr === 'ring' ? 22 : 18, 0, 6.3); ctx.fill();
  ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(a.x, a.y, 10, 0, 6.3); ctx.fill();
  ctx.globalAlpha = dr === 'tilt' ? 0.4 : 0.22; ctx.beginPath(); ctx.arc(b.x, b.y, dr === 'tilt' ? 18 : 14, 0, 6.3); ctx.fill();
  ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, 6.3); ctx.fill();
}
function drawMini(i, p, t) {
  var oc = [CX, CY, K], oy = yaw, op = pitch;
  var bob = Math.sin(t / 700 + i * 2) * 5, k = p.k || 36;
  CX = p.x; CY = p.y + bob; K = k; setView(t * 0.0006 * (1 + (i % 3) * 0.25) + i * 2.1, 0.45 + 0.3 * Math.sin(t / 2100 + i * 1.7));
  var gr = ctx.createRadialGradient(CX, CY, 4, CX, CY, k * 2.6); gr.addColorStop(0, 'rgba(243,226,184,.5)'); gr.addColorStop(1, 'rgba(243,226,184,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(CX, CY, k * 2.6, 0, 6.3); ctx.fill();
  drawCube({ geo: geos[4], noLetters: true, noGrid: true, col: p.col || '244,222,160' });
  CX = oc[0]; CY = oc[1]; K = oc[2]; setView(oy, op);
}


/* ---------- the cube universe (start screen) ---------- */
var swarm = [], CV8 = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
var CF = [[0, 1, 2, 3, 0, 0, -1], [4, 5, 6, 7, 0, 0, 1], [0, 1, 5, 4, 0, -1, 0], [3, 2, 6, 7, 0, 1, 0], [0, 3, 7, 4, -1, 0, 0], [1, 2, 6, 5, 1, 0, 0]];
(function () {
  var r = G.rng(2024), i, j, k, st = 0.4;
  function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  for (i = 0; i < 5; i++) for (j = 0; j < 5; j++) for (k = 0; k < 5; k++) if (i === 0 || i === 4 || j === 0 || j === 4 || k === 0 || k === 4)
    swarm.push({ p: [(i - 2) * st, (j - 2) * st, (k - 2) * st], h: 0.112, col: CUBE_COLS[Math.floor(r() * 6)], ph: r() * 6.28, spd: 0.0004 + r() * 0.0009, bob: r() * 6.28, orb: null });
  for (i = 0; i < 26; i++) {
    var ax = nrm([r() - 0.5, r() - 0.5, r() - 0.5]), t = Math.abs(ax[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0], u = nrm(crs(ax, t)), v = crs(ax, u);
    swarm.push({ orb: { u: u, v: v, r: 1.25 + r() * 0.4, w: (0.0002 + r() * 0.0004) * (r() < 0.5 ? 1 : -1), ph: r() * 6.28 }, h: 0.05 + r() * 0.05, col: CUBE_COLS[Math.floor(r() * 6)], ph: r() * 6.28, spd: 0.0006 + r() * 0.001 });
  }
  swarm.forEach(function (c, n) { c.i = n; });
})();
function mv(M, v) { return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]]; }
function drawMicro(c, al) {
  var a = c.ph + now * c.spd, Ru = mul(ry(a), rx(a * 0.7)), pv = [], i, f;
  for (i = 0; i < 8; i++) { var w = mv(Ru, CV8[i]); pv.push(projN(w[0] * c.h + c.wp[0], w[1] * c.h + c.wp[1], w[2] * c.h + c.wp[2])); }
  var rgb = c.col.split(',').map(Number);
  for (f = 0; f < 6; f++) {
    var F = CF[f], nv = mv(R, mv(Ru, [F[4], F[5], F[6]]));
    if (nv[2] < 0.02) continue;
    var lum = 0.66 + 0.34 * clamp(-0.35 * nv[0] + 0.65 * nv[1] + 0.65 * nv[2], 0, 1);
    ctx.beginPath(); ctx.moveTo(pv[F[0]].x, pv[F[0]].y); for (i = 1; i < 4; i++) ctx.lineTo(pv[F[i]].x, pv[F[i]].y); ctx.closePath();
    ctx.fillStyle = 'rgba(' + Math.round(rgb[0] * lum) + ',' + Math.round(rgb[1] * lum) + ',' + Math.round(rgb[2] * lum) + ',' + al + ')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 * al) + ')'; ctx.lineWidth = 0.7; ctx.stroke();
  }
}
function drawSwarm(al, skip) {
  var t = now, list = [], i, c;
  for (i = 0; i < swarm.length; i++) {
    c = swarm[i]; var wp;
    if (c.orb) { var a = c.orb.ph + t * c.orb.w, ca = Math.cos(a) * c.orb.r, sa = Math.sin(a) * c.orb.r; wp = [ca * c.orb.u[0] + sa * c.orb.v[0], ca * c.orb.u[1] + sa * c.orb.v[1], ca * c.orb.u[2] + sa * c.orb.v[2]]; }
    else { var bb = 1 + 0.02 * Math.sin(t / 900 + c.bob); wp = [c.p[0] * bb, c.p[1] * bb, c.p[2] * bb]; }
    var pr = projN(wp[0], wp[1], wp[2]); c.wp = wp; c.sx = pr.x; c.sy = pr.y; c.sz = pr.z; c.px = K * c.h * pr.sc; list.push(c);
  }
  list.sort(function (x, y) { return x.sz - y.sz; });
  for (i = 0; i < list.length; i++) if (list[i].i !== skip) drawMicro(list[i], al);
}
var hz = document.createElement('canvas'), HS = 0.2; hz.width = Math.round(W * HS); hz.height = Math.round(H * HS); var hctx = hz.getContext('2d');
function drawGlow(a) {
  var g = ctx.createRadialGradient(CX, CY, 10, CX, CY, 190); g.addColorStop(0, 'rgba(243,226,184,' + 0.3 * a + ')'); g.addColorStop(1, 'rgba(243,226,184,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, 190, 0, 6.3); ctx.fill();
}

/* ---------- saying strip ---------- */
function foundMap() { var m = {}; cube.found.forEach(function (f) { m[f.w] = f; }); return m; }
function nextTarget() { for (var i = 0; i < cube.words.length; i++) if (!foundMap()[cube.words[i]]) return cube.words[i]; return null; }
var lastFoundWord = null;
function renderSaying() {
  var fm = foundMap(), tg = nextTarget(), html = '';
  cube.tokens.forEach(function (t) {
    var lead = t.raw.match(/^[^A-Za-z]*/)[0], trail = t.raw.match(/[^A-Za-z]*$/)[0];
    if (!t.hunted) html += '<span class="w a">' + t.raw + '</span>';
    else if (fm[t.core]) html += '<span class="w f' + (lastFoundWord === t.core ? '' : '') + '" style="color:' + COLORS[fm[t.core].ci % COLORS.length] + '">' + t.raw + '</span>';
    else if (t.core === tg) html += '<span class="w g">' + t.raw + '</span>';
    else html += '<span class="w b">' + lead + '<i style="width:' + (t.core.length * 0.62).toFixed(2) + 'em"></i>' + trail + '</span>';
  });
  $('saying').innerHTML = html;
}

/* ---------- cube lifecycle ---------- */
function newCubeObj(sy, replay) {
  var tier = G.TIERS[sy.tier - 1], geo = geos[tier.n], gen = G.buildCube(sy, geo, tier);
  return { saying: sy, tier: tier, geo: geo, N: tier.n, letters: gen.letters, place: gen.place, words: gen.words, tokens: gen.tokens, found: [], startCell: null, flash: null, hintCell: -1, hintUntil: 0, replay: !!replay, lastProg: performance.now() };
}
function launch(sy, replay) {
  cube = newCubeObj(sy, replay); curTrad = sy.trad; Snd.setScale(sy.trad);
  var rec = SAVE.cubes[sy.id];
  if (!replay && rec && rec.found) rec.found.forEach(function (w) { if (cube.place[w]) cube.found.push({ w: w, seq: cube.place[w].slice(), ci: cube.words.indexOf(w), t0: 0 }); });
  if (!replay) { SAVE.active = sy.id; if (!rec) SAVE.cubes[sy.id] = { found: [], done: false }; save(); }
  renderSaying(); updateHint(); $('bhint').classList.remove('pulse');
}
function saveProgress() {
  if (cube.replay || cube.tut) return;
  var rec = SAVE.cubes[cube.saying.id] || (SAVE.cubes[cube.saying.id] = { found: [], done: false });
  rec.found = cube.found.map(function (f) { return f.w; }); save();
}
function pickSaying(tierId) {
  var all = SAYINGS.filter(function (s) { return s.tier === tierId; });
  var open = all.filter(function (s) { return !(SAVE.cubes[s.id] && SAVE.cubes[s.id].done); });
  var list = open.length ? open : all;
  return list[Math.floor(Math.random() * list.length)];
}
function canResume() { var a = SAVE.active; return !!(a && byId[a] && !(SAVE.cubes[a] && SAVE.cubes[a].done)); }

function goStart() {
  setMode('start'); camStart(); curTrad = 'jp'; Snd.setScale('jp'); 
  $('bplay').style.display = canResume() ? 'block' : 'none'; sel = null; anim = null; pitch = 0.4; vyaw = vpitch = 0;
  $('sub').textContent = SAVE.tutorial ? 'touch a cube' : 'touch a cube to begin';
}
function goTier() {
  setMode('tier'); var el = $('tier'); Array.prototype.slice.call(el.querySelectorAll('.tr')).forEach(function (n) { n.remove(); });
  G.TIERS.forEach(function (t, i) {
    var all = SAYINGS.filter(function (s) { return s.tier === t.id; }), done = all.filter(function (s) { return SAVE.cubes[s.id] && SAVE.cubes[s.id].done; }).length;
    var b = document.createElement('button'); b.className = 'tr'; b.style.top = (440 + i * 92) + 'px'; b.style.height = '80px';
    b.innerHTML = '<b>' + t.name.toUpperCase() + '</b><span>' + t.desc + ' · ' + done + '/' + all.length + '</span>';
    b.addEventListener('click', function () { Snd.wake(); pickTier = t.id; beginEmerge({ x: 195, y: 290, k: 64, col: sel && sel.col }); });
    el.appendChild(b);
  });
}
function startTap(p) {
  var best = null, bz = -1e9;
  swarm.forEach(function (c) { if (c.sx == null) return; var rr = Math.max(c.px * 1.5, 14); if (Math.hypot(p.x - c.sx, p.y - c.sy) < rr && c.sz > bz) { bz = c.sz; best = c; } });
  if (!best) return;
  Snd.chime(false);
  if (!SAVE.tutorial) { startTutorial(); return; }
  sel = { i: best.i, x0: best.sx, y0: best.sy, k0: Math.max(best.px, 8), col: best.col, t0: performance.now() }; goTier();
}
function goPick(tierId, from) {
  pickTier = tierId; pickFrom = from; setMode('pick');
  $('ptxt').textContent = from === 'tut' ? 'TOUCH THE GLOWING CUBE' : 'TOUCH A CUBE';
  picks = [{ x: 195, y: 350, k: 44, col: CUBE_COLS[3] }];
}
function pickTap(p) {
  for (var i = 0; i < picks.length; i++) {
    if (Math.hypot(p.x - picks[i].x, p.y - picks[i].y - 0) < 66) { beginEmerge(picks[i]); return; }
  }
}
function beginEmerge(pk) {
  var sy = pickSaying(pickTier); launch(sy, false); Snd.chime(false);
  emerge = { t0: performance.now(), from: { x: pk.x, y: pk.y }, y0: yaw, k0: pk.k || 36 };
  setMode('emerge');
}
function goPlay() { setMode('play'); camPlay(); }
function resume() { launch(byId[SAVE.active], false); camPlay(); setMode('play'); yaw = -0.6; pitch = 0.5; }
function goDone() {
  var sy = cube.saying; setMode('done');
  $('dtag').textContent = TRAD[sy.trad] + ' · ' + G.TIERS[sy.tier - 1].name; $('dsy').textContent = sy.text; $('dby').textContent = '— ' + sy.by;
}
function completeCube() {
  if (cube.tut) { return; }
  if (!cube.replay) { var rec = SAVE.cubes[cube.saying.id]; rec.done = true; rec.found = cube.words.slice(); SAVE.active = null; save(); }
  Snd.chime(true);
  setTimeout(function () { if (cube && mode === 'play') goDone(); }, 1300);
}

/* ---------- selecting words ---------- */
function rev(s) { return s.split('').reverse().join(''); }
function linesBetween(a, b) {
  var out = [], N = cube.N;
  for (var d = 0; d < 8; d++) { var seq = cube.geo.walk(a, cube.geo.DIRS[d], 4 * N), k = seq.indexOf(b); if (k > 0) out.push(seq.slice(0, k + 1)); }
  return out;
}
function tryMatch(a, b) {
  var cands = linesBetween(a, b), fm = foundMap();
  for (var i = 0; i < cands.length; i++) {
    var s = cands[i].map(function (c) { return cube.letters[c]; }).join('');
    for (var j = 0; j < cube.words.length; j++) { var w = cube.words[j]; if (!fm[w] && (s === w || s === rev(w))) return { w: w, seq: cands[i], ci: j, t0: performance.now() }; }
  }
  cands.sort(function (x, y) { return x.length - y.length; });
  cube.flash = cands.length ? { seq: cands[0], t0: performance.now() } : null;
  return null;
}
function tapCell(c) {
  if (c < 0 || !cube) return;
  if (mode === 'tut') return tutTap(c);
  if (mode !== 'play') return;
  if (cube.startCell === null) { cube.startCell = c; Snd.tick(); return; }
  if (cube.startCell === c) { cube.startCell = null; return; }
  var hit = tryMatch(cube.startCell, c); cube.startCell = null;
  if (hit) onFound(hit); else Snd.soft();
}
function onFound(hit) {
  cube.found.push(hit); cube.lastProg = performance.now(); lastFoundWord = hit.w; renderSaying(); saveProgress();
  $('bhint').classList.remove('pulse'); if (cube.hintCell >= 0) cube.hintCell = -1;
  if (cube.found.length === cube.words.length) completeCube(); else Snd.chime(false);
}

/* ---------- view animation ---------- */
function animateTo(y1, p1, dur, cb) {
  if (y1 === null || y1 === undefined) y1 = yaw;
  var d = wrapPi(y1 - yaw); anim = { t0: performance.now(), dur: dur, y0: yaw, y1: yaw + d, p0: pitch, p1: pitch + wrapPi(p1 - pitch), cb: cb };
}
function viewForSeq(seq) { return G.viewFor(cube.geo, seq); }
function softPitch(v) { return Math.abs(v.pitch) > 1.0 ? v.pitch * 0.9 : clamp(v.pitch * 0.5 + 0.22, -1.2, 1.2); }

/* ---------- hints ---------- */
function updateHint() { $('hn').textContent = SAVE.hints.n; $('bhint').classList.toggle('zero', SAVE.hints.n <= 0); }
function useHint() {
  Snd.wake();
  if (mode !== 'play' || !cube || anim) return;
  var tg = nextTarget(); if (!tg) return;
  if (SAVE.hints.n <= 0) { $('bhint').style.animation = 'shake .4s'; setTimeout(function () { $('bhint').style.animation = ''; }, 420); return; }
  SAVE.hints.n--; save(); updateHint(); $('bhint').classList.remove('pulse');
  var seq = cube.place[tg], v = viewForSeq(seq[0]);
  cube.startCell = null; cube.hintCell = seq[0]; cube.hintUntil = performance.now() + 6000;
  animateTo(v.yaw, softPitch(v), 800);
}

/* ---------- tutorial ---------- */
function capText(t) { var c = $('cap'); c.textContent = t; c.classList.add('on'); }
function capOff() { $('cap').classList.remove('on'); }
function startTutorial() {
  Snd.wake(); var geo = geos[5], t = G.buildTutorial(geo);
  cube = { saying: { id: 'tut', tier: 2, trad: 'jp', text: 'Find line down slant cross', by: '' }, tier: { n: 5 }, geo: geo, N: 5, letters: t.letters, place: t.place, words: t.words, tokens: t.tokens, found: [], startCell: null, flash: null, hintCell: -1, hintUntil: 0, tut: true, lastProg: performance.now() };
  curTrad = 'jp'; Snd.setScale('jp'); camPlay(); setMode('tut'); tut = { i: 0, phase: 'start', target: -1, fingerOn: false };
  renderSaying(); setView(yaw = -0.6, pitch = 0.5); tutStep();
}
function tutWord() { var w = cube.words[tut.i]; return { w: w, seq: cube.place[w] }; }
function tutStep() {
  var tw = tutWord(), seq = tw.seq, crossing = cube.geo.crosses(seq), a = seq[0], b = seq[seq.length - 1];
  tut.target = tut.phase === 'start' ? a : b; tut.fingerOn = false;
  capText(tut.phase === 'start' ? 'Tap the first letter of ' + tw.w : (crossing ? 'Turn to the last letter, then tap it' : 'Now tap the last letter'));
  var viewCell = !crossing ? seq[(seq.length - 1) >> 1] : (tut.phase === 'start' ? a : b);
  var v = viewForSeq(viewCell);
  if (!crossing && tut.phase === 'end') { tut.fingerOn = true; return; }
  animateTo(v.yaw, softPitch(v), 900, function () { tut.fingerOn = true; });
}
function tutTap(c) {
  if (anim) return;
  if (c !== tut.target) { var cp = $('cap'); cp.classList.remove('shake'); void cp.offsetWidth; cp.classList.add('shake'); return; }
  if (tut.phase === 'start') { cube.startCell = c; Snd.tick(); tut.phase = 'end'; tutStep(); return; }
  var hit = tryMatch(cube.startCell, c); cube.startCell = null;
  if (!hit) { tut.phase = 'start'; tutStep(); return; }
  cube.found.push(hit); lastFoundWord = hit.w; renderSaying(); Snd.chime(false); tut.fingerOn = false; $('finger').classList.remove('on');
  tut.i++;
  if (tut.i >= cube.words.length) { setTimeout(tutDone, 900); capText('Well done'); }
  else { tut.phase = 'start'; setTimeout(function () { if (mode === 'tut') tutStep(); }, 900); }
}
function tutDone() {
  var first = !SAVE.tutorial; SAVE.tutorial = true; save(); capOff();
  if (first) goPick(1, 'tut'); else goStart();
}
bskip.addEventListener('click', function () { SAVE.tutorial = true; save(); cube = null; goStart(); });

/* ---------- input ---------- */
function lp(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
function hit(x, y) {
  var best = -1, bd = 1e9;
  for (var i = 0; i < drawn.length; i++) {
    var d = drawn[i]; if (d.fac < 0.2) continue;
    var dist = Math.hypot(d.x - x, d.y - y), rad = Math.max(d.px * 0.5, 15);
    if (dist < rad) { var s = dist - d.z * 6; if (s < bd) { bd = s; best = d.c; } }
  }
  return best;
}
function controlsActive() { return mode === 'play' && !anim; }
function yawSign() { return R[4] >= 0 ? 1 : -1; }
function angRing(p) { return Math.atan2(p.x - CX, -(p.y - CY)); }
cv.addEventListener('pointerdown', function (e) {
  Snd.wake(); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (anim || mode === 'emerge') { drag = null; return; }
  var p = lp(e); drag = { id: e.pointerId, x0: p.x, y0: p.y, x: p.x, y: p.y, t0: performance.now(), moved: false, type: 'cube' };
  vyaw = vpitch = 0; touched = true;
  if (controlsActive()) {
    var rd = ringDot(), td = tiltDot();
    if (Math.hypot(p.x - rd.x, p.y - rd.y) < 28) { drag.type = 'ring'; drag.moved = true; drag.a = angRing(p); }
    else if (Math.hypot(p.x - td.x, p.y - td.y) < 26) { drag.type = 'tilt'; drag.moved = true; drag.a = Math.atan2(-(p.y - CY), p.x - CX); }
  }
});
cv.addEventListener('pointermove', function (e) {
  var p = lp(e);
  if (drag && drag.id === e.pointerId) {
    if (drag.type === 'ring') { var a = angRing(p); yaw += wrapPi(a - drag.a); drag.a = a; }
    else if (drag.type === 'tilt') { var al = Math.atan2(-(p.y - CY), p.x - CX); pitch = wrapPi(pitch + wrapPi(al - drag.a)); drag.a = al; }
    else {
      if (!drag.moved && Math.hypot(p.x - drag.x0, p.y - drag.y0) > 7) drag.moved = true;
      if (drag.moved && (mode === 'play' || mode === 'start')) {
        var dx = p.x - drag.x, dy = p.y - drag.y;
        var ys = yawSign(); yaw += dx * 0.0125 * ys; pitch = wrapPi(pitch + dy * 0.0125);
        vyaw = dx * 0.0125 * ys * 0.6 + vyaw * 0.4; vpitch = dy * 0.0125 * 0.6 + vpitch * 0.4; drag.last = performance.now();
      }
    }
    drag.x = p.x; drag.y = p.y;
  } else if (e.pointerType === 'mouse' && (mode === 'play' || mode === 'tut')) hover = hit(p.x, p.y);
});
function endDrag(e, cancel) {
  if (!drag || drag.id !== e.pointerId) return;
  var d = drag; drag = null; if (cancel) return;
  if (d.type === 'ring') {
    var nr = Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(yaw - nr) < 0.12) animateTo(nr, pitch, 260);
    return;
  }
  if (d.type === 'tilt') {
    var nt = Math.round(pitch / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(pitch - nt) < 0.12) animateTo(yaw, nt, 260);
    return;
  }
  if (!d.moved && performance.now() - d.t0 < 700) {
    var p = lp(e);
    if (mode === 'pick') pickTap(p); else if (mode === 'start') startTap(p); else if (mode === 'play' || mode === 'tut') tapCell(hit(p.x, p.y));
  } else if (!d.last || performance.now() - d.last > 90) { vyaw = vpitch = 0; }
}
cv.addEventListener('pointerup', function (e) { endDrag(e, false); });
cv.addEventListener('pointercancel', function (e) { endDrag(e, true); });
cv.addEventListener('pointerleave', function () { hover = -1; });
addEventListener('keydown', function (e) {
  if (mode !== 'play') { if (e.key === 'Escape') $('detail').classList.remove('on'); return; }
  if (e.key === 'ArrowLeft') vyaw -= 0.05 * yawSign(); else if (e.key === 'ArrowRight') vyaw += 0.05 * yawSign();
  else if (e.key === 'ArrowUp') vpitch -= 0.05; else if (e.key === 'ArrowDown') vpitch += 0.05; else return;
  touched = true; Snd.wake();
});

/* ---------- buttons ---------- */
$('bplay').addEventListener('click', function () { Snd.wake(); if (canResume()) resume(); });
$('bhome').addEventListener('click', function () { goStart(); });
$('bhelp').addEventListener('click', function () { startTutorial(); });
$('bhint').addEventListener('click', useHint);
$('bcards').addEventListener('click', goCards);
$('ccls').addEventListener('click', goStart);
$('dnext').addEventListener('click', goTier);
$('dcards').addEventListener('click', goCards);
$('xcls').addEventListener('click', function () { $('detail').classList.remove('on'); });
$('bsnd').addEventListener('click', function () { Snd.set(!Snd.on); SAVE.sound = Snd.on; save(); });
function drawSnd() {
  $('isnd').innerHTML = Snd.on ? '<circle cx="11" cy="11" r="2.4" fill="#f4ead5" stroke="none"/><circle cx="11" cy="11" r="6.2" opacity=".6"/><circle cx="11" cy="11" r="9.6" opacity=".3"/>' : '<circle cx="11" cy="11" r="6.2" opacity=".6"/><path d="M5 17 L17 5" opacity=".8"/>';
}
Snd.on = SAVE.sound !== false; Snd.onchange = drawSnd; drawSnd();

function miniSvg(col) {
  return '<svg width="58" height="74" viewBox="40 60 80 100"><polygon points="80,80 106,95 80,110 54,95" fill="#f6efe0"/><polygon points="54,95 80,110 80,140 54,125" fill="#e8dcc2"/><polygon points="80,110 106,95 106,125 80,140" fill="#d9ccb0"/><circle cx="80" cy="110" r="6" fill="' + col + '" opacity=".9"/></svg>';
}
function goCards() {
  setMode('cards'); var n = 0, html = '';
  SAYINGS.forEach(function (s) {
    var d = SAVE.cubes[s.id] && SAVE.cubes[s.id].done, tn = G.TIERS[s.tier - 1].name;
    if (d) { n++; html += '<div class="cd" data-id="' + s.id + '"><div class="bd" style="background:' + TRAD_COL[s.trad] + '"></div>' + miniSvg(TRAD_COL[s.trad]) + '<small>' + tn + '</small></div>'; }
    else html += '<div class="cd l">?<small>' + tn + '</small></div>';
  });
  $('cgrid').innerHTML = html; $('chd').textContent = 'YOUR CARDS · ' + n + ' / ' + SAYINGS.length;
  Array.prototype.slice.call($('cgrid').querySelectorAll('.cd[data-id]')).forEach(function (el) { el.addEventListener('click', function () { openDetail(el.getAttribute('data-id')); }); });
}
function openDetail(id) {
  var s = byId[id]; $('xtag').textContent = TRAD[s.trad] + ' · ' + G.TIERS[s.tier - 1].name; $('xsy').textContent = s.text; $('xby').textContent = '— ' + s.by;
  $('xplay').onclick = function () { $('detail').classList.remove('on'); launch(s, true); camPlay(); setMode('play'); setView(yaw = -0.6, pitch = 0.5); };
  $('detail').classList.add('on');
}

/* ---------- frame ---------- */
var sceneKey = 'jp';
function frame(t) {
  requestAnimationFrame(frame); now = performance.now();
  if (anim) {
    var u = clamp((now - anim.t0) / anim.dur, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    yaw = anim.y0 + (anim.y1 - anim.y0) * e; pitch = anim.p0 + (anim.p1 - anim.p0) * e;
    if (u >= 1) { var cb = anim.cb; anim = null; if (cb) cb(); }
  } else if (!drag || !drag.moved || drag.type !== 'cube') {
    if (mode === 'start' || mode === 'tier') { yaw += 0.003 + vyaw; pitch = wrapPi(pitch + vpitch); vyaw *= 0.95; vpitch *= 0.95; }
    else if (mode === 'play' && Math.abs(vyaw) + Math.abs(vpitch) > 0.0004) { yaw += vyaw; pitch = wrapPi(pitch + vpitch); vyaw *= 0.94; vpitch *= 0.94; }
  }
  /* emerge */
  if (mode === 'emerge' && emerge) {
    var eu = clamp((now - emerge.t0) / 900, 0, 1), ee = 1 - Math.pow(1 - eu, 3);
    CX = lerp(emerge.from.x, 195, ee); CY = lerp(emerge.from.y, 372, ee); K = lerp(emerge.k0, 80, ee); yaw = -0.6 + (1 - ee) * 6.2832; pitch = 0.5;
    if (eu >= 1) { emerge = null; camPlay(); yaw = -0.6; pitch = 0.5; setMode('play'); }
  }
  setView(yaw, pitch);
  if (cube && cube.hintCell >= 0 && now > cube.hintUntil) cube.hintCell = -1;
  if (mode === 'play' && cube && !cube.tut && SAVE.hints.n > 0 && now - cube.lastProg > 30000) $('bhint').classList.add('pulse');
  sceneKey = (mode === 'play' || mode === 'tut' || mode === 'done' || mode === 'emerge') && cube ? curTrad : (mode === 'cards' ? 'jp' : 'jp');
  if (!sceneCv[sceneKey]) sceneCv[sceneKey] = paintScene(sceneKey);
  ctx.setTransform(q, 0, 0, q, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(sceneCv[sceneKey], 0, 0, W, H);
  ctx.fillStyle = PAL[sceneKey].part;
  parts.forEach(function (p) { p.y += p.vy; p.x += Math.sin(now / 1800 + p.ph) * 0.25; if (p.y > 620) { p.y = -10; } ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill(); });
  ctx.globalAlpha = 1;
  if (mode === 'start') {
    drawGlow(1); drawSwarm(1, -1);
  } else if (mode === 'tier' && sel) {
    var hh = smooth((now - sel.t0) / 800), mc = ctx;
    ctx = hctx; hctx.setTransform(HS, 0, 0, HS, 0, 0); hctx.clearRect(0, 0, W, H); drawGlow(1); drawSwarm(1, sel.i); ctx = mc;
    if (hh < 1) { drawGlow(1 - hh); drawSwarm(1 - hh, sel.i); }
    ctx.globalAlpha = hh; ctx.drawImage(hz, 0, 0, W, H); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(18,14,44,' + (0.4 * hh) + ')'; ctx.fillRect(0, 0, W, H);
    drawMini(sel.i, { x: lerp(sel.x0, 195, hh), y: lerp(sel.y0, 290, hh), k: lerp(sel.k0, 64, hh), col: sel.col }, now);
  } else if (mode === 'pick') {
    picks.forEach(function (p, i) { drawMini(i, p, now); });
  } else if ((mode === 'play' || mode === 'tut' || mode === 'done' || mode === 'emerge') && cube) {
    ctx.fillStyle = 'rgba(15,14,40,.35)'; ctx.beginPath(); ctx.ellipse(195, 548, 72 * (K / 80), 8, 0, 0, 6.3); ctx.fill();
    var ea = mode === 'emerge' ? clamp((now - emerge.t0) / 900 * 1.4 - 0.2, 0, 1) : 1;
    drawCube({ geo: cube.geo, letters: cube.letters, found: cube.found, flash: cube.flash, startCell: cube.startCell, hintCell: cube.hintCell, alpha: mode === 'emerge' ? 1 : 1, letterFade: ea });
    if (mode === 'play') drawControls();
  } else drawn.length = 0;
  /* finger */
  var fg = $('finger');
  if (mode === 'tut' && tut && tut.fingerOn && !anim) {
    var cell = cube.geo.cells[tut.target], pp = projD(cell.p, cube.N);
    var vis = FD[cell.f] > 0.2; fg.style.left = pp.x + 'px'; fg.style.top = pp.y + 'px'; fg.classList.toggle('on', vis);
  } else fg.classList.remove('on');
}

/* ---------- boot ---------- */
refill(); setInterval(refill, 60000); document.addEventListener('visibilitychange', function () { if (!document.hidden) refill(); });
goStart(); requestAnimationFrame(frame);
window.__mc = {
  get mode() { return mode; }, get cube() { return cube; }, get save() { return SAVE; }, get tut() { return tut; }, get view() { return { yaw: yaw, pitch: pitch }; },
  setView: function (y, p) { yaw = y; pitch = p; anim = null; }, tapCell: tapCell, project: function (c) { var p = projD(cube.geo.cells[c].p, cube.N); return { x: p.x, y: p.y, fac: FD[cube.geo.cells[c].f] }; },
  cellN: function (c) { var p = cube.geo.cells[c].p, N = cube.N; return [(p[0] - N) / N, (p[1] - N) / N, (p[2] - N) / N]; },
  frontCube: function () { var b = null; swarm.forEach(function (c) { if (c.sx != null && !c.orb && (!b || c.sz > b.sz)) b = c; }); return { x: b.sx, y: b.sy }; }, ringDot: ringDot, tiltDot: tiltDot, refill: refill, launch: function (id) { launch(byId[id], false); camPlay(); setMode('play'); setView(yaw = -0.6, pitch = 0.5); }, get anim() { return !!anim; }
};
})();
