/* Curated presets. Each entry is a partial state merged over OpArt.defaultState(). */
(function (root) {
  'use strict';
  const L = (o) => Object.assign(root.OpArt.defaultLayer(true), o);
  const OFF = () => root.OpArt.defaultLayer(false);

  root.PALETTES = [
    { name: 'Mono', colors: ['#000000', '#ffffff'] },
    { name: 'Ink', colors: ['#101820', '#f2f2f2'] },
    { name: 'Riley', colors: ['#1c1c1c', '#e8e4d8', '#c8102e'] },
    { name: 'Vasarely', colors: ['#0b3d91', '#ffd400', '#e63946', '#2a9d8f'] },
    { name: 'Anuszkiewicz', colors: ['#ff2d55', '#00c2ff', '#ffd60a', '#1a0033'] },
    { name: 'Neon', colors: ['#0d0221', '#ff00c8', '#00f0ff', '#f9f871'] },
    { name: 'Sunset', colors: ['#2b0a3d', '#ff4e00', '#ffb800', '#fff1c1'] },
    { name: 'Ocean', colors: ['#03045e', '#0077b6', '#00b4d8', '#caf0f8'] },
    { name: 'Pastel', colors: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'] },
    { name: 'Terracotta', colors: ['#3d1e1e', '#b5532c', '#e8b17c', '#f4e7d3'] },
    { name: 'Forest', colors: ['#0b2b1a', '#1f6f43', '#8ab17d', '#e9f5db'] },
    { name: 'Cube', colors: ['#111111', '#7a7a7a', '#f4f4f4'] }
  ];

  root.PRESETS = [
    { name: 'Riley Waves', state: { layers: [L({ pattern: 'waves', freq: 22, amp: 0.35, freq2: 3, duty: 0.5 }), OFF()] } },
    { name: 'Vega Bulge', state: { layers: [L({ pattern: 'checker', freq: 24, amp: 0 }), OFF()], warp: { bulge: 0.85, twist: 0, ripple: 0, rippleFreq: 6, wave: 0, waveFreq: 3, noise: 0, noiseFreq: 2, animate: true } } },
    { name: 'Vasarely Dots', state: { layers: [L({ pattern: 'dots', freq: 20, amp: 0.85, freq2: 2.2, drift: 0 }), OFF()], palette: ['#0b3d91', '#ffd400'] } },
    { name: 'Moiré Rings', state: { layers: [L({ pattern: 'rings', freq: 34, amp: 0, cx: -0.12 }), L({ pattern: 'rings', freq: 34, amp: 0, cx: 0.12, drift: -1 })], blend: 'difference' } },
    { name: 'Blaze', state: { layers: [L({ pattern: 'blaze', freq: 18, amp: 0.45, count: 24, drift: 0.5 }), OFF()], warp: { bulge: 0.3, twist: 0, ripple: 0, rippleFreq: 6, wave: 0, waveFreq: 3, noise: 0, noiseFreq: 2, animate: true } } },
    { name: 'Tumbling Cubes', state: { layers: [L({ pattern: 'cubes', freq: 18, amp: 0, drift: 0, shape: 'steps', steps: 3 }), OFF()], palette: ['#111111', '#7a7a7a', '#f4f4f4'] } },
    { name: 'Polar Vega', state: { layers: [L({ pattern: 'polarCheck', freq: 26, count: 32, drift: 0.25 }), OFF()], warp: { bulge: -0.4, twist: 0, ripple: 0, rippleFreq: 6, wave: 0, waveFreq: 3, noise: 0, noiseFreq: 2, animate: true } } },
    { name: 'Kaleido Spiral', state: { layers: [L({ pattern: 'spiral', freq: 12, count: 5, shape: 'smooth' }), OFF()], symSeg: 8, symMirror: true, palette: ['#0d0221', '#ff00c8', '#00f0ff', '#f9f871'], colorMode: 'gradient' } },
    { name: 'Twisted Tunnel', state: { layers: [L({ pattern: 'tunnel', freq: 20, count: 16, drift: 1 }), OFF()], warp: { bulge: 0, twist: 0.6, ripple: 0, rippleFreq: 6, wave: 0, waveFreq: 3, noise: 0, noiseFreq: 2, animate: true } } },
    { name: 'Cataract', state: { layers: [L({ pattern: 'cataract', freq: 30, amp: 0.6, freq2: 2, duty: 0.55 }), OFF()], palette: ['#1c1c1c', '#e8e4d8'] } },
    { name: 'Interference', state: { layers: [L({ pattern: 'interference', freq: 26, amp: 0.7, shape: 'hard', duty: 0.5 }), OFF()], palette: ['#03045e', '#caf0f8'] } },
    { name: 'Hex Rings', state: { layers: [L({ pattern: 'hexagons', freq: 16, freq2: 6, amp: 1, shape: 'steps', steps: 4 }), OFF()], palette: ['#3d1e1e', '#b5532c', '#e8b17c', '#f4e7d3'] } },
    { name: 'Noise Contours', state: { layers: [L({ pattern: 'contours', freq: 10, count: 12, amp: 1, shape: 'hard', duty: 0.5 }), OFF()], palette: ['#0b2b1a', '#e9f5db'] } },
    { name: 'Ripple XOR', state: { layers: [L({ pattern: 'stripes', freq: 16 }), L({ pattern: 'rays', count: 20, drift: 0 })], blend: 'difference', warp: { bulge: 0, twist: 0, ripple: 0.6, rippleFreq: 5, wave: 0, waveFreq: 3, noise: 0, noiseFreq: 2, animate: true } } },
    { name: 'Gradient Vortex', state: { layers: [L({ pattern: 'vortex', freq: 10, count: 3, shape: 'smooth' }), OFF()], palette: ['#2b0a3d', '#ff4e00', '#ffb800', '#fff1c1'], colorMode: 'gradient', palRepeat: 2 } },
    { name: 'Organic Weave', state: { layers: [L({ pattern: 'weave', freq: 12, amp: 1.2, freq2: 2, shape: 'steps', steps: 4 }), OFF()], warp: { bulge: 0, twist: 0, ripple: 0, rippleFreq: 6, wave: 0, waveFreq: 3, noise: 0.5, noiseFreq: 1.5, animate: true }, palette: ['#ff2d55', '#00c2ff', '#ffd60a', '#1a0033'] } }
  ];
})(window);
