// Müzik dosyasının tempo ve bölüm analizini çıkarır (WAV okur): başlangıç (onset) zarfı + otokorelasyon ile BPM,
// ölçü başına enerji ile bölüm sınırları. Sonuç animasyonun zaman tablosuyla (src/zaman.js) karşılaştırılır.
'use strict';
const fs = require('fs'); const path = require('path');
const Z = require('../src/zaman.js');
const f = process.argv[2] || path.join(__dirname, '..', 'build', 'muzik.wav');
const b = fs.readFileSync(f);
const SR = b.readUInt32LE(24), ch = b.readUInt16LE(22), n = (b.length - 44) / (2 * ch);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) { let s = 0; for (let c = 0; c < ch; c++) s += b.readInt16LE(44 + (i * ch + c) * 2); x[i] = s / ch / 32768; }
const hop = 441, frames = Math.floor(n / hop), fr = SR / hop; // 100 kare/sn
const en = new Float32Array(frames);
for (let k = 0; k < frames; k++) { let s = 0; for (let i = 0; i < hop; i++) { const v = x[k * hop + i]; s += v * v; } en[k] = Math.log(1e-9 + s); }
const on = new Float32Array(frames); for (let k = 1; k < frames; k++) on[k] = Math.max(0, en[k] - en[k - 1]);
let best = 0, bpm = 0;
for (let b2 = 70; b2 <= 180; b2 += 0.5) {
  const lag = fr * 60 / b2; let s = 0;
  for (let k = Math.ceil(lag); k < frames; k++) { const l = k - lag, i0 = Math.floor(l), fx = l - i0; s += on[k] * (on[i0] * (1 - fx) + on[i0 + 1] * fx); }
  if (s > best) { best = s; bpm = b2; }
}
console.log(`Süre ${(n / SR).toFixed(2)} sn · tahmini tempo ${bpm} BPM (tablo: ${Z.BPM})`);
const bar = 60 / Z.BPM * 4;
const rms = []; for (let m = 0; m < Z.TOPLAM_OLCU; m++) { let s = 0; const a = Math.floor(m * bar * SR), e = Math.min(n, Math.floor((m + 1) * bar * SR)); for (let i = a; i < e; i++) s += x[i] * x[i]; rms.push(Math.sqrt(s / (e - a))); }
console.log('Ölçü enerjileri (█ = yüksek):');
Z.BOLUMLER.forEach(bl => {
  const row = rms.slice(bl.bas, bl.bit).map(v => ' ▁▂▃▄▅▆▇█'[Math.min(8, Math.round(v / Math.max(...rms) * 8))]).join('');
  console.log(`  ${bl.t0.toFixed(1).padStart(5)}–${bl.t1.toFixed(1).padEnd(5)} sn  ${bl.ad.padEnd(8)} ${row}`);
});
