// Videoyu kare kare üretir: tarayıcıda her kare T anında çizilir, ffmpeg'e aktarılır, müzikle birleştirilir.
// Kullanım: node tools/render.js [kare] [fps]
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
(async () => {
  const kare = process.argv[2] === 'kare';
  const fps = +(process.argv[kare ? 3 : 2] || 30);
  const kok = path.join(__dirname, '..');
  const out = path.join(kok, kare ? 'sayilar-kare-1080x1080.mp4' : 'sayilar-16x9-1920x1080.mp4');
  const ff = process.env.FFMPEG || 'ffmpeg';
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const p = await b.newPage({ viewport: { width: kare ? 1080 : 1920, height: 1080 } });
  await p.goto('file://' + path.join(kok, 'index.html') + '?render=1' + (kare ? '&kare=1' : ''));
  await p.evaluate(() => window.hazir);
  const { SURE } = await p.evaluate(() => window.ZAMAN_BILGI);
  const n = Math.ceil(SURE * fps);
  const enc = spawn(ff, ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(kok, 'muzik.m4a'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  let minF = 999, minAt = '';
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const url = await p.evaluate(t => window.ciz(t), i / fps);
    const mf = await p.evaluate(() => window.minFont());
    if (mf.size < minF) { minF = mf.size; minAt = `${(i / fps).toFixed(2)} sn: ${mf.at}`; }
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
    if (i % (fps * 10) === 0) process.stdout.write(`${(i / fps).toFixed(0)}/${SURE.toFixed(0)} sn (${((Date.now() - t0) / 1000).toFixed(0)} sn geçti)\n`);
  }
  enc.stdin.end();
  await new Promise(r => enc.on('close', r));
  await b.close();
  console.log(`${out}  ·  ${n} kare  ·  en küçük yazı ${minF.toFixed(1)} px (${minAt})`);
})();
