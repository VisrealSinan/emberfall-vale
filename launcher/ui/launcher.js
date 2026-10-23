const L = window.launcher;
const $ = (id) => document.getElementById(id);
let state = null;
let pendingUpdate = null;
let busy = false;

function setStatus(text, kind) {
  $('statusText').textContent = text;
  $('dot').className = 'dot' + (kind ? ' ' + kind : '');
}

function setPlay(label, opts = {}) {
  const b = $('btnPlay');
  b.textContent = label;
  b.disabled = !!opts.disabled;
  b.classList.toggle('update', !!opts.update);
}

function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// News comes from GitHub, so it is inserted as text, never as HTML.
function renderNews(news) {
  if (!Array.isArray(news) || !news.length) return;
  const list = $('newsList');
  list.textContent = '';
  for (const n of news) {
    const el = document.createElement('article');
    el.className = 'item';
    const meta = document.createElement('div'); meta.className = 'meta';
    const pill = document.createElement('span'); pill.className = 'pill'; pill.textContent = n.tag || 'News';
    const date = document.createElement('span'); date.textContent = n.date ? fmtDate(n.date) : '';
    meta.append(pill, date);
    const h = document.createElement('h3'); h.textContent = n.title || '';
    const p = document.createElement('p'); p.textContent = n.body || '';
    el.append(meta, h, p);
    list.append(el);
  }
  const top = news[0];
  $('heroTag').textContent = `${top.tag || 'Latest'} · Latest`;
  $('featureTitle').textContent = top.title || '';
  $('featureBody').textContent = top.body || '';
}

async function checkForUpdate() {
  setStatus('Checking for updates');
  setPlay('Play', { disabled: true });
  const r = await L.checkUpdate();
  if (!r.ok) {
    setStatus(`v${state.game.version} · offline, can't check for updates`, 'warn');
    setPlay('Play');
    return;
  }
  renderNews(r.remote.news);
  if (r.available) {
    pendingUpdate = r;
    setStatus(`Update ${r.remote.gameVersion} is ready to download`, 'warn');
    setPlay('Update', { update: true });
  } else {
    pendingUpdate = null;
    setStatus(`v${r.current} · up to date`, 'ok');
    setPlay('Play');
  }
}

async function installUpdate() {
  busy = true;
  setPlay('Updating', { disabled: true, update: true });
  $('prog').hidden = false;
  $('progBar').style.width = '5%';
  const r = await L.installUpdate();
  busy = false;
  if (!r.ok) {
    $('prog').hidden = true;
    setStatus(`Update failed: ${r.error}. You can still play v${state.game.version}.`, 'bad');
    setPlay('Play');
    return;
  }
  $('progBar').style.width = '100%';
  state = await L.getState();
  pendingUpdate = null;
  setTimeout(() => { $('prog').hidden = true; }, 600);
  setStatus(`v${r.version} · up to date`, 'ok');
  setPlay('Play');
}

L.onProgress(({ p, msg }) => {
  $('progBar').style.width = Math.round(p * 100) + '%';
  if (busy && msg) setStatus(msg);
});

$('btnPlay').addEventListener('click', () => {
  if (busy) return;
  if (pendingUpdate) installUpdate();
  else L.play();
});

// settings
let draft = {};
function paintSettings() {
  document.querySelectorAll('.seg').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(draft[seg.dataset.key] === b.dataset.v)));
  });
}
document.querySelectorAll('.seg').forEach((seg) => {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    draft[seg.dataset.key] = b.dataset.v;
    paintSettings();
  });
});
function openSettings() { draft = { ...state.settings }; paintSettings(); $('settings').hidden = false; $('btnSave').focus(); }
function closeSettings() { $('settings').hidden = true; $('btnSettings').focus(); }
$('btnSettings').addEventListener('click', openSettings);
$('btnCancel').addEventListener('click', closeSettings);
$('btnSave').addEventListener('click', async () => { state.settings = await L.saveSettings(draft); closeSettings(); });
$('settings').addEventListener('click', (e) => { if (e.target.id === 'settings') closeSettings(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('settings').hidden) closeSettings(); });

$('btnGithub').addEventListener('click', () => L.open('https://github.com/VisrealSinan/emberfall-vale'));
$('btnMin').addEventListener('click', () => L.win('min'));
$('btnClose').addEventListener('click', () => L.win('close'));

(async () => {
  state = await L.getState();
  renderNews(state.news);
  setStatus(`v${state.game.version}`);
  checkForUpdate();
})();
