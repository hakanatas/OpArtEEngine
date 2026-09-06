# OpArt Engine

Tarayıcıda çalışan, bağımlılıksız, gelişmiş bir **Op Art (optik sanat) üreteci**.
Selim Tezel'in *Gemini Op Art Engine* sayfasındaki fikirden (slider'larla kontrol edilen
canvas tabanlı op-art üretimi) yola çıkar; onu katmanlı bir skaler-alan render motoruna,
bozunum/simetri sistemine, palet yönetimine, animasyona ve yüksek çözünürlüklü dışa aktarmaya genişletir.

> **Canlı kullanım:** `index.html` dosyasını bir HTTP sunucusundan açın (`npm start` → http://localhost:8080)
> veya GitHub Pages'e yayınlayın. `dist/opart-engine.html` tek dosyalık sürümdür; çift tıklayarak da açılabilir.

---

## Özellikler

**22 desen** — Stripes, Waves (Riley), Cataract, Zigzag, Rings, Concentric squares, Diamonds, Polygons, Rays,
Spiral, Vortex, Tunnel, Blaze, Checkerboard, Polar checker (Vasarely *Vega*), Dot grid (Vasarely), Hexagons,
Tumbling cubes, Weave, Lissajous, Noise contours, Interference.

**İki katman + karışım** — İkinci katman ayrı desen, yoğunluk, merkez, ölçek ve faz ile eklenir;
Difference (XOR), Multiply, Screen, Average, Min, Max, Add modlarıyla karıştırılır (moiré efektleri).

**Kenar biçimi** — Her katman için Hard (kalınlık ayarlı kare dalga), Smooth, Triangle, Sawtooth, Stepped (N bant).

**Bozunum (warp) yığını** — Bulge/pinch, twist, ripple, wave, noise (domain warping); hepsi birlikte
uygulanabilir ve animasyonla canlandırılabilir.

**Simetri** — 1–24 dilimli kaleydoskop, dilim aynalama, X/Y aynalama.

**Renk** — 1–8 renkli palet editörü, 12 hazır palet (Riley, Vasarely, Anuszkiewicz, Neon…),
ayrık bant / gradyan eşleme, palet tekrarı ve kayması, gama, ters çevirme, gren, vinyet.

**Animasyon** — Katman başına kayma hızı, canlandırılan bozunumlar, oynat/duraklat, hız kontrolü,
6 saniyelik WebM/MP4 kaydı (MediaRecorder).

**Etkileşim** — Sürükle: kaydır, tekerlek: yakınlaştır, çift tık: sıfırla; slider'a çift tık: varsayılana dön.
Kısayollar: `Boşluk` oynat, `R` rastgele, `M` mutasyon, `I` ters çevir, `F` tam ekran, `E`/`Ctrl+S` PNG, `Ctrl+Z/Y` geri al/yinele.

**Üretkenlik** — 16 hazır ayar (canlı küçük resimlerle), tohumlu rastgele üretim, mutasyon, 100 adımlı geri al/yinele,
otomatik kayıt (localStorage), JSON kaydet/yükle, paylaşılabilir URL (`#s=…`).

**Dışa aktarma** — 1024–4096 px PNG, 2×2 veya 3×3 süper örnekleme ile kenar yumuşatma; mevcut en-boy oranı korunur.

**Performans** — Render, Web Worker havuzunda (çekirdek sayısı kadar) satır bloklarına bölünerek yapılır;
etkileşim ve animasyon sırasında çözünürlük ölçülen hıza göre otomatik düşürülür, boşta tam çözünürlükte
yeniden çizilir. `file://` ile açıldığında ana iş parçacığına düşer.

**Arayüz** — Türkçe/İngilizce, koyu/açık tema, mobil uyumlu düzen, katlanabilir bölümler.

---

## Mimari

```
index.html        arayüz iskeleti
css/style.css     tema değişkenleri, düzen
js/core.js        saf render çekirdeği (DOM yok; hem ana iş parçacığında hem worker'da çalışır)
js/worker.js      worker giriş noktası (importScripts('core.js'))
js/presets.js     hazır ayarlar ve paletler
js/i18n.js        TR/EN metinler
js/app.js         durum, geçmiş, worker havuzu, UI üretimi, dışa aktarma, klavye/işaretçi
tools/build.js    her şeyi tek HTML dosyasına gömer (dist/opart-engine.html)
tools/smoke.js    her deseni tüm özelliklerle çizip NaN/çökme kontrolü yapar
```

### Piksel hattı

Her piksel bir skaler alan olarak hesaplanır:

1. **Koordinat** — kısa kenar `[-1, 1]` olacak şekilde normalize; zoom, döndürme, kaydırma.
2. **Simetri** — kaleydoskop dilimi ve aynalama.
3. **Bozunum** — kutupsal (bulge, twist, ripple) ve kartezyen (wave, noise) warp'lar.
4. **Katmanlar** — her katman `(u, v, r, θ) → faz` üretir; faz, kenar biçimiyle `[0, 1]` değere dönüştürülür.
5. **Karışım** — katman değerleri seçilen modla birleştirilir.
6. **Renk** — gama/ters çevirme, ardından palet eşlemesi (ayrık veya gradyan), vinyet ve gren.

Yeni bir desen eklemek için `js/core.js` içinde `PATTERNS` listesine bir kayıt ve `PF` nesnesine bir fonksiyon eklemek,
`js/i18n.js` içinde adını tanımlamak yeterlidir.

---

## Geliştirme

```bash
npm start     # yerel sunucu (http://localhost:8080)
npm test      # headless duman testi (Node)
npm run build # dist/opart-engine.html üret
```

Harici bağımlılık yoktur; derleme adımı isteğe bağlıdır.

---

## English summary

OpArt Engine is a dependency-free, browser-based optical-art generator: 22 scalar-field patterns, two blendable
layers (XOR/multiply/screen/…), stackable distortions (bulge, twist, ripple, wave, noise), kaleidoscope symmetry,
palette editor with presets, discrete or gradient colour mapping, animation with video recording, seeded randomise
and mutate, undo/redo, shareable URLs, JSON save/load, and 4096 px supersampled PNG export. Rendering is split
across a Web Worker pool with adaptive preview resolution. UI in English and Turkish, dark and light themes.
