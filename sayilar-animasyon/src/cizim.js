// El çizimi motoru: titrek kalem çizgileri, fosforlu kalem, karakalem tarama, yazıyla açılan metin.
// Her şey zamanın saf fonksiyonu: aynı T -> aynı kare (video çıktısı için deterministik).
(function (root) {
  const C = {};
  C.ctx = null;
  C.BOIL = 0;          // "kaynayan çizgi" adımı (saniyede 8 kez değişir)
  C.minFont = 999;     // kontrol için: çizilen en küçük yazı boyutu (üs ve kök indeksi dahil)
  C.minFontAt = '';

  C.INK = '#1b3a8c';
  C.BLK = '#24242c';
  C.RED = '#d42f3c';
  C.GRN = '#1f8a4c';
  C.PUR = '#6b3db3';
  C.GRY = '#5f6168';
  C.PAPER = '#fbf9f1';
  C.HL = {
    sari: 'rgba(255,226,40,0.55)',
    pembe: 'rgba(255,92,165,0.42)',
    yesil: 'rgba(90,225,120,0.45)',
    mavi: 'rgba(70,175,255,0.40)',
    turuncu: 'rgba(255,155,40,0.45)',
    mor: 'rgba(160,110,255,0.38)',
  };
  // ---------- Temalar: zemin + kalem paleti ----------
  const KOYU = { hlMode: 'source-over', hlA: 0.62 };
  C.TEMALAR = {
    defter: { INK: '#1b3a8c', BLK: '#24242c', RED: '#d42f3c', GRN: '#1f8a4c', PUR: '#6b3db3', GRY: '#5f6168', PAPER: '#fbf9f1',
      ORG: '#c05a00', BRN: '#8a5a2b', BRN2: '#6a3a14', GOLD: '#9a7200', CYAN: '#1a7f95', WAVE: 'rgba(40,120,200,0.55)',
      HATCHG: 'rgba(31,138,76,0.45)', HATCH: 'rgba(90,90,100,0.55)', hlMode: 'multiply', hlA: 1 },
    kraft: { INK: '#1c2d6b', BLK: '#2a1f16', RED: '#b01e2b', GRN: '#16613a', PUR: '#56298f', GRY: '#5c4730', PAPER: '#e3c99d',
      ORG: '#9c4200', BRN: '#5b3412', BRN2: '#4a2a0e', GOLD: '#735300', CYAN: '#0f6273', WAVE: 'rgba(30,80,140,0.55)',
      HATCHG: 'rgba(22,97,58,0.5)', HATCH: 'rgba(60,40,20,0.5)', hlMode: 'multiply', hlA: 1 },
    kara: Object.assign({ INK: '#f6f3ea', BLK: '#f6f3ea', RED: '#ff8f8f', GRN: '#9be8a3', PUR: '#d2b6ff', GRY: '#b6c1b9', PAPER: '#26342e',
      ORG: '#ffb46e', BRN: '#e9c79c', BRN2: '#e9c79c', GOLD: '#ffe27a', CYAN: '#90e6f4', WAVE: 'rgba(200,230,255,0.5)',
      HATCHG: 'rgba(160,240,170,0.45)', HATCH: 'rgba(240,240,230,0.35)' }, KOYU),
    gece: Object.assign({ INK: '#ffffff', BLK: '#f3f1ff', RED: '#ff8aa0', GRN: '#8ff0b0', PUR: '#c7b3ff', GRY: '#aab3d8', PAPER: '#121a3d',
      ORG: '#ffb86b', BRN: '#f0cfa0', BRN2: '#f0cfa0', GOLD: '#ffe070', CYAN: '#86e8ff', WAVE: 'rgba(180,210,255,0.5)',
      HATCHG: 'rgba(150,240,190,0.45)', HATCH: 'rgba(220,220,255,0.35)' }, KOYU),
    plan: Object.assign({ INK: '#ffffff', BLK: '#f4f8ff', RED: '#ffb3a3', GRN: '#b9f7c6', PUR: '#e4d2ff', GRY: '#c3d6f5', PAPER: '#1e5299',
      ORG: '#ffc98a', BRN: '#ffe0b8', BRN2: '#ffe0b8', GOLD: '#ffe68a', CYAN: '#a8f0ff', WAVE: 'rgba(255,255,255,0.45)',
      HATCHG: 'rgba(200,255,215,0.45)', HATCH: 'rgba(255,255,255,0.35)' }, KOYU),
  };
  C.tema = function (ad) {
    const [k, renk] = ad.split(':');
    Object.assign(C, C.TEMALAR[k] || C.TEMALAR.defter);
    if (renk) C.PAPER = renk; // "renk:#ffd84d" -> düz renkli zemin, koyu kalemler
    C.KOYU = C.hlMode !== 'multiply';
  };
  C.tema('defter');
  C.FONT = "Kalam, 'Cambria Math', 'Segoe UI Symbol', 'DejaVu Sans', 'Noto Sans Math', sans-serif";

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  C.clamp = clamp;
  C.seg = (t, a, b) => clamp((t - a) / (b - a));
  C.ease = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  C.eo = x => 1 - Math.pow(1 - x, 3);
  C.back = x => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  C.lerp = (a, b, t) => a + (b - a) * t;

  function hash(a, b) {
    let h = Math.imul((a * 1000) | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ 0x5bd1e995;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  C.hash = hash;
  const jit = (k, amp) => (hash(k, C.BOIL) * 2 - 1) * amp;
  C.jit = jit;
  // Zamanla değişmeyen (kalıcı) rastgele
  C.rs = (k) => hash(k, 7777);

  // ---------- Kalem ----------
  C.pen = function (pts, o = {}) {
    const ctx = C.ctx;
    const p = o.p === undefined ? 1 : o.p;
    if (p <= 0 || pts.length < 2) return;
    const amp = o.j === undefined ? 1.5 : o.j;
    const q = pts.map(([x, y], i) => [x + jit(x * 0.31 + y * 0.17 + i * 1.1, amp), y + jit(x * 0.13 + y * 0.59 + i * 0.7 + 9.9, amp)]);
    let L = 0; const d = [0];
    for (let i = 1; i < q.length; i++) { L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); d.push(L); }
    const target = L * p;
    ctx.beginPath();
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) {
      if (d[i] <= target) ctx.lineTo(q[i][0], q[i][1]);
      else {
        const f = (target - d[i - 1]) / Math.max(1e-6, d[i] - d[i - 1]);
        ctx.lineTo(q[i - 1][0] + (q[i][0] - q[i - 1][0]) * f, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * f);
        break;
      }
    }
    ctx.strokeStyle = o.c || C.INK;
    ctx.lineWidth = o.w || 4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  };

  C.segPts = function (x1, y1, x2, y2, step = 26) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.ceil(L / step));
    const nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1);
    const bow = (C.rs(x1 * 0.37 + y2 * 0.11) * 2 - 1) * Math.min(6, L * 0.012);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const b = Math.sin(t * Math.PI) * bow;
      pts.push([x1 + (x2 - x1) * t + nx * b, y1 + (y2 - y1) * t + ny * b]);
    }
    return pts;
  };
  C.line = (x1, y1, x2, y2, o = {}) => C.pen(C.segPts(x1, y1, x2, y2), o);

  C.ellPts = function (cx, cy, rx, ry, turn = 1.07, a0) {
    const start = a0 === undefined ? -Math.PI * 0.6 + C.rs(cx + cy) * 0.6 : a0;
    const n = Math.max(24, Math.ceil((rx + ry) * turn * 0.25));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = start + (i / n) * Math.PI * 2 * turn;
      const wob = 1 + (i / n) * 0.025 * (C.rs(cx) - 0.3);
      pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]);
    }
    return pts;
  };
  C.circle = (cx, cy, r, o = {}) => C.pen(C.ellPts(cx, cy, r, r, o.turn || 1.07), o);
  C.ellipse = (cx, cy, rx, ry, o = {}) => C.pen(C.ellPts(cx, cy, rx, ry, o.turn || 1.05), o);

  C.rectPts = function (x, y, w, h) {
    return [].concat(
      C.segPts(x, y, x + w, y), C.segPts(x + w, y, x + w, y + h).slice(1),
      C.segPts(x + w, y + h, x, y + h).slice(1), C.segPts(x, y + h, x, y - 4).slice(1));
  };
  C.rect = (x, y, w, h, o = {}) => C.pen(C.rectPts(x, y, w, h), o);

  C.arrow = function (x1, y1, x2, y2, o = {}) {
    const p = o.p === undefined ? 1 : o.p;
    C.line(x1, y1, x2, y2, Object.assign({}, o, { p: C.seg(p, 0, 0.8) }));
    const hp = C.seg(p, 0.8, 1);
    if (hp > 0) {
      const a = Math.atan2(y2 - y1, x2 - x1), s = o.head || 20;
      C.line(x2, y2, x2 - Math.cos(a - 0.45) * s, y2 - Math.sin(a - 0.45) * s, Object.assign({}, o, { p: hp }));
      C.line(x2, y2, x2 - Math.cos(a + 0.45) * s, y2 - Math.sin(a + 0.45) * s, Object.assign({}, o, { p: hp }));
    }
  };

  // Fosforlu kalem: soldan sağa sürülen yarı saydam bant
  C.hl = function (x, y, w, h, col, p = 1) {
    if (p <= 0) return;
    const ctx = C.ctx;
    ctx.save();
    ctx.globalCompositeOperation = C.hlMode;
    ctx.globalAlpha *= C.hlA;
    ctx.fillStyle = col;
    const ww = w * p;
    ctx.beginPath();
    const j = k => jit(k + x * 0.1 + y * 0.3, 2);
    ctx.moveTo(x + j(1), y + j(2));
    ctx.lineTo(x + ww + j(3), y + 3 + j(4));
    ctx.lineTo(x + ww + j(5), y + h + j(6));
    ctx.lineTo(x + j(7), y + h - 3 + j(8));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Karakalem tarama: bir yolun içini çapraz çizgilerle doldurur
  C.hatch = function (pathFn, bx, by, bw, bh, o = {}) {
    const p = o.p === undefined ? 1 : o.p;
    if (p <= 0) return;
    const ctx = C.ctx;
    ctx.save();
    ctx.beginPath(); pathFn(ctx); ctx.clip();
    const gap = o.gap || 14, ang = o.ang === undefined ? -0.7 : o.ang;
    const diag = Math.hypot(bw, bh);
    const cx = bx + bw / 2, cy = by + bh / 2;
    const n = Math.ceil(diag / gap);
    const nn = Math.ceil(n * p);
    ctx.strokeStyle = o.c || C.HATCH;
    ctx.lineWidth = o.w || 2.2;
    ctx.lineCap = 'round';
    const ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.beginPath();
    for (let i = 0; i < nn; i++) {
      const off = -diag / 2 + i * gap + jit(i * 3.3 + bx, 2);
      const px = cx - sa * off, py = cy + ca * off;
      ctx.moveTo(px - ca * diag / 2, py - sa * diag / 2);
      ctx.lineTo(px + ca * diag / 2 + jit(i + by, 4), py + sa * diag / 2);
    }
    ctx.stroke();
    ctx.restore();
  };
  C.fillSoft = function (pathFn, col) {
    const ctx = C.ctx;
    ctx.save();
    ctx.globalCompositeOperation = C.hlMode;
    ctx.globalAlpha *= C.hlA;
    ctx.fillStyle = col; ctx.beginPath(); pathFn(ctx); ctx.fill();
    ctx.restore();
  };

  // ---------- Metin ----------
  // Mini işaretleme: ^{...} üs, \r{...} karekök, \r3{...} küpkök
  function parse(s) {
    const out = []; let i = 0, buf = '';
    const flush = () => { if (buf) { out.push({ k: 't', s: buf }); buf = ''; } };
    while (i < s.length) {
      if (s[i] === '^' && s[i + 1] === '{') { flush(); const j = s.indexOf('}', i); out.push({ k: 'sup', s: s.slice(i + 2, j) }); i = j + 1; }
      else if (s[i] === '\\' && s[i + 1] === 'r') {
        flush(); let k = i + 2, idx = '';
        if (s[k] !== '{') { idx = s[k]; k++; }
        const j = s.indexOf('}', k);
        out.push({ k: 'root', idx, s: s.slice(k + 1, j) }); i = j + 1;
      } else { buf += s[i]; i++; }
    }
    flush(); return out;
  }
  C.parse = parse;
  const SUP = 0.62, IDX = 0.5;
  function setFont(size, bold) { C.ctx.font = `${bold ? 700 : 400} ${size}px ${C.FONT}`; }
  C.supMin = 0; // üs/kök indeksi için en küçük boyut (48 px kuralı)
  const supS = size => Math.max(size * SUP, C.supMin);
  const idxS = size => Math.max(size * IDX, C.supMin);
  function tokW(t, size, bold) {
    const ctx = C.ctx;
    if (t.k === 't') { setFont(size, bold); return ctx.measureText(t.s).width; }
    if (t.k === 'sup') { setFont(supS(size), bold); return ctx.measureText(t.s).width + size * 0.04; }
    setFont(size, bold); return ctx.measureText(t.s).width + size * 0.62;
  }
  C.measure = function (s, size, bold) { return parse(s).reduce((a, t) => a + tokW(t, size, bold), 0); };
  function noteFont(size, what) { if (size < C.minFont) { C.minFont = size; C.minFontAt = what; } }

  function drawToks(toks, x, y, size, bold, col, scale) {
    const ctx = C.ctx;
    ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    for (const t of toks) {
      const w = tokW(t, size, bold);
      if (t.k === 't') { setFont(size, bold); ctx.fillText(t.s, x, y); noteFont(size * scale, t.s); }
      else if (t.k === 'sup') { setFont(supS(size), bold); ctx.fillText(t.s, x + size * 0.02, y - size * 0.42); noteFont(supS(size) * scale, '^' + t.s); }
      else {
        const top = y - size * 0.86, cw = w - size * 0.62;
        const lw = Math.max(3, size * 0.055);
        C.pen([[x + size * 0.02, y - size * 0.30], [x + size * 0.13, y - size * 0.37], [x + size * 0.27, y + size * 0.08],
          [x + size * 0.47, top], [x + size * 0.56 + cw + size * 0.04, top]], { c: col, w: lw, j: 0.8 });
        if (t.idx) { setFont(idxS(size), bold); ctx.fillText(t.idx, x - size * 0.06, y - size * 0.44); noteFont(idxS(size) * scale, 'kök ' + t.idx); }
        setFont(size, bold); ctx.fillText(t.s, x + size * 0.56, y); noteFont(size * scale, t.s);
      }
      x += w;
    }
  }

  // txt: y = satırın dikey ortası. o: {s, b, c, a, p, maxW}
  C.txt = function (s, x, y, o = {}) {
    const ctx = C.ctx;
    const size = o.s || 56, bold = !!o.b, al = o.a || 'center';
    const p = o.p === undefined ? 1 : o.p;
    const toks = parse(s);
    const w = toks.reduce((a, t) => a + tokW(t, size, bold), 0);
    if (p <= 0) return w;
    let sc = 1; if (o.maxW && w > o.maxW) sc = o.maxW / w;
    const x0 = al === 'center' ? x - w * sc / 2 : al === 'right' ? x - w * sc : x;
    ctx.save();
    ctx.translate(x0 + jit(x * 0.7 + y * 2 + s.length, 0.9), y + jit(y * 0.9 + x * 3, 0.9));
    ctx.rotate(jit(x * 0.07 + y * 0.03 + s.length * 1.7, 0.004));
    ctx.scale(sc, sc);
    if (p < 1) { ctx.beginPath(); ctx.rect(-size * 0.3, -size * 1.5, (w + size * 0.6) * p, size * 3); ctx.clip(); }
    drawToks(toks, 0, size * 0.36, size, bold, o.c || C.INK, sc);
    ctx.restore();
    return w * sc;
  };

  // Paragraf: kelime kaydırmalı, satır satır yazılır. Dönen: son satırın altı.
  C.wrap = function (s, size, bold, maxW) {
    const words = s.split(' '); const lines = []; let cur = '';
    for (const wd of words) {
      const tryS = cur ? cur + ' ' + wd : wd;
      if (C.measure(tryS, size, bold) > maxW && cur) { lines.push(cur); cur = wd; } else cur = tryS;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  C.para = function (s, x, y, o = {}) {
    const size = o.s || 56;
    const lines = C.wrap(s, size, o.b, o.maxW || 1600);
    const lh = size * (o.lh || 1.28);
    const p = o.p === undefined ? 1 : o.p;
    const n = lines.length;
    const y0 = o.va === 'top' ? y : y - (n - 1) * lh / 2;
    lines.forEach((ln, i) => {
      const lp = C.clamp(p * n - i);
      C.txt(ln, x, y0 + i * lh, Object.assign({}, o, { p: lp, maxW: undefined }));
    });
    return y0 + (n - 1) * lh + size * 0.6;
  };

  // ---------- Süsler ----------
  C.not = function (x, y, w, h, col, rot, p = 1, fn) { // yapışkan not
    if (p <= 0) return;
    const ctx = C.ctx;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot || 0);
    const s = 0.6 + 0.4 * C.back(C.clamp(p));
    ctx.scale(s, s);
    ctx.globalAlpha *= C.clamp(p * 3);
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    ctx.fillStyle = col;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; // bant
    ctx.fillRect(-36, -h / 2 - 12, 72, 24);
    if (fn) fn(-w / 2, -h / 2);
    ctx.restore();
  };
  C.tik = function (x, y, s, p = 1, c = C.GRN) {
    C.pen([[x - s * 0.5, y], [x - s * 0.15, y + s * 0.4], [x + s * 0.55, y - s * 0.5]], { c, w: s * 0.14, p });
  };
  C.carpi = function (x, y, s, p = 1, c = C.RED) {
    C.line(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { c, w: s * 0.13, p: C.seg(p, 0, 0.5) });
    C.line(x + s / 2, y - s / 2, x - s / 2, y + s / 2, { c, w: s * 0.13, p: C.seg(p, 0.5, 1) });
  };
  C.damga = function (s, x, y, p, o = {}) {
    if (p <= 0) return;
    const ctx = C.ctx, size = o.s || 76;
    const k = C.clamp(p);
    const sc = 2.2 - 1.2 * C.eo(k);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(o.rot === undefined ? -0.2 : o.rot); ctx.scale(sc, sc);
    ctx.globalAlpha *= C.clamp(k * 2) * 0.9;
    const w = C.measure(s, size, true) + 60, h = size * 1.5;
    C.rect(-w / 2, -h / 2, w, h, { c: o.c || C.RED, w: 7, j: 1 });
    C.rect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, { c: o.c || C.RED, w: 3, j: 1 });
    C.txt(s, 0, 0, { s: size, b: true, c: o.c || C.RED });
    ctx.restore();
  };
  C.pop = function (x, y, p, fn) { // ölçekle belirme
    if (p <= 0) return;
    const ctx = C.ctx; ctx.save();
    ctx.translate(x, y); const s = C.back(C.clamp(p)); ctx.scale(s, s);
    ctx.globalAlpha *= C.clamp(p * 4);
    fn(); ctx.restore();
  };
  C.alpha = function (a, fn) { if (a <= 0) return; const ctx = C.ctx; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); };

  // Konfeti patlaması: t = patlamadan beri geçen süre (deterministik)
  C.konfeti = function (x, y, t, o = {}) {
    if (t < 0 || t > 2.2) return;
    const ctx = C.ctx, n = o.n || 46;
    const cols = o.cols || ['#ffd84d', '#ff6fa8', '#5cc8ff', '#6fe08a', '#b58cff', '#ff9f43'];
    ctx.save();
    ctx.globalAlpha *= 1 - C.seg(t, 1.4, 2.2);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (C.rs(i * 3.3 + x) - 0.5) * (o.yay || 2.6);
      const v = 500 + C.rs(i * 7.1 + y) * 700;
      const px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t + 900 * t * t;
      ctx.save(); ctx.translate(px, py); ctx.rotate(t * (4 + C.rs(i) * 8) + i);
      ctx.fillStyle = cols[i % cols.length];
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); }
      else ctx.fillRect(-9, -4, 18, 8 * Math.abs(Math.cos(t * 6 + i)) + 2);
      ctx.restore();
    }
    ctx.restore();
  };

  // Zaman bloğu: [a,b] aralığında çizer, kenarlarda yumuşak geçiş
  C.blok = function (t, a, b, fn, fo = 0.25, fi = 0) {
    if (t < a || t > b) return;
    const al = Math.min(fi ? C.seg(t, a, a + fi) : 1, fo && isFinite(b) ? 1 - C.seg(t, b - fo, b) : 1);
    C.alpha(al, () => fn(t - a));
  };

  // Sayı doğrusu. o: {x0,x1,y,min,max,step,lab(v)->string|null,p,c}
  C.dogru = function (o) {
    const p = o.p === undefined ? 1 : o.p;
    const X = v => o.x0 + (v - o.min) / (o.max - o.min) * (o.x1 - o.x0);
    const pad = o.pad === undefined ? 40 : o.pad;
    C.arrow(o.x0 - pad, o.y, o.x1 + pad, o.y, { c: o.c || C.BLK, w: 4, p, head: 18 });
    if (!o.noLeftArrow) {
      const hp = C.seg(p, 0.85, 1);
      if (hp > 0) {
        C.line(o.x0 - pad, o.y, o.x0 - pad + 18, o.y - 8, { c: o.c || C.BLK, w: 4, p: hp });
        C.line(o.x0 - pad, o.y, o.x0 - pad + 18, o.y + 8, { c: o.c || C.BLK, w: 4, p: hp });
      }
    }
    if (o.step) {
      for (let v = o.min, i = 0; v <= o.max + 1e-9; v += o.step, i++) {
        const tp = C.seg(p, 0.3 + 0.6 * (v - o.min) / (o.max - o.min) - 0.1, 0.35 + 0.6 * (v - o.min) / (o.max - o.min));
        C.line(X(v), o.y - 12, X(v), o.y + 12, { c: o.c || C.BLK, w: 3, p: tp });
        const lab = o.lab ? o.lab(v, i) : String(v);
        if (lab !== null && tp > 0) C.txt(lab, X(v), o.y + 50, { s: o.ls || 48, c: o.lc || C.GRY, p: tp });
      }
    }
    return X;
  };
  C.nokta = function (x, y, dolu, p = 1, c = C.INK) {
    if (p <= 0) return;
    const ctx = C.ctx;
    C.pop(x, y, p, () => {
      ctx.fillStyle = dolu ? c : C.PAPER;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      C.circle(0, 0, 13, { c, w: 4.5, j: 0.5 });
    });
  };
  // Aralık bandı: [a,b] üstünde renkli kalın çizgi; a/b = ±Infinity -> ok ucu
  C.bant = function (X, y, a, b, col, p = 1, o = {}) {
    if (p <= 0) return;
    const xa = isFinite(a) ? X(a) : o.xmin, xb = isFinite(b) ? X(b) : o.xmax;
    C.hl(xa, y - 16, (xb - xa), 32, col, p);
    const c = o.c || C.INK;
    C.line(xa, y, xa + (xb - xa) * p, y, { c, w: 7, j: 1 });
    if (!isFinite(b) && p > 0.9) C.arrow(xb - 30, y, xb + 12, y, { c, w: 7, head: 22 });
    if (!isFinite(a) && p > 0.2) C.arrow(xa + 30, y, xa - 12, y, { c, w: 7, head: 22 });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.CIZ = C;
})(this);
