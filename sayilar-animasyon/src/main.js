// Oynatıcı: müzikle senkron saat, sahne geçişleri, klavye kontrolleri, video render arayüzü.
(function (root) {
  const C = root.CIZ, Z = root.ZAMAN, S = root.SAHNELER;
  const q = new URLSearchParams(location.search);
  const KARE = q.get('kare') === '1';
  const RENDER = q.get('render') === '1';
  const W = KARE ? 1080 : 1920, H = 1080;
  const L = { W, H, cx: W / 2, cy: H / 2, wide: !KARE };

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  C.ctx = ctx;

  // ---------- Zeminler (her biri bir kez çizilip önbelleğe alınır) ----------
  const zeminler = {};
  function tuval() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function doku(p, n, col, sz) {
    for (let i = 0; i < n; i++) {
      p.fillStyle = col(i);
      p.fillRect(C.rs(i * 1.7) * W, C.rs(i * 3.1 + 5) * H, sz, sz);
    }
  }
  function vinyet(p, a) {
    const g = p.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
    p.fillStyle = g; p.fillRect(0, 0, W, H);
  }
  const CIZICI = {
    defter(p) {
      p.fillStyle = '#fbf9f1'; p.fillRect(0, 0, W, H);
      p.strokeStyle = 'rgba(80,140,210,0.22)'; p.lineWidth = 1.5;
      for (let x = 0; x <= W; x += 40) { p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
      for (let y = 0; y <= H; y += 40) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); }
      doku(p, 9000, i => `rgba(120,100,60,${0.02 + C.rs(i * 7.3) * 0.04})`, 2);
      vinyet(p, 0.10);
      p.fillStyle = 'rgba(0,0,0,0.10)';
      for (let x = 60; x < W; x += 80) { p.beginPath(); p.arc(x, 14, 7, 0, 7); p.fill(); }
    },
    kraft(p) {
      p.fillStyle = '#e3c99d'; p.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i++) { // lifler
        const x = C.rs(i * 2.3) * W, y = C.rs(i * 5.7) * H, a = C.rs(i * 1.1) * 3.14, l = 6 + C.rs(i * 9.9) * 18;
        p.strokeStyle = C.rs(i * 4.4) > 0.5 ? 'rgba(120,80,30,0.16)' : 'rgba(255,245,220,0.22)';
        p.lineWidth = 1.2; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
      }
      p.fillStyle = 'rgba(90,60,30,0.22)';
      for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) { p.beginPath(); p.arc(x, y, 2, 0, 7); p.fill(); }
      vinyet(p, 0.22);
    },
    kara(p) {
      const g = p.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#2f4038'); g.addColorStop(1, '#1d2823');
      p.fillStyle = g; p.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { // silinmiş tebeşir izleri
        p.fillStyle = `rgba(255,255,255,${0.02 + C.rs(i * 3.9) * 0.03})`;
        p.beginPath(); p.ellipse(C.rs(i * 1.3) * W, C.rs(i * 2.7) * H, 120 + C.rs(i) * 260, 40 + C.rs(i * 8) * 90, C.rs(i * 5) * 3, 0, 7); p.fill();
      }
      doku(p, 7000, i => `rgba(255,255,255,${0.015 + C.rs(i * 7.3) * 0.03})`, 2);
      vinyet(p, 0.35);
      p.lineWidth = 22; p.strokeStyle = '#7a5230'; p.strokeRect(11, 11, W - 22, H - 22);
      p.lineWidth = 4; p.strokeStyle = 'rgba(0,0,0,0.35)'; p.strokeRect(24, 24, W - 48, H - 48);
    },
    gece(p) {
      const g = p.createRadialGradient(W * 0.5, H * 0.45, 50, W / 2, H / 2, W * 0.75);
      g.addColorStop(0, '#26336e'); g.addColorStop(1, '#090d22');
      p.fillStyle = g; p.fillRect(0, 0, W, H);
      [['rgba(170,90,255,0.10)', 0.2, 0.7], ['rgba(40,200,220,0.08)', 0.8, 0.3], ['rgba(255,90,170,0.07)', 0.65, 0.85]].forEach(([c, u, v]) => {
        const r = p.createRadialGradient(u * W, v * H, 10, u * W, v * H, 520);
        r.addColorStop(0, c); r.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = r; p.fillRect(0, 0, W, H);
      });
      for (let i = 0; i < 420; i++) {
        p.fillStyle = `rgba(255,255,255,${0.25 + C.rs(i * 4.1) * 0.6})`;
        p.beginPath(); p.arc(C.rs(i * 1.9) * W, C.rs(i * 6.3) * H, 0.6 + C.rs(i * 2.2) * 1.8, 0, 7); p.fill();
      }
    },
    plan(p) {
      const g = p.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2360ad'); g.addColorStop(1, '#17457f');
      p.fillStyle = g; p.fillRect(0, 0, W, H);
      p.lineWidth = 1;
      for (let x = 0; x <= W; x += 20) { p.strokeStyle = x % 100 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'; p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
      for (let y = 0; y <= H; y += 20) { p.strokeStyle = y % 100 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)'; p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); }
      p.strokeStyle = 'rgba(255,255,255,0.5)'; p.lineWidth = 3; p.strokeRect(18, 18, W - 36, H - 36);
      vinyet(p, 0.25);
    },
    renk(p, renk) {
      p.fillStyle = renk; p.fillRect(0, 0, W, H);
      for (let x = 0; x < W + 30; x += 30) for (let y = 0; y < H + 30; y += 30) { // yarım ton noktaları
        const k = Math.max(0, 1 - Math.hypot(x - W, y - H) / (W * 0.9));
        if (k <= 0) continue;
        p.fillStyle = 'rgba(0,0,0,0.07)'; p.beginPath(); p.arc(x + ((y / 30) % 2) * 15, y, 1 + k * 8, 0, 7); p.fill();
      }
      p.fillStyle = 'rgba(255,255,255,0.25)';
      p.beginPath(); p.arc(W * 0.1, H * 0.15, 260, 0, 7); p.fill();
      vinyet(p, 0.12);
    },
  };
  function zemin(ad) {
    if (!zeminler[ad]) { const c = tuval(); const [k, r] = ad.split(':'); CIZICI[k](c.getContext('2d'), r); zeminler[ad] = c; }
    return zeminler[ad];
  }

  const BOL = Z.BOLUMLER;
  const bolumAt = T => { for (let i = BOL.length - 1; i >= 0; i--) if (T >= BOL[i].t0) return i; return 0; };
  const GECIS = 0.6; // sahneler arası geçiş süresi
  const GECISLER = ['yukari', 'fosfor', 'sola', 'zoom'];
  const FOSFOR = ['#ffd84d', '#ff9cc0', '#8fd6ff', '#97e8ad'];

  function sahne(i, lt) {
    const b = BOL[i], tm = b.tema;
    let k = 0; while (k + 1 < tm.length && lt >= tm[k + 1][0]) k++;
    const f = k > 0 ? C.seg(lt, tm[k][0], tm[k][0] + 0.45) : 1;
    if (f < 1) ctx.drawImage(zemin(tm[k - 1][1]), 0, 0);
    C.alpha(f, () => ctx.drawImage(zemin(tm[k][1]), 0, 0));
    C.tema(tm[k][1]);
    // kamera: sahne boyunca yavaşça yaklaşır
    const dur = b.t1 - b.t0, s = 1 + 0.03 * C.clamp(lt / dur);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
    S[b.ad](lt, L);
    ctx.restore();
  }

  function ciz(T, boilT) {
    C.BOIL = Math.floor((boilT === undefined ? T : boilT) * 8);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    const i = bolumAt(T);
    const lt = T - BOL[i].t0;
    if (!(i > 0 && lt < GECIS)) { sahne(i, lt); return; }
    const e = C.ease(lt / GECIS);
    const prev = BOL[i - 1], plt = prev.t1 - prev.t0 - 0.001;
    const tur = GECISLER[(i - 1) % GECISLER.length];
    if (tur === 'yukari') {
      ctx.save(); ctx.translate(0, -e * H); sahne(i - 1, plt); ctx.restore();
      ctx.save(); ctx.translate(0, H * (1 - e));
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, -16, W, 16);
      sahne(i, lt); ctx.restore();
    } else if (tur === 'sola') {
      ctx.save(); ctx.translate(-e * W, 0); sahne(i - 1, plt); ctx.restore();
      ctx.save(); ctx.translate(W * (1 - e), 0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-16, 0, 16, H);
      sahne(i, lt); ctx.restore();
    } else if (tur === 'zoom') {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + 0.35 * e, 1 + 0.35 * e); ctx.translate(-W / 2, -H / 2);
      sahne(i - 1, plt); ctx.restore();
      C.alpha(e, () => {
        const s = 0.9 + 0.1 * e;
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); sahne(i, lt); ctx.restore();
      });
    } else { // fosfor: kalın bir fosforlu kalem darbesi ekranı silip yenisini açar
      const raw = lt / GECIS;
      if (raw < 0.5) sahne(i - 1, plt); else sahne(i, lt);
      const u = C.ease(raw);
      const x0 = raw < 0.5 ? -W * 1.2 + u * 2 * W * 1.2 : (u - 0.5) * 2 * W * 1.2;
      const bw = W * 1.2;
      ctx.save();
      ctx.fillStyle = FOSFOR[Math.floor((i - 1) / GECISLER.length) % FOSFOR.length];
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      for (let y = 0; y <= H; y += 60) ctx.lineTo(x0 + bw + Math.sin(y * 0.05) * 30 + C.rs(y) * 40, y);
      ctx.lineTo(x0 - 40, H);
      for (let y = H; y >= 0; y -= 60) ctx.lineTo(x0 + Math.sin(y * 0.07) * 30 - C.rs(y + 3) * 40, y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ---------- Render modu (video) ----------
  root.ciz = function (T, fmt) {
    C.minFont = 999;
    ciz(T);
    return fmt === 'none' ? '' : cv.toDataURL(fmt || 'image/jpeg', 0.93);
  };
  root.minFont = () => ({ size: C.minFont, at: C.minFontAt });
  root.ZAMAN_BILGI = { SURE: Z.SURE, W, H };

  root.hazir = document.fonts.ready.then(() => Promise.all([
    document.fonts.load('400 48px Kalam'), document.fonts.load('700 48px Kalam')]));

  if (RENDER) { document.body.classList.add('render'); return; }

  // ---------- Etkileşimli oynatıcı ----------
  const audio = document.getElementById('muzik');
  const hud = document.getElementById('hud');
  const start = document.getElementById('start');
  let playing = false, started = false, autoStop = false;
  let clockT = 0, clockBase = 0, useAudio = true;
  let lastT = 0, hudTimer = 0;

  function now() {
    if (useAudio && !audio.error && audio.readyState >= 1) return audio.currentTime;
    return playing ? clockT + (performance.now() - clockBase) / 1000 : clockT;
  }
  function seek(T) {
    T = Math.max(0, Math.min(Z.SURE, T));
    clockT = T; clockBase = performance.now();
    try { audio.currentTime = T; } catch (e) { /* yok */ }
    lastT = T;
  }
  function play() {
    if (now() >= Z.SURE - 0.05) seek(0);
    playing = true; clockT = now(); clockBase = performance.now();
    const pr = audio.play();
    if (pr && pr.catch) pr.catch(() => { useAudio = false; });
    showHud();
  }
  function pause() { clockT = now(); playing = false; audio.pause(); showHud(); }
  function toggle() { if (!started) return begin(); playing ? pause() : play(); }
  function begin() { started = true; start.classList.add('gizli'); seek(0); play(); }

  function showHud(msg) {
    const i = bolumAt(now());
    const b = BOL[i];
    hud.innerHTML = (msg ? `<b>${msg}</b> · ` : '') +
      `${i + 1}/${BOL.length} · ${b.kod ? b.kod + ' · ' : ''}${b.baslik} · ${playing ? '▶' : '⏸ duraklatıldı'}` +
      ` · sahne sonunda dur: <b>${autoStop ? 'açık' : 'kapalı'}</b> (D)`;
    hud.classList.add('gorunur');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => { if (playing) hud.classList.remove('gorunur'); }, 2500);
  }

  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      if (!started) { started = true; start.classList.add('gizli'); }
      const T = now(), i = bolumAt(T);
      let j = e.code === 'ArrowRight' ? Math.min(BOL.length - 1, i + 1) : (T - BOL[i].t0 > 1.2 ? i : Math.max(0, i - 1));
      seek(BOL[j].t0 + (j > 0 ? GECIS : 0));
      showHud();
    } else if (e.code === 'KeyD') { autoStop = !autoStop; showHud(); }
    else if (e.code === 'KeyF') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
    else if (e.code === 'KeyM') { audio.muted = !audio.muted; showHud(audio.muted ? 'ses kapalı' : 'ses açık'); }
    else if (e.code === 'Home') { seek(0); showHud(); }
  });
  cv.addEventListener('click', toggle);
  start.addEventListener('click', begin);
  audio.addEventListener('error', () => { useAudio = false; });

  function fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
  }
  addEventListener('resize', fit); fit();

  function loop() {
    let T = now();
    if (playing && autoStop) {
      const i = bolumAt(lastT);
      const end = BOL[i].t1;
      if (i < BOL.length - 1 && lastT < end - 0.06 && T >= end - 0.06) { seek(end - 0.06); T = end - 0.06; pause(); }
    }
    if (playing && T >= Z.SURE) { pause(); T = Z.SURE; }
    lastT = T;
    ciz(T, performance.now() / 1000);
    requestAnimationFrame(loop);
  }
  root.hazir.then(() => { ciz(0); requestAnimationFrame(loop); });
})(this);
