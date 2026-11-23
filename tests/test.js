// Run: node tests/test.js  — geometry, generator and content checks.
var assert = require('assert');
var makeGeometry = require('../js/core.js').makeGeometry;
var G = require('../js/gen.js');
var SAYINGS = require('../js/sayings.js').SAYINGS;
var geos = { 4: makeGeometry(4), 5: makeGeometry(5) };

[4, 5].forEach(function (N) {
  var geo = geos[N], bad = 0;
  for (var s = 0; s < geo.cells.length; s++) for (var d = 0; d < 8; d++) {
    var seq = geo.walk(s, geo.DIRS[d], 4 * N);
    if (seq.length < 2) continue;
    var e = seq[seq.length - 1], ok = false;
    for (var d2 = 0; d2 < 8 && !ok; d2++) {
      var back = geo.walk(e, geo.DIRS[d2], seq.length);
      if (back.length === seq.length && back.every(function (c, k) { return c === seq[seq.length - 1 - k]; })) ok = true;
    }
    if (!ok) bad++;
  }
  assert.strictEqual(bad, 0, 'irreversible lines on N=' + N);
  for (var s2 = 0; s2 < geo.cells.length; s2++) for (var d3 = 0; d3 < 4; d3++) assert.strictEqual(geo.walk(s2, geo.DIRS[d3], 99).length, 4 * N);
});
console.log('geometry ok');

var ids = {};
SAYINGS.forEach(function (sy) {
  assert(!ids[sy.id], 'dup id ' + sy.id); ids[sy.id] = 1;
  var tier = G.TIERS[sy.tier - 1], geo = geos[tier.n];
  var a = G.buildCube(sy, geo, tier), b = G.buildCube(sy, geo, tier);
  assert(a, 'generation failed ' + sy.id);
  assert.strictEqual(a.letters, b.letters, 'not deterministic ' + sy.id);
  assert.strictEqual(a.letters.length, geo.cells.length);
  a.words.forEach(function (w) {
    var seq = a.place[w];
    assert(seq && seq.length === w.length, 'missing ' + w);
    assert.strictEqual(seq.map(function (c) { return a.letters[c]; }).join(''), w, 'letters mismatch ' + w);
    assert(w.length <= 4 * tier.n - 1);
  });
  var diag = 0, cross = 0;
  a.words.forEach(function (w) { if (geo.crosses(a.place[w])) cross++; });
  console.log(sy.id, 'tier', sy.tier, 'words', a.words.length, 'cross', cross, 'attempt', a.attempt);
});
var t = G.buildTutorial(geos[5]);
assert(t, 'tutorial failed');
G.TUT_WORDS.forEach(function (w) { assert.strictEqual(t.place[w].map(function (c) { return t.letters[c]; }).join(''), w); });
console.log('tutorial ok attempt', t.attempt, 'sayings', SAYINGS.length);
