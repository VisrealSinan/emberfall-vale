// Copies the game into launcher/game so it ships inside the installer,
// and downloads the fonts so the launcher and game work offline.
const fs = require('fs');
const path = require('path');
const { localizeHtml } = require('../localize');

const root = path.join(__dirname, '..', '..');
const app = path.join(__dirname, '..');
const gameDir = path.join(app, 'game');
const fontDir = path.join(app, 'fonts');

fs.mkdirSync(gameDir, { recursive: true });
fs.mkdirSync(fontDir, { recursive: true });

// 1. Game page
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
fs.writeFileSync(path.join(gameDir, 'index.html'), localizeHtml(html, '../fonts/fonts.css'));

// 2. three.js (installed as a dev dependency)
fs.copyFileSync(
  require.resolve('three/build/three.min.js', { paths: [app] }),
  path.join(gameDir, 'three.min.js')
);

// 3. Version + news (used when the launcher is offline)
const meta = JSON.parse(fs.readFileSync(path.join(root, 'updates.json'), 'utf8'));
fs.writeFileSync(path.join(gameDir, 'updates.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(gameDir, 'version.json'), JSON.stringify({ gameVersion: meta.gameVersion }));

// 4. Fonts (best effort: if the download fails, system fonts are used instead)
const FONTS = [
  ['Cinzel.ttf', 'ofl/cinzel/Cinzel%5Bwght%5D.ttf'],
  ['AlegreyaSans-Regular.ttf', 'ofl/alegreyasans/AlegreyaSans-Regular.ttf'],
  ['AlegreyaSans-Medium.ttf', 'ofl/alegreyasans/AlegreyaSans-Medium.ttf'],
  ['AlegreyaSans-Bold.ttf', 'ofl/alegreyasans/AlegreyaSans-Bold.ttf'],
  ['MPLUSRounded1c-Regular.ttf', 'ofl/mplusrounded1c/MPLUSRounded1c-Regular.ttf'],
  ['MPLUSRounded1c-Medium.ttf', 'ofl/mplusrounded1c/MPLUSRounded1c-Medium.ttf'],
  ['MPLUSRounded1c-Bold.ttf', 'ofl/mplusrounded1c/MPLUSRounded1c-Bold.ttf'],
  ['MPLUSRounded1c-ExtraBold.ttf', 'ofl/mplusrounded1c/MPLUSRounded1c-ExtraBold.ttf'],
];
const CSS = `@font-face{font-family:'Cinzel';src:url(Cinzel.ttf) format('truetype');font-weight:400 900;font-display:swap}
@font-face{font-family:'Alegreya Sans';src:url(AlegreyaSans-Regular.ttf) format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'Alegreya Sans';src:url(AlegreyaSans-Medium.ttf) format('truetype');font-weight:500;font-display:swap}
@font-face{font-family:'Alegreya Sans';src:url(AlegreyaSans-Bold.ttf) format('truetype');font-weight:700;font-display:swap}
@font-face{font-family:'M PLUS Rounded 1c';src:url(MPLUSRounded1c-Regular.ttf) format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'M PLUS Rounded 1c';src:url(MPLUSRounded1c-Medium.ttf) format('truetype');font-weight:500;font-display:swap}
@font-face{font-family:'M PLUS Rounded 1c';src:url(MPLUSRounded1c-Bold.ttf) format('truetype');font-weight:700;font-display:swap}
@font-face{font-family:'M PLUS Rounded 1c';src:url(MPLUSRounded1c-ExtraBold.ttf) format('truetype');font-weight:800;font-display:swap}
`;

(async () => {
  let ok = 0;
  for (const [file, remote] of FONTS) {
    const dest = path.join(fontDir, file);
    if (fs.existsSync(dest)) { ok++; continue; }
    try {
      const r = await fetch('https://raw.githubusercontent.com/google/fonts/main/' + remote);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) {
      console.warn(`Could not download ${file}: ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(fontDir, 'fonts.css'), CSS);
  console.log(`Game ${meta.gameVersion} prepared. Fonts: ${ok}/${FONTS.length}.`);
})();
