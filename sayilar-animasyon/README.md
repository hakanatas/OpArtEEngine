# Sayılar · 9. Sınıf Matematik 1. Tema animasyonu

Türkiye Yüzyılı Maarif Modeli 9. sınıf matematiğinin 1. teması **"Sayılar" (MAT.9.1)** için derse giriş animasyonu. Süresi yaklaşık 2 dakika. Dört öğrenme çıktısının her biri bir sahne.

| Dosya | Ne |
|---|---|
| `index.html` | Tek dosyalık oynatıcı. Font, müzik ve kod içine gömülü, internetsiz açılır. Tuşlar: boşluk, ← →, D, F, M |
| `sayilar-16x9-1920x1080.mp4` | Sınıfta yansıtmak için |
| `sayilar-kare-1080x1080.mp4` | Paylaşmak için |
| `ogretmen-notu.md` | Her sahnede sorulabilecek sorular ve cevapları |
| `muzik.m4a` | Animasyon için bestelenmiş müzik (100 BPM, 48 ölçü) |

## Nasıl yapıldı

- Her kare JavaScript ile Canvas 2D üzerine sıfırdan çiziliyor (`src/cizim.js`). Hazır görsel, video ya da animasyon kütüphanesi yok. Tek dış varlık el yazısı font Kalam (SIL OFL), o da dosyaya gömülü.
- Çizgiler saniyede 8 kez hafifçe "kaynıyor". Böylece kareli defter üstünde tükenmez kalem, fosforlu kalem ve karakalemle o an çiziliyormuş gibi görünüyor.
- Görüntü zamanın saf fonksiyonu: aynı T her zaman aynı kareyi verir. Bu sayede tarayıcıdaki oynatıcı ile video çıktısı birebir aynı.
- **Müzik:** klasörde `muzik.m4a` yoktu. Bu yüzden müzik de sıfırdan, animasyonun zaman tablosuna göre sentezlendi (`tools/muzik.js`). Hazır ses örneği yok. Sahne sınırları, müzikteki bölüm sınırlarıyla (crash + riser) aynı yere düşüyor. Hepsi `src/zaman.js`'teki tek tablodan geliyor. `tools/analiz.js` müziğin tempo ve bölüm analizini WAV'dan bağımsız olarak çıkarıp tabloyla karşılaştırıyor (tahmin: 100 BPM).
- **Doğruluk:** `tools/dogrula.js` ekrandaki her sayıyı, eşitliği ve aralık gösterimini hesaplayarak kontrol ediyor. Uzun yazım ile bilimsel gösterim, çit hesabı, küme işlemleri, |x − 3| < 1, YBC 7289, özdeşlikler bu kontrole dahil. Render aracı ekranda çizilen en küçük yazıyı da raporluyor: 1080p'de en az 48 px.

## Yeniden üretmek

```bash
npm i -g playwright            # ya da mevcut kurulum
node tools/dogrula.js          # matematik kontrolü
node tools/build.js            # müzik + index.html (ffmpeg gerekir; FFMPEG=/yol/ffmpeg)
node tools/analiz.js           # müzik tempo/bölüm analizi
node tools/render.js           # 16:9 MP4
node tools/render.js kare      # kare MP4
node tools/kareler.js 12.5 40  # belirli anlardan PNG (build/kareler)
```

## Kendi müziğinizi kullanmak

`muzik.m4a` dosyasını kendi müziğinizle değiştirirseniz sahne zamanlarını da uyarlamanız gerekir. Bunun için `src/zaman.js` içindeki `BPM` değerini ve bölüm ölçülerini değiştirin, sonra `tools/build.js` betiğindeki müzik üretme adımını kaldırın.
