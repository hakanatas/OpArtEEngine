/* UI strings. Turkish and English. */
(function (root) {
  'use strict';
  const STR = {
    en: {
      appTitle: 'OpArt Engine', subtitle: 'Advanced optical-art generator',
      secPattern: 'Pattern', secLayer2: 'Second layer', secTransform: 'Transform', secWarp: 'Distortion',
      secSymmetry: 'Symmetry', secColor: 'Colour', secPost: 'Finish', secAnim: 'Animation', secCanvas: 'Canvas',
      secPresets: 'Presets', secActions: 'Actions',
      pattern: 'Pattern', shape: 'Edge shape', duty: 'Line weight', steps: 'Bands', phase: 'Phase', drift: 'Drift (anim)',
      cx: 'Centre X', cy: 'Centre Y', scale: 'Scale', enable: 'Enable', blend: 'Blend mode',
      density: 'Density', amplitude: 'Amplitude', waveFreq: 'Wave frequency', tilt: 'Tilt', wobble: 'Wobble',
      lobes: 'Lobes', rounding: 'Rounding', sides: 'Sides', twist: 'Twist', rays: 'Rays', curl: 'Curl', arms: 'Arms',
      teeth: 'Teeth', shear: 'Shear', sectors: 'Sectors', dotSize: 'Dot size', modulation: 'Size modulation',
      ringsPerCell: 'Rings per cell', parityShift: 'Parity shift', rotation: 'Rotation', ratio: 'Ratio',
      bands: 'Bands', separation: 'Separation',
      zoom: 'Zoom', rot: 'Rotation', panX: 'Pan X', panY: 'Pan Y',
      bulge: 'Bulge / pinch', twistW: 'Twist', ripple: 'Ripple', rippleFreq: 'Ripple frequency',
      wave: 'Wave', waveFreqW: 'Wave frequency', noise: 'Noise warp', noiseFreq: 'Noise scale', animateWarp: 'Animate distortion',
      symSeg: 'Kaleidoscope segments', symMirror: 'Mirror segments', mirrorX: 'Mirror X', mirrorY: 'Mirror Y',
      palette: 'Palette', colorMode: 'Colour mapping', palRepeat: 'Palette repeat', palOffset: 'Palette offset',
      addColor: '+ colour', palettePresets: 'Palette presets',
      gamma: 'Gamma', invert: 'Invert', grain: 'Grain', vignette: 'Vignette', aa: 'Anti-aliasing',
      play: 'Play', pause: 'Pause', speed: 'Speed (cycles/s)',
      aspect: 'Aspect ratio', fitWindow: 'Fit window', square: 'Square 1:1',
      randomize: 'Randomise', mutate: 'Mutate', reset: 'Reset', undo: 'Undo', redo: 'Redo',
      exportPng: 'Export PNG', exportSize: 'Export size', copyLink: 'Copy link', linkCopied: 'Link copied',
      saveJson: 'Save JSON', loadJson: 'Load JSON', record: 'Record 6s video', recording: 'Recording…',
      fullscreen: 'Fullscreen', seed: 'Seed', newSeed: 'New seed', language: 'Türkçe', theme: 'Theme',
      renderTime: 'render', exportBusy: 'Rendering export…', hint: 'Drag to pan · wheel to zoom · Space play · R random · M mutate',
      shapes: { hard: 'Hard', smooth: 'Smooth', tri: 'Triangle', saw: 'Sawtooth', steps: 'Stepped' },
      blends: { difference: 'Difference (XOR)', multiply: 'Multiply', screen: 'Screen', average: 'Average', min: 'Minimum', max: 'Maximum', add: 'Add' },
      colorModes: { discrete: 'Discrete bands', gradient: 'Gradient' },
      patterns: {
        stripes: 'Stripes', waves: 'Waves (Riley)', cataract: 'Cataract', zigzag: 'Zigzag', rings: 'Rings',
        squares: 'Concentric squares', diamonds: 'Diamonds', polygons: 'Polygons', rays: 'Rays', spiral: 'Spiral',
        vortex: 'Vortex', tunnel: 'Tunnel', blaze: 'Blaze', checker: 'Checkerboard', polarCheck: 'Polar checker (Vega)',
        dots: 'Dot grid (Vasarely)', hexagons: 'Hexagons', cubes: 'Tumbling cubes', weave: 'Weave', lissajous: 'Lissajous',
        contours: 'Noise contours', interference: 'Interference'
      }
    },
    tr: {
      appTitle: 'OpArt Engine', subtitle: 'Gelişmiş optik sanat üreteci',
      secPattern: 'Desen', secLayer2: 'İkinci katman', secTransform: 'Dönüşüm', secWarp: 'Bozunum',
      secSymmetry: 'Simetri', secColor: 'Renk', secPost: 'Bitiş', secAnim: 'Animasyon', secCanvas: 'Tuval',
      secPresets: 'Hazır ayarlar', secActions: 'İşlemler',
      pattern: 'Desen', shape: 'Kenar biçimi', duty: 'Çizgi kalınlığı', steps: 'Bant sayısı', phase: 'Faz', drift: 'Kayma (anim.)',
      cx: 'Merkez X', cy: 'Merkez Y', scale: 'Ölçek', enable: 'Etkin', blend: 'Karışım modu',
      density: 'Yoğunluk', amplitude: 'Genlik', waveFreq: 'Dalga frekansı', tilt: 'Eğim', wobble: 'Salınım',
      lobes: 'Lob', rounding: 'Yuvarlama', sides: 'Kenar sayısı', twist: 'Burgu', rays: 'Işın', curl: 'Kıvrım', arms: 'Kol',
      teeth: 'Diş', shear: 'Kayma', sectors: 'Dilim', dotSize: 'Nokta boyu', modulation: 'Boy modülasyonu',
      ringsPerCell: 'Hücre başına halka', parityShift: 'Parite kayması', rotation: 'Döndürme', ratio: 'Oran',
      bands: 'Bant', separation: 'Ayrım',
      zoom: 'Yakınlaştırma', rot: 'Döndürme', panX: 'Kaydır X', panY: 'Kaydır Y',
      bulge: 'Şişirme / sıkma', twistW: 'Burgu', ripple: 'Dalgacık', rippleFreq: 'Dalgacık frekansı',
      wave: 'Dalga', waveFreqW: 'Dalga frekansı', noise: 'Gürültü bozunumu', noiseFreq: 'Gürültü ölçeği', animateWarp: 'Bozunumu canlandır',
      symSeg: 'Kaleydoskop dilimi', symMirror: 'Dilimleri aynala', mirrorX: 'X aynala', mirrorY: 'Y aynala',
      palette: 'Palet', colorMode: 'Renk eşleme', palRepeat: 'Palet tekrarı', palOffset: 'Palet kayması',
      addColor: '+ renk', palettePresets: 'Hazır paletler',
      gamma: 'Gama', invert: 'Ters çevir', grain: 'Gren', vignette: 'Vinyet', aa: 'Kenar yumuşatma',
      play: 'Oynat', pause: 'Duraklat', speed: 'Hız (döngü/s)',
      aspect: 'En-boy oranı', fitWindow: 'Pencereye sığdır', square: 'Kare 1:1',
      randomize: 'Rastgele', mutate: 'Mutasyon', reset: 'Sıfırla', undo: 'Geri al', redo: 'Yinele',
      exportPng: 'PNG dışa aktar', exportSize: 'Dışa aktarma boyutu', copyLink: 'Bağlantıyı kopyala', linkCopied: 'Bağlantı kopyalandı',
      saveJson: 'JSON kaydet', loadJson: 'JSON yükle', record: '6 sn video kaydet', recording: 'Kaydediliyor…',
      fullscreen: 'Tam ekran', seed: 'Tohum', newSeed: 'Yeni tohum', language: 'English', theme: 'Tema',
      renderTime: 'çizim', exportBusy: 'Dışa aktarma çiziliyor…', hint: 'Sürükle: kaydır · Tekerlek: yakınlaştır · Boşluk: oynat · R: rastgele · M: mutasyon',
      shapes: { hard: 'Sert', smooth: 'Yumuşak', tri: 'Üçgen', saw: 'Testere', steps: 'Basamaklı' },
      blends: { difference: 'Fark (XOR)', multiply: 'Çarp', screen: 'Ekran', average: 'Ortalama', min: 'Minimum', max: 'Maksimum', add: 'Topla' },
      colorModes: { discrete: 'Ayrık bantlar', gradient: 'Geçişli' },
      patterns: {
        stripes: 'Çizgiler', waves: 'Dalgalar (Riley)', cataract: 'Katarakt', zigzag: 'Zikzak', rings: 'Halkalar',
        squares: 'İç içe kareler', diamonds: 'Baklava', polygons: 'Çokgenler', rays: 'Işınlar', spiral: 'Sarmal',
        vortex: 'Girdap', tunnel: 'Tünel', blaze: 'Alev (Blaze)', checker: 'Dama', polarCheck: 'Kutupsal dama (Vega)',
        dots: 'Nokta ızgarası (Vasarely)', hexagons: 'Altıgenler', cubes: 'Yuvarlanan küpler', weave: 'Dokuma', lissajous: 'Lissajous',
        contours: 'Gürültü eşyükseltileri', interference: 'Girişim'
      }
    }
  };
  let lang = 'en';
  function t(key) {
    const d = STR[lang] || STR.en;
    if (key.indexOf('.') > 0) {
      const [a, b] = key.split('.');
      return (d[a] && d[a][b]) || (STR.en[a] && STR.en[a][b]) || b;
    }
    return d[key] !== undefined ? d[key] : (STR.en[key] !== undefined ? STR.en[key] : key);
  }
  root.I18N = {
    t,
    setLang(l) { lang = STR[l] ? l : 'en'; },
    getLang() { return lang; },
    languages: Object.keys(STR)
  };
})(window);
