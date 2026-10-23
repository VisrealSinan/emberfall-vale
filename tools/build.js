// Builds index.html from the files in src/.
//   node tools/build.js
// src/head.html  -> page markup and styles
// src/NN-*.js    -> game code, joined in number order inside one script
// The result is a single self-contained index.html (plus three.js from a CDN),
// which is what the browser version, GitHub Pages and the launcher all use.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const head = fs.readFileSync(path.join(src, 'head.html'), 'utf8');
const parts = fs.readdirSync(src).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();

let js = '';
for (const f of parts) {
  js += `\n/* ===================== ${f} ===================== */\n`;
  js += fs.readFileSync(path.join(src, f), 'utf8');
}

const out =
  head.trimEnd() +
  '\n\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' +
  '/* Emberfall Vale. Built from src/ by tools/build.js. Edit the files in src/, not this one. */\n' +
  "(()=>{\n'use strict';\n" +
  js +
  '\n})();\n</script>\n';

fs.writeFileSync(path.join(root, 'index.html'), out);
console.log(`Built index.html from ${parts.length} parts (${(out.length / 1024).toFixed(0)} KB).`);
