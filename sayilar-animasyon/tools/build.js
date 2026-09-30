// index.html'i üretir: fontlar, müzik ve JS tek dosyaya gömülür (internetsiz sınıfta da çalışır).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const kok = path.join(__dirname, '..');
const oku = f => fs.readFileSync(path.join(kok, f));

// 1) müzik
const ff = process.env.FFMPEG || 'ffmpeg';
execFileSync('node', [path.join(__dirname, 'muzik.js'), path.join(kok, 'build', 'muzik.wav')], { stdio: 'inherit' });
execFileSync(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(kok, 'build', 'muzik.wav'), '-c:a', 'aac', '-b:a', '192k', path.join(kok, 'muzik.m4a')], { stdio: 'inherit' });
// AAC çalamayan tarayıcılar için Opus yedeği
execFileSync(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(kok, 'build', 'muzik.wav'), '-c:a', 'libopus', '-b:a', '112k', path.join(kok, 'build', 'muzik.webm')], { stdio: 'inherit' });

// 2) fontlar (Kalam, SIL OFL)
const fonts = [
  ['400', 'kalam-400-latin.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['400', 'kalam-400-latinext.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
  ['700', 'kalam-700-latin.woff2', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'],
  ['700', 'kalam-700-latinext.woff2', 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'],
];
const css = fonts.map(([w, f, r]) => `@font-face{font-family:Kalam;font-style:normal;font-weight:${w};font-display:block;` +
  `src:url(data:font/woff2;base64,${oku('tools/fonts/' + f).toString('base64')}) format('woff2');unicode-range:${r}}`).join('\n');

// 3) JS
const js = ['src/zaman.js', 'src/cizim.js', 'src/sahneler.js', 'src/main.js'].map(f => `// ---- ${f} ----\n` + oku(f).toString()).join('\n');
const muzik = 'data:audio/mp4;base64,' + oku('muzik.m4a').toString('base64');
const muzik2 = 'data:audio/webm;base64,' + oku('build/muzik.webm').toString('base64');
let html = oku('src/sablon.html').toString();
html = html.replace('/*FONTLAR*/', () => css).replace('/*JS*/', () => js).replace('/*MUZIK*/', () => muzik).replace('/*MUZIK2*/', () => muzik2);
fs.writeFileSync(path.join(kok, 'index.html'), html);
console.log(`index.html: ${(html.length / 1e6).toFixed(2)} MB`);
