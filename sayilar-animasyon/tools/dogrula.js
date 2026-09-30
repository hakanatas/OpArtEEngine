// Animasyondaki her sayısal iddiayı hesaplayarak kontrol eder. Hata varsa çıkış kodu 1.
'use strict';
let hata = 0;
const ok = (ad, kosul, ayrinti = '') => { console.log((kosul ? '  ✓ ' : '  ✗ ') + ad + (ayrinti ? '  (' + ayrinti + ')' : '')); if (!kosul) hata++; };
const yak = (a, b, tol) => Math.abs(a - b) <= tol;
const tr = s => +s.replace(/ /g, '').replace(',', '.');

console.log('Kanca');
ok('Arşimet: 1 ve 63 sıfır = 10^63', ('1' + '0'.repeat(63)).length === 64);

console.log('MAT.9.1.1 bilimsel gösterim (uzun yazım = kısa yazım)');
[['0,0000000000000017', 1.7e-15], ['7 000 000 000 000 000 000 000 000 000', 7e27], ['86 000 000 000', 8.6e10], ['2 900 000 000', 2.9e9]]
  .forEach(([u, v]) => ok(`${u} = ${v}`, yak(tr(u), v, v * 1e-12)));
ok('hidrojen çekirdeği (proton) çapı ≈ 1,7 fm (yük yarıçapı 0,84 fm × 2)', yak(2 * 0.841, 1.7, 0.05));
ok('Dünya–Uranüs ortalama uzaklığı ≈ 2,9·10^9 km (Uranüs yörünge yarı büyük ekseni 19,19 AU)', yak(19.19 * 1.496e8, 2.9e9, 0.05e9));
ok('8^(1/3) = 2', yak(Math.cbrt(8), 2, 1e-12) && yak(Math.pow(8, 1 / 3), 2, 1e-12));
const kenar = Math.sqrt(1200);
ok('√1200 = 20√3', yak(kenar, 20 * Math.sqrt(3), 1e-9));
ok('20√3 ≈ 34,6', yak(kenar, 34.6, 0.05), kenar.toFixed(4));
ok('20 · 1,732 = 34,64', yak(20 * 1.732, 34.64, 1e-9));
const cevre = 4 * kenar;
ok('çevre = 80√3 ≈ 138,6', yak(cevre, 80 * Math.sqrt(3), 1e-9) && yak(cevre, 138.6, 0.05), cevre.toFixed(3));
ok('138,6 ÷ 5 ≈ 27,7 → 28 panel', yak(138.6 / 5, 27.7, 0.05) && Math.ceil(cevre / 5) === 28);
ok('28 · 1700 = 47 600', 28 * 1700 === 47600);
const panel = r3 => Math.ceil(4 * 20 * r3 / 5 - 1e-9);
ok('√3≈2 → 32 panel, 54 400 TL', panel(2) === 32 && panel(2) * 1700 === 54400);
ok('√3≈1,7 → 28 panel, 47 600 TL', panel(1.7) === 28 && panel(1.7) * 1700 === 47600);
ok('√3≈1,73 → 28 panel, 47 600 TL', panel(1.73) === 28);
ok('fark: 4 panel = 6 800 TL', (32 - 28) * 1700 === 6800);

console.log('MAT.9.1.2 aralıklar');
const inA = x => x >= 10 && x <= 14, inB = x => x >= 12 && x <= 16;
const ornek = []; for (let x = 5; x <= 20; x += 0.25) ornek.push(x);
const esit = (f, g) => ornek.every(x => f(x) === g(x));
ok('A ∪ B = [10, 16]', esit(x => inA(x) || inB(x), x => x >= 10 && x <= 16));
ok('A ∩ B = [12, 14]', esit(x => inA(x) && inB(x), x => x >= 12 && x <= 14));
ok('A \\ B = [10, 12)', esit(x => inA(x) && !inB(x), x => x >= 10 && x < 12));
ok("A' = (−∞, 10) ∪ (14, ∞)", esit(x => !inA(x), x => x < 10 || x > 14));
ok('x ≥ 120 ⇔ [120, ∞) (120 dahil)', 120 >= 120);
ok('8 < x < 60 ⇔ (8, 60) (8 ve 60 hariç)', !(8 > 8) && !(60 < 60));
ok('2 < x < 4 ⇔ |x − 3| < 1', ornek.concat([2, 4, 1.999, 4.001]).every(x => (x > 2 && x < 4) === (Math.abs(x - 3) < 1)));
ok('merkez = (2 + 4)/2 = 3, tolerans = (4 − 2)/2 = 1', (2 + 4) / 2 === 3 && (4 - 2) / 2 === 1);

console.log('MAT.9.1.3 sayı kümeleri');
const babil = 1 + 24 / 60 + 51 / 3600 + 10 / 216000;
ok('YBC 7289: 1;24,51,10 = 1,41421 29…', babil.toFixed(9).startsWith('1.4142129'), babil.toFixed(9));
ok('√2 = 1,41421 35…', Math.SQRT2.toFixed(9).startsWith('1.4142135'), Math.SQRT2.toFixed(9));
const ortak = (a, b) => { let i = 0; while (a[i] === b[i]) i++; return a.slice(2, i).length; };
ok('ortak ondalık basamak = 5', ortak(babil.toFixed(9), Math.SQRT2.toFixed(9)) === 5);
ok('YBC 7289 ~ MÖ 1800–1600 → yaklaşık 3800 yıllık', 2026 + 1800 >= 3600 && 2026 + 1800 <= 3900);
const mids = [[1 / 2, 1, 3 / 4], [1 / 2, 3 / 4, 5 / 8], [1 / 2, 5 / 8, 9 / 16], [1 / 2, 9 / 16, 17 / 32]];
mids.forEach(([a, b, m]) => ok(`(${a} + ${b})/2 = ${m} ve arada`, (a + b) / 2 === m && a < m && m < b));
ok('√2 · √2 = 2 (aksine örnek)', yak(Math.SQRT2 * Math.SQRT2, 2, 1e-12));

console.log('MAT.9.1.4 cebir');
const ab = [[3, 5], [7, 2], [-4, 9], [0.5, 1.25]];
ok('(a + b)² = a² + 2ab + b²', ab.every(([a, b]) => yak((a + b) ** 2, a * a + 2 * a * b + b * b, 1e-9)));
ok('a² − b² = (a − b)(a + b)', ab.every(([a, b]) => yak(a * a - b * b, (a - b) * (a + b), 1e-9)));
ok('bahçe: üst şerit a×(a−b) + taşınan şerit b×(a−b) = (a+b)(a−b)', ab.every(([a, b]) => yak(a * (a - b) + b * (a - b), (a + b) * (a - b), 1e-9)));
ok('bahçe: L alanı = a² − b²', ab.every(([a, b]) => yak(a * (a - b) + (a - b) * b, a * a - b * b, 1e-9)));
ok('"Her tam sayı çifttir" yanlış (3)', 3 % 2 !== 0);
ok('"Bazı tam sayılar çifttir" doğru (4)', 4 % 2 === 0);

console.log(hata ? `\n${hata} HATA` : '\nTüm kontroller geçti.');
process.exit(hata ? 1 : 0);
