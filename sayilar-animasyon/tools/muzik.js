// Animasyonun zaman çizelgesine göre bestelenmiş özgün müzik (hazır örnek / kütüphane yok).
// 100 BPM, 4/4, 48 ölçü. Bölüm sınırları src/zaman.js ile aynı.
// Çıktı: muzik.wav (44.1 kHz, 16 bit, stereo) -> build sırasında muzik.m4a'ya çevrilir.
'use strict';
const fs = require('fs');
const path = require('path');
const Z = require('../src/zaman.js');

const SR = 44100;
const BEAT = 60 / Z.BPM;
const BAR = BEAT * 4;
const TAIL = 3.0;
const N = Math.ceil((Z.TOPLAM_OLCU * BAR + TAIL) * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const revL = new Float32Array(N), revR = new Float32Array(N); // reverb gönderimi

// Tohumlu rastgele sayı
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const t2i = t => Math.floor(t * SR);

function add(buf, i, v) { if (i >= 0 && i < N) buf[i] += v; }
function put(i, v, pan, send) {
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  add(L, i, v * gl); add(R, i, v * gr);
  if (send) { add(revL, i, v * gl * send); add(revR, i, v * gr * send); }
}

// ---------- Enstrümanlar ----------
function kick(t, g = 1) {
  const i0 = t2i(t), len = t2i(0.45);
  let ph = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const f = 48 + 110 * Math.exp(-x * 28);
    ph += 2 * Math.PI * f / SR;
    const env = Math.exp(-x * 7.5);
    const click = k < 60 ? (1 - k / 60) * 0.25 : 0;
    put(i0 + k, (Math.sin(ph) * env + click) * 0.85 * g, 0, 0);
  }
}
function clap(t, g = 1) {
  const i0 = t2i(t), len = t2i(0.28);
  let lp = 0, prev = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const n = rnd() * 2 - 1;
    // basit bant geçiren: yüksek geçiren + alçak geçiren
    const hp = n - prev; prev = n;
    lp += (hp - lp) * 0.35;
    const burst = (x < 0.03 ? (Math.floor(x / 0.01) % 2 === 0 ? 1 : 0.4) : 1);
    const env = Math.exp(-x * 18) * burst;
    put(i0 + k, lp * env * 0.55 * g, 0.1, 0.35);
  }
}
function hat(t, g = 1, open = false) {
  const i0 = t2i(t), len = t2i(open ? 0.22 : 0.06);
  let prev = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const n = rnd() * 2 - 1;
    const hp = n - prev; prev = n;
    const env = Math.exp(-x * (open ? 14 : 70));
    put(i0 + k, hp * env * 0.16 * g, -0.3, 0.05);
  }
}
function crash(t, g = 1) {
  const i0 = t2i(t), len = t2i(2.2);
  let prev = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const n = rnd() * 2 - 1;
    const hp = n - prev; prev = n;
    const env = Math.exp(-x * 2.2);
    put(i0 + k, hp * env * 0.13 * g, 0.4, 0.4);
  }
}
function riser(t0, t1, g = 1) {
  const i0 = t2i(t0), len = t2i(t1 - t0);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const p = k / len;
    const n = rnd() * 2 - 1;
    lp += (n - lp) * (0.02 + p * 0.5);
    put(i0 + k, lp * p * p * 0.22 * g, 0, 0.5);
  }
}
function pluck(t, midi, dur, g = 1, pan = 0.2) {
  const i0 = t2i(t), len = t2i(dur + 0.6);
  const f = mtof(midi);
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const env = Math.min(1, x * 400) * Math.exp(-x * 5.5);
    const s = Math.sin(2 * Math.PI * f * x) * 0.7 + Math.sin(4 * Math.PI * f * x) * 0.2 * Math.exp(-x * 12)
      + Math.sin(6 * Math.PI * f * x) * 0.08 * Math.exp(-x * 20);
    put(i0 + k, s * env * 0.26 * g, pan, 0.3);
  }
}
function bell(t, midi, g = 1) { // final için çan benzeri (FM)
  const i0 = t2i(t), len = t2i(3.5);
  const f = mtof(midi);
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const env = Math.min(1, x * 300) * Math.exp(-x * 1.4);
    const s = Math.sin(2 * Math.PI * f * x + 1.8 * Math.exp(-x * 2) * Math.sin(2 * Math.PI * f * 3.5 * x));
    put(i0 + k, s * env * 0.16 * g, -0.2, 0.5);
  }
}
function bass(t, midi, dur, g = 1) {
  const i0 = t2i(t), len = t2i(dur);
  const f = mtof(midi);
  let lp = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const rel = Math.min(1, (len - k) / (SR * 0.03));
    const env = Math.min(1, x * 200) * (0.75 + 0.25 * Math.exp(-x * 6)) * rel;
    const raw = Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sign(Math.sin(2 * Math.PI * f * x));
    lp += (raw - lp) * 0.08;
    put(i0 + k, lp * env * 0.34 * g, 0, 0);
  }
}
function pad(t, notes, dur, g = 1, bright = 0.06) {
  const i0 = t2i(t), len = t2i(dur);
  const voices = [];
  notes.forEach(m => [-0.08, 0.08].forEach(d => voices.push({ f: mtof(m + d), ph: rnd() })));
  let lpL = 0, lpR = 0;
  for (let k = 0; k < len; k++) {
    const x = k / SR;
    const att = Math.min(1, x / 0.35), rel = Math.min(1, (len - k) / (SR * 0.4));
    let sl = 0, sr = 0;
    voices.forEach((v, j) => {
      const ph = (v.ph + v.f * x) % 1;
      const saw = 2 * ph - 1;
      if (j % 2) sr += saw; else sl += saw;
    });
    lpL += (sl - lpL) * bright; lpR += (sr - lpR) * bright;
    const e = att * rel * 0.05 * g;
    add(L, i0 + k, lpL * e); add(R, i0 + k, lpR * e);
    add(revL, i0 + k, lpL * e * 0.4); add(revR, i0 + k, lpR * e * 0.4);
  }
}

// ---------- Armoni ----------
// F - C - Dm - Bb (I V vi IV), her akor 1 ölçü
const PROG = [
  { root: 41, tri: [65, 69, 72] },       // F
  { root: 36, tri: [64, 67, 72] },       // C (E G C)
  { root: 38, tri: [65, 69, 74] },       // Dm (F A D)
  { root: 34, tri: [65, 70, 74] },       // Bb (F Bb D)
];
const PENTA = [65, 67, 69, 72, 74, 77, 79, 81]; // F majör pentatonik

function melodyBar(bar, density, octave = 0, g = 1, pan = 0.25) {
  const t0 = bar * BAR;
  const ch = PROG[bar % 4];
  for (let s = 0; s < 8; s++) {
    if (rnd() > density) continue;
    let m = PENTA[Math.floor(rnd() * PENTA.length)];
    if (s % 4 === 0) m = ch.tri[Math.floor(rnd() * 3)] + 12; // güçlü zamanlarda akor notası
    pluck(t0 + s * BEAT / 2, m + octave, BEAT / 2, g * (s % 2 ? 0.75 : 1), pan);
  }
}

function drums(bar, opt = {}) {
  const t0 = bar * BAR;
  for (let b = 0; b < 4; b++) {
    const t = t0 + b * BEAT;
    if (opt.kick !== false && (b === 0 || b === 2 || (opt.fourFloor))) kick(t, opt.kg || 1);
    if (opt.kick !== false && b === 2 && opt.extraKick) kick(t + BEAT / 2, 0.6);
    if (opt.clap !== false && (b === 1 || b === 3)) clap(t, opt.cg || 1);
    if (opt.hat !== false) {
      const sub = opt.hat16 ? 4 : 2;
      for (let s = 0; s < sub; s++) hat(t + s * BEAT / sub, (s === 0 ? 0.6 : 1) * (opt.hg || 1), opt.openOff && s === sub / 2);
    }
  }
}

// ---------- Düzenleme (bölümler src/zaman.js ile senkron) ----------
const S = Z.BOLUMLER; // [{ad, bas, bit}] ölçü cinsinden
const sec = ad => S.find(s => s.ad === ad);

// 0) KANCA: tik-tak gerilim, 3. ölçüde bas, 4. ölçü sonunda riser
{
  const k = sec('kanca');
  for (let bar = k.bas; bar < k.bit; bar++) {
    const t0 = bar * BAR;
    for (let s = 0; s < 8; s++) hat(t0 + s * BEAT / 2, 0.8 + (bar - k.bas) * 0.15);
    // koşu: 1. ve 2. ölçüde hızlanan kick
    if (bar < k.bas + 2) { for (let b = 0; b < 4; b++) kick(t0 + b * BEAT, 0.55 + 0.1 * b); }
    else { drums(bar, { clap: bar === k.bit - 1 }); bass(t0, PROG[bar % 4].root, BAR * 0.95, 0.8); }
    pad(t0, PROG[bar % 4].tri, BAR, 0.6 + 0.2 * (bar - k.bas), 0.03);
  }
  // Bolt çizgiyi geçerken (ölçü 1, 1. vuruş = 2,4 sn) vurgu
  crash(k.bas * BAR + BAR, 0.8);
  pluck(k.bas * BAR + BAR, 77, 0.4, 1.2);
  riser((k.bit - 1) * BAR, k.bit * BAR, 1.2);
}

function groove(ad, o) {
  const s = sec(ad);
  for (let bar = s.bas; bar < s.bit; bar++) {
    const rel = bar - s.bas;
    const t0 = bar * BAR;
    const ch = PROG[bar % 4];
    const breakdown = o.breakdown && rel < 2;
    drums(bar, { kick: !breakdown, clap: !breakdown, hat16: o.hat16, extraKick: o.extraKick, openOff: o.openOff });
    // bas: 8'lik nabız
    for (let q = 0; q < (breakdown ? 1 : 4); q++) bass(t0 + q * BEAT, ch.root, BEAT * (breakdown ? 3.8 : 0.9), 0.9);
    pad(t0, ch.tri, BAR, o.padG || 1, breakdown ? 0.02 : 0.06);
    if (!breakdown) melodyBar(bar, o.dens, o.oct || 0, 1);
    if (o.counter && !breakdown) melodyBar(bar, 0.35, -12, 0.55, -0.4);
  }
  crash(s.bas * BAR, 1);
  if (o.riserEnd) riser((s.bit - 1) * BAR + BAR / 2, s.bit * BAR, 0.9);
}
groove('ussu', { dens: 0.55, riserEnd: true });
groove('aralik', { dens: 0.6, hat16: true, oct: 0, riserEnd: true });
groove('kumeler', { dens: 0.5, breakdown: true, openOff: true, riserEnd: true });
groove('cebir', { dens: 0.65, counter: true, extraKick: true, hat16: true, riserEnd: true });

// 5) FİNAL: son akor ilerlemesi + çanlar, son ölçüde tutulan F
{
  const f = sec('final');
  for (let bar = f.bas; bar < f.bit; bar++) {
    const t0 = bar * BAR;
    const last = bar === f.bit - 1;
    const ch = last ? PROG[0] : PROG[bar % 4];
    if (!last) drums(bar, { hat16: false });
    bass(t0, ch.root, last ? BAR + TAIL : BAR * 0.95, 0.9);
    pad(t0, ch.tri, last ? BAR + TAIL : BAR, 1.2, 0.05);
    bell(t0, ch.tri[2] + 12, 0.9);
    if (!last) melodyBar(bar, 0.4, 0, 0.8);
  }
  crash(f.bas * BAR, 1.1);
  kick((f.bit - 1) * BAR, 1); crash((f.bit - 1) * BAR, 0.8);
  bell((f.bit - 1) * BAR + BEAT, 77, 1); bell((f.bit - 1) * BAR + 2 * BEAT, 81, 0.9); bell((f.bit - 1) * BAR + 3 * BEAT, 84, 0.8);
}

// ---------- Reverb (Schroeder: 4 tarak + 2 tüm geçiren) ----------
function reverb(inp, out, off) {
  const combs = [1557, 1617, 1491, 1422].map(d => ({ d: d + off, b: new Float32Array(d + off), i: 0, lp: 0 }));
  const aps = [225, 556].map(d => ({ d, b: new Float32Array(d), i: 0 }));
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.b[c.i];
      c.lp = y * 0.7 + c.lp * 0.3;
      c.b[c.i] = inp[n] + c.lp * 0.8;
      c.i = (c.i + 1) % c.d; s += y;
    }
    for (const a of aps) {
      const y = a.b[a.i];
      const v = s + y * -0.5;
      a.b[a.i] = s + y * 0.5; // basit tüm geçiren
      a.i = (a.i + 1) % a.d; s = v;
    }
    out[n] += s * 0.12;
  }
}
reverb(revL, L, 0); reverb(revR, R, 23);

// ---------- Mastering ----------
let peak = 0;
for (let n = 0; n < N; n++) { L[n] = Math.tanh(L[n] * 1.1); R[n] = Math.tanh(R[n] * 1.1); peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const norm = 0.89 / peak;
const fadeStart = N - t2i(1.5);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  const f = n > fadeStart ? 1 - (n - fadeStart) / (N - fadeStart) : 1;
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * norm * f)) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * norm * f)) * 32767), 46 + n * 4);
}
const out = process.argv[2] || path.join(__dirname, '..', 'build', 'muzik.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log(`muzik.wav: ${(N / SR).toFixed(2)} sn, ${Z.BPM} BPM, ${Z.TOPLAM_OLCU} ölçü -> ${out}`);
