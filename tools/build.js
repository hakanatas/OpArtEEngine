#!/usr/bin/env node
/* Bundle index.html + css + js into a single self-contained dist/opart-engine.html.
 * The core is inlined in a tagged <script> so the app can spin up Blob workers without extra files. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => '<style>\n' + read('css/style.css') + '\n</style>');
html = html.replace('<script src="js/core.js"></script>', () => '<script id="opart-core-inline">\n' + read('js/core.js') + '\n</script>');
for (const f of ['i18n', 'presets', 'app']) {
  html = html.replace(`<script src="js/${f}.js"></script>`, () => '<script>\n' + read(`js/${f}.js`) + '\n</script>');
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'opart-engine.html'), html);
console.log('wrote dist/opart-engine.html', (html.length / 1024).toFixed(1) + ' KB');
