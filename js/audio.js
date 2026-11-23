// Light generated music: a quiet drone, sparse pentatonic plucks, and soft chimes. Starts after the first touch.
(function (root) {
  var SCALES = {
    jp: [-12, -10, -9, -5, -4, 0, 2, 3, 7, 8, 12, 14, 15],
    cn: [-12, -10, -6, -3, -1, 0, 2, 4, 7, 9, 12, 14, 16],
    pali: [-12, -10, -7, -5, -3, 0, 2, 5, 7, 9, 12, 14, 17]
  };
  function freqs(k) { return SCALES[k].map(function (s) { return 293.66 * Math.pow(2, s / 12); }); }
  var Snd = {
    ctx: null, on: true, started: false, master: null, bus: null, dry: null, verb: null, timer: null, sc: freqs('jp'), onchange: null,
    setScale: function (k) { this.sc = freqs(SCALES[k] ? k : 'jp'); },
    wake: function () {
      try {
        if (!this.ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); this.build(); }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.on && !this.started) this.start();
      } catch (e) {}
    },
    build: function () {
      var c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(c.destination);
      var comp = c.createDynamicsCompressor(); comp.connect(this.master); this.bus = comp;
      this.dry = c.createGain(); this.dry.gain.value = 0.7; this.dry.connect(this.bus);
      var conv = c.createConvolver(), len = Math.floor(c.sampleRate * 3.8), buf = c.createBuffer(2, len, c.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
      conv.buffer = buf; var wet = c.createGain(); wet.gain.value = 0.8; conv.connect(wet); wet.connect(this.bus); this.verb = conv;
    },
    start: function () {
      var c = this.ctx, self = this; this.started = true;
      this.master.gain.setTargetAtTime(0.9, c.currentTime, 1.2);
      [[73.42, 0.022], [110, 0.014], [146.83, 0.007]].forEach(function (x) {
        var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = x[0];
        var g = c.createGain(); g.gain.value = x[1];
        var l = c.createOscillator(); l.frequency.value = 0.05 + Math.random() * 0.06;
        var lg = c.createGain(); lg.gain.value = x[1] * 0.6; l.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(self.dry); g.connect(self.verb); o.start(); l.start();
      });
      this.loop();
    },
    note: function (f, vol, dur, when) {
      var c = this.ctx, t = c.currentTime + (when || 0);
      var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      var o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
      var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var g2 = c.createGain(); g2.gain.value = 0.25;
      var lpf = c.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2600;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lpf); lpf.connect(this.dry); lpf.connect(this.verb);
      o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    },
    loop: function () {
      var self = this; clearTimeout(this.timer);
      if (!this.on || !this.ctx) return;
      var pick = function () { return self.sc[Math.floor(Math.random() * self.sc.length)]; };
      this.note(pick(), 0.05 + 0.03 * Math.random(), 3.4);
      if (Math.random() < 0.35) this.note(pick(), 0.035, 3.6, 0.4 + Math.random() * 0.6);
      this.timer = setTimeout(function () { self.loop(); }, 1700 + Math.random() * 3300);
    },
    ok: function () { return this.ctx && this.on && this.started; },
    tick: function () { if (this.ok()) this.note(this.sc[8 + Math.floor(Math.random() * 3)], 0.045, 1.1); },
    soft: function () { if (this.ok()) this.note(this.sc[1], 0.05, 1.4); },
    chime: function (big) {
      if (!this.ok()) return;
      var base = 5 + Math.floor(Math.random() * 2), n = big ? 5 : 3;
      for (var i = 0; i < n; i++) this.note(this.sc[Math.min(this.sc.length - 1, base + i)], big ? 0.085 : 0.075, big ? 4.2 : 2.8, i * (big ? 0.2 : 0.13));
    },
    set: function (v) {
      this.on = v;
      if (this.onchange) this.onchange(v);
      if (!this.ctx) { if (v) this.wake(); return; }
      this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.25);
      if (v) { if (!this.started) this.start(); else this.loop(); } else clearTimeout(this.timer);
    }
  };
  document.addEventListener('visibilitychange', function () {
    if (!Snd.ctx) return; if (document.hidden) Snd.ctx.suspend(); else if (Snd.on) Snd.ctx.resume();
  });
  root.Snd = Snd;
})(typeof window !== 'undefined' ? window : this);
