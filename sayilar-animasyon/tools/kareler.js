// Belirli anlardan PNG kareler alır (görsel kontrol) ve en küçük yazı boyutunu raporlar.
// Kullanım: node tools/kareler.js [kare] t1 t2 ...
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const args = process.argv.slice(2);
  const kare = args[0] === 'kare'; if (kare) args.shift();
  const out = path.join(__dirname, '..', 'build', 'kareler');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const p = await b.newPage({ viewport: { width: kare ? 1080 : 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html') + '?render=1' + (kare ? '&kare=1' : ''));
  await p.evaluate(() => window.hazir);
  for (const t of args) {
    const url = await p.evaluate(t => window.ciz(+t, 'image/png'), t);
    const mf = await p.evaluate(() => window.minFont());
    const f = path.join(out, `${kare ? 'kare' : 'genis'}-${String(t).padStart(6, '0')}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log(f, 'minFont', mf.size.toFixed(1), mf.at);
  }
  if (errs.length) console.log('HATALAR:', errs);
  await b.close();
})();
