# OpArt Engine

Tarayıcıda çalışan gelişmiş bir **optik sanat (Op Art) üreteci**. Bağımlılık yok, tek sayfa; GitHub Pages veya herhangi bir statik sunucuda çalışır.

An advanced browser-based **optical-art generator**. No dependencies, no build step required; works on GitHub Pages or any static host.

**Canlı deneme / live demo:** `index.html` dosyasını bir statik sunucudan açın (`npm start` → http://localhost:8080). Tek dosyalık sürüm için `npm run build` → `dist/opart-engine.html`.

## Özellikler / Features

| | |
|---|---|
| **22 desen** | Riley dalgaları, Cataract, zikzak, halkalar, iç içe kareler, çokgenler, ışınlar, sarmal, girdap, tünel, Blaze, dama, kutupsal dama (Vasarely *Vega*), nokta ızgarası (Vasarely), altıgenler, yuvarlanan küpler, dokuma, Lissajous, gürültü eşyükseltileri, girişim |
| **İki katman** | İkinci katman ayrı desen/parametrelerle; XOR-fark, çarp, ekran, ortalama, min, max, topla karışımı ile moiré |
| **Bozunum** | Şişirme/sıkma, burgu, dalgacık, dalga, gürültü (domain warp); yığılabilir ve animasyonlu |
| **Simetri** | 24 dilime kadar kaleydoskop, dilim aynalama, X/Y aynalama |
| **Renk** | 8 renge kadar palet editörü, 12 hazır palet, ayrık bant / gradyan eşleme, palet tekrarı ve kayması, gama, ters çevirme, gren, vinyet |
| **Kenar biçimi** | Sert (çizgi kalınlığı ayarlı), yumuşak, üçgen, testere, basamaklı |
| **Animasyon** | Katman başına kayma hızı, canlı bozunum, oynat/duraklat, 6 sn WebM/MP4 kaydı |
| **Üretkenlik** | 16 canlı küçük resimli hazır ayar, tohumlu rastgele üretim, mutasyon, geri al/yinele, paylaşılabilir URL (`#s=…`), JSON kaydet/yükle, otomatik yerel kayıt |
| **Dışa aktarma** | 1024–4096 px PNG, 2×2 / 3×3 süper örnekleme ile |
| **Performans** | Web Worker havuzu (çekirdek sayısına göre), etkileşim sırasında uyarlanabilir önizleme çözünürlüğü, boşta tam çözünürlük |
| **Arayüz** | Türkçe / İngilizce, koyu / açık tema, mobil düzen, klavye kısayolları |

### Klavye / Keyboard

`Space` oynat-duraklat · `R` rastgele · `M` mutasyon · `I` ters çevir · `F` tam ekran · `E` / `Ctrl+S` PNG · `Ctrl+Z` / `Ctrl+Y` geri al-yinele · Sürükle: kaydır · Tekerlek: yakınlaştır · Çift tık: görünümü sıfırla · Slider'a çift tık: varsayılana dön

## Mimari / Architecture

```
index.html        arayüz iskeleti
css/style.css     tema değişkenleri (koyu/açık), düzen
js/core.js        saf render çekirdeği (DOM yok; ana iş parçacığı ve worker'da aynı kod)
js/worker.js      worker giriş noktası (importScripts core.js)
js/app.js         durum, geçmiş, arayüz üretimi, worker havuzu, dışa aktarma
js/presets.js     hazır ayarlar ve paletler
js/i18n.js        TR/EN dizeleri
tools/build.js    tek dosyalık dist/opart-engine.html üretir
tools/smoke.js    tüm desen × kenar biçimi kombinasyonlarını headless test eder
```

Her piksel bir **skaler alan** olarak hesaplanır:

```
piksel → normalize (kısa kenar −1..1) → yakınlaştır/döndür/kaydır
       → simetri (kaleydoskop, aynalama)
       → bozunumlar (şişirme, burgu, dalgacık, dalga, gürültü)
       → katman A: desen(u,v) → faz → kenar biçimi → değer [0,1]
       → katman B (opsiyonel) → karışım
       → gama / ters çevir → palet (ayrık veya gradyan)
       → vinyet, gren
```

Desenler faz döndürdüğü için aynı bozunum, simetri ve renk hattı hepsine uygulanır.

### Yeni desen ekleme

`js/core.js` içinde iki yer:

```js
// 1) katalog: hangi genel parametreleri kullandığı ve etiket anahtarları
{ id: 'myPattern', uses: { freq: 'density', amp: 'amplitude' } },

// 2) fonksiyon: (u, v, r, angle, layer, tAngle, seed) → faz
PF.myPattern = (u, v, r, a, L, t) => u * L.freq + L.amp * Math.sin(v * 3 + t);
```

Sonra `js/i18n.js` içine `patterns.myPattern` adını ekleyin. Etiket anahtarları (`density`, `amplitude`, …) da aynı dosyada tanımlıdır.

## Geliştirme / Development

```bash
npm start        # http://localhost:8080 (python3 http.server)
npm test         # headless duman testi (Node)
npm run build    # dist/opart-engine.html
```

Worker'lar `file://` üzerinden açıldığında tarayıcı güvenlik kısıtı nedeniyle yüklenemez; uygulama otomatik olarak ana iş parçacığına düşer. Tam hız için bir HTTP sunucusu kullanın veya `dist/opart-engine.html` dosyasını açın (çekirdek satır içi olduğundan Blob worker'lar çalışır).

## Esin / Inspiration

Selim Tezel'in *Gemini Op Art Engine* sayfasındaki fikirden yola çıkılarak sıfırdan yazılmıştır. Bridget Riley, Victor Vasarely ve Richard Anuszkiewicz'in eserlerine saygıyla.

## Lisans

MIT
