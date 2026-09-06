/* Headless smoke test: renders every pattern once with every feature enabled and checks for NaN / crashes. */
global.self = global;
require('../js/core.js');
const O = global.OpArt;
const w = 256, h = 256, buf = new Uint8ClampedArray(w * h * 4);
let failed = 0;
for (const id of O.PATTERN_IDS) {
  for (const shape of O.SHAPES) {
    const S = O.defaultState();
    S.layers[0].pattern = id; S.layers[0].shape = shape;
    S.layers[1].on = true; S.layers[1].pattern = id;
    S.warp = { bulge: 0.4, twist: 0.5, ripple: 0.3, rippleFreq: 5, wave: 0.2, waveFreq: 3, noise: 0.2, noiseFreq: 2, animate: true };
    S.symSeg = 5; S.symMirror = true; S.mirrorX = true;
    S.palette = ['#ff0000', '#00ff00', '#0000ff', '#ffffff']; S.colorMode = 'gradient'; S.palRepeat = 2; S.palOffset = 0.3;
    S.gamma = 1.4; S.invert = true; S.grain = 0.2; S.vignette = 0.4;
    try {
      O.renderRows(buf, w, h, 0, h, S, 0.37, 2);
      let nan = 0; for (let i = 0; i < buf.length; i++) if (buf[i] !== buf[i]) nan++;
      if (nan) { failed++; console.log('NaN in', id, shape); }
    } catch (e) { failed++; console.log('crash in', id, shape, e.message); }
  }
}
console.log(failed ? `FAILED (${failed})` : `OK: ${O.PATTERN_IDS.length} patterns × ${O.SHAPES.length} shapes`);
process.exit(failed ? 1 : 0);
