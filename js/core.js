/* ==========================================================================
 * OpArt Engine — rendering core
 * Pure math, no DOM. Runs identically on the main thread and inside Workers.
 * Every pixel is evaluated as a scalar field: coordinates -> symmetry ->
 * warps -> pattern layers -> blend -> palette -> post-processing.
 * ========================================================================== */
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const PI = Math.PI;

  /* ---------- small math helpers ---------- */
  function fract(x) { return x - Math.floor(x); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function tri(x) { return Math.abs(fract(x) * 2 - 1); }        // 1 at 0, 0 at .5, period 1
  function smoothstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  /* integer hash -> [0,1) */
  function hash2(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return mix(mix(a, b, u), mix(c, d, u), v);
  }
  function fbm(x, y, seed, oct) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) {
      s += amp * vnoise(x * f, y * f, seed + i * 17);
      n += amp; amp *= 0.5; f *= 2;
    }
    return s / n;
  }

  /* pointy-top hex cell lookup. Returns [dx, dy, q, r] relative to cell centre (circumradius 1) */
  const _hex = [0, 0, 0, 0];
  function hexCell(x, y) {
    const q = (0.5773502691896258 * x - y / 3), r = (2 / 3) * y;
    let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r);
    const dx = Math.abs(rx - q), dy = Math.abs(ry - (-q - r)), dz = Math.abs(rz - r);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    const cx = 1.7320508075688772 * (rx + rz / 2), cy = 1.5 * rz;
    _hex[0] = x - cx; _hex[1] = y - cy; _hex[2] = rx; _hex[3] = rz;
    return _hex;
  }

  /* ---------- pattern catalogue ----------
   * Each pattern maps (u, v, r, angle, layer, tAngle, seed) -> continuous phase.
   * The phase is later shaped (square / sine / triangle / steps) into a value in [0,1].
   * `uses` lists which generic layer parameters the pattern reads and the label key for each.
   */
  const PATTERNS = [
    { id: 'stripes',   uses: { freq: 'density', amp: 'tilt' } },
    { id: 'waves',     uses: { freq: 'density', amp: 'amplitude', freq2: 'waveFreq' } },
    { id: 'cataract',  uses: { freq: 'density', amp: 'amplitude', freq2: 'waveFreq' } },
    { id: 'zigzag',    uses: { freq: 'density', amp: 'amplitude', freq2: 'waveFreq' } },
    { id: 'rings',     uses: { freq: 'density', amp: 'wobble', freq2: 'waveFreq', count: 'lobes' } },
    { id: 'squares',   uses: { freq: 'density', amp: 'rounding' } },
    { id: 'diamonds',  uses: { freq: 'density' } },
    { id: 'polygons',  uses: { freq: 'density', count: 'sides', amp: 'twist' } },
    { id: 'rays',      uses: { count: 'rays', amp: 'curl' } },
    { id: 'spiral',    uses: { freq: 'density', count: 'arms' } },
    { id: 'vortex',    uses: { freq: 'density', count: 'arms' } },
    { id: 'tunnel',    uses: { freq: 'density', count: 'rays' } },
    { id: 'blaze',     uses: { freq: 'density', amp: 'amplitude', count: 'teeth' } },
    { id: 'checker',   uses: { freq: 'density', amp: 'shear' } },
    { id: 'polarCheck',uses: { freq: 'density', count: 'sectors' } },
    { id: 'dots',      uses: { freq: 'density', amp: 'dotSize', freq2: 'modulation' } },
    { id: 'hexagons',  uses: { freq: 'density', freq2: 'ringsPerCell', amp: 'parityShift' } },
    { id: 'cubes',     uses: { freq: 'density', amp: 'rotation' } },
    { id: 'weave',     uses: { freq: 'density', amp: 'amplitude', freq2: 'waveFreq' } },
    { id: 'lissajous', uses: { freq: 'density', count: 'ratio', amp: 'amplitude' } },
    { id: 'contours',  uses: { freq: 'density', count: 'bands', amp: 'amplitude' } },
    { id: 'interference', uses: { freq: 'density', amp: 'separation' } }
  ];
  const PATTERN_IDS = PATTERNS.map(p => p.id);

  const PF = {
    stripes(u, v, r, a, L, t) { return (u + L.amp * v) * L.freq; },
    waves(u, v, r, a, L, t) { return u * L.freq + L.amp * Math.sin(v * L.freq2 * PI + t); },
    cataract(u, v, r, a, L, t) {
      const env = 0.5 + 0.5 * Math.cos(u * PI * 0.9);
      return u * L.freq + L.amp * env * Math.sin(v * L.freq2 * PI + u * 2 + t);
    },
    zigzag(u, v, r, a, L, t) { return u * L.freq + L.amp * 2 * tri(v * L.freq2 * 0.5 + t / TAU); },
    rings(u, v, r, a, L, t) { return (r + L.amp * 0.1 * Math.sin(a * L.count + t) * Math.sin(r * L.freq2)) * L.freq; },
    squares(u, v, r, a, L, t) {
      const au = Math.abs(u), av = Math.abs(v);
      const box = Math.max(au, av);
      return mix(box, r, clamp(L.amp, 0, 1)) * L.freq;
    },
    diamonds(u, v, r, a, L, t) { return (Math.abs(u) + Math.abs(v)) * L.freq; },
    polygons(u, v, r, a, L, t) {
      const n = Math.max(3, Math.round(L.count));
      const seg = TAU / n;
      const aa = a + L.amp * r * 2;
      const m = aa - seg * Math.floor(aa / seg) - seg / 2;
      return r * Math.cos(m) / Math.cos(seg / 2) * L.freq;
    },
    rays(u, v, r, a, L, t) { return (a + L.amp * r * 3) / TAU * L.count; },
    spiral(u, v, r, a, L, t) { return r * L.freq + a / TAU * L.count; },
    vortex(u, v, r, a, L, t) { return Math.log(r + 0.02) * L.freq * 0.35 + a / TAU * L.count; },
    tunnel(u, v, r, a, L, t) { return (L.freq * 0.12) / (r + 0.04) + a / TAU * L.count; },
    blaze(u, v, r, a, L, t) { return r * L.freq + L.amp * tri(a / TAU * L.count + t / TAU); },
    checker(u, v, r, a, L, t) {
      const x = u * L.freq * 0.5, y = (v + L.amp * u) * L.freq * 0.5;
      return (Math.floor(x) + Math.floor(y)) * 0.5;
    },
    polarCheck(u, v, r, a, L, t) {
      return (Math.floor(r * L.freq * 0.5) + Math.floor(a / TAU * L.count)) * 0.5;
    },
    dots(u, v, r, a, L, t) {
      const f = L.freq * 0.5;
      const x = u * f, y = v * f;
      const dx = x - Math.floor(x) - 0.5, dy = y - Math.floor(y) - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) * 2;                 // 0 at centre, 1 at cell edge
      const size = clamp(L.amp * (0.55 + 0.45 * Math.cos(r * L.freq2 * PI + t)), 0.001, 2);
      return clamp(d / (2 * size), 0, 0.9999);                    // < duty  => inside the dot
    },
    hexagons(u, v, r, a, L, t) {
      const f = L.freq * 0.25;
      const h = hexCell(u * f, v * f);
      const adx = Math.abs(h[0]), ady = Math.abs(h[1]);
      const hd = Math.max(adx, 0.5 * adx + 0.8660254 * ady) / 0.8660254;
      const parity = ((h[2] + h[3]) & 1) ? L.amp * 0.5 : 0;
      return hd * L.freq2 * 0.5 + parity;
    },
    cubes(u, v, r, a, L, t) {
      const f = L.freq * 0.25;
      const h = hexCell(u * f, v * f);
      let ang = Math.atan2(h[1], h[0]) + PI * 0.5 + L.amp * PI * 0.6667;   // boundaries hit hex vertices
      ang -= TAU * Math.floor(ang / TAU);
      const sector = Math.floor(ang / (TAU / 3)) % 3;
      return sector / 3 + 0.001;
    },
    weave(u, v, r, a, L, t) {
      const s1 = Math.sin(u * L.freq * PI + L.amp * Math.sin(v * L.freq2 * PI + t));
      const s2 = Math.sin(v * L.freq * PI + L.amp * Math.sin(u * L.freq2 * PI - t));
      return (s1 * s2) * 0.25 + 0.25;
    },
    lissajous(u, v, r, a, L, t) {
      return (Math.sin(u * L.freq * 0.5 * PI + t) + Math.sin(v * L.freq * 0.5 * PI * (L.count / 4) * L.amp + t)) * 0.5;
    },
    contours(u, v, r, a, L, t, seed) {
      const n = fbm(u * L.freq * 0.25 + t * 0.15, v * L.freq * 0.25, seed, 4);
      return n * L.count * Math.max(0.05, L.amp);
    },
    interference(u, v, r, a, L, t) {
      const s = L.amp * 0.5;
      const d1 = Math.sqrt((u - s) * (u - s) + v * v);
      const d2 = Math.sqrt((u + s) * (u + s) + v * v);
      return (Math.cos(d1 * L.freq * PI + t) + Math.cos(d2 * L.freq * PI - t)) * 0.25 + 0.5;
    }
  };

  const SHAPES = ['hard', 'smooth', 'tri', 'saw', 'steps'];
  const BLENDS = ['difference', 'multiply', 'screen', 'average', 'min', 'max', 'add'];
  const COLOR_MODES = ['discrete', 'gradient'];

  /* ---------- state ---------- */
  function defaultLayer(on) {
    return {
      on: !!on, pattern: 'waves',
      freq: 14, amp: 0.5, freq2: 3, count: 8,
      phase: 0, drift: 1, cx: 0, cy: 0, scale: 1,
      shape: 'hard', duty: 0.5, steps: 3
    };
  }
  function defaultState() {
    return {
      v: 1,
      seed: 20240101,
      zoom: 1, rot: 0, panX: 0, panY: 0,
      symSeg: 1, symMirror: false, mirrorX: false, mirrorY: false,
      warp: {
        bulge: 0, twist: 0,
        ripple: 0, rippleFreq: 6,
        wave: 0, waveFreq: 3,
        noise: 0, noiseFreq: 2,
        animate: true
      },
      layers: [defaultLayer(true), Object.assign(defaultLayer(false), { pattern: 'rings', freq: 16 })],
      blend: 'difference',
      palette: ['#000000', '#ffffff'],
      colorMode: 'discrete',
      palRepeat: 1, palOffset: 0,
      gamma: 1, invert: false, grain: 0, vignette: 0,
      anim: { play: false, speed: 0.15 },
      aa: 1
    };
  }

  function hexToRgb(hex) {
    let h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* Convert the user-facing state into a flat, numeric structure for the inner loop */
  function prepare(S, t) {
    const pal = (S.palette && S.palette.length ? S.palette : ['#000', '#fff']).map(hexToRgb);
    const layers = [];
    for (let i = 0; i < S.layers.length; i++) {
      const L = S.layers[i];
      if (!L.on && i > 0) continue;
      layers.push({
        fn: PF[L.pattern] || PF.stripes,
        needsSeed: L.pattern === 'contours',
        freq: +L.freq, amp: +L.amp, freq2: +L.freq2, count: +L.count,
        phase: +L.phase + t * (+L.drift),
        cx: +L.cx, cy: +L.cy, invScale: 1 / Math.max(0.05, +L.scale || 1),
        shape: SHAPES.indexOf(L.shape) < 0 ? 0 : SHAPES.indexOf(L.shape),
        duty: clamp(+L.duty, 0.01, 0.99),
        steps: Math.max(2, Math.round(+L.steps || 2))
      });
    }
    const W = S.warp || {};
    const tAng = t * TAU;
    const wt = W.animate ? tAng : 0;
    const rotC = Math.cos(-S.rot * PI / 180), rotS = Math.sin(-S.rot * PI / 180);
    return {
      seed: (S.seed | 0) & 0x7fffffff,
      invZoom: 1 / Math.max(0.05, S.zoom), rotC, rotS,
      panX: +S.panX, panY: +S.panY,
      symSeg: Math.max(1, Math.round(S.symSeg || 1)), symMirror: !!S.symMirror,
      mirrorX: !!S.mirrorX, mirrorY: !!S.mirrorY,
      bulge: +W.bulge || 0, bulgePow: Math.pow(2, (+W.bulge || 0) * 1.5),
      twist: +W.twist || 0,
      ripple: +W.ripple || 0, rippleFreq: +W.rippleFreq || 1,
      wave: +W.wave || 0, waveFreq: +W.waveFreq || 1,
      noise: +W.noise || 0, noiseFreq: +W.noiseFreq || 1,
      wt,
      layers,
      blend: Math.max(0, BLENDS.indexOf(S.blend)),
      pal, palN: pal.length,
      gradient: S.colorMode === 'gradient',
      palRepeat: +S.palRepeat || 1, palOffset: +S.palOffset || 0,
      gamma: +S.gamma || 1, invert: !!S.invert,
      grain: +S.grain || 0, vignette: +S.vignette || 0,
      tAng
    };
  }

  function shapeValue(phase, shape, duty, steps) {
    switch (shape) {
      case 0: return fract(phase) < duty ? 0 : 1;                   // hard
      case 1: return 0.5 - 0.5 * Math.cos(phase * TAU);              // smooth
      case 2: return tri(phase);                                     // triangle
      case 3: return fract(phase);                                   // saw
      default: { const f = fract(phase); return Math.floor(f * steps) / (steps - 1); }   // steps
    }
  }

  /* Evaluate one sample. Returns packed 0xRRGGBB */
  function shade(px, py, P) {
    // px, py: normalised so the short axis spans [-1, 1]
    let u = px * P.invZoom, v = py * P.invZoom;
    if (P.rotC !== 1) { const nu = u * P.rotC - v * P.rotS; v = u * P.rotS + v * P.rotC; u = nu; }
    u -= P.panX; v -= P.panY;
    const r0 = Math.sqrt(u * u + v * v);

    if (P.mirrorX) u = Math.abs(u);
    if (P.mirrorY) v = Math.abs(v);

    let r = Math.sqrt(u * u + v * v), a = Math.atan2(v, u);
    let polarDirty = false;

    if (P.symSeg > 1) {
      const seg = TAU / P.symSeg;
      a = a - seg * Math.floor(a / seg);
      if (P.symMirror && a > seg * 0.5) a = seg - a;
      polarDirty = true;
    }
    if (P.bulge !== 0) { r = Math.pow(r, P.bulgePow); polarDirty = true; }
    if (P.twist !== 0) { a += P.twist * r * PI; polarDirty = true; }
    if (P.ripple !== 0) { r += P.ripple * 0.15 * Math.sin(r * P.rippleFreq * PI - P.wt); polarDirty = true; }
    if (polarDirty) { u = r * Math.cos(a); v = r * Math.sin(a); }
    if (P.wave !== 0) {
      const nu = u + P.wave * 0.5 * Math.sin(v * P.waveFreq * PI + P.wt);
      v = v + P.wave * 0.5 * Math.sin(u * P.waveFreq * PI - P.wt);
      u = nu;
      polarDirty = true;
    }
    if (P.noise !== 0) {
      const f = P.noiseFreq;
      u += P.noise * (fbm(u * f, v * f, P.seed, 3) - 0.5) * 1.5;
      v += P.noise * (fbm(u * f + 31.7, v * f - 17.3, P.seed + 99, 3) - 0.5) * 1.5;
      polarDirty = true;
    }

    // layers
    let val = 0;
    const layers = P.layers;
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      const lu = (u - L.cx) * L.invScale, lv = (v - L.cy) * L.invScale;
      const lr = Math.sqrt(lu * lu + lv * lv), la = Math.atan2(lv, lu);
      const ph = L.fn(lu, lv, lr, la, L, P.tAng, P.seed) + L.phase;
      const x = shapeValue(ph, L.shape, L.duty, L.steps);
      if (i === 0) { val = x; continue; }
      switch (P.blend) {
        case 0: val = Math.abs(val - x); break;
        case 1: val = val * x; break;
        case 2: val = 1 - (1 - val) * (1 - x); break;
        case 3: val = (val + x) * 0.5; break;
        case 4: val = Math.min(val, x); break;
        case 5: val = Math.max(val, x); break;
        default: val = Math.min(1, val + x);
      }
    }

    if (P.gamma !== 1) val = Math.pow(val, P.gamma);
    if (P.invert) val = 1 - val;

    // palette
    let cr, cg, cb;
    const pal = P.pal, n = P.palN;
    let x = val;
    if (P.palRepeat !== 1 || P.palOffset !== 0) x = fract(x * P.palRepeat + P.palOffset);
    if (P.gradient && n > 1) {
      const pos = x * (n - 1);
      let i = Math.floor(pos); if (i >= n - 1) i = n - 2;
      const f = pos - i;
      const c0 = pal[i], c1 = pal[i + 1];
      cr = c0[0] + (c1[0] - c0[0]) * f; cg = c0[1] + (c1[1] - c0[1]) * f; cb = c0[2] + (c1[2] - c0[2]) * f;
    } else {
      let i = Math.floor(x * n); if (i >= n) i = n - 1; if (i < 0) i = 0;
      const c = pal[i]; cr = c[0]; cg = c[1]; cb = c[2];
    }

    if (P.vignette > 0) {
      const k = 1 - P.vignette * smoothstep(0.6, 1.6, r0);
      cr *= k; cg *= k; cb *= k;
    }
    if (P.grain > 0) {
      const g = (hash2((px * 4096) | 0, (py * 4096) | 0, P.seed + 7) - 0.5) * P.grain * 120;
      cr += g; cg += g; cb += g;
    }
    cr = cr < 0 ? 0 : cr > 255 ? 255 : cr;
    cg = cg < 0 ? 0 : cg > 255 ? 255 : cg;
    cb = cb < 0 ? 0 : cb > 255 ? 255 : cb;
    return ((cr | 0) << 16) | ((cg | 0) << 8) | (cb | 0);
  }

  /* Render rows [y0, y1) of a w x h image into buf (RGBA, starts at row y0). */
  function renderRows(buf, w, h, y0, y1, S, t, ss) {
    const P = prepare(S, t);
    ss = Math.max(1, Math.min(4, ss | 0));
    const m = Math.min(w, h);
    const sx = 2 / m, sy = 2 / m;
    const ox = -w / m, oy = -h / m;
    let o = 0;
    if (ss === 1) {
      for (let y = y0; y < y1; y++) {
        const py = oy + (y + 0.5) * sy;
        for (let x = 0; x < w; x++) {
          const c = shade(ox + (x + 0.5) * sx, py, P);
          buf[o++] = c >> 16; buf[o++] = (c >> 8) & 255; buf[o++] = c & 255; buf[o++] = 255;
        }
      }
    } else {
      const n = ss * ss, step = 1 / ss, half = step * 0.5;
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < w; x++) {
          let r = 0, g = 0, b = 0;
          for (let j = 0; j < ss; j++) {
            const py = oy + (y + half + j * step) * sy;
            for (let i = 0; i < ss; i++) {
              const c = shade(ox + (x + half + i * step) * sx, py, P);
              r += c >> 16; g += (c >> 8) & 255; b += c & 255;
            }
          }
          buf[o++] = r / n; buf[o++] = g / n; buf[o++] = b / n; buf[o++] = 255;
        }
      }
    }
    return buf;
  }

  /* Worker entry point: shared by js/worker.js and by inline Blob workers */
  function workerMain(self) {
    self.onmessage = function (e) {
      const d = e.data;
      const rows = d.y1 - d.y0;
      const buf = new Uint8ClampedArray(rows * d.w * 4);
      renderRows(buf, d.w, d.h, d.y0, d.y1, d.state, d.t, d.ss);
      self.postMessage({ id: d.id, y0: d.y0, y1: d.y1, buf: buf.buffer }, [buf.buffer]);
    };
  }

  root.OpArt = {
    TAU, fract, clamp, mix, tri, hash2, vnoise, fbm,
    PATTERNS, PATTERN_IDS, PF, SHAPES, BLENDS, COLOR_MODES,
    defaultState, defaultLayer, hexToRgb, prepare, shade, renderRows, workerMain
  };
})(typeof self !== 'undefined' ? self : this);
