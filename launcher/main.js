const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { localizeHtml } = require('./localize');

const REPO = 'VisrealSinan/emberfall-vale';
const RAW = process.env.EMBERFALL_RAW || `https://raw.githubusercontent.com/${REPO}/main`;
const BUNDLED_GAME = path.join(__dirname, 'game');
const FONTS_CSS = path.join(__dirname, 'fonts', 'fonts.css');
const ICON = path.join(__dirname, 'ui', 'icon.png');
let USER_GAME, SETTINGS;

let launcher = null;
let gameWin = null;

const DEFAULTS = { display: 'windowed', resolution: '1600x900', graphics: 'high' };

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function settings() { return { ...DEFAULTS, ...readJSON(SETTINGS, {}) }; }
function cmpVer(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}

// The launcher plays whichever copy of the game is newest: the one that came
// with the installer, or one it downloaded later from GitHub.
function activeGame() {
  const bundled = readJSON(path.join(BUNDLED_GAME, 'version.json'), { gameVersion: '0.0.0' });
  const updated = readJSON(path.join(USER_GAME, 'version.json'), null);
  if (updated && cmpVer(updated.gameVersion, bundled.gameVersion) > 0 &&
      fs.existsSync(path.join(USER_GAME, 'index.html'))) {
    return { dir: USER_GAME, version: updated.gameVersion };
  }
  return { dir: BUNDLED_GAME, version: bundled.gameVersion };
}

async function fetchRemote(file) {
  const r = await fetch(`${RAW}/${file}?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`GitHub answered ${r.status}`);
  return r;
}

function createLauncher() {
  launcher = new BrowserWindow({
    width: 1120, height: 680, minWidth: 900, minHeight: 560,
    frame: false, backgroundColor: '#120f0d', show: false,
    title: 'Emberfall Vale', icon: ICON,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  launcher.loadFile(path.join(__dirname, 'ui', 'launcher.html'));
  launcher.once('ready-to-show', () => launcher.show());
  launcher.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

function startGame() {
  if (gameWin) { gameWin.focus(); return; }
  const s = settings();
  const g = activeGame();
  const [w, h] = s.resolution.split('x').map(Number);
  gameWin = new BrowserWindow({
    width: w || 1600, height: h || 900, fullscreen: s.display === 'fullscreen',
    backgroundColor: '#120f0d', title: 'Emberfall Vale', icon: ICON, show: false, autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  gameWin.setMenu(null);
  gameWin.loadFile(path.join(g.dir, 'index.html'), { query: { gfx: s.graphics } });
  gameWin.once('ready-to-show', () => { gameWin.show(); if (launcher) launcher.hide(); });
  gameWin.webContents.on('before-input-event', (ev, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      gameWin.setFullScreen(!gameWin.isFullScreen());
      ev.preventDefault();
    }
  });
  gameWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  gameWin.on('closed', () => {
    gameWin = null;
    if (launcher && !launcher.isDestroyed()) { launcher.show(); launcher.focus(); }
  });
}

ipcMain.handle('get-state', () => ({
  settings: settings(),
  game: activeGame(),
  appVersion: app.getVersion(),
  news: readJSON(path.join(BUNDLED_GAME, 'updates.json'), { news: [] }).news,
}));

ipcMain.handle('save-settings', (_e, s) => {
  const merged = { ...settings(), ...s };
  fs.mkdirSync(path.dirname(SETTINGS), { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(merged, null, 2));
  return merged;
});

ipcMain.handle('check-update', async () => {
  try {
    const remote = await (await fetchRemote('updates.json')).json();
    const current = activeGame().version;
    return { ok: true, remote, current, available: cmpVer(remote.gameVersion, current) > 0 };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('install-update', async (e) => {
  const send = (p, msg) => { if (!e.sender.isDestroyed()) e.sender.send('update-progress', { p, msg }); };
  try {
    send(0.1, 'Downloading game files');
    const meta = await (await fetchRemote('updates.json')).json();
    const html = await (await fetchRemote('index.html')).text();
    if (!html.includes('THREE.')) throw new Error('the downloaded game file looks incomplete');
    send(0.7, 'Installing');
    fs.mkdirSync(USER_GAME, { recursive: true });
    const tmp = path.join(USER_GAME, 'index.html.tmp');
    fs.writeFileSync(tmp, localizeHtml(html, pathToFileURL(FONTS_CSS).href));
    fs.copyFileSync(path.join(BUNDLED_GAME, 'three.min.js'), path.join(USER_GAME, 'three.min.js'));
    fs.renameSync(tmp, path.join(USER_GAME, 'index.html'));
    fs.writeFileSync(path.join(USER_GAME, 'version.json'), JSON.stringify({ gameVersion: meta.gameVersion }));
    send(1, 'Done');
    return { ok: true, version: meta.gameVersion };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('play', () => startGame());
ipcMain.on('win', (_e, cmd) => {
  if (!launcher) return;
  if (cmd === 'min') launcher.minimize();
  if (cmd === 'close') app.quit();
});
ipcMain.on('open', (_e, url) => {
  if (typeof url === 'string' && url.startsWith('https://')) shell.openExternal(url);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = gameWin || launcher;
    if (w) { if (w.isMinimized()) w.restore(); w.show(); w.focus(); }
  });
  app.whenReady().then(() => {
    USER_GAME = path.join(app.getPath('userData'), 'game');
    SETTINGS = path.join(app.getPath('userData'), 'settings.json');
    createLauncher();
  });
  app.on('window-all-closed', () => app.quit());
}
