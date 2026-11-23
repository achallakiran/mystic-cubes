// Cube surface geometry: cells, straight lines (incl. across edges), shared by generator and game.
(function (root) {
  function makeGeometry(N) {
    const D = 2 * N; // doubled units: cube spans [0, D]
    const defs = [[0, 1], [0, 0], [1, 1], [1, 0], [2, 1], [2, 0]]; // [normal axis, side]
    const cells = [];
    const index = new Map();
    for (let f = 0; f < 6; f++) {
      const a = defs[f][0], s = defs[f][1];
      const u = (a + 1) % 3, v = (a + 2) % 3;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const p = [0, 0, 0];
        p[a] = s ? D : 0; p[u] = 2 * i + 1; p[v] = 2 * j + 1;
        index.set(p.join(','), cells.length);
        cells.push({ f: f, i: i, j: j, p: p, a: a, u: u, v: v });
      }
    }
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

    function faceAxis(p) {
      for (let c = 0; c < 3; c++) if (p[c] === 0 || p[c] === D) return c;
      return -1;
    }
    // One step along direction d (3-vector, doubled units). Unfolds across edges; null at corners.
    function step(p, d) {
      const a = faceAxis(p);
      const q = [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
      const over = [];
      for (let c = 0; c < 3; c++) {
        if (c === a) continue;
        if (q[c] < 0 || q[c] > D) over.push(c);
      }
      if (over.length === 0) return { p: q, d: d };
      if (over.length > 1) return null; // corner vertex: no straight continuation
      const c = over[0];
      const B = q[c] < 0 ? 0 : D;
      const o = Math.abs(q[c] - B);
      const mag = Math.abs(d[c]);
      const nd = d.slice();
      nd[c] = 0;
      if (p[a] === D) { q[a] = D - o; nd[a] = -mag; } else { q[a] = o; nd[a] = mag; }
      q[c] = B;
      return { p: q, d: nd };
    }
    function walk(start, dir, maxLen) {
      const c = cells[start];
      let cd = [0, 0, 0];
      cd[c.u] = 2 * dir[0]; cd[c.v] = 2 * dir[1];
      let p = c.p.slice();
      const seq = [start];
      const seen = new Set(seq);
      while (seq.length < maxLen) {
        const r = step(p, cd);
        if (!r) break;
        const k = index.get(r.p.join(','));
        if (k === undefined || seen.has(k)) break;
        seq.push(k); seen.add(k);
        p = r.p; cd = r.d;
      }
      return seq;
    }
    // point on the shared edge between two consecutive cells on different faces (doubled coords), else null
    function edgePoint(i, j) {
      const A = cells[i], B = cells[j];
      if (A.f === B.f) return null;
      const a = A.a, c = B.a, b = 3 - a - c;
      const e = [0, 0, 0];
      e[a] = A.p[a]; e[c] = B.p[c]; e[b] = (A.p[b] + B.p[b]) / 2;
      return e;
    }
    function crosses(seq) {
      for (let k = 1; k < seq.length; k++) if (cells[seq[k]].f !== cells[seq[0]].f) return true;
      return false;
    }
    return { N: N, D: D, cells: cells, index: index, DIRS: DIRS, walk: walk, edgePoint: edgePoint, crosses: crosses };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { makeGeometry: makeGeometry };
  else root.makeGeometry = makeGeometry;
})(typeof window !== 'undefined' ? window : this);
