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

  // Kâğıt (bir kez çizilir)
  const paper = document.createElement('canvas');
  paper.width = W; paper.height = H;
  (function () {
    const p = paper.getContext('2d');
    p.fillStyle = C.PAPER; p.fillRect(0, 0, W, H);
    p.strokeStyle = 'rgba(80,140,210,0.22)'; p.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 40) { p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, H); p.stroke(); }
    for (let y = 0; y <= H; y += 40) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(W, y + 0.5); p.stroke(); }
    // kâğıt dokusu
    for (let i = 0; i < 9000; i++) {
      const x = C.rs(i * 1.7) * W, y = C.rs(i * 3.1 + 5) * H;
      p.fillStyle = `rgba(120,100,60,${0.02 + C.rs(i * 7.3) * 0.04})`;
      p.fillRect(x, y, 2, 2);
    }
    const g = p.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,70,30,0.12)');
    p.fillStyle = g; p.fillRect(0, 0, W, H);
    // spiral delikleri
    p.fillStyle = 'rgba(0,0,0,0.10)';
    for (let x = 60; x < W; x += 80) { p.beginPath(); p.arc(x, 14, 7, 0, 7); p.fill(); }
  })();

  const BOL = Z.BOLUMLER;
  const bolumAt = T => { for (let i = BOL.length - 1; i >= 0; i--) if (T >= BOL[i].t0) return i; return 0; };
  const GECIS = 0.5; // sayfa çevirme süresi

  function sahne(i, lt) {
    ctx.drawImage(paper, 0, 0);
    S[BOL[i].ad](lt, L);
  }

  function ciz(T, boilT) {
    C.BOIL = Math.floor((boilT === undefined ? T : boilT) * 8);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e9e4d6'; ctx.fillRect(0, 0, W, H);
    const i = bolumAt(T);
    const lt = T - BOL[i].t0;
    if (i > 0 && lt < GECIS) {
      const e = C.ease(lt / GECIS);
      const prev = BOL[i - 1];
      ctx.save(); ctx.translate(0, -e * H); sahne(i - 1, prev.t1 - prev.t0 - 0.001); ctx.restore();
      ctx.save(); ctx.translate(0, H * (1 - e));
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, -14, W, 14);
      sahne(i, lt); ctx.restore();
    } else sahne(i, lt);
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
