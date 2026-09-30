// Sahneler. Her sahne (t = sahne içi süre, L = düzen) alır; zamanlar vuruşa (0,6 sn) oturur.
(function (root) {
  const C = root.CIZ, Z = root.ZAMAN;
  const { seg, ease, eo, clamp, lerp, txt, para, line, pen, circle, ellipse, rect, arrow, hl, blok } = C;
  const B = Z.BEAT; // 0,6 sn

  // ---------- ortak ----------
  function baslik(kod, ad, t, L) {
    C.not(34, 26, 262, 92, '#ffe66b', -0.035, seg(t, 0.05, 0.5), (x, y) => {
      txt(kod, x + 131, y + 48, { s: 50, b: true, c: C.BLK });
    });
    const maxW = L.W - 360;
    txt(ad, 322, 72, { s: 54, a: 'left', c: C.BLK, p: seg(t, 0.2, 0.9), maxW, b: true });
    const w = Math.min(maxW, C.measure(ad, 54, true));
    line(322, 112, 322 + w, 116, { c: C.RED, w: 3.5, p: seg(t, 0.6, 1.1) });
  }

  // Koşan çöp adam
  function kosucu(x, fy, ph, s = 1, col = C.BLK) {
    const hip = [x, fy - 100 * s], sh = [x + 16 * s, fy - 168 * s];
    const w = 6;
    line(hip[0], hip[1], sh[0], sh[1], { c: col, w, j: 0.8 });
    circle(sh[0] + 12 * s, sh[1] - 34 * s, 24 * s, { c: col, w, j: 0.8 });
    for (const sg of [1, -1]) {
      const a = 0.85 * Math.sin(ph + (sg > 0 ? 0 : Math.PI));
      const knee = [hip[0] + Math.sin(a) * 52 * s, hip[1] + Math.cos(a) * 52 * s];
      const bend = 0.3 + 1.1 * Math.max(0, -Math.sin(ph + (sg > 0 ? 0 : Math.PI) + 0.9));
      const foot = [knee[0] + Math.sin(a - bend) * 52 * s, knee[1] + Math.cos(a - bend) * 52 * s];
      pen([hip, knee, foot], { c: col, w, j: 0.8 });
      const b = -0.9 * Math.sin(ph + (sg > 0 ? 0 : Math.PI));
      const el = [sh[0] + Math.sin(b) * 42 * s, sh[1] + Math.cos(b) * 42 * s];
      const hand = [el[0] + Math.sin(b + 1.4) * 38 * s, el[1] + Math.cos(b + 1.4) * 38 * s];
      pen([sh, el, hand], { c: col, w, j: 0.8 });
    }
  }
  function copAdam(x, fy, s = 1, col = C.BLK) {
    const hip = [x, fy - 100 * s], sh = [x, fy - 170 * s];
    line(hip[0], hip[1], sh[0], sh[1], { c: col, w: 5 });
    circle(x, sh[1] - 32 * s, 24 * s, { c: col, w: 5 });
    pen([[x - 34 * s, fy], hip, [x + 34 * s, fy]], { c: col, w: 5 });
    pen([[x - 52 * s, fy - 110 * s], [x, sh[1] + 12 * s], [x + 52 * s, fy - 110 * s]], { c: col, w: 5 });
  }

  // =====================================================================
  // 0) KANCA
  function kanca(t, L) {
    const { W, H, cx, wide } = L;
    // --- Bolt ---
    blok(t, 0, 4.5, lt => {
      const xs = wide ? 180 : 110, xf = W - (wide ? 330 : 190);
      const lanes = [640, 790, 940];
      lanes.forEach((y, i) => line(60, y, W - 60, y, { c: C.GRY, w: 3, p: seg(lt, 0.0 + i * 0.1, 0.5 + i * 0.1) }));
      // bitiş çizgisi (dama)
      const fp = seg(lt, 0.3, 0.7);
      for (let k = 0; k < 10; k++) {
        const y = 600 + k * 38;
        if (y > 960 || k / 10 > fp) continue;
        C.ctx.fillStyle = k % 2 ? C.BLK : 'rgba(0,0,0,0)';
        C.ctx.fillRect(xf - 12, y, 12, 38); C.ctx.fillStyle = k % 2 ? 'rgba(0,0,0,0)' : C.BLK; C.ctx.fillRect(xf, y, 12, 38);
      }
      txt('100 m', xf, 575, { s: 48, c: C.GRY, p: fp });
      // koşucu
      const f = clamp((lt - 0.2) / 2.2);
      const cross = 2.4;
      let x;
      if (lt < cross) x = xs + (xf - xs) * Math.pow(f, 1.25);
      else x = xf + 190 * eo(seg(lt, cross, 4.0));
      x = Math.min(x, W - 70);
      const ph = lt < cross ? lt * 15 : cross * 15 + (lt - cross) * 15 * (1 - seg(lt, cross, 4));
      kosucu(x, 790 - 6, ph, 1.05);
      if (lt < cross) for (let k = 0; k < 3; k++) line(x - 110 - k * 26, 650 + k * 40, x - 60 - k * 26, 650 + k * 40, { c: C.GRY, w: 3 });
      // kronometre
      const sx = cx, sy = wide ? 300 : 360;
      circle(sx, sy, 150, { c: C.BLK, w: 6, p: seg(lt, 0, 0.5) });
      rect(sx - 22, sy - 190, 44, 34, { c: C.BLK, w: 5, p: seg(lt, 0.2, 0.5) });
      const v = 9.58 * clamp((lt - 0.2) / 2.2);
      const str = v.toFixed(2).replace('.', ',');
      if (lt >= cross) hl(sx - 125, sy - 55, 250, 110, C.HL.sari, seg(lt, cross, cross + 0.3));
      txt(str, sx, sy, { s: 112, b: true, c: lt >= cross ? C.RED : C.BLK });
      txt('sn', sx, sy + 90, { s: 48, c: C.GRY });
      if (lt >= cross) {
        for (let k = 0; k < 10; k++) {
          const a = k / 10 * Math.PI * 2, r0 = 170, r1 = 170 + 50 * eo(seg(lt, cross, cross + 0.4));
          line(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0, sx + Math.cos(a) * r1, sy + Math.sin(a) * r1, { c: C.RED, w: 5 });
        }
      }
      txt('Usain Bolt · 100 m · 2009', wide ? 90 : cx, wide ? 110 : 70, { s: 52, a: wide ? 'left' : 'center', c: C.GRY, p: seg(lt, 0.1, 0.8) });
      const q = 'Neden 10 sn değil de 9,58?';
      para(q, cx, wide ? 1025 : 1015, { s: 70, b: true, c: C.INK, p: seg(lt, 2.6, 3.4), maxW: W - 120 });
    }, 0.3);
    // --- Arşimet ---
    blok(t, 4.5, Infinity, lt => {
      para('Evreni doldurmak için kaç kum tanesi gerekir?', cx, wide ? 150 : 170, { s: 70, b: true, maxW: W - 200, p: seg(lt, 0, 0.9) });
      txt('— Arşimet, MÖ 3. yüzyıl', W - 90, wide ? 245 : 330, { s: 52, a: 'right', c: C.GRY, p: seg(lt, 0.7, 1.2) });
      // kum taneleri
      const ctx = C.ctx;
      ctx.fillStyle = '#b8894a';
      for (let i = 0; i < 420; i++) {
        const ti = 0.2 + C.rs(i * 3.7) * 4.5;
        if (lt < ti) continue;
        const x = 60 + C.rs(i * 1.3) * (W - 120);
        const ground = H - 40 - 60 * Math.exp(-Math.pow((x - W / 2) / (W * 0.25), 2)) * clamp((lt - 0.5) / 4) - C.rs(i * 9.1) * 30;
        const y = Math.min(ground, 280 + (lt - ti) * (500 + C.rs(i) * 400));
        ctx.beginPath(); ctx.arc(x, y, 3 + C.rs(i * 5.3) * 2.5, 0, 7); ctx.fill();
      }
      // büyüyen sayı
      const gp = seg(lt, 0.6, 2.7);
      const coll = seg(lt, 2.7, 3.1);
      if (gp > 0 && coll < 1) {
        const zeros = Math.floor(Math.pow(gp, 1.4) * 63);
        let s = '1' + '0'.repeat(zeros);
        s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const size = 80 + 110 * gp;
        C.alpha(1 - coll, () => {
          ctx.save();
          const w = C.measure(s, size, true);
          ctx.translate(cx, 560);
          ctx.scale(1 - 0.9 * ease(coll), 1);
          txt(s, Math.max(60 - cx, -w / 2), 0, { s: size, b: true, a: 'left', c: C.BLK });
          ctx.restore();
        });
      }
      if (lt >= 2.8) {
        C.pop(cx, 560, seg(lt, 2.8, 3.3), () => {
          txt('≈ 10^{63} kum tanesi', 0, 0, { s: 120, b: true, c: C.RED });
        });
        txt('(Arşimet\'in tahmini)', cx, 680, { s: 48, c: C.GRY, p: seg(lt, 3.1, 3.5) });
        const y = wide ? 830 : 860;
        const sen = 'Sayıların dili bunun için var.';
        const sw = Math.min(W - 120, C.measure(sen, 84, true));
        hl(cx - sw / 2 - 20, y - 52, sw + 40, 104, C.HL.sari, seg(lt, 3.9, 4.5));
        txt(sen, cx, y, { s: 84, b: true, c: C.INK, p: seg(lt, 3.3, 4.0), maxW: W - 120 });
      }
    });
  }

  // =====================================================================
  // 1) ÜSLÜ VE KÖKLÜ GÖSTERİM
  const DURAKLAR = [
    { ic: 'cekirdek', ad: 'Hidrojen çekirdeğinin çapı', uzun: '0,0000000000000017 m', kisa: '≈ 1,7 · 10^{-15} m', e: -15 },
    { ic: 'insan', ad: 'İnsan vücudundaki atom sayısı', uzun: '7 000 000 000 000 000 000 000 000 000', kisa: '≈ 7 · 10^{27}', e: 27 },
    { ic: 'beyin', ad: 'Beyindeki nöron sayısı', uzun: '86 000 000 000', kisa: '≈ 8,6 · 10^{10}', e: 10 },
    { ic: 'uranus', ad: 'Dünya–Uranüs uzaklığı (ortalama)', uzun: '2 900 000 000 km', kisa: '≈ 2,9 · 10^{9} km', e: 9 },
  ];
  function ikon(tur, x, y, s, p) {
    if (p <= 0) return;
    if (tur === 'cekirdek') {
      circle(x, y, 90 * s, { c: C.GRY, w: 3, dash: [8, 10], p });
      C.fillSoft(ctx => ctx.arc(x, y, 34 * s, 0, 7), 'rgba(255,92,165,0.35)');
      circle(x, y, 34 * s, { c: C.RED, w: 5, p });
      line(x - 14 * s, y, x + 14 * s, y, { c: C.RED, w: 5, p }); line(x, y - 14 * s, x, y + 14 * s, { c: C.RED, w: 5, p });
    } else if (tur === 'insan') {
      C.alpha(p, () => copAdam(x, y + 95 * s, 0.95 * s));
      for (let i = 0; i < 16; i++) {
        const a = C.rs(i * 2.1) * 6.28, r = (60 + C.rs(i * 7.7) * 60) * s;
        C.alpha(p, () => circle(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1, 5, { c: C.PUR, w: 3, j: 0.4 }));
      }
    } else if (tur === 'beyin') {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const a = i / 64 * Math.PI * 2;
        const r = 1 + 0.09 * Math.sin(a * 9);
        pts.push([x + Math.cos(a) * 110 * s * r, y + Math.sin(a) * 78 * s * r]);
      }
      C.fillSoft(ctx => { ctx.moveTo(pts[0][0], pts[0][1]); pts.forEach(q => ctx.lineTo(q[0], q[1])); }, 'rgba(255,92,165,0.22)');
      pen(pts, { c: C.RED, w: 5, p });
      const mid = []; for (let i = 0; i <= 10; i++) mid.push([x + Math.sin(i * 1.3) * 10 * s, y - 70 * s + i * 14 * s]);
      pen(mid, { c: C.RED, w: 4, p: seg(p, 0.5, 1) });
    } else if (tur === 'uranus') {
      C.fillSoft(ctx => ctx.arc(x, y, 62 * s, 0, 7), 'rgba(70,200,220,0.35)');
      circle(x, y, 62 * s, { c: '#1a7f95', w: 5, p });
      C.ctx.save(); C.ctx.translate(x, y); C.ctx.rotate(1.35);
      ellipse(0, 0, 110 * s, 22 * s, { c: '#1a7f95', w: 4, p: seg(p, 0.3, 1) });
      C.ctx.restore();
      circle(x - 150 * s, y + 70 * s, 12 * s, { c: C.INK, w: 4, p });
      arrow(x - 132 * s, y + 60 * s, x - 70 * s, y + 30 * s, { c: C.GRY, w: 3, dash: [6, 8], p: seg(p, 0.5, 1) });
    }
  }

  function ussu(t, L) {
    const { W, H, cx, wide } = L;
    baslik('MAT.9.1.1', 'Üslü ve köklü gösterim', t, L);

    // --- A: 10'un kuvvetleri ---
    blok(t, 0, 10.8, lt => {
      const x0 = wide ? 200 : 110, x1 = W - (wide ? 200 : 110), ay = 245;
      const X = C.dogru({ x0, x1, y: ay, min: -16, max: 29, step: 1, p: seg(lt, 0, 1.0),
        lab: v => (v % (wide ? 5 : 10) === 0 ? String(v).replace('-', '−') : null), ls: 48 });
      txt("10'un kuvvetleri: üs (n)", wide ? x0 - 40 : x0 - 40, 175 + (wide ? 0 : 0), { s: 48, a: 'left', c: C.GRY, p: seg(lt, 0.3, 1.0) });
      // işaretçi
      const k = clamp(Math.floor((lt - 1.2) / 2.4), 0, 3);
      const lk = lt - 1.2 - k * 2.4;
      const ePrev = k > 0 ? DURAKLAR[k - 1].e : -16;
      const e = lt < 1.2 ? -16 : lerp(ePrev, DURAKLAR[k].e, ease(seg(lk, 0, 0.5)));
      if (lt >= 1.0) {
        const mx = X(e);
        pen([[mx, ay - 22], [mx - 14, ay - 50], [mx + 14, ay - 50], [mx, ay - 22]], { c: C.RED, w: 5 });
        C.fillSoft(ctx => { ctx.moveTo(mx, ay - 22); ctx.lineTo(mx - 14, ay - 50); ctx.lineTo(mx + 14, ay - 50); }, 'rgba(212,47,60,0.6)');
      }
      // geçmiş duraklar küçük nokta
      for (let i = 0; i < k; i++) C.nokta(X(DURAKLAR[i].e), ay, true, 1, C.RED);

      if (lt >= 1.2) {
        blok(lt, 1.2 + k * 2.4, 1.2 + (k + 1) * 2.4, st => {
          const d = DURAKLAR[k];
          const nameY = wide ? 420 : 400;
          txt(d.ad, cx, nameY, { s: 60, b: true, c: C.BLK, p: seg(st, 0.05, 0.6), maxW: W - 120 });
          const icx = wide ? 300 : cx, icy = wide ? 700 : 560, iss = wide ? 1.3 : 0.95;
          ikon(d.ic, icx, icy, iss, seg(st, 0.1, 0.7));
          const nx = wide ? cx + 150 : cx, ny = wide ? 700 : 830;
          const maxW = wide ? W - 640 : W - 100;
          const fold = seg(st, 1.0, 1.4);
          if (fold < 1) {
            C.ctx.save(); C.ctx.translate(nx, ny); C.ctx.scale(1 - 0.92 * ease(fold), 1);
            C.alpha(1 - fold * 0.8, () => txt(d.uzun, 0, 0, { s: 64, c: C.BLK, p: seg(st, 0.25, 0.95), maxW }));
            C.ctx.restore();
            if (fold > 0) { // akordeon çizgileri
              const hw = Math.min(maxW, C.measure(d.uzun, 64)) / 2 * (1 - 0.92 * ease(fold));
              const zz = []; for (let i = 0; i <= 8; i++) zz.push([nx - hw + i * hw / 4, ny + (i % 2 ? -40 : 40)]);
              C.alpha(1 - fold, () => pen(zz, { c: C.GRY, w: 3 }));
            }
          }
          if (fold > 0) {
            const kw = C.measure(d.kisa, 96, true);
            hl(nx - kw / 2 - 20, ny - 55, kw + 40, 110, C.HL.sari, seg(st, 1.45, 1.8));
            C.pop(nx, ny, seg(st, 1.05, 1.5), () => txt(d.kisa, 0, 0, { s: 96, b: true, c: C.INK }));
          }
          txt('uzun yazım → bilimsel gösterim', cx, wide ? 950 : 1000, { s: 48, c: C.GRY, p: k === 0 ? seg(st, 1.3, 1.9) : 1, maxW: W - 120 });
        }, 0.25);
      }
    }, 0.3);

    // --- B: rasyonel üs / küp ---
    blok(t, 10.8, 16.2, lt => {
      const u = wide ? 95 : 78;
      const ox = wide ? 470 : cx, oy = wide ? 720 : 440;
      const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
      const P = (a, b, c) => [ox + (a - b) * c30 * u, oy + (a + b) * s30 * u - c * u];
      const order = [];
      for (let z = 0; z < 2; z++) for (let a = 1; a >= 0; a--) for (let b = 1; b >= 0; b--) order.push([a, b, z]);
      order.sort((p1, p2) => (p1[2] - p2[2]) || ((p1[0] + p1[1]) - (p2[0] + p2[1])));
      order.forEach(([a, b, z], i) => {
        const cp = seg(lt, 0.2 + i * 0.3, 0.45 + i * 0.3);
        if (cp <= 0) return;
        const top = [P(a, b, z + 1), P(a + 1, b, z + 1), P(a + 1, b + 1, z + 1), P(a, b + 1, z + 1)];
        const left = [P(a, b + 1, z), P(a + 1, b + 1, z), P(a + 1, b + 1, z + 1), P(a, b + 1, z + 1)];
        const right = [P(a + 1, b, z), P(a + 1, b + 1, z), P(a + 1, b + 1, z + 1), P(a + 1, b, z + 1)];
        const drop = (1 - eo(cp)) * 120;
        C.ctx.save(); C.ctx.translate(0, -drop); C.ctx.globalAlpha *= clamp(cp * 3);
        const face = (q, col) => {
          C.ctx.fillStyle = col; C.ctx.beginPath(); C.ctx.moveTo(q[0][0], q[0][1]); q.forEach(r => C.ctx.lineTo(r[0], r[1])); C.ctx.closePath(); C.ctx.fill();
          pen(q.concat([q[0]]), { c: C.INK, w: 3.5, j: 0.7 });
        };
        face(top, '#fff3b0'); face(left, '#cfe6ff'); face(right, '#ffd3e6');
        C.ctx.restore();
      });
      const n = clamp(Math.floor((lt - 0.2) / 0.3) + 1, 0, 8);
      if (lt >= 0.2) txt(n === 8 ? '8 birim küp' : String(n), ox, oy - 3 * u - 20, { s: 64, b: true, c: C.PUR });
      // kenar vurgusu
      if (lt >= 4.2) {
        const e1 = P(0, 2, 0), e2 = P(2, 2, 0);
        line(e1[0], e1[1] + 8, e2[0], e2[1] + 8, { c: C.RED, w: 9, p: seg(lt, 4.2, 4.6) });
        const m = [(e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2];
        txt('kenar = 2', m[0] - 10, m[1] + 70, { s: 56, b: true, c: C.RED, p: seg(lt, 4.4, 4.9) });
      }
      const fx = wide ? 1340 : cx, fy = wide ? 600 : 880;
      txt('Kesirli üs = kök', fx, wide ? fy - 150 : fy - 115, { s: 56, c: C.GRY, p: seg(lt, 2.4, 3.0), maxW: W - 120 });
      let f = '8^{1/3}';
      if (lt >= 3.3) f += ' = \\r3{8}';
      if (lt >= 3.9) f += ' = 2';
      const fw = C.measure('8^{1/3} = \\r3{8} = 2', 100, true);
      if (lt >= 3.9) hl(fx - fw / 2 - 20, fy - 60, fw + 40, 120, C.HL.sari, seg(lt, 3.9, 4.3));
      if (lt >= 2.7) {
        const cur = C.measure(f, 100, true);
        txt(f, fx - fw / 2 + cur / 2, fy, { s: 100, b: true, c: C.INK, p: lt < 3.3 ? seg(lt, 2.7, 3.1) : 1 });
      }
      txt('"8\'in küpkökü: küpü 8 olan sayı"', fx, fy + 130, { s: 48, c: C.GRY, p: seg(lt, 4.5, 5.1), maxW: W - 120 });
    }, 0.3);

    // --- C: Ahmet Bey'in çiti ---
    blok(t, 16.2, Infinity, lt => {
      const S = wide ? 560 : 380;
      const x0 = wide ? 180 : cx - S / 2, y0 = wide ? 240 : 220;
      const fx = wide ? 1300 : cx, fy = wide ? 330 : 700;
      const fmaxW = wide ? W - 820 : W - 90;
      // arazi
      const lp = seg(lt, 0, 1.0);
      C.hatch(ctx => ctx.rect(x0, y0, S, S), x0, y0, S, S, { p: lp, c: 'rgba(31,138,76,0.45)', gap: 18 });
      rect(x0, y0, S, S, { c: C.GRN, w: 5, p: lp });
      txt('1200 m²', x0 + S / 2, y0 + S / 2, { s: 72, b: true, c: C.GRN, p: seg(lt, 0.4, 1.0) });
      txt("Ahmet Bey'in kare arazisi", wide ? x0 + S / 2 : cx, wide ? y0 + S + 70 : y0 - 50, { s: 50, c: C.GRY, p: seg(lt, 0.3, 1.0), maxW: wide ? S + 100 : W - 100 });
      // kenar etiketi
      let kenar = null;
      if (lt >= 1.2) kenar = '\\r{1200} m';
      if (lt >= 4.2) kenar = '≈ 34,6 m';
      if (kenar) {
        C.ctx.save(); C.ctx.translate(x0 - 50, y0 + S / 2); C.ctx.rotate(-Math.PI / 2);
        txt(kenar, 0, 0, { s: 56, b: true, c: C.RED, p: seg(lt, 1.2, 1.6) });
        C.ctx.restore();
      }
      // çit direkleri: 28 panel
      if (lt >= 4.8) {
        const pp = seg(lt, 4.8, 6.4);
        const per = 4 * S, n = 28;
        const at = d => { d = d % per; if (d < S) return [x0 + d, y0]; if (d < 2 * S) return [x0 + S, y0 + d - S]; if (d < 3 * S) return [x0 + S - (d - 2 * S), y0 + S]; return [x0, y0 + S - (d - 3 * S)]; };
        const rail = []; for (let d = 0; d <= per * pp; d += 20) rail.push(at(d));
        if (rail.length > 1) { pen(rail, { c: '#8a5a2b', w: 7, j: 1 }); }
        for (let i = 0; i < n; i++) {
          if (i / n > pp) break;
          const [px, py] = at(i * per / n);
          line(px, py - 16, px, py + 16, { c: '#8a5a2b', w: 6, j: 0.6 });
          line(px - 16, py, px + 16, py, { c: '#8a5a2b', w: 6, j: 0.6 });
        }
        const cnt = Math.min(n, Math.floor(pp * n) + (pp > 0 ? 1 : 0));
        if (lt < 9.0) txt(cnt + ' panel', x0 + S / 2, y0 + S / 2 + 80, { s: 52, b: true, c: '#8a5a2b', p: seg(lt, 4.8, 5.1) });
      }
      // formül satırı (tek seferde bir formül)
      const steps = [
        [1.2, 2.4, 'kenar = \\r{1200}'],
        [2.4, 3.6, '\\r{1200} = \\r{400 · 3} = 20\\r{3}'],
        [3.6, 4.8, '20\\r{3} ≈ 20 · 1,732 ≈ 34,6 m'],
        [4.8, 6.6, 'çevre = 80\\r{3} ≈ 138,6 m'],
        [6.6, 7.8, '138,6 ÷ 5 ≈ 27,7 → 28 panel'],
        [7.8, 9.0, '28 · 1700 TL = 47 600 TL'],
      ];
      steps.forEach(([a, b, f]) => blok(lt, a, b, st => {
        txt(f, fx, fy, { s: 84, b: true, c: C.INK, p: seg(st, 0, 0.45), maxW: fmaxW });
      }, 0.15));
      // kıyas: √3 yerine ne yazmalı?
      blok(lt, 9.0, Infinity, st => {
        txt('\\r{3} yerine ne yazmalı?', fx, fy, { s: 76, b: true, c: C.INK, p: seg(st, 0, 0.4), maxW: fmaxW });
        const rows = [
          ['\\r{3} ≈ 2', '32 panel · 54 400 TL', false],
          ['\\r{3} ≈ 1,7', '28 panel · 47 600 TL', true],
          ['\\r{3} ≈ 1,73', '28 panel · 47 600 TL', true],
        ];
        const rx = wide ? 900 : 40, rw = wide ? W - 960 : W - 80;
        const ry0 = wide ? 480 : fy + 85, rh = wide ? 115 : 76;
        rows.forEach(([a, b, ok], i) => {
          const rp = seg(st, 0.3 + i * 0.6, 0.7 + i * 0.6);
          if (rp <= 0) return;
          const y = ry0 + i * rh;
          C.alpha(clamp(rp * 2), () => {
            hl(rx, y - 36, rw * eo(rp), 72, ok ? C.HL.yesil : C.HL.pembe, 1);
            txt(a, rx + 20, y, { s: 56, b: true, a: 'left', c: C.BLK });
            txt(b, rx + rw - 90, y, { s: 52, a: 'right', c: C.BLK });
            if (ok) C.tik(rx + rw - 45, y, 48, seg(rp, 0.5, 1)); else C.carpi(rx + rw - 45, y, 42, seg(rp, 0.5, 1));
          });
        });
        const cy2 = wide ? ry0 + 3 * rh + 40 : ry0 + 3 * rh + 5;
        txt('Kaba yuvarlama = 6 800 TL israf!', wide ? rx + rw / 2 : cx, cy2, { s: 56, b: true, c: C.RED, p: seg(st, 2.1, 2.8), maxW: wide ? rw : W - 60 });
      });
    });
  }

  // =====================================================================
  // 2) ARALIKLAR
  function aralik(t, L) {
    const { W, H, cx, wide } = L;
    baslik('MAT.9.1.2', 'Aralıklar ve küme işlemleri', t, L);

    // --- A: Lunapark ---
    blok(t, 0, 8.4, lt => {
      const sx = wide ? 120 : 40, sw = wide ? 1060 : W - 80, sy = 160, sh = 250;
      // tabela
      C.fillSoft(ctx => ctx.rect(sx, sy, sw, sh), 'rgba(255,200,120,0.25)');
      rect(sx, sy, sw, sh, { c: '#8a5a2b', w: 6, p: seg(lt, 0, 0.6) });
      line(sx + 60, sy + sh, sx + 60, sy + sh + 40, { c: '#8a5a2b', w: 6, p: seg(lt, 0.3, 0.6) });
      line(sx + sw - 60, sy + sh, sx + sw - 60, sy + sh + 40, { c: '#8a5a2b', w: 6, p: seg(lt, 0.3, 0.6) });
      txt('LUNAPARK · DEV DÖNME DOLAP', sx + sw / 2, sy + 50, { s: 52, b: true, c: '#8a5a2b', p: seg(lt, 0.2, 0.7), maxW: sw - 40 });
      const r1y = sy + 125, r2y = sy + 200;
      if (lt >= 1.8) hl(sx + 30, r1y - 32, C.measure('• Boy en az 120 cm', 52) + 20, 64, C.HL.pembe, seg(lt, 1.8, 2.2));
      if (lt >= 4.2) hl(sx + 30, r2y - 32, C.measure("• Yaş 8'den büyük, 60'tan küçük", 52) + 20, 64, C.HL.mavi, seg(lt, 4.2, 4.6));
      txt('• Boy en az 120 cm', sx + 40, r1y, { s: 52, a: 'left', c: C.BLK, p: seg(lt, 0.5, 1.1) });
      txt("• Yaş 8'den büyük, 60'tan küçük", sx + 40, r2y, { s: 52, a: 'left', c: C.BLK, p: seg(lt, 1.1, 1.7), maxW: sw - 60 });
      // dönme dolap doodle (geniş ekranda)
      if (wide) {
        const wx = 1620, wy = 290, R = 125, rot = t * 0.4;
        circle(wx, wy, R, { c: C.PUR, w: 5, p: seg(lt, 0.2, 0.9) });
        for (let i = 0; i < 8; i++) {
          const a = rot + i * Math.PI / 4;
          line(wx, wy, wx + Math.cos(a) * R, wy + Math.sin(a) * R, { c: C.PUR, w: 3, p: seg(lt, 0.5, 1.0) });
          C.alpha(seg(lt, 0.8, 1.2), () => rect(wx + Math.cos(a) * R - 16, wy + Math.sin(a) * R, 32, 26, { c: C.RED, w: 3, j: 0.6 }));
        }
        pen([[wx - 90, wy + 200], [wx, wy], [wx + 90, wy + 200]], { c: C.PUR, w: 5, p: seg(lt, 0.4, 0.9) });
      }
      const ly1 = wide ? 610 : 600, ly2 = wide ? 860 : 860;
      const x0 = wide ? 220 : 110, x1 = W - (wide ? 220 : 110);
      // boy
      if (lt >= 1.8) {
        const X = C.dogru({ x0, x1, y: ly1, min: 100, max: 160, step: 10, p: seg(lt, 1.8, 2.5) });
        C.bant(X, ly1, 120, Infinity, C.HL.pembe, seg(lt, 2.5, 3.1), { xmax: x1 + 30, c: C.RED });
        C.nokta(X(120), ly1, true, seg(lt, 2.4, 2.7), C.RED);
        txt('boy (cm)', x1 + 40, ly1 + 105, { s: 48, a: 'right', c: C.GRY, p: seg(lt, 2.0, 2.5) });
        C.alpha(lt >= 4.8 ? 0.35 : 1, () => txt('x ≥ 120  ⇔  x ∈ [120, ∞)', cx, ly1 - 80, { s: 72, b: true, c: C.RED, p: seg(lt, 3.1, 3.7), maxW: W - 100 }));
      }
      // yaş
      if (lt >= 4.2) {
        const X = C.dogru({ x0, x1, y: ly2, min: 0, max: 70, step: 10, p: seg(lt, 4.2, 4.9) });
        C.bant(X, ly2, 8, 60, C.HL.mavi, seg(lt, 5.0, 5.6), { c: C.INK });
        C.nokta(X(8), ly2, false, seg(lt, 4.9, 5.2), C.INK);
        C.nokta(X(60), ly2, false, seg(lt, 5.5, 5.8), C.INK);
                txt('yaş', x1 + 40, ly2 + 105, { s: 48, a: 'right', c: C.GRY, p: seg(lt, 4.4, 4.8) });
        txt('8 < x < 60  ⇔  x ∈ (8, 60)', cx, ly2 - 85, { s: 72, b: true, c: C.INK, p: seg(lt, 5.7, 6.3), maxW: W - 100 });
      }
      // lejant
      blok(lt, 6.6, Infinity, st => {
        const lx = cx, ly = wide ? 1030 : 1035;
        const s1 = 'dolu nokta: sayı dahil', s2 = 'boş nokta: dahil değil';
        const w1 = C.measure(s1, 50), w2 = C.measure(s2, 50);
        const gap = 110, total = w1 + w2 + gap + 60;
        const fits = total < W - 80;
        if (fits) {
          const a = lx - total / 2;
          C.nokta(a + 15, ly, true, seg(st, 0, 0.3), C.RED);
          txt(s1, a + 45, ly, { s: 50, a: 'left', c: C.BLK, p: seg(st, 0.1, 0.6) });
          C.nokta(a + 45 + w1 + gap, ly, false, seg(st, 0.4, 0.7), C.INK);
          txt(s2, a + 75 + w1 + gap, ly, { s: 50, a: 'left', c: C.BLK, p: seg(st, 0.5, 1.0) });
        } else {
          C.nokta(cx - Math.max(w1, w2) / 2 - 20, ly - 45, true, seg(st, 0, 0.3), C.RED);
          txt(s1, cx - Math.max(w1, w2) / 2 + 10, ly - 45, { s: 50, a: 'left', c: C.BLK, p: seg(st, 0.1, 0.6) });
          C.nokta(cx - Math.max(w1, w2) / 2 - 20, ly + 20, false, seg(st, 0.4, 0.7), C.INK);
          txt(s2, cx - Math.max(w1, w2) / 2 + 10, ly + 20, { s: 50, a: 'left', c: C.BLK, p: seg(st, 0.5, 1.0) });
        }
      });
    }, 0.3);

    // --- B: kurs saatleri ---
    blok(t, 8.4, 16.8, lt => {
      const x0 = wide ? 220 : 110, x1 = W - (wide ? 220 : 110);
      const ay = wide ? 480 : 500, ry = wide ? 790 : 800;
      const nA = 'Resim kursu: A = [10, 14]', nB = 'Bale kursu: B = [12, 16]';
      if (wide) {
        txt(nA, 120, 205, { s: 56, a: 'left', c: C.RED, b: true, p: seg(lt, 0.1, 0.6) });
        txt(nB, W - 120, 205, { s: 56, a: 'right', c: '#a07800', b: true, p: seg(lt, 0.6, 1.1) });
      } else {
        txt(nA, cx, 190, { s: 54, c: C.RED, b: true, p: seg(lt, 0.1, 0.6) });
        txt(nB, cx, 260, { s: 54, c: '#a07800', b: true, p: seg(lt, 0.6, 1.1) });
      }
      const X = C.dogru({ x0, x1, y: ay, min: 8, max: 18, step: 1, p: seg(lt, 0, 0.6), lab: v => (v % 2 === 0 ? String(v) : null) });
      txt('saat', x1 + 10, ay - 55, { s: 48, a: 'right', c: C.GRY, p: seg(lt, 0.3, 0.6) });
      // A ve B bantları (doğrunun üstünde)
      const yA = ay - 80, yB = ay - 135;
      C.hl(X(10), yA - 16, (X(14) - X(10)) * seg(lt, 0.3, 0.9), 32, C.HL.pembe);
      line(X(10), yA, X(10) + (X(14) - X(10)) * seg(lt, 0.3, 0.9), yA, { c: C.RED, w: 7 });
      C.nokta(X(10), yA, true, seg(lt, 0.3, 0.5), C.RED); C.nokta(X(14), yA, true, seg(lt, 0.8, 1.0), C.RED);
      txt('A', X(10) - 45, yA, { s: 52, b: true, c: C.RED, p: seg(lt, 0.3, 0.6) });
      C.hl(X(12), yB - 16, (X(16) - X(12)) * seg(lt, 0.9, 1.5), 32, C.HL.sari);
      line(X(12), yB, X(12) + (X(16) - X(12)) * seg(lt, 0.9, 1.5), yB, { c: '#a07800', w: 7 });
      C.nokta(X(12), yB, true, seg(lt, 0.9, 1.1), '#a07800'); C.nokta(X(16), yB, true, seg(lt, 1.4, 1.6), '#a07800');
      txt('B', X(16) + 45, yB, { s: 52, b: true, c: '#a07800', p: seg(lt, 0.9, 1.2) });
      // işlem çipleri
      const ops = [
        { ad: 'birleşim', f: 'A ∪ B = [10, 16]', seg: [[10, 16, true, true]] },
        { ad: 'kesişim', f: 'A ∩ B = [12, 14]', seg: [[12, 14, true, true]] },
        { ad: 'fark', f: 'A \\ B = [10, 12)', seg: [[10, 12, true, false]] },
        { ad: 'tümleme (evrensel küme ℝ)', f: "A' = (−∞, 10) ∪ (14, ∞)", seg: [[-Infinity, 10, false, false], [14, Infinity, false, false]] },
      ];
      const k = clamp(Math.floor((lt - 1.8) / 1.6), 0, 3);
      if (lt >= 1.6) {
        const X2 = C.dogru({ x0, x1, y: ry, min: 8, max: 18, step: 1, p: seg(lt, 1.6, 2.0), lab: v => (v % 2 === 0 ? String(v) : null) });
        blok(lt, 1.8 + k * 1.6, 1.8 + (k + 1) * 1.6, st => {
          const op = ops[k];
          txt(op.ad, cx, ry - 150, { s: 52, c: C.PUR, b: true, p: seg(st, 0, 0.3), maxW: W - 100 });
          op.seg.forEach(([a, b, ca, cb]) => {
            C.bant(X2, ry - 50, a, b, C.HL.mor, seg(st, 0.15, 0.6), { xmin: x0 - 30, xmax: x1 + 30, c: C.PUR });
            if (isFinite(a)) C.nokta(X2(a), ry - 50, ca, seg(st, 0.15, 0.35), C.PUR);
            if (isFinite(b)) C.nokta(X2(b), ry - 50, cb, seg(st, 0.45, 0.65), C.PUR);
          });
          const fy2 = ry + 150;
          const fw = C.measure(op.f, 80, true);
          hl(cx - Math.min(fw, W - 80) / 2 - 16, fy2 - 50, Math.min(fw, W - 80) + 32, 100, C.HL.mor, seg(st, 0.6, 0.9));
          txt(op.f, cx, fy2, { s: 80, b: true, c: C.PUR, p: seg(st, 0.35, 0.75), maxW: W - 80 });
        }, k === 3 ? 0.3 : 0.15);
      }
    }, 0.3);

    // --- C: köprü ve mutlak değer ---
    blok(t, 16.8, Infinity, lt => {
      const bx0 = 60, bx1 = W - 60, deck = wide ? 420 : 400;
      const t1 = lerp(bx0, bx1, 0.27), t2 = lerp(bx0, bx1, 0.73), top = 190;
      const bp = seg(lt, 0, 1.4);
      const flex = Math.sin(t * 2.2) * 7 * seg(lt, 1.0, 1.6);
      // deniz
      for (let i = 0; i < 3; i++) {
        const pts = []; for (let x = bx0; x <= bx1; x += 30) pts.push([x, deck + 70 + i * 26 + Math.sin(x * 0.03 + i + t * 1.5) * 6]);
        pen(pts, { c: 'rgba(40,120,200,0.55)', w: 3, p: bp });
      }
      // tabliye
      const dpts = []; for (let x = bx0; x <= bx1; x += 30) { const u = (x - bx0) / (bx1 - bx0); dpts.push([x, deck + flex * Math.sin(u * Math.PI)]); }
      pen(dpts, { c: C.BLK, w: 7, p: bp });
      // kuleler
      [t1, t2].forEach(tx => {
        line(tx - 18, deck + 60, tx - 10, top, { c: C.RED, w: 7, p: bp });
        line(tx + 18, deck + 60, tx + 10, top, { c: C.RED, w: 7, p: bp });
        line(tx - 14, top + 50, tx + 14, top + 50, { c: C.RED, w: 5, p: bp });
      });
      // ana kablo
      const cab = []; for (let x = t1; x <= t2; x += 20) { const u = (x - t1) / (t2 - t1); cab.push([x, top + 4 + 4 * (deck - 30 - top) * u * (1 - u) + flex * Math.sin(u * Math.PI) * 0.5]); }
      pen(cab, { c: C.BLK, w: 4, p: seg(lt, 0.5, 1.4) });
      pen([[bx0 + 10, deck - 6], [t1, top + 4]], { c: C.BLK, w: 4, p: seg(lt, 0.5, 1.2) });
      pen([[t2, top + 4], [bx1 - 10, deck - 6]], { c: C.BLK, w: 4, p: seg(lt, 0.5, 1.2) });
      for (let x = t1 + 40; x < t2; x += 60) { const u = (x - t1) / (t2 - t1); line(x, top + 8 + 4 * (deck - 30 - top) * u * (1 - u), x, deck + flex * Math.sin((x - bx0) / (bx1 - bx0) * Math.PI), { c: C.GRY, w: 2, p: seg(lt, 0.9, 1.5) }); }
      txt('1915 Çanakkale Köprüsü', wide ? W - 90 : cx, wide ? 160 : 160, { s: 50, a: wide ? 'right' : 'center', c: C.GRY, p: seg(lt, 0.4, 1.0), b: true });
      para('Tabliye ısıyla uzar, kısalır. Güvenli aralık = merkez ± tolerans', cx, wide ? 545 : 580, { s: 52, c: C.BLK, p: seg(lt, 1.0, 2.2), maxW: W - 120 });
      // sayı doğrusu
      const ny = wide ? 770 : 810;
      const x0 = wide ? 360 : 110, x1 = W - (wide ? 360 : 110);
      const X = C.dogru({ x0, x1, y: ny, min: 0, max: 6, step: 1, p: seg(lt, 1.6, 2.3) });
      if (lt >= 2.3) {
        C.bant(X, ny, 2, 4, C.HL.turuncu, seg(lt, 2.4, 2.9), { c: '#c05a00' });
        C.nokta(X(2), ny, false, seg(lt, 2.4, 2.6), '#c05a00'); C.nokta(X(4), ny, false, seg(lt, 2.7, 2.9), '#c05a00');
      }
      if (lt >= 4.2) {
        pen([[X(3), ny - 18], [X(3) - 12, ny - 42], [X(3) + 12, ny - 42], [X(3), ny - 18]], { c: C.RED, w: 5, p: seg(lt, 4.2, 4.4) });
        txt('merkez', X(3), ny + 100, { s: 48, b: true, c: C.RED, p: seg(lt, 4.2, 4.6) });
        arrow(X(3), ny - 65, X(2), ny - 65, { c: C.RED, w: 4, p: seg(lt, 4.6, 5.0) });
        arrow(X(3), ny - 65, X(4), ny - 65, { c: C.RED, w: 4, p: seg(lt, 4.6, 5.0) });
        txt('1', (X(3) + X(2)) / 2, ny - 100, { s: 48, b: true, c: C.RED, p: seg(lt, 4.8, 5.1) });
        txt('1', (X(3) + X(4)) / 2, ny - 100, { s: 48, b: true, c: C.RED, p: seg(lt, 4.8, 5.1) });
      }
      const fy = wide ? 975 : 1000;
      blok(lt, 2.4, 4.2, st => txt('2 < x < 4', cx, fy, { s: 88, b: true, c: '#c05a00', p: seg(st, 0, 0.4) }), 0.15);
      blok(lt, 4.2, 5.4, st => txt('merkez = (2 + 4) / 2 = 3,  tolerans = 1', cx, fy, { s: 72, b: true, c: C.RED, p: seg(st, 0, 0.5), maxW: W - 80 }), 0.15);
      blok(lt, 5.4, Infinity, st => {
        const f = '2 < x < 4  ⇔  |x − 3| < 1';
        const fw = Math.min(W - 80, C.measure(f, 92, true));
        hl(cx - fw / 2 - 20, fy - 55, fw + 40, 110, C.HL.sari, seg(st, 0.5, 0.9));
        txt(f, cx, fy, { s: 92, b: true, c: C.INK, p: seg(st, 0, 0.5), maxW: W - 80 });
      });
    });
  }

  // =====================================================================
  // 3) SAYI KÜMELERİ
  function kumeler(t, L) {
    const { W, H, cx, wide } = L;
    baslik('MAT.9.1.3', 'Sayı kümeleri ve özellikleri', t, L);

    // --- A: iç içe kümeler ---
    blok(t, 0, 9.6, lt => {
      const bx = wide ? 90 : 40, by = 170, bw = wide ? 1170 : W - 80, bh = wide ? 740 : 580;
      const M = (u, v) => [bx + u * bw, by + v * bh];
      const qEnd = wide ? 0.76 : 0.73; // ℚ | ℚ' sınırı
      // ℝ
      const rp = seg(lt, 7.2, 7.9);
      if (rp > 0) {
        C.fillSoft(ctx => ctx.rect(bx, by, bw, bh), `rgba(90,225,120,${0.12 * rp})`);
        rect(bx, by, bw, bh, { c: C.GRN, w: 6, p: rp });
        txt('ℝ', bx + bw - 50, by + 55, { s: 72, b: true, c: C.GRN, p: seg(lt, 7.5, 7.9) });
        const dv = []; for (let i = 0; i <= 20; i++) { const v = i / 20; dv.push([bx + qEnd * bw + Math.sin(v * 9) * 12, by + v * bh]); }
        pen(dv, { c: C.GRN, w: 4, dash: [14, 10], p: seg(lt, 7.6, 8.2) });
        txt("ℚ'", bx + (qEnd + 1) / 2 * bw, by + 0.22 * bh, { s: 64, b: true, c: C.GRN, p: seg(lt, 7.8, 8.2) });
        txt('irrasyonel', bx + (qEnd + 1) / 2 * bw, by + 0.33 * bh, { s: 48, c: C.GRN, p: seg(lt, 7.9, 8.3), maxW: (1 - qEnd) * bw - 20 });
        ['\\r{2}', 'π', '−\\r{3}'].forEach((s, i) => txt(s, bx + (qEnd + 1) / 2 * bw + (i - 1) * 0 , by + (0.5 + i * 0.16) * bh, { s: 56, b: true, c: C.GRN, p: seg(lt, 8.0 + i * 0.2, 8.4 + i * 0.2) }));
      }
      // ℚ
      const qp = seg(lt, 4.8, 5.5);
      if (qp > 0) {
        C.fillSoft(ctx => ctx.rect(bx + 16, by + 16, qEnd * bw - 32, bh - 32), `rgba(70,175,255,${0.12 * qp})`);
        rect(bx + 16, by + 16, qEnd * bw - 32, bh - 32, { c: C.INK, w: 5, p: qp });
        txt('ℚ', bx + 70, by + 75, { s: 72, b: true, c: C.INK, p: seg(lt, 5.1, 5.5) });
        const qs = [['1/2', 0.13, 0.3], ['−3/4', 0.12, 0.82], ['0,25', 0.64, 0.14], ['7/3', 0.66, 0.86]];
        qs.forEach(([s, u, v], i) => { const [x, y] = M(u, v); txt(s, x, y, { s: 56, b: true, c: C.INK, p: seg(lt, 5.4 + i * 0.2, 5.8 + i * 0.2) }); });
      }
      // ℤ
      const zc = M(0.40, 0.53), zrx = 0.29 * bw, zry = 0.37 * bh;
      const zp = seg(lt, 2.4, 3.1);
      if (zp > 0) {
        C.fillSoft(ctx => ctx.ellipse(zc[0], zc[1], zrx, zry, 0, 0, 7), `rgba(255,155,40,${0.14 * zp})`);
        ellipse(zc[0], zc[1], zrx, zry, { c: '#c05a00', w: 5, p: zp });
        txt('ℤ', zc[0] - zrx * 0.55, zc[1] - zry * 0.62, { s: 72, b: true, c: '#c05a00', p: seg(lt, 2.8, 3.1) });
        [['−1', -0.72, 0.1], ['−2', 0.66, -0.34], ['−50', 0.62, 0.52]].forEach(([s, u, v], i) =>
          txt(s, zc[0] + u * zrx, zc[1] + v * zry, { s: 56, b: true, c: '#c05a00', p: seg(lt, 3.0 + i * 0.3, 3.4 + i * 0.3) }));
      }
      // ℕ
      const nc = M(0.40, 0.58), nrx = 0.15 * bw, nry = 0.2 * bh;
      const np = seg(lt, 0.1, 0.8);
      C.fillSoft(ctx => ctx.ellipse(nc[0], nc[1], nrx * np, nry * np, 0, 0, 7), 'rgba(255,92,165,0.16)');
      ellipse(nc[0], nc[1], nrx, nry, { c: C.RED, w: 5, p: np });
      txt('ℕ', nc[0], nc[1] - nry * 0.5, { s: 72, b: true, c: C.RED, p: seg(lt, 0.4, 0.8) });
      const nums = ['0', '1', '2', '3', '…'];
      nums.forEach((s, i) => txt(s, nc[0] - nrx * 0.62 + i * nrx * 0.31, nc[1] + nry * 0.3, { s: 56, b: true, c: C.RED, p: seg(lt, 0.8 + i * 0.3, 1.1 + i * 0.3) }));

      // ihtiyaç doodle'ları
      const dx = wide ? 1590 : cx, dy = wide ? 540 : 900;
      const need = [
        [0, 2.4, 'saymak → ℕ'],
        [2.4, 4.8, 'borç → negatif → ℤ'],
        [4.8, 7.2, 'pay etmek → kesir → ℚ'],
        [7.2, 9.6, "köşegen → \\r{2} ∉ ℚ"],
      ];
      need.forEach(([a, b, s], i) => blok(lt, a, b, st => {
        const ix = wide ? dx : cx - 250, iy = wide ? dy - 140 : dy;
        const tx = wide ? dx : cx + 130, ty = wide ? dy + 110 : dy;
        if (i === 0) { for (let k = 0; k < 5; k++) line(ix - 60 + k * 26, iy - 50, ix - 60 + k * 26 + (k === 4 ? 0 : 0), iy + 50, { c: C.RED, w: 6, p: seg(st, 0.1 + k * 0.1, 0.25 + k * 0.1) }); line(ix - 75, iy + 30, ix + 60, iy - 30, { c: C.RED, w: 6, p: seg(st, 0.7, 0.9) }); }
        if (i === 1) { rect(ix - 80, iy - 70, 160, 140, { c: '#c05a00', w: 4, p: seg(st, 0, 0.4) }); txt('borç', ix, iy - 25, { s: 48, c: '#c05a00', p: seg(st, 0.2, 0.5) }); txt('−50 TL', ix, iy + 30, { s: 50, b: true, c: '#c05a00', p: seg(st, 0.3, 0.7) }); }
        if (i === 2) {
          circle(ix, iy, 75, { c: C.INK, w: 5, p: seg(st, 0, 0.4) });
          line(ix - 75, iy, ix + 75, iy, { c: C.INK, w: 4, p: seg(st, 0.3, 0.5) }); line(ix, iy - 75, ix, iy + 75, { c: C.INK, w: 4, p: seg(st, 0.4, 0.6) });
          C.fillSoft(ctx => { ctx.moveTo(ix, iy); ctx.arc(ix, iy, 72, -Math.PI / 2, 0); ctx.closePath(); }, C.HL.sari);
        }
        if (i === 3) {
          rect(ix - 65, iy - 65, 130, 130, { c: C.GRN, w: 5, p: seg(st, 0, 0.4) });
          line(ix - 65, iy + 65, ix + 65, iy - 65, { c: C.RED, w: 6, p: seg(st, 0.35, 0.6) });
          txt('1', ix - 95, iy, { s: 48, c: C.GRN, p: seg(st, 0.3, 0.5) });
          txt('\\r{2}', ix + 15, iy - 18, { s: 50, b: true, c: C.RED, p: seg(st, 0.5, 0.8) });
        }
        txt(s, tx, ty, { s: 52, b: true, c: C.BLK, p: seg(st, 0.3, 0.8), maxW: wide ? 560 : 600 });
      }, i === 3 ? 0 : 0.2));
      // formül
      if (lt >= 8.4) {
        const f = 'ℕ ⊆ ℤ ⊆ ℚ ⊆ ℝ';
        const fy = wide ? 990 : 1030;
        const fw = C.measure(f, 84, true);
        const fx = wide ? bx + bw / 2 : cx;
        hl(fx - fw / 2 - 20, fy - 50, fw + 40, 100, C.HL.sari, seg(lt, 8.8, 9.2));
        txt(f, fx, fy, { s: 84, b: true, c: C.BLK, p: seg(lt, 8.4, 8.9) });
      }
    }, 0.3);

    // --- B: YBC 7289 ---
    blok(t, 9.6, 13.2, lt => {
      const tx = wide ? 440 : cx, ty = wide ? 580 : 420, R = wide ? 230 : 170;
      const tp = seg(lt, 0, 0.9);
      C.hatch(ctx => ctx.ellipse(tx, ty, R, R * 0.95, 0, 0, 7), tx - R, ty - R, 2 * R, 2 * R, { p: tp, c: 'rgba(150,100,50,0.45)', gap: 11, ang: 0.6 });
      ellipse(tx, ty, R, R * 0.95, { c: '#7a4a1e', w: 6, p: tp });
      const s = R * 0.55;
      C.ctx.save(); C.ctx.translate(tx, ty); C.ctx.rotate(0.785);
      rect(-s, -s, 2 * s, 2 * s, { c: '#5a3210', w: 5, p: seg(lt, 0.3, 0.9) });
      line(-s, -s, s, s, { c: '#5a3210', w: 5, p: seg(lt, 0.6, 1.0) });
      line(-s, s, s, -s, { c: '#5a3210', w: 5, p: seg(lt, 0.7, 1.1) });
      for (let i = 0; i < 6; i++) { // çivi yazısı işaretleri
        const u = -s * 0.8 + i * s * 0.28;
        C.alpha(seg(lt, 0.9 + i * 0.05, 1.1 + i * 0.05), () => {
          pen([[u, -10], [u + 12, -4], [u, 2]], { c: '#5a3210', w: 4, j: 0.4 });
          line(u + 6, -2, u + 6, 16, { c: '#5a3210', w: 3, j: 0.4 });
        });
      }
      C.ctx.restore();
      const cx2 = wide ? 1280 : cx;
      const mw = wide ? 1000 : W - 80;
      let y = wide ? 260 : 690;
      txt('YBC 7289 · Babil tableti', cx2, y, { s: 60, b: true, c: '#7a4a1e', p: seg(lt, 0.8, 1.3), maxW: mw });
      txt('yaklaşık 3800 yıllık', cx2, y + (wide ? 80 : 70), { s: 50, c: C.GRY, p: seg(lt, 1.1, 1.5), maxW: mw });
      const ly1 = wide ? 520 : 870, ly2 = wide ? 660 : 960;
      const lab1 = 'Babil:', lab2 = 'Bugün:';
      const v1 = '1,41421 29...', v2 = '1,41421 35...';
      const lx = cx2 - (wide ? 400 : 440);
      txt(lab1, lx, ly1, { s: 56, a: 'left', c: C.GRY, p: seg(lt, 1.6, 1.9) });
      txt(lab2, lx, ly2, { s: 56, a: 'left', c: C.GRY, p: seg(lt, 2.2, 2.5) });
      const vx = lx + 200;
      const common = C.measure('1,41421', 76, true);
      hl(vx - 10, ly1 - 45, common + 20, 90, C.HL.yesil, seg(lt, 2.8, 3.1));
      hl(vx - 10, ly2 - 45, common + 20, 90, C.HL.yesil, seg(lt, 2.8, 3.1));
      txt(v1, vx, ly1, { s: 76, b: true, a: 'left', c: '#7a4a1e', p: seg(lt, 1.6, 2.2) });
      txt(v2, vx, ly2, { s: 76, b: true, a: 'left', c: C.INK, p: seg(lt, 2.2, 2.8) });
      txt('\\r{2} değeri: 5 ondalık basamak doğru!', cx2, wide ? 830 : 1040, { s: 56, b: true, c: C.GRN, p: seg(lt, 2.9, 3.4), maxW: mw });
    }, 0.3);

    // --- C: yoğunluk / doğrudan ispat ---
    blok(t, 13.2, 19.2, lt => {
      para('Doğrudan ispat: iki rasyonel sayı arasında her zaman bir rasyonel sayı daha vardır.', cx, wide ? 215 : 235, { s: 56, b: true, c: C.BLK, p: seg(lt, 0, 1.0), maxW: W - 140 });
      const ny = wide ? 560 : 600;
      const x0 = 150, x1 = W - 150;
      const his = [1, 0.75, 0.625, 0.5625];
      const zi = lt < 2.4 ? 0 : lt < 3.6 ? ease(seg(lt, 2.4, 3.0)) : lt < 4.8 ? 1 + ease(seg(lt, 3.6, 4.2)) : 2 + ease(seg(lt, 4.8, 5.4));
      const i0 = Math.min(2, Math.floor(zi)), fr = zi - i0;
      const lo = 0.5;
      // log-ölçekte yumuşak geçiş
      const hi = lo + (his[i0] - lo) * Math.pow((his[i0 + 1] - lo) / (his[i0] - lo), fr);
      const X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
      arrow(x0 - 60, ny, x1 + 60, ny, { c: C.BLK, w: 4, p: seg(lt, 0.8, 1.4) });
      const pts = [
        { v: 0.5, s: '1/2', at: 1.0 }, { v: 1, s: '1', at: 1.2 },
        { v: 0.75, s: '3/4', at: 1.8, m: true }, { v: 0.625, s: '5/8', at: 3.0, m: true },
        { v: 0.5625, s: '9/16', at: 4.2, m: true }, { v: 0.53125, s: '17/32', at: 5.4, m: true },
      ];
      pts.forEach((q, i) => {
        const x = X(q.v);
        if (x > x1 + 70 || lt < q.at) return;
        const p = seg(lt, q.at, q.at + 0.3);
        C.nokta(x, ny, true, p, q.m ? C.RED : C.INK);
        txt(q.s, x, ny + (q.m ? -70 : 70), { s: 56, b: true, c: q.m ? C.RED : C.INK, p });
        if (q.m) { // iki uçtan gelen yaylar
          const prev = pts.filter(r => r.at < q.at);
          const a = 0.5, b = prev.filter(r => r.v > q.v).reduce((m, r) => Math.min(m, r.v), 9);
          const arc = (xa, xb) => { const ps = []; for (let k = 0; k <= 16; k++) { const u = k / 16; ps.push([lerp(xa, xb, u), ny - 20 - Math.sin(u * Math.PI) * 60]); } return ps; };
          if (lt < q.at + 1.2) C.alpha(1 - seg(lt, q.at + 0.9, q.at + 1.2), () => {
            pen(arc(X(a), x), { c: C.RED, w: 3, dash: [8, 8], p: seg(lt, q.at - 0.3, q.at) });
            pen(arc(X(b), x), { c: C.RED, w: 3, dash: [8, 8], p: seg(lt, q.at - 0.3, q.at) });
          });
        }
      });
      // büyüteç
      if (lt > 2.2) {
        const mx = x0 + 120, my = ny + 180;
        C.alpha(seg(lt, 2.2, 2.6), () => { circle(mx, my, 44, { c: C.GRY, w: 5 }); line(mx + 32, my + 32, mx + 80, my + 80, { c: C.GRY, w: 9 }); });
        txt('yakınlaştır: ×' + Math.round((1 - lo) / (hi - lo)), mx + 110, my, { s: 48, a: 'left', c: C.GRY, p: seg(lt, 2.4, 2.8) });
      }
      const fy = wide ? 920 : 950;
      if (lt >= 3.6) {
        const f = 'a, b ∈ ℚ  ⇒  (a + b) / 2 ∈ ℚ';
        const fw = Math.min(W - 80, C.measure(f, 84, true));
        hl(cx - fw / 2 - 20, fy - 50, fw + 40, 100, C.HL.sari, seg(lt, 4.1, 4.5));
        txt(f, cx, fy, { s: 84, b: true, c: C.INK, p: seg(lt, 3.6, 4.2), maxW: W - 80 });
        txt('ortalama her zaman ikisinin arasındadır', cx, fy + 95, { s: 48, c: C.GRY, p: seg(lt, 4.4, 5.0), maxW: W - 80 });
      }
    }, 0.3);

    // --- D: aksine örnek ---
    blok(t, 19.2, Infinity, lt => {
      const nw = wide ? 1240 : W - 90, nh = wide ? 250 : 290;
      C.not(cx - nw / 2, 190, nw, nh, '#d8f0ff', 0.015, seg(lt, 0, 0.5), (x, y) => {
        txt('İDDİA', x + nw / 2, y + 55, { s: 48, b: true, c: C.GRY });
        para('İki irrasyonel sayının çarpımı irrasyoneldir.', x + nw / 2, y + nh / 2 + 30, { s: 64, b: true, c: C.BLK, p: seg(lt, 0.2, 1.0), maxW: nw - 60 });
      });
      const fy = wide ? 640 : 680;
      txt('\\r{2} · \\r{2} = 2', cx, fy, { s: 110, b: true, c: C.INK, p: seg(lt, 1.2, 1.9) });
      txt('\\r{2} ∉ ℚ', cx - (wide ? 470 : 330), fy - 110, { s: 56, c: C.GRN, p: seg(lt, 1.5, 1.9) });
      const w2 = C.measure('ama 2 rasyonel!', 64, true);
      hl(cx - w2 / 2 - 16, fy + 95, w2 + 32, 90, C.HL.yesil, seg(lt, 2.5, 2.8));
      txt('ama 2 rasyonel!', cx, fy + 140, { s: 64, b: true, c: C.GRN, p: seg(lt, 2.2, 2.7) });
      C.damga('ÇÜRÜTÜLDÜ', cx + (wide ? 420 : 250), wide ? 470 : 505, seg(lt, 3.0, 3.3), { s: 64 });
      txt('bir aksine örnek yeter', cx, wide ? 950 : 1000, { s: 52, c: C.RED, p: seg(lt, 3.4, 3.9), b: true });
    });
  }

  // =====================================================================
  // 4) CEBİR
  function cebir(t, L) {
    const { W, H, cx, wide } = L;
    baslik('MAT.9.1.4', 'İşlem özelliklerinden cebire', t, L);

    // --- A: (a+b)² ---
    blok(t, 0, 7.2, lt => {
      const a = wide ? 380 : 330, b = wide ? 200 : 170, S = a + b;
      const x0 = wide ? 250 : cx - S / 2, y0 = wide ? 230 : 190;
      const sp = seg(lt, 0, 0.9);
      rect(x0, y0, S, S, { c: C.BLK, w: 6, p: sp });
      const split = seg(lt, 1.2, 2.0);
      if (lt < 1.4) {
        txt('a + b', x0 + S / 2, y0 - 42, { s: 56, b: true, c: C.BLK, p: seg(lt, 0.4, 0.9) });
        C.ctx.save(); C.ctx.translate(x0 - 50, y0 + S / 2); C.ctx.rotate(-Math.PI / 2);
        txt('a + b', 0, 0, { s: 56, b: true, c: C.BLK, p: seg(lt, 0.5, 1.0) }); C.ctx.restore();
      } else {
        txt('a', x0 + a / 2, y0 - 42, { s: 56, b: true, c: C.INK }); txt('b', x0 + a + b / 2, y0 - 42, { s: 56, b: true, c: C.RED });
        txt('a', x0 - 45, y0 + a / 2, { s: 56, b: true, c: C.INK }); txt('b', x0 - 45, y0 + a + b / 2, { s: 56, b: true, c: C.RED });
      }
      line(x0 + a, y0, x0 + a, y0 + S, { c: C.BLK, w: 4, p: split });
      line(x0, y0 + a, x0 + S, y0 + a, { c: C.BLK, w: 4, p: split });
      const pulse = lt > 5.6 ? 0.5 + 0.5 * Math.sin((lt - 5.6) * 10) : 1;
      const parts = [
        [x0, y0, a, a, C.HL.mavi, 'a²', 2.4, C.INK],
        [x0 + a, y0, b, a, C.HL.sari, 'ab', 3.0, '#8a6a00'],
        [x0, y0 + a, a, b, C.HL.sari, 'ab', 3.6, '#8a6a00'],
        [x0 + a, y0 + a, b, b, C.HL.pembe, 'b²', 4.2, C.RED],
      ];
      parts.forEach(([x, y, w, h, col, lab, at, tc], i) => {
        const p = seg(lt, at, at + 0.5);
        if (p <= 0) return;
        const k = (i === 1 || i === 2) ? pulse : 1;
        C.alpha(k, () => hl(x + 6, y + 6, w - 12, h - 12, col, p));
        txt(lab.replace('²', '^{2}'), x + w / 2, y + h / 2, { s: 80, b: true, c: tc, p });
      });
      const fx = wide ? 1370 : cx, fy = wide ? 520 : 880;
      const f = '(a + b)^{2} = a^{2} + 2ab + b^{2}';
      const fw = Math.min(wide ? 920 : W - 60, C.measure(f, 84, true));
      hl(fx - fw / 2 - 20, fy - 55, fw + 40, 110, C.HL.sari, seg(lt, 5.4, 5.8));
      txt(f, fx, fy, { s: 84, b: true, c: C.BLK, p: seg(lt, 4.8, 5.4), maxW: wide ? 920 : W - 60 });
      txt('iki tane ab var → 2ab', fx, fy + 110, { s: 52, c: '#8a6a00', p: seg(lt, 5.8, 6.3), b: true });
    }, 0.3);

    // --- B: Deniz Hanım'ın bahçesi ---
    blok(t, 7.2, 13.2, lt => {
      const a = wide ? 470 : 440, b = wide ? 190 : 170;
      const x0 = wide ? 150 : (W - (a + b)) / 2, y0 = wide ? 260 : 290;
      txt("Deniz Hanım'ın kare bahçesi", wide ? 1420 : cx, wide ? 250 : 175, { s: 56, b: true, c: C.GRN, p: seg(lt, 0, 0.6), maxW: W - 100 });
      const gp = seg(lt, 0, 0.8);
      const R1 = [x0, y0, a, a - b]; // üst şerit
      const hatchR = (r, p, col) => C.hatch(ctx => ctx.rect(r[0], r[1], r[2], r[3]), r[0], r[1], r[2], r[3], { p, c: col, gap: 16 });
      hatchR(R1, gp, 'rgba(31,138,76,0.45)');
      rect(R1[0], R1[1], R1[2], R1[3], { c: C.GRN, w: 5, p: gp });
      // köşe karesi b×b
      const cutP = seg(lt, 1.2, 1.8);
      if (lt < 1.2) { hatchR([x0, y0 + a - b, a, b], gp, 'rgba(31,138,76,0.45)'); rect(x0, y0, a, a, { c: C.GRN, w: 5, p: gp }); }
      if (lt >= 1.2) {
        rect(x0 + a - b, y0 + a - b, b, b, { c: C.RED, w: 4, dash: [10, 8] });
        C.alpha(1 - cutP, () => hatchR([x0 + a - b, y0 + a - b, b, b], 1, 'rgba(31,138,76,0.45)'));
        txt('b', x0 + a - b / 2, y0 + a + 42, { s: 52, b: true, c: C.RED, p: cutP });
        txt('b²', x0 + a - b / 2, y0 + a - b / 2, { s: 56, b: true, c: C.RED, p: cutP });
      }
      // hareket eden şerit R2: (a−b) × b
      const mp = ease(seg(lt, 2.4, 3.9));
      const c1 = [x0 + (a - b) / 2, y0 + a - b / 2];
      const c2 = [x0 + a + b / 2, y0 + (a - b) / 2];
      const cc = [lerp(c1[0], c2[0], mp), lerp(c1[1], c2[1], mp) - Math.sin(mp * Math.PI) * 80];
      C.ctx.save(); C.ctx.translate(cc[0], cc[1]); C.ctx.rotate(-Math.PI / 2 * mp);
      const w2 = a - b, h2 = b;
      if (lt >= 1.2) hatchR([-w2 / 2, -h2 / 2, w2, h2], 1, 'rgba(31,138,76,0.45)');
      rect(-w2 / 2, -h2 / 2, w2, h2, { c: lt >= 1.2 ? C.PUR : C.GRN, w: 5, p: lt >= 1.2 ? 1 : gp });
      C.ctx.restore();
      // etiketler
      if (lt < 2.4) {
        txt('a', x0 + a / 2, y0 - 40, { s: 56, b: true, c: C.BLK, p: seg(lt, 0.4, 0.8) });
        txt('a', x0 - 40, y0 + a / 2, { s: 56, b: true, c: C.BLK, p: seg(lt, 0.4, 0.8) });
        txt('a^{2} − b^{2}', x0 + a / 2, y0 + (a - b) / 2, { s: 80, b: true, c: C.GRN, p: seg(lt, 1.7, 2.2) });
      } else if (lt >= 3.9) {
        const ap = seg(lt, 3.9, 4.3);
        txt('a + b', x0 + (a + b) / 2, y0 - 42, { s: 56, b: true, c: C.PUR, p: ap });
        C.ctx.save(); C.ctx.translate(x0 - 44, y0 + (a - b) / 2); C.ctx.rotate(-Math.PI / 2);
        txt('a − b', 0, 0, { s: 56, b: true, c: C.PUR, p: ap }); C.ctx.restore();
        rect(x0, y0, a + b, a - b, { c: C.PUR, w: 6, p: ap });
      }
      const fx = wide ? 1420 : cx, fy = wide ? 560 : 900;
      if (lt >= 4.2) {
        const f = 'a^{2} − b^{2} = (a − b)(a + b)';
        const fw = Math.min(wide ? 900 : W - 60, C.measure(f, 84, true));
        hl(fx - fw / 2 - 20, fy - 55, fw + 40, 110, C.HL.mor, seg(lt, 4.7, 5.1));
        txt(f, fx, fy, { s: 84, b: true, c: C.BLK, p: seg(lt, 4.2, 4.8), maxW: wide ? 900 : W - 60 });
      }
      txt('iki kare farkı', fx, fy + (wide ? 110 : 105), { s: 52, c: C.PUR, p: seg(lt, 4.9, 5.3), b: true });
    }, 0.3);

    // --- C: önermeler ---
    blok(t, 13.2, Infinity, lt => {
      txt('Sıfır çarpım kuralı', cx, 220, { s: 56, c: C.GRY, p: seg(lt, 0, 0.4) });
      const f = 'a · b = 0  ⇔  a = 0 ∨ b = 0';
      const fw = Math.min(W - 60, C.measure(f, 88, true));
      hl(cx - fw / 2 - 20, 330 - 55, fw + 40, 110, C.HL.sari, seg(lt, 0.8, 1.2));
      txt(f, cx, 330, { s: 88, b: true, c: C.BLK, p: seg(lt, 0.2, 0.9), maxW: W - 60 });
      txt('⇔ : ancak ve ancak     ∨ : veya', cx, 440, { s: 50, c: C.GRY, p: seg(lt, 1.2, 1.8), maxW: W - 80 });
      // her / bazı
      const y1 = wide ? 640 : 650, y2 = wide ? 820 : 850;
      const lx = wide ? 360 : 110;
      const q = (sym, x, y, p, col) => { circle(x, y, 38, { c: col, w: 4, p }); txt(sym, x, y, { s: 52, b: true, c: col, p }); };
      q('∀', lx, y1, seg(lt, 2.4, 2.8), C.RED);
      hl(lx + 60, y1 - 38, C.measure('Her', 68, true) + 20, 76, C.HL.pembe, seg(lt, 2.6, 2.9));
      txt('Her tam sayı çifttir.', lx + 70, y1, { s: 68, b: true, a: 'left', c: C.BLK, p: seg(lt, 2.4, 3.0) });
      const e1 = lx + 70 + C.measure('Her tam sayı çifttir.', 68, true);
      C.carpi(e1 + 60, y1, 52, seg(lt, 3.1, 3.4));
      if (wide) txt('3 çift değil!', e1 + 110, y1, { s: 50, a: 'left', c: C.RED, p: seg(lt, 3.3, 3.7) });
      else txt('(3 çift değil!)', lx + 70, y1 + 72, { s: 48, a: 'left', c: C.RED, p: seg(lt, 3.3, 3.7) });
      q('∃', lx, y2, seg(lt, 3.8, 4.2), C.GRN);
      hl(lx + 60, y2 - 38, C.measure('Bazı', 68, true) + 20, 76, C.HL.yesil, seg(lt, 4.0, 4.3));
      txt('Bazı tam sayılar çifttir.', lx + 70, y2, { s: 68, b: true, a: 'left', c: C.BLK, p: seg(lt, 3.8, 4.4) });
      const e2 = lx + 70 + C.measure('Bazı tam sayılar çifttir.', 68, true);
      C.tik(e2 + 60, y2, 60, seg(lt, 4.5, 4.8));
      if (wide) txt('örneğin 4', e2 + 110, y2, { s: 50, a: 'left', c: C.GRN, p: seg(lt, 4.6, 5.0) });
      else txt('(örneğin 4)', lx + 70, y2 + 72, { s: 48, a: 'left', c: C.GRN, p: seg(lt, 4.6, 5.0) });
      txt('Tek kelime, bambaşka anlam!', cx, wide ? 990 : 1030, { s: 60, b: true, c: C.PUR, p: seg(lt, 4.9, 5.5), maxW: W - 80 });
    });
  }

  // =====================================================================
  // 5) FİNAL
  function final(t, L) {
    const { W, H, cx, wide } = L;
    const pos = wide
      ? [[W * 0.2, 330], [W * 0.4, 330], [W * 0.6, 330], [W * 0.8, 330]]
      : [[cx - 240, 230], [cx + 240, 230], [cx - 240, 500], [cx + 240, 500]];
    const R = wide ? 125 : 100;
    const kod = ['MAT.9.1.1', 'MAT.9.1.2', 'MAT.9.1.3', 'MAT.9.1.4'];
    const cols = [C.HL.sari, C.HL.pembe, C.HL.mavi, C.HL.yesil];
    pos.forEach(([x, y], i) => {
      const p = seg(t, i * B, i * B + 0.5);
      C.pop(x, y, p, () => {
        C.fillSoft(ctx => ctx.arc(0, 0, R, 0, 7), cols[i]);
        circle(0, 0, R, { c: C.BLK, w: 5 });
        if (i === 0) txt('10^{n}', 0, 0, { s: 96, b: true, c: C.INK });
        if (i === 1) {
          line(-R * 0.75, 18, R * 0.75, 18, { c: C.BLK, w: 4 });
          hl(-R * 0.45, 2, R * 0.9, 32, C.HL.mor);
          C.nokta(-R * 0.45, 18, true, 1, C.PUR); C.nokta(R * 0.45, 18, false, 1, C.PUR);
          txt('[ )', 0, -40, { s: 56, b: true, c: C.PUR });
        }
        if (i === 2) {
          ellipse(0, 10, R * 0.8, R * 0.62, { c: '#1f8a4c', w: 4 });
          ellipse(-8, 18, R * 0.55, R * 0.42, { c: C.INK, w: 4 });
          ellipse(-14, 26, R * 0.3, R * 0.22, { c: C.RED, w: 4 });
          txt('ℝ', R * 0.52, -R * 0.45, { s: 48, b: true, c: '#1f8a4c' });
        }
        if (i === 3) {
          const s = R * 1.1, a = s * 0.62;
          rect(-s / 2, -s / 2, s, s, { c: C.BLK, w: 4 });
          line(-s / 2 + a, -s / 2, -s / 2 + a, s / 2, { c: C.BLK, w: 3 }); line(-s / 2, -s / 2 + a, s / 2, -s / 2 + a, { c: C.BLK, w: 3 });
          hl(-s / 2 + 4, -s / 2 + 4, a - 8, a - 8, C.HL.mavi);
          hl(-s / 2 + a + 4, -s / 2 + a + 4, s - a - 8, s - a - 8, C.HL.pembe);
        }
      });
      txt(kod[i], x, y + R + 45, { s: 48, b: true, c: C.GRY, p: seg(t, i * B + 0.3, i * B + 0.7) });
    });
    // son cümle: anlamlı yerden iki satıra bölünür
    const lines = ['Her sayının bir hikâyesi var —', 'bu yıl onları okuyacağız.'];
    const sy = wide ? 720 : 820;
    const lh = 76 * 1.3;
    lines.forEach((ln, i) => {
      const y = sy - lh / 2 + i * lh;
      const w = Math.min(W - 100, C.measure(ln, 76, true));
      hl(cx - w / 2 - 16, y - 45, w + 32, 90, C.HL.sari, seg(t, 5.0 + i * 0.3, 5.5 + i * 0.3));
      txt(ln, cx, y, { s: 76, b: true, c: C.INK, p: seg(t, 2.4 + i * 1.2, 3.6 + i * 1.2), maxW: W - 100 });
    });
    const by = wide ? 900 : 1020;
    txt('9. Sınıf Matematik · 1. Tema: Sayılar', cx, by, { s: 54, c: C.GRY, p: seg(t, 5.4, 6.4), maxW: W - 100 });
    if (wide) line(cx - 420, by + 45, cx + 420, by + 49, { c: C.RED, w: 4, p: seg(t, 6.2, 6.8) });
  }

  root.SAHNELER = { kanca, ussu, aralik, kumeler, cebir, final };
})(this);
