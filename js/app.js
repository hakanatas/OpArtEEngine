/* ==========================================================================
 * OpArt Engine — application layer
 * UI construction, state/history, worker-backed renderer, export, presets.
 * ========================================================================== */
(function () {
  'use strict';
  const O = window.OpArt, T = window.I18N.t;

  /* ---------- tiny DOM / utility helpers ---------- */
  const $ = (s, root) => (root || document).querySelector(s);
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    for (const k of kids) if (k != null) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    return e;
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, p, v) { const ks = p.split('.'); let c = o; for (let i = 0; i < ks.length - 1; i++) c = c[ks[i]]; c[ks[ks.length - 1]] = v; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  const fmt = (v, step) => (step >= 1 ? String(Math.round(v)) : (+v).toFixed(step >= 0.1 ? 1 : 2));

  /* Merge a partial state over defaults, tolerating old/partial data. */
  function normalize(s) {
    const d = O.defaultState();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign(d, s);
    out.warp = Object.assign(O.defaultState().warp, s.warp || {});
    out.anim = Object.assign(O.defaultState().anim, s.anim || {});
    const layers = Array.isArray(s.layers) ? s.layers : [];
    out.layers = [0, 1].map((i) => Object.assign(O.defaultLayer(i === 0), layers[i] || {}));
    out.layers[0].on = true;
    if (!Array.isArray(out.palette) || out.palette.length < 1) out.palette = ['#000000', '#ffffff'];
    if (O.PATTERN_IDS.indexOf(out.layers[0].pattern) < 0) out.layers[0].pattern = 'stripes';
    if (O.PATTERN_IDS.indexOf(out.layers[1].pattern) < 0) out.layers[1].pattern = 'rings';
    return out;
  }

  /* ========================================================================
   * Renderer: worker pool with main-thread fallback
   * ====================================================================== */
  const Renderer = {
    workers: [], ready: false, nextId: 1, jobs: new Map(), nsPerSample: 120,
    init() {
      const n = Math.min(8, Math.max(2, navigator.hardwareConcurrency || 4));
      const inline = document.getElementById('opart-core-inline');
      let url = null;
      try {
        if (inline) {
          url = URL.createObjectURL(new Blob([inline.textContent + '\n;OpArt.workerMain(self);'], { type: 'text/javascript' }));
        } else if (location.protocol !== 'file:') {
          url = 'js/worker.js';
        }
        if (url) {
          for (let i = 0; i < n; i++) {
            const w = new Worker(url);
            w.onmessage = (e) => Renderer.onResult(e.data);
            w.onerror = (e) => { console.warn('worker failed, falling back to main thread', e.message || e); Renderer.disableWorkers(); };
            this.workers.push(w);
          }
          this.ready = true;
        }
      } catch (e) { console.warn('workers unavailable', e); this.disableWorkers(); }
    },
    disableWorkers() {
      this.workers.forEach((w) => { try { w.terminate(); } catch (e) { /* ignore */ } });
      this.workers = []; this.ready = false;
      for (const [, job] of this.jobs) this.runMainThread(job);
    },
    /* Render a full w x h image; resolves with ImageData */
    render(w, h, state, t, ss) {
      return new Promise((resolve) => {
        const id = this.nextId++;
        const img = new ImageData(w, h);
        const job = { id, w, h, state, t, ss, img, resolve, remaining: 0, start: performance.now() };
        this.jobs.set(id, job);
        if (this.ready && this.workers.length) {
          const chunks = Math.min(h, this.workers.length * 3);
          const rows = Math.ceil(h / chunks);
          let y = 0, k = 0;
          while (y < h) {
            const y1 = Math.min(h, y + rows);
            job.remaining++;
            this.workers[k % this.workers.length].postMessage({ id, w, h, y0: y, y1, state, t, ss });
            y = y1; k++;
          }
        } else {
          this.runMainThread(job);
        }
      });
    },
    runMainThread(job) {
      setTimeout(() => {
        if (!this.jobs.has(job.id)) return;
        O.renderRows(job.img.data, job.w, job.h, 0, job.h, job.state, job.t, job.ss);
        this.finish(job);
      }, 0);
    },
    onResult(d) {
      const job = this.jobs.get(d.id);
      if (!job) return;
      job.img.data.set(new Uint8ClampedArray(d.buf), d.y0 * job.w * 4);
      if (--job.remaining <= 0) this.finish(job);
    },
    finish(job) {
      this.jobs.delete(job.id);
      const ms = performance.now() - job.start;
      const samples = job.w * job.h * job.ss * job.ss;
      this.nsPerSample = this.nsPerSample * 0.5 + (ms * 1e6 / samples) * 0.5;
      job.ms = ms;
      job.resolve(job);
    }
  };

  /* ========================================================================
   * Application state & history
   * ====================================================================== */
  let state = O.defaultState();
  const past = [], future = [];
  let time = 0, lastFrame = 0, animRaf = 0;
  let busy = false, dirty = false, wantFull = false, idleTimer = 0, exporting = false;
  let interacting = false;

  function snapshot() { const s = clone(state); delete s.anim; return s; }
  function commit() {
    const s = snapshot();
    if (past.length && JSON.stringify(past[past.length - 1]) === JSON.stringify(s)) return;
    past.push(s); if (past.length > 100) past.shift();
    future.length = 0;
    store('opart.state', JSON.stringify(state));
    updateUndoButtons();
  }
  function undo() { if (!past.length) return; future.push(snapshot()); const s = past.pop(); applyState(s, false); }
  function redo() { if (!future.length) return; past.push(snapshot()); const s = future.pop(); applyState(s, false); }
  function applyState(s, doCommit) {
    const anim = state.anim;
    state = normalize(s);
    state.anim = anim;
    if (doCommit !== false) commit();
    refreshUI();
    requestRender(true);
    updateUndoButtons();
  }
  function updateUndoButtons() {
    const u = $('#btn-undo'), r = $('#btn-redo');
    if (u) u.disabled = !past.length;
    if (r) r.disabled = !future.length;
  }

  /* ========================================================================
   * Canvas / rendering orchestration
   * ====================================================================== */
  const view = $('#view');
  const vctx = view.getContext('2d');
  const stage = $('#stage');
  let aspect = load('opart.aspect') || 'fit';
  let bufCanvas = document.createElement('canvas');
  const bctx = bufCanvas.getContext('2d');

  function layoutCanvas() {
    const box = stage.getBoundingClientRect();
    let w = Math.max(64, box.width - 8), h = Math.max(64, box.height - 8);
    if (aspect !== 'fit') {
      const [a, b] = aspect.split(':').map(Number);
      const r = a / b;
      if (w / h > r) w = h * r; else h = w / r;
    }
    view.style.width = w + 'px'; view.style.height = h + 'px';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.width = Math.round(w * dpr); view.height = Math.round(h * dpr);
    requestRender(true);
  }

  function fullSize() {
    const maxPx = 2.4e6;
    let w = view.width, h = view.height;
    const k = Math.sqrt(maxPx / (w * h));
    if (k < 1) { w = Math.round(w * k); h = Math.round(h * k); }
    return [w, h];
  }

  function requestRender(full) {
    if (full) wantFull = true;
    dirty = true;
    if (!busy) kick();
  }

  function kick() {
    if (!dirty || exporting) return;
    dirty = false;
    const [fw, fh] = fullSize();
    const quick = interacting || state.anim.play;
    let w = fw, h = fh, ss = 1;
    if (quick) {
      const budgetNs = 30e6;
      const target = budgetNs / Renderer.nsPerSample;
      const scale = Math.min(1, Math.sqrt(target / (fw * fh)));
      const s = Math.max(0.15, scale);
      w = Math.max(32, Math.round(fw * s)); h = Math.max(32, Math.round(fh * s));
      wantFull = true;
    } else {
      ss = Math.max(1, state.aa | 0);
      wantFull = false;
    }
    busy = true;
    const t = time;
    Renderer.render(w, h, state, t, ss).then((job) => {
      busy = false;
      present(job.img);
      setStatus(job);
      if (dirty) kick();
      else if (wantFull && !state.anim.play) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { if (!interacting) { requestRender(false); } }, 120);
      }
    });
  }

  function present(img) {
    if (bufCanvas.width !== img.width || bufCanvas.height !== img.height) { bufCanvas.width = img.width; bufCanvas.height = img.height; }
    bctx.putImageData(img, 0, 0);
    vctx.imageSmoothingEnabled = true;
    vctx.imageSmoothingQuality = 'high';
    vctx.drawImage(bufCanvas, 0, 0, view.width, view.height);
  }

  let fpsAcc = 0, fpsN = 0, fpsShown = 0;
  function setStatus(job) {
    const s = $('#status');
    if (!s) return;
    fpsAcc += job.ms; fpsN++;
    if (fpsN >= 10) { fpsShown = 1000 / (fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
    s.textContent = `${T('seed')}: ${state.seed} · ${job.w}×${job.h}${job.ss > 1 ? ' ×' + job.ss * job.ss + 'AA' : ''} · ${job.ms.toFixed(0)} ms ${T('renderTime')}` +
      (state.anim.play ? ` · ${fpsShown.toFixed(0)} fps` : '') + ` · ${Renderer.ready ? Renderer.workers.length + ' workers' : 'main thread'}`;
  }

  /* animation loop */
  function animLoop(ts) {
    if (!state.anim.play) { animRaf = 0; return; }
    if (lastFrame) time += ((ts - lastFrame) / 1000) * state.anim.speed;
    lastFrame = ts;
    if (time > 1e6) time -= 1e6;
    requestRender(false);
    animRaf = requestAnimationFrame(animLoop);
  }
  function setPlay(on) {
    state.anim.play = !!on;
    const b = $('#btn-play');
    if (b) b.textContent = on ? '⏸ ' + T('pause') : '▶ ' + T('play');
    lastFrame = 0;
    if (on && !animRaf) animRaf = requestAnimationFrame(animLoop);
    if (!on) requestRender(true);
  }

  /* ========================================================================
   * UI construction
   * ====================================================================== */
  const panel = $('#panel');
  const bindings = [];   // {path, update()}
  const openState = JSON.parse(load('opart.sections') || '{}');

  function section(id, titleKey, ...kids) {
    const d = el('details', { class: 'sec', open: openState[id] !== false });
    d.appendChild(el('summary', { text: T(titleKey) }));
    const body = el('div', { class: 'sec-body' }, ...kids);
    d.appendChild(body);
    d.addEventListener('toggle', () => { openState[id] = d.open; store('opart.sections', JSON.stringify(openState)); });
    return d;
  }

  function onInput(path, value) {
    setPath(state, path, value);
    interacting = true;
    requestRender(false);
  }
  function onChange() {
    interacting = false;
    commit();
    requestRender(true);
  }

  function slider(path, labelKey, min, max, step, opts) {
    opts = opts || {};
    const v = getPath(state, path);
    const range = el('input', { type: 'range', min, max, step, value: v });
    const num = el('input', { type: 'number', min, max, step, value: fmt(v, step) });
    const label = el('label', { text: T(labelKey) });
    const row = el('div', { class: 'row' }, label, range, num);
    if (opts.param) row.dataset.param = opts.param;
    range.addEventListener('input', () => { num.value = fmt(range.value, step); onInput(path, +range.value); });
    range.addEventListener('change', onChange);
    num.addEventListener('change', () => { const x = Math.min(max, Math.max(min, +num.value || 0)); range.value = x; num.value = fmt(x, step); onInput(path, x); onChange(); });
    range.addEventListener('dblclick', () => { const d = opts.reset !== undefined ? opts.reset : getPath(O.defaultState(), path); if (d !== undefined) { range.value = d; num.value = fmt(d, step); onInput(path, d); onChange(); } });
    bindings.push({ path, update() { const x = getPath(state, path); range.value = x; num.value = fmt(x, step); }, label, row });
    return row;
  }

  function select(path, labelKey, options, onAfter) {
    const s = el('select');
    options.forEach((o) => s.appendChild(el('option', { value: o.value, text: o.label })));
    s.value = getPath(state, path);
    s.addEventListener('change', () => { setPath(state, path, s.value); if (onAfter) onAfter(s.value); commit(); requestRender(true); });
    const row = el('div', { class: 'row' }, el('label', { text: T(labelKey) }), s);
    bindings.push({ path, update() { s.value = getPath(state, path); if (onAfter) onAfter(s.value, true); } });
    return row;
  }

  function checkbox(path, labelKey, onAfter) {
    const c = el('input', { type: 'checkbox' });
    c.checked = !!getPath(state, path);
    c.addEventListener('change', () => { setPath(state, path, c.checked); if (onAfter) onAfter(c.checked); commit(); requestRender(true); });
    const row = el('label', { class: 'row check' }, c, el('span', { text: T(labelKey) }));
    bindings.push({ path, update() { c.checked = !!getPath(state, path); } });
    return row;
  }

  function button(labelKey, fn, attrs) {
    return el('button', Object.assign({ type: 'button', text: T(labelKey), onclick: fn }, attrs || {}));
  }

  /* --- layer section (pattern + pattern-specific params) --- */
  function layerSection(i) {
    const p = `layers.${i}`;
    const patternOpts = O.PATTERN_IDS.map((id) => ({ value: id, label: T('patterns.' + id) }));
    const rows = {};
    const wrap = el('div');
    if (i === 1) wrap.appendChild(checkbox(`${p}.on`, 'enable', () => toggleLayerBody()));
    const body = el('div', { class: 'layer-body' });
    wrap.appendChild(body);
    body.appendChild(select(`${p}.pattern`, 'pattern', patternOpts, () => updateRows()));
    rows.freq = slider(`${p}.freq`, 'density', 1, 80, 0.5, { param: 'freq' });
    rows.amp = slider(`${p}.amp`, 'amplitude', 0, 2, 0.01, { param: 'amp' });
    rows.freq2 = slider(`${p}.freq2`, 'waveFreq', 0, 24, 0.1, { param: 'freq2' });
    rows.count = slider(`${p}.count`, 'lobes', 1, 64, 1, { param: 'count' });
    for (const k in rows) body.appendChild(rows[k]);
    body.appendChild(select(`${p}.shape`, 'shape', O.SHAPES.map((s) => ({ value: s, label: T('shapes.' + s) })), () => updateShape()));
    const dutyRow = slider(`${p}.duty`, 'duty', 0.02, 0.98, 0.01);
    const stepsRow = slider(`${p}.steps`, 'steps', 2, 8, 1);
    body.appendChild(dutyRow); body.appendChild(stepsRow);
    body.appendChild(slider(`${p}.phase`, 'phase', 0, 1, 0.01));
    body.appendChild(slider(`${p}.drift`, 'drift', -3, 3, 0.05));
    body.appendChild(slider(`${p}.scale`, 'scale', 0.1, 4, 0.01));
    body.appendChild(slider(`${p}.cx`, 'cx', -1.5, 1.5, 0.01));
    body.appendChild(slider(`${p}.cy`, 'cy', -1.5, 1.5, 0.01));
    if (i === 1) body.appendChild(select('blend', 'blend', O.BLENDS.map((b) => ({ value: b, label: T('blends.' + b) }))));

    function updateRows() {
      const def = O.PATTERNS.find((x) => x.id === state.layers[i].pattern) || O.PATTERNS[0];
      for (const k in rows) {
        const use = def.uses[k];
        rows[k].hidden = !use;
        if (use) rows[k].querySelector('label').textContent = T(use);
      }
    }
    function updateShape() {
      const sh = state.layers[i].shape;
      dutyRow.hidden = sh !== 'hard';
      stepsRow.hidden = sh !== 'steps';
    }
    function toggleLayerBody() { body.classList.toggle('disabled', !state.layers[i].on); }
    updateRows(); updateShape(); toggleLayerBody();
    bindings.push({ path: p, update() { updateRows(); updateShape(); toggleLayerBody(); } });
    return wrap;
  }

  /* --- palette editor --- */
  function paletteEditor() {
    const wrap = el('div', { class: 'palette' });
    const list = el('div', { class: 'swatches' });
    const presets = el('div', { class: 'pal-presets' });
    function rebuild() {
      list.innerHTML = '';
      state.palette.forEach((c, idx) => {
        const inp = el('input', { type: 'color', value: c });
        inp.addEventListener('input', () => { state.palette[idx] = inp.value; interacting = true; requestRender(false); });
        inp.addEventListener('change', () => { state.palette[idx] = inp.value; onChange(); });
        const rm = el('button', { type: 'button', class: 'mini', text: '×', title: 'remove', onclick: () => { if (state.palette.length > 1) { state.palette.splice(idx, 1); rebuild(); commit(); requestRender(true); } } });
        list.appendChild(el('div', { class: 'swatch' }, inp, rm));
      });
      if (state.palette.length < 8) list.appendChild(button('addColor', () => {
        const last = state.palette[state.palette.length - 1];
        state.palette.push(last === '#ffffff' ? '#000000' : '#ffffff'); rebuild(); commit(); requestRender(true);
      }, { class: 'mini add' }));
      const rev = button('↔', () => { state.palette.reverse(); rebuild(); commit(); requestRender(true); }, { class: 'mini', title: 'reverse' });
      rev.textContent = '↔';
      list.appendChild(rev);
    }
    window.PALETTES.forEach((p) => {
      const b = el('button', { type: 'button', class: 'pal-btn', title: p.name });
      p.colors.forEach((c) => b.appendChild(el('span', { style: 'background:' + c })));
      b.addEventListener('click', () => { state.palette = p.colors.slice(); rebuild(); commit(); requestRender(true); });
      presets.appendChild(b);
    });
    rebuild();
    wrap.appendChild(el('div', { class: 'row-label', text: T('palette') }));
    wrap.appendChild(list);
    wrap.appendChild(el('div', { class: 'row-label', text: T('palettePresets') }));
    wrap.appendChild(presets);
    bindings.push({ path: 'palette', update: rebuild });
    return wrap;
  }

  /* --- preset gallery with live thumbnails --- */
  function presetGallery() {
    const grid = el('div', { class: 'presets' });
    const size = 72;
    window.PRESETS.forEach((p) => {
      const c = el('canvas', { width: size, height: size, title: p.name });
      const img = new ImageData(size, size);
      const s = normalize(clone(p.state));
      O.renderRows(img.data, size, size, 0, size, s, 0.2, 1);
      c.getContext('2d').putImageData(img, 0, 0);
      const b = el('button', { type: 'button', class: 'preset', onclick: () => { const st = normalize(clone(p.state)); st.seed = state.seed; applyState(st); } }, c, el('span', { text: p.name }));
      grid.appendChild(b);
    });
    return grid;
  }

  function buildPanel() {
    panel.innerHTML = '';
    bindings.length = 0;
    const aspectOpts = [{ value: 'fit', label: T('fitWindow') }, { value: '1:1', label: T('square') }, { value: '4:3', label: '4:3' }, { value: '3:4', label: '3:4' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }];
    const aspectSel = el('select');
    aspectOpts.forEach((o) => aspectSel.appendChild(el('option', { value: o.value, text: o.label })));
    aspectSel.value = aspect;
    aspectSel.addEventListener('change', () => { aspect = aspectSel.value; store('opart.aspect', aspect); layoutCanvas(); });
    const exportSel = el('select');
    [1024, 2048, 3072, 4096].forEach((n) => exportSel.appendChild(el('option', { value: n, text: n + ' px' })));
    exportSel.value = load('opart.exportSize') || 2048;
    exportSel.addEventListener('change', () => store('opart.exportSize', exportSel.value));

    const seedInput = el('input', { type: 'number', value: state.seed, class: 'seed' });
    seedInput.addEventListener('change', () => { state.seed = (+seedInput.value | 0); commit(); requestRender(true); });
    bindings.push({ path: 'seed', update() { seedInput.value = state.seed; } });

    panel.append(
      section('presets', 'secPresets', presetGallery()),
      section('actions', 'secActions',
        el('div', { class: 'btns' },
          button('randomize', randomize, { class: 'primary' }),
          button('mutate', mutate),
          button('reset', () => applyState(O.defaultState())),
          button('undo', undo, { id: 'btn-undo' }),
          button('redo', redo, { id: 'btn-redo' })),
        el('div', { class: 'row' }, el('label', { text: T('seed') }), seedInput, button('newSeed', () => { state.seed = (Math.random() * 2147483647) | 0; commit(); refreshUI(); requestRender(true); }, { class: 'mini' })),
        el('div', { class: 'btns' },
          button('exportPng', exportPNG, { id: 'btn-export' }), exportSel,
          button('copyLink', copyLink, { id: 'btn-link' }),
          button('saveJson', saveJSON), button('loadJson', loadJSON),
          button('record', recordVideo, { id: 'btn-record' }))),
      section('pattern', 'secPattern', layerSection(0)),
      section('layer2', 'secLayer2', layerSection(1)),
      section('color', 'secColor',
        paletteEditor(),
        select('colorMode', 'colorMode', O.COLOR_MODES.map((m) => ({ value: m, label: T('colorModes.' + m) }))),
        slider('palRepeat', 'palRepeat', 1, 8, 1),
        slider('palOffset', 'palOffset', 0, 1, 0.01)),
      section('warp', 'secWarp',
        slider('warp.bulge', 'bulge', -1, 1, 0.01),
        slider('warp.twist', 'twistW', -3, 3, 0.01),
        slider('warp.ripple', 'ripple', -1, 1, 0.01),
        slider('warp.rippleFreq', 'rippleFreq', 0.5, 30, 0.1),
        slider('warp.wave', 'wave', -1, 1, 0.01),
        slider('warp.waveFreq', 'waveFreqW', 0.5, 20, 0.1),
        slider('warp.noise', 'noise', 0, 2, 0.01),
        slider('warp.noiseFreq', 'noiseFreq', 0.2, 10, 0.1),
        checkbox('warp.animate', 'animateWarp')),
      section('symmetry', 'secSymmetry',
        slider('symSeg', 'symSeg', 1, 24, 1),
        checkbox('symMirror', 'symMirror'),
        checkbox('mirrorX', 'mirrorX'),
        checkbox('mirrorY', 'mirrorY')),
      section('transform', 'secTransform',
        slider('zoom', 'zoom', 0.1, 6, 0.01),
        slider('rot', 'rot', -180, 180, 1),
        slider('panX', 'panX', -3, 3, 0.01),
        slider('panY', 'panY', -3, 3, 0.01)),
      section('post', 'secPost',
        slider('gamma', 'gamma', 0.2, 3, 0.01),
        checkbox('invert', 'invert'),
        slider('grain', 'grain', 0, 1, 0.01),
        slider('vignette', 'vignette', 0, 1, 0.01),
        select('aa', 'aa', [{ value: 1, label: '1×' }, { value: 2, label: '4× (2×2)' }, { value: 3, label: '9× (3×3)' }], (v) => { state.aa = +v; })),
      section('anim', 'secAnim',
        el('div', { class: 'btns' }, button('play', () => setPlay(!state.anim.play), { id: 'btn-play' })),
        slider('anim.speed', 'speed', 0.01, 2, 0.01)),
      section('canvas', 'secCanvas', el('div', { class: 'row' }, el('label', { text: T('aspect') }), aspectSel))
    );
    setPlay(state.anim.play);
    updateUndoButtons();
    $('#hint').textContent = T('hint');
    $('#subtitle').textContent = T('subtitle');
    $('#btn-lang').textContent = T('language');
    $('#btn-fs').title = T('fullscreen');
  }

  function refreshUI() { bindings.forEach((b) => b.update()); }

  /* ========================================================================
   * Randomise / mutate
   * ====================================================================== */
  function randomize() {
    const seed = (Math.random() * 2147483647) | 0;
    const R = mulberry32(seed);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const rnd = (a, b) => a + R() * (b - a);
    const s = O.defaultState();
    s.seed = seed;
    const layer = (on) => {
      const L = O.defaultLayer(on);
      L.pattern = pick(O.PATTERN_IDS);
      L.freq = Math.round(rnd(6, 40) * 2) / 2;
      L.amp = +rnd(0, 1.2).toFixed(2);
      L.freq2 = +rnd(0.5, 6).toFixed(1);
      L.count = Math.round(rnd(3, 36));
      if (L.pattern === 'polygons') L.count = Math.round(rnd(3, 8));
      if (L.pattern === 'dots') { L.amp = +rnd(0.5, 1).toFixed(2); L.freq2 = +rnd(0, 4).toFixed(1); }
      if (L.pattern === 'contours') { L.count = Math.round(rnd(4, 16)); L.amp = 1; }
      L.shape = R() < 0.7 ? 'hard' : pick(O.SHAPES);
      L.duty = +rnd(0.35, 0.65).toFixed(2);
      L.steps = Math.round(rnd(2, 5));
      L.drift = R() < 0.5 ? 1 : +rnd(-2, 2).toFixed(2);
      return L;
    };
    s.layers = [layer(true), layer(R() < 0.3)];
    s.blend = pick(O.BLENDS);
    const pal = pick(window.PALETTES).colors.slice();
    s.palette = pal;
    s.colorMode = R() < 0.75 ? 'discrete' : 'gradient';
    if (s.colorMode === 'discrete' && pal.length > 2 && s.layers[0].shape === 'hard' && R() < 0.5) { s.layers[0].shape = 'steps'; s.layers[0].steps = pal.length; }
    const W = s.warp;
    if (R() < 0.4) W.bulge = +rnd(-0.8, 0.9).toFixed(2);
    if (R() < 0.3) W.twist = +rnd(-1.5, 1.5).toFixed(2);
    if (R() < 0.3) { W.ripple = +rnd(-0.7, 0.7).toFixed(2); W.rippleFreq = +rnd(2, 12).toFixed(1); }
    if (R() < 0.3) { W.wave = +rnd(-0.6, 0.6).toFixed(2); W.waveFreq = +rnd(1, 6).toFixed(1); }
    if (R() < 0.2) { W.noise = +rnd(0.2, 1).toFixed(2); W.noiseFreq = +rnd(0.5, 4).toFixed(1); }
    if (R() < 0.3) { s.symSeg = Math.round(rnd(2, 10)); s.symMirror = R() < 0.7; }
    s.rot = R() < 0.3 ? Math.round(rnd(-45, 45)) : 0;
    s.zoom = +rnd(0.7, 1.6).toFixed(2);
    if (R() < 0.15) s.vignette = +rnd(0.2, 0.6).toFixed(2);
    applyState(s);
  }

  function mutate() {
    const s = clone(state);
    const R = Math.random;
    const nudge = (obj, key, min, max, k) => { const range = (max - min) * (k || 0.12); obj[key] = Math.min(max, Math.max(min, obj[key] + (R() * 2 - 1) * range)); obj[key] = +obj[key].toFixed(2); };
    const L = s.layers[0];
    const ops = [
      () => nudge(L, 'freq', 1, 80), () => nudge(L, 'amp', 0, 2), () => nudge(L, 'freq2', 0, 24),
      () => { L.count = Math.max(1, Math.min(64, Math.round(L.count + (R() * 2 - 1) * 6))); },
      () => nudge(L, 'duty', 0.05, 0.95), () => nudge(L, 'phase', 0, 1, 0.3),
      () => nudge(s.warp, 'bulge', -1, 1), () => nudge(s.warp, 'twist', -3, 3), () => nudge(s.warp, 'ripple', -1, 1),
      () => nudge(s.warp, 'wave', -1, 1), () => nudge(s, 'zoom', 0.1, 6), () => nudge(s, 'rot', -180, 180),
      () => { s.palette = s.palette.map((c) => { const [r, g, b] = O.hexToRgb(c); const j = (x) => Math.max(0, Math.min(255, Math.round(x + (R() * 2 - 1) * 24))); return '#' + [j(r), j(g), j(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }); }
    ];
    const n = 2 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) ops[Math.floor(R() * ops.length)]();
    applyState(s);
  }

  /* ========================================================================
   * Export / share / persistence
   * ====================================================================== */
  function download(blob, name) {
    const a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function overlay(msg) { const o = $('#overlay'); o.hidden = !msg; if (msg) o.textContent = msg; }

  async function exportPNG() {
    if (exporting) return;
    exporting = true;
    overlay(T('exportBusy'));
    try {
      const long = +(load('opart.exportSize') || 2048);
      const r = view.width / view.height;
      const w = r >= 1 ? long : Math.round(long * r), h = r >= 1 ? Math.round(long / r) : long;
      const ss = Math.max(2, state.aa | 0);
      const job = await Renderer.render(w, h, state, time, ss);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').putImageData(job.img, 0, 0);
      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      download(blob, `opart-${state.layers[0].pattern}-${state.seed}.png`);
    } finally {
      exporting = false; overlay(null); requestRender(true);
    }
  }

  function encodeState() { return b64e(JSON.stringify(snapshot())); }
  function decodeState(str) { try { return normalize(JSON.parse(b64d(str))); } catch (e) { return null; } }
  function copyLink() {
    const url = location.origin + location.pathname + '#s=' + encodeState();
    history.replaceState(null, '', url);
    const done = () => { const b = $('#btn-link'); const old = T('copyLink'); b.textContent = T('linkCopied'); setTimeout(() => (b.textContent = old), 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
  }
  function saveJSON() {
    download(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }), `opart-${state.seed}.json`);
  }
  function loadJSON() {
    const inp = el('input', { type: 'file', accept: '.json,application/json' });
    inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      f.text().then((txt) => { try { applyState(JSON.parse(txt)); } catch (e) { alert('Invalid JSON'); } });
    });
    inp.click();
  }
  function recordVideo() {
    if (!('MediaRecorder' in window) || !view.captureStream) { alert('MediaRecorder not supported'); return; }
    const btn = $('#btn-record');
    const wasPlaying = state.anim.play;
    setPlay(true);
    const stream = view.captureStream(30);
    const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 8e6 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      download(new Blob(chunks, { type: rec.mimeType || 'video/webm' }), `opart-${state.seed}.${(rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'}`);
      btn.textContent = T('record'); btn.disabled = false;
      if (!wasPlaying) setPlay(false);
    };
    btn.textContent = T('recording'); btn.disabled = true;
    rec.start(200);
    setTimeout(() => rec.stop(), 6000);
  }

  /* ========================================================================
   * Pointer & keyboard interaction on the canvas
   * ====================================================================== */
  (function pointer() {
    let drag = null;
    view.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY }; view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const rect = view.getBoundingClientRect();
      const m = Math.min(rect.width, rect.height) / 2;
      let dx = (e.clientX - drag.x) / m, dy = (e.clientY - drag.y) / m;
      const a = -state.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const rx = dx * c - dy * s, ry = dx * s + dy * c;
      state.panX = +(drag.panX + rx / state.zoom).toFixed(3);
      state.panY = +(drag.panY + ry / state.zoom).toFixed(3);
      interacting = true; refreshUI(); requestRender(false);
    });
    const end = () => { if (!drag) return; drag = null; interacting = false; commit(); requestRender(true); };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    view.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.zoom = +Math.min(6, Math.max(0.1, state.zoom * Math.exp(-e.deltaY * 0.0012))).toFixed(3);
      interacting = true; refreshUI(); requestRender(false);
      clearTimeout(view._wt); view._wt = setTimeout(() => { interacting = false; commit(); requestRender(true); }, 250);
    }, { passive: false });
    view.addEventListener('dblclick', () => { state.zoom = 1; state.panX = 0; state.panY = 0; commit(); refreshUI(); requestRender(true); });
  })();

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const k = e.key.toLowerCase();
    if (e.ctrlKey || e.metaKey) {
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      else if (k === 's') { e.preventDefault(); exportPNG(); }
      return;
    }
    if (k === ' ') { e.preventDefault(); setPlay(!state.anim.play); }
    else if (k === 'r') randomize();
    else if (k === 'm') mutate();
    else if (k === 'i') { state.invert = !state.invert; commit(); refreshUI(); requestRender(true); }
    else if (k === 'f') toggleFullscreen();
    else if (k === 'e') exportPNG();
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
    else document.exitFullscreen();
  }

  /* ========================================================================
   * Boot
   * ====================================================================== */
  function boot() {
    Renderer.init();
    const savedLang = load('opart.lang') || ((navigator.language || '').startsWith('tr') ? 'tr' : 'en');
    window.I18N.setLang(savedLang);
    const theme = load('opart.theme'); if (theme) document.documentElement.dataset.theme = theme;

    let initial = null;
    const m = location.hash.match(/[#&]s=([^&]+)/);
    if (m) initial = decodeState(m[1]);
    if (!initial) { const saved = load('opart.state'); if (saved) { try { initial = normalize(JSON.parse(saved)); } catch (e) { /* ignore */ } } }
    if (!initial) initial = normalize(clone(window.PRESETS[0].state));
    state = initial; state.anim.play = false;
    past.push(snapshot());

    buildPanel();
    $('#btn-lang').addEventListener('click', () => { const l = window.I18N.getLang() === 'tr' ? 'en' : 'tr'; window.I18N.setLang(l); store('opart.lang', l); buildPanel(); });
    $('#btn-theme').addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; store('opart.theme', t); });
    $('#btn-fs').addEventListener('click', toggleFullscreen);
    window.addEventListener('hashchange', () => { const mm = location.hash.match(/[#&]s=([^&]+)/); if (mm) { const s = decodeState(mm[1]); if (s) applyState(s); } });
    window.addEventListener('resize', layoutCanvas);
    document.addEventListener('fullscreenchange', layoutCanvas);
    new ResizeObserver(layoutCanvas).observe(stage);
    layoutCanvas();
  }
  boot();

  /* expose a little API for the console / tests */
  window.OpArtApp = { get state() { return state; }, applyState, randomize, mutate, exportPNG, Renderer, encodeState };
})();
