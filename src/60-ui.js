/* Interface: HUD, nameplates, tooltips, windows (character, bags, talents, quests, spells, map, vendor, NPC), menus. */

/* ---------------- icons ---------------- */
const _icons = new Map();
function iconCanvas() { const c = document.createElement('canvas'); c.width = c.height = 64; return c; }
function skillIcon(sk) {
  const key = 'sk' + sk.id; if (_icons.has(key)) return _icons.get(key);
  const c = iconCanvas(), x = c.getContext('2d'), col = hex(sk.color);
  const gr = x.createRadialGradient(24, 20, 4, 32, 32, 44); gr.addColorStop(0, shade(sk.color, 0.45)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(sk.color, -0.6));
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(32, 32, 10 + i * 9, -0.6 + i, 1 + i); x.stroke(); }
  const ini = sk.abbr || sk.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  x.font = '800 24px "M PLUS Rounded 1c", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 5; x.strokeStyle = 'rgba(10,12,26,.85)'; x.strokeText(ini, 32, 34); x.fillStyle = '#fff'; x.fillText(ini, 32, 34);
  const url = c.toDataURL(); _icons.set(key, url); return url;
}
function itemIcon(it) {
  const key = 'it' + it.slot + it.type + it.color + it.rarity; if (_icons.has(key)) return _icons.get(key);
  const c = iconCanvas(), x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, 64); bg.addColorStop(0, '#2a2f4a'); bg.addColorStop(1, '#141828'); x.fillStyle = bg; x.fillRect(0, 0, 64, 64);
  const col = hex(it.color), dk = shade(it.color, -0.5), lt = shade(it.color, 0.35);
  x.fillStyle = col; x.strokeStyle = '#0b0d18'; x.lineWidth = 3; x.lineJoin = 'round';
  const path = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); x.stroke(); };
  const s = it.slot, t = it.type;
  if (s === 'head') { x.beginPath(); x.arc(32, 36, 18, Math.PI, 0); x.lineTo(52, 42); x.lineTo(12, 42); x.closePath(); x.fill(); x.stroke(); x.fillStyle = lt; x.fillRect(14, 38, 36, 6); }
  else if (s === 'neck') { x.strokeStyle = '#d8c070'; x.lineWidth = 3; x.beginPath(); x.arc(32, 22, 16, 0.2, Math.PI - 0.2); x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(32, 44, 9, 0, 7); x.fill(); x.strokeStyle = '#0b0d18'; x.stroke(); }
  else if (s === 'shoulders') { for (const cx of [20, 44]) { x.beginPath(); x.ellipse(cx, 34, 14, 10, 0, Math.PI, 0); x.lineTo(cx + 14, 40); x.lineTo(cx - 14, 40); x.closePath(); x.fill(); x.stroke(); } }
  else if (s === 'back') path([[20, 12], [44, 12], [54, 54], [32, 48], [10, 54]]);
  else if (s === 'chest') path([[18, 12], [26, 16], [38, 16], [46, 12], [56, 24], [48, 30], [48, 54], [16, 54], [16, 30], [8, 24]]);
  else if (s === 'hands') { path([[20, 54], [20, 22], [26, 14], [32, 14], [34, 22], [40, 18], [46, 24], [44, 36], [46, 54]]); }
  else if (s === 'waist') { x.fillRect(8, 26, 48, 12); x.strokeRect(8, 26, 48, 12); x.fillStyle = '#d8c070'; x.fillRect(26, 23, 12, 18); x.strokeRect(26, 23, 12, 18); }
  else if (s === 'legs') path([[16, 10], [48, 10], [50, 56], [36, 56], [32, 28], [28, 56], [14, 56]]);
  else if (s === 'feet') path([[18, 10], [34, 10], [34, 38], [54, 44], [54, 54], [18, 54]]);
  else if (s === 'ring') { x.strokeStyle = '#d8c070'; x.lineWidth = 7; x.beginPath(); x.arc(32, 38, 15, 0, 7); x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(32, 20, 8, 0, 7); x.fill(); x.lineWidth = 3; x.strokeStyle = '#0b0d18'; x.stroke(); }
  else if (s === 'trinket') { path([[32, 8], [52, 32], [32, 56], [12, 32]]); x.fillStyle = lt; x.beginPath(); x.arc(32, 32, 7, 0, 7); x.fill(); }
  else if (t === 'Dagger') { path([[30, 6], [36, 6], [38, 40], [28, 40]]); x.fillStyle = '#c8a050'; x.fillRect(20, 40, 26, 6); x.fillStyle = dk; x.fillRect(29, 46, 8, 14); }
  else if (t === 'Bow') { x.strokeStyle = col; x.lineWidth = 7; x.beginPath(); x.arc(14, 32, 26, -1.1, 1.1); x.stroke(); x.strokeStyle = '#eee'; x.lineWidth = 2; x.beginPath(); x.moveTo(26, 9); x.lineTo(26, 55); x.stroke(); }
  else if (t === 'Staff') { x.strokeStyle = dk; x.lineWidth = 6; x.beginPath(); x.moveTo(16, 58); x.lineTo(44, 18); x.stroke(); x.fillStyle = lt; x.beginPath(); x.arc(46, 15, 9, 0, 7); x.fill(); x.strokeStyle = '#0b0d18'; x.lineWidth = 3; x.stroke(); }
  else if (t === 'Quiver') { path([[22, 18], [42, 18], [40, 58], [24, 58]]); x.fillStyle = '#eee'; for (const ax of [26, 32, 38]) x.fillRect(ax - 1, 6, 3, 14); }
  else if (t === 'Tome') { x.fillRect(14, 12, 36, 42); x.strokeRect(14, 12, 36, 42); x.fillStyle = '#eee'; x.fillRect(46, 15, 4, 36); x.fillStyle = lt; x.beginPath(); x.arc(31, 33, 7, 0, 7); x.fill(); }
  else if (t === 'Idol') { path([[32, 8], [44, 22], [40, 56], [24, 56], [20, 22]]); x.fillStyle = lt; x.fillRect(27, 24, 10, 4); }
  else { x.fillStyle = '#8a8a8a'; path([[18, 24], [30, 14], [46, 20], [50, 40], [36, 52], [16, 44]]); }
  x.strokeStyle = hex(RARITY[it.rarity].glow); x.lineWidth = it.rarity >= 2 ? 4 : 2; x.globalAlpha = 0.85; x.strokeRect(2, 2, 60, 60);
  const url = c.toDataURL(); _icons.set(key, url); return url;
}

/* ---------------- tooltips ---------------- */
const tipEl = $('tip');
function statLines(it) {
  let h = '';
  if (it.dmg) h += `<div>${it.dmg} Weapon Damage</div>`;
  if (it.stats.armor) h += `<div>${it.stats.armor} Armor</div>`;
  for (const k of ['sta', 'agi', 'int']) if (it.stats[k]) h += `<div>+${it.stats[k]} ${STAT_NAME[k]}</div>`;
  for (const k of ['crit', 'haste']) if (it.stats[k]) h += `<div class="g">Equip: +${it.stats[k]} ${STAT_NAME[k]} rating</div>`;
  return h;
}
function itemTipHtml(it, label) {
  if (it.slot === 'junk') return `<div class="tt"><span class="nm q0">${esc(it.name)}</span><div class="m">Junk</div><div class="m">Sell price: ${it.sell} g</div></div>`;
  const req = it.req > P.lvl ? 'r' : '';
  return `<div class="tt">${label ? `<div class="cur">${label}</div>` : ''}<span class="nm q${it.rarity}">${esc(it.name)}</span>
    <div class="y">Item Level ${it.ilvl}</div><div class="row"><span>${SLOT[it.slot].name}</span><span>${it.type || ''}</span></div>${statLines(it)}
    <div class="${req}">Requires Level ${it.req}</div><div class="m">${RARITY[it.rarity].name} · Sell price: ${it.sell} g</div></div>`;
}
function compareHtml(it) {
  if (!it || it.slot === 'junk') return '';
  const cur = CH.equip[it.slot]; const keys = ['dmg', 'armor', 'sta', 'agi', 'int', 'crit', 'haste'];
  const val = (x, k) => (x ? (k === 'dmg' ? x.dmg || 0 : x.stats[k] || 0) : 0);
  const diff = keys.map((k) => [k, val(it, k) - val(cur, k)]).filter(([, d]) => d);
  if (!diff.length) return '';
  return `<div class="tt" style="width:190px"><div class="cur">If you equip this</div>${diff.map(([k, d]) => `<div class="${d > 0 ? 'g' : 'r'}">${d > 0 ? '+' : ''}${d} ${k === 'dmg' ? 'Weapon Damage' : STAT_NAME[k]}</div>`).join('')}</div>`;
}
function showTip(html, ev) {
  tipEl.innerHTML = html; tipEl.hidden = false;
  const r = tipEl.getBoundingClientRect(); let x = ev.clientX + 16, y = ev.clientY + 12;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 16; if (y + r.height > innerHeight - 8) y = innerHeight - r.height - 8;
  tipEl.style.left = Math.max(8, x) + 'px'; tipEl.style.top = Math.max(8, y) + 'px';
}
function hideTip() { tipEl.hidden = true; }
function skillTipHtml(sk) {
  const locked = P.lvl < sk.lvl;
  return `<div class="tt"><span class="nm">${esc(sk.name)}</span><div class="row m"><span>${sk.range ? sk.range + ' yd range' : 'Instant'}</span><span>${skillCd(sk) >= 1.5 ? Math.round(skillCd(sk) * 10) / 10 + ' sec cooldown' : ''}</span></div>
    <div class="desc">${esc(sk.desc)}</div>${locked ? `<div class="r">Unlocks at level ${sk.lvl}</div>` : ''}</div>`;
}
// Hover tooltips for anything with data-tip.
document.addEventListener('pointerover', (ev) => {
  if (ev.pointerType === 'touch') return;
  const el = ev.target.closest('[data-tip]'); if (!el) return;
  const html = tipFor(el.dataset.tip); if (html) showTip(html, ev);
});
document.addEventListener('pointermove', (ev) => { if (!tipEl.hidden && ev.pointerType !== 'touch') { const el = ev.target.closest('[data-tip]'); if (!el) hideTip(); else { const html = tipFor(el.dataset.tip); if (html) showTip(html, ev); } } });
function itemFromRef(ref) {
  const [k, v] = ref.split(':');
  if (k === 'b') return CH.inv[+v]; if (k === 'e') return CH.equip[v]; if (k === 'v') return curVendor && vendorStock(curVendor.def)[+v];
  if (k === 'r') { const q = QUEST[curQuestView]; return q && questRewards(q)[+v]; }
  return null;
}
function tipFor(ref) {
  const [k, v] = ref.split(':');
  if (k === 's') return skillTipHtml(SK[v]);
  if (k === 't') return talentTipHtml(+v.split('-')[0], +v.split('-')[1]);
  if (k === 'slot') return `<div class="tt"><span class="nm">${SLOT[v].name}</span><div class="m">Empty</div></div>`;
  if (k === 'txt') return `<div class="tt">${esc(decodeURIComponent(v))}</div>`;
  const it = itemFromRef(ref); if (!it) return '';
  const cur = k !== 'e' && it.slot !== 'junk' ? CH.equip[it.slot] : null;
  return itemTipHtml(it) + (k !== 'e' ? compareHtml(it) : '') + (cur ? itemTipHtml(cur, 'Currently equipped') : '');
}

/* ---------------- item action popup ---------------- */
const iact = $('iact');
function openItemActions(ref, ev) {
  const it = itemFromRef(ref); if (!it) return;
  const [k, v] = ref.split(':'); const btns = [];
  if (k === 'b') {
    if (it.slot !== 'junk') btns.push(['Equip', () => equipFromBag(+v)]);
    if (curVendor) btns.push([`Sell (${it.sell} g)`, () => sellItem(+v)]);
    btns.push(['Destroy', () => destroyItem(+v), 'danger']);
  } else if (k === 'e') btns.push(['Unequip', () => unequip(v)]);
  else if (k === 'v') btns.push([`Buy (${it.price} g)`, () => buyItem(+v)]);
  iact.innerHTML = itemTipHtml(it).replace('class="tt"', 'class="tt" style="width:auto;border:0;padding:2px;box-shadow:none;background:none"') + '<div class="btnrow" style="margin-top:4px"></div>';
  const row = iact.querySelector('.btnrow');
  for (const [label, fn, cls] of btns.concat([['Cancel', () => {}, 'ghost']])) { const b = document.createElement('button'); b.className = 'btn sm ' + (cls || ''); b.textContent = label; b.onclick = () => { iact.hidden = true; fn(); }; row.appendChild(b); }
  iact.hidden = false; hideTip();
  const r = iact.getBoundingClientRect(); iact.style.left = clamp(ev.clientX - r.width / 2, 8, innerWidth - r.width - 8) + 'px'; iact.style.top = clamp(ev.clientY - r.height - 10, 8, innerHeight - r.height - 8) + 'px';
}
document.addEventListener('pointerdown', (ev) => { if (!iact.hidden && !iact.contains(ev.target)) iact.hidden = true; }, true);
function itemSlotHtml(it, ref, extra = '') {
  if (!it) return `<button class="isl ${extra}" data-tip="${ref.startsWith('e:') ? 'slot:' + ref.slice(2) : ''}" data-ref="${ref}"><span class="sl">${ref.startsWith('e:') ? SLOT[ref.slice(2)].name : ''}</span></button>`;
  return `<button class="isl r${it.rarity} ${extra}" data-tip="${ref}" data-ref="${ref}"><img src="${itemIcon(it)}" alt="${esc(it.name)}"></button>`;
}
function wireItemSlots(root) {
  root.querySelectorAll('.isl[data-ref]').forEach((el) => {
    const ref = el.dataset.ref; if (!itemFromRef(ref) || el.classList.contains('pickable')) return;
    el.addEventListener('click', (ev) => openItemActions(ref, ev));
    el.addEventListener('contextmenu', (ev) => { ev.preventDefault(); const [k, v] = ref.split(':'); hideTip();
      if (k === 'b') { if (curVendor) sellItem(+v); else equipFromBag(+v); } else if (k === 'e') unequip(v); else if (k === 'v') buyItem(+v); });
  });
}

/* ---------------- windows ---------------- */
const WINS = ['winChar', 'winBags', 'winTal', 'winQuest', 'winSpell', 'winMap', 'winVendor', 'winNpc', 'winMenu', 'winSet'];
function openWin(id) {
  if (mode !== 'play') return;
  if (id === 'winTal' && P.lvl < 10) { toast('Talents unlock at level 10.'); }
  $(id).hidden = false; renderWin(id);
}
function closeWin(id) { $(id).hidden = true; hideTip(); if (id === 'winVendor') { curVendor = null; $('btnJunk').hidden = true; } if (id === 'winNpc') curQuestView = null; canvas.focus(); }
function toggleWin(id) { if ($(id).hidden) openWin(id); else closeWin(id); }
function closeAllWindows() { for (const id of WINS) if (!$(id).hidden) closeWin(id); iact.hidden = true; }
const anyModal = () => !$('winMenu').hidden || !$('winSet').hidden;
const anyOpen = () => WINS.some((id) => !$(id).hidden);
document.querySelectorAll('.win [data-close]').forEach((b) => b.addEventListener('click', () => closeWin(b.closest('.win').id)));
document.querySelectorAll('#micro [data-open]').forEach((b) => b.addEventListener('click', () => toggleWin(b.dataset.open)));
function renderWin(id) {
  if (id === 'winChar') renderChar(); else if (id === 'winBags') renderBags(); else if (id === 'winTal') renderTalents(); else if (id === 'winQuest') renderQuestLog();
  else if (id === 'winSpell') renderSpells(); else if (id === 'winMap') renderBigMap(); else if (id === 'winVendor') renderVendor(); else if (id === 'winSet') renderSettings();
}
function refreshPanels() {
  if (mode !== 'play') return;
  for (const id of ['winChar', 'winBags', 'winTal', 'winQuest', 'winVendor']) if (!$(id).hidden) renderWin(id);
  if (!$('winNpc').hidden && curNpc) { if (curQuestView) showQuest(curQuestView); }
  renderTracker(); $('mTal').classList.toggle('dot', P.lvl >= 10 && talentSpent() < talentPoints());
}

/* ---------------- character panel ---------------- */
const prev = { renderer: null, scene: null, cam: null, model: null, yaw: 0.3, dirty: true };
function initPreview() {
  const c = $('charCanvas');
  prev.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
  prev.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  prev.scene = new THREE.Scene();
  prev.scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7090, 0.9));
  const d = new THREE.DirectionalLight(0xffffff, 0.7); d.position.set(2, 4, 5); prev.scene.add(d);
  prev.cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  let drag = null;
  c.addEventListener('pointerdown', (e) => { drag = e.clientX; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', (e) => { if (drag != null) { prev.yaw += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  c.addEventListener('pointerup', () => (drag = null));
}
function renderPreview(dt) {
  if ($('winChar').hidden || !prev.renderer) return;
  const c = $('charCanvas'), w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  if (c.width !== Math.round(w * prev.renderer.getPixelRatio())) { prev.renderer.setSize(w, h, false); prev.cam.aspect = w / h; prev.cam.updateProjectionMatrix(); }
  if (prev.dirty) { if (prev.model) prev.scene.remove(prev.model.g); prev.model = buildHero(CH, CH.equip); prev.scene.add(prev.model.g); prev.dirty = false; }
  prev.model.g.rotation.y = prev.yaw; animBiped(prev.model, 0, false, -1);
  const ht = 2.5 * RACE_SHAPE[CH.race].h; prev.cam.position.set(0, ht * 0.55, 7.2); prev.cam.lookAt(0, ht * 0.5, 0);
  prev.renderer.render(prev.scene, prev.cam);
}
function renderChar() {
  prev.dirty = true;
  $('dollL').innerHTML = DOLL_L.map((s) => itemSlotHtml(CH.equip[s], 'e:' + s)).join('');
  $('dollR').innerHTML = DOLL_R.map((s) => itemSlotHtml(CH.equip[s], 'e:' + s)).join('');
  $('dollW').innerHTML = DOLL_W.map((s) => itemSlotHtml(CH.equip[s], 'e:' + s)).join('');
  $('dollName').innerHTML = `${esc(CH.name)}<small>Level ${P.lvl} ${RACES[CH.race].name} ${CLASSES[CH.cls].name}</small>`;
  const st = P.stats, prim = primaryOf(CH.cls, P.form);
  const rows = [['Health', P.maxHp], ['Attack power', Math.round(atk())], ['Stamina', st.sta], [prim === 'agi' ? 'Agility' : 'Intellect', st[prim]],
    ['Critical strike', P.critPct.toFixed(1) + '%'], ['Haste', P.haste.toFixed(1) + '%'], ['Armor', `${P.armor} (${Math.round(armorDR(P.lvl) * 100)}%)`], ['Move speed', Math.round(P.speedMul * 100) + '%'],
    ['Item level', Math.round(GEAR_SLOTS.reduce((a, s) => a + (CH.equip[s] ? CH.equip[s].ilvl : 0), 0) / GEAR_SLOTS.length * 10) / 10], ['Talent points', `${talentSpent()} / ${talentPoints()}`]];
  $('charStats').innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  wireItemSlots($('winChar'));
}

/* ---------------- bags & vendor ---------------- */
let curVendor = null;
function renderBags() {
  $('bagGrid').innerHTML = CH.inv.map((it, i) => itemSlotHtml(it, 'b:' + i)).join('');
  $('bagGold').textContent = P.gold + ' g'; $('bagPot').textContent = P.potions;
  $('btnJunk').hidden = !curVendor; wireItemSlots($('winBags'));
}
$('btnSort').onclick = () => sortBags();
$('btnJunk').onclick = () => { let g = 0, n = 0; CH.inv.forEach((it, i) => { if (it && it.slot === 'junk') { g += it.sell; n++; CH.inv[i] = null; } }); if (!n) return toast('You have no junk to sell.'); P.gold += g; toast(`Sold ${n} junk items for ${g} g.`); refreshPanels(); saveChar(); };
function openVendor(n) { curVendor = n; $('vTitle').textContent = n.def.name; $('winNpc').hidden = true; openWin('winVendor'); openWin('winBags'); }
function renderVendor() {
  if (!curVendor) return;
  const stock = vendorStock(curVendor.def), pp = potionPrice();
  let h = `<div class="vrow"><span class="isl r1" style="width:44px;height:44px;display:grid;place-items:center;font-weight:800;color:var(--hp)">HP</span><span class="nm">Healing Potion<br><small class="m" style="color:var(--muted)">Restores 45% health. You have ${P.potions}.</small></span><span class="pr">${pp} g</span><button class="btn sm" id="buyPot">Buy</button></div>`;
  stock.forEach((it, i) => { h += `<div class="vrow">${itemSlotHtml(it, 'v:' + i)}<span class="nm q${it.rarity}">${esc(it.name)}<br><small style="color:var(--muted)">${SLOT[it.slot].name} · Level ${it.req}</small></span><span class="pr">${it.price} g</span><button class="btn sm" data-buy="${i}">Buy</button></div>`; });
  h += `<p style="color:var(--muted);font-size:12.5px;margin:10px 0 0">Right-click items in your bags to sell them, or use Sell junk.</p>`;
  $('vList').innerHTML = h;
  $('buyPot').onclick = () => { if (P.gold < pp) return fail('You can\'t afford that.'); P.gold -= pp; P.potions++; refreshPanels(); renderBags(); };
  $('vList').querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => buyItem(+b.dataset.buy)));
  wireItemSlots($('winVendor'));
}
function buyItem(i) {
  const stock = vendorStock(curVendor.def), it = stock[i]; if (!it) return;
  if (P.gold < it.price) return fail('You can\'t afford that.'); if (CH.inv.indexOf(null) < 0) return fail('Your bags are full.');
  P.gold -= it.price; stock.splice(i, 1); addItem(it); toast(`Bought ${it.name}.`); refreshPanels(); saveChar();
}

/* ---------------- talents ---------------- */
function talentTipHtml(ti, i) {
  const tal = TALENTS[CH.cls][ti].list[i], r = CH.talents[ti + '-' + i] || 0;
  return `<div class="tt"><span class="nm">${esc(tal.n)}</span><div class="m">Rank ${r}/${tal.max}${tal.cap ? ' · Capstone' : ''}</div>
    ${r ? `<div class="desc">${esc(tal.d(r))}</div>` : ''}${r < tal.max ? `<div class="${r ? 'm' : 'desc'}">${r ? 'Next rank: ' : ''}${esc(tal.d(r + 1))}</div>` : ''}
    ${treeSpent(ti) < TAL_ROW_REQ[i] ? `<div class="r">Requires ${TAL_ROW_REQ[i]} points in ${TALENTS[CH.cls][ti].name}</div>` : ''}</div>`;
}
function renderTalents() {
  const trees = TALENTS[CH.cls], free = talentPoints() - talentSpent();
  $('trees').innerHTML = trees.map((t, ti) => `<div class="tree"><h4 style="color:${hex(t.color)}"><span>${t.name}</span><span>${treeSpent(ti)}</span></h4><p>${t.desc}</p><div class="trows">${
    t.list.map((tal, i) => { const r = CH.talents[ti + '-' + i] || 0, locked = treeSpent(ti) < TAL_ROW_REQ[i];
      return `<button class="tal ${locked ? 'locked' : ''} ${r === tal.max ? 'max' : ''} ${tal.cap ? 'cap' : ''}" data-tal="${ti}-${i}" data-tip="t:${ti}-${i}"><span class="ti" style="background:${hex(t.color)}">${tal.n.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span><span class="tn">${esc(tal.n)}</span><span class="tr">${r}/${tal.max}</span></button>`; }).join('')}</div></div>`).join('');
  $('talPts').innerHTML = P.lvl < 10 ? 'Talents unlock at level 10. You earn one point every level after that.' : `<b class="goldv">${free}</b> point${free === 1 ? '' : 's'} to spend`;
  $('trees').querySelectorAll('[data-tal]').forEach((b) => b.addEventListener('click', () => {
    const [ti, i] = b.dataset.tal.split('-').map(Number), tal = trees[ti].list[i], key = ti + '-' + i, r = CH.talents[key] || 0;
    if (talentPoints() - talentSpent() <= 0) return fail(P.lvl < 10 ? 'Talents unlock at level 10.' : 'You have no talent points left.');
    if (treeSpent(ti) < TAL_ROW_REQ[i]) return fail(`Spend ${TAL_ROW_REQ[i]} points in ${trees[ti].name} first.`);
    if (r >= tal.max) return;
    CH.talents[key] = r + 1; recalcStats(); renderTalents(); refreshPanels(); buildBar(); saveChar();
  }));
}
$('btnTalReset').onclick = () => { CH.talents = {}; recalcStats(); renderTalents(); refreshPanels(); toast('Talents reset.'); saveChar(); };

/* ---------------- quest log & tracker ---------------- */
let selQuest = null;
function objText(q, o, p) {
  if (o.t === 'kill') return `${(MOBS[o.m] || NAMED[o.m]).name} slain: ${Math.min(p, o.n)}/${o.n}`;
  if (o.t === 'loot') return `${o.item}: ${Math.min(p, o.n)}/${o.n}`;
  return `${GATHER[o.k].name}: ${Math.min(p, o.n)}/${o.n}`;
}
function renderQuestLog() {
  const act = Object.keys(CH.quests.active).map((id) => QUEST[id]);
  if (!act.includes(QUEST[selQuest])) selQuest = act[0] ? act[0].id : null;
  const byZone = {}; for (const q of act) { const z = ZONE[TOWN[NPC[q.giver].town].zone].name; (byZone[z] = byZone[z] || []).push(q); }
  $('qList').innerHTML = act.length ? Object.entries(byZone).map(([z, list]) => `<h5>${z}</h5>` + list.map((q) => `<button class="qli ${q.id === selQuest ? 'sel' : ''}" data-q="${q.id}"><span>${esc(q.title)}${qState(q) === 'ready' ? ' <span style="color:var(--q2)">(Done)</span>' : ''}</span><span class="lv" style="color:${diffColor(q.lvl)}">${q.lvl}</span></button>`).join('')).join('')
    : '<p style="color:var(--muted);font-size:13px;line-height:1.5">No quests yet. Look for NPCs with a gold <b style="color:var(--gold)">!</b> over their heads.</p>';
  $('qList').querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => { selQuest = b.dataset.q; renderQuestLog(); }));
  const q = QUEST[selQuest];
  if (!q) { $('qDet').innerHTML = ''; return; }
  const a = CH.quests.active[q.id], tn = NPC[q.turnin || q.giver];
  $('qDet').innerHTML = `<h4>${esc(q.title)}</h4><p>${esc(q.text)}</p><span class="lab">Objectives</span><ul class="qobj">${q.obj.length ? q.obj.map((o, i) => `<li class="${a.p[i] >= o.n ? 'ok' : ''}">${objText(q, o, a.p[i])}</li>`).join('') : `<li>Speak with ${esc(tn.name)} in ${TOWN[tn.town].name}.</li>`}</ul>
    <p style="font-size:13px;color:var(--muted)">Turn in to ${esc(tn.name)}, ${TOWN[tn.town].name}. Rewards: ${questXP(q)} xp, ${questGold(q)} g${q.reward === 'potions' ? ', 3 potions' : q.reward !== 'none' ? ', a choice of gear' : ''}.</p>
    <button class="btn sm ghost" id="btnAbandon">Abandon quest</button>`;
  $('btnAbandon').onclick = () => { abandonQuest(q.id); renderQuestLog(); };
}
function renderTracker() {
  const act = Object.keys(CH.quests.active).map((id) => QUEST[id]).slice(0, 5);
  $('tracker').innerHTML = act.map((q) => { const a = CH.quests.active[q.id], st = qState(q);
    return `<div class="trk"><b>${esc(q.title)}</b>${st === 'ready' ? `<div class="ok">Return to ${esc(NPC[q.turnin || q.giver].name)}</div>` : q.obj.map((o, i) => `<div class="${a.p[i] >= o.n ? 'ok' : ''}">${objText(q, o, a.p[i])}</div>`).join('')}</div>`; }).join('');
}

/* ---------------- spellbook ---------------- */
function renderSpells() {
  const list = classSkills(CH.cls); let h = '', lastForm = null;
  for (const sk of list) {
    if (CH.cls === 'druid' && sk.inForm && sk.inForm !== lastForm) { lastForm = sk.inForm; h += `<h4 style="margin:12px 0 2px;color:var(--gold);font-family:var(--display)">${SK['form' + lastForm[0].toUpperCase() + lastForm.slice(1)].name}</h4>`; }
    h += `<div class="spl ${P.lvl < sk.lvl ? 'locked' : ''}"><img class="ic" src="${skillIcon(sk)}" alt=""><div><b>${esc(sk.name)}</b><small>${P.lvl < sk.lvl ? 'Unlocks at level ' + sk.lvl : 'Level ' + sk.lvl}${skillCd(sk) >= 1.5 ? ' · ' + Math.round(skillCd(sk) * 10) / 10 + ' sec cooldown' : ''}</small><p>${esc(sk.desc)}</p></div></div>`;
  }
  $('spellList').innerHTML = `<p style="margin:0 0 6px;color:var(--muted);font-size:13px">${CH.cls === 'druid' ? 'Keys 1 to 3 change form. Keys 4 to 8 use the skills of your current form.' : 'Use skills with keys 1 to 8.'} Click or press F to use your basic attack.</p>` + h;
}

/* ---------------- action bar ---------------- */
function buildBar() {
  if (!CH) return;
  const bar = $('abar'); let h = '';
  if (!isTouch()) h += `<div class="slot" style="cursor:default" data-tip="txt:${encodeURIComponent('Basic attack. Click on the world or press F.')}"><span class="k">F</span><span class="ic" style="background:${hex(CLASSES[CH.cls].color)};display:grid;place-items:center;font-weight:800;font-size:12px">ATK</span></div>`;
  barSkills().forEach((sk, i) => { h += `<button class="slot" data-slot="${i}" data-tip="s:${sk.id}"><span class="k">${i + 1}</span><img class="ic" src="${skillIcon(sk)}" alt="${esc(sk.name)}"><span class="cdv"></span></button>`; });
  h += `<button class="slot" id="potSlot" data-tip="txt:${encodeURIComponent('Healing Potion: restore 45% of your health (Q).')}"><span class="k">Q</span><span class="ic" style="background:radial-gradient(circle at 40% 35%,#ffb0b8,#d8344a 60%,#5a0a1a);border-radius:50%"></span><span class="n" id="potN"></span><span class="cdv"></span></button>`;
  bar.innerHTML = h;
  bar.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); hideTip(); useSlot(+b.dataset.slot); }));
  $('potSlot').addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); drinkPotion(); });
}
function updateBar() {
  const list = barSkills();
  $('abar').querySelectorAll('[data-slot]').forEach((b) => {
    const sk = list[+b.dataset.slot]; if (!sk) return; const id = sk.cdId || sk.id, left = cds[id] || 0, locked = P.lvl < sk.lvl;
    b.classList.toggle('locked', locked); b.classList.toggle('active', !!sk.form && sk.form === P.form);
    b.style.setProperty('--cd', locked ? 0 : left > 0 ? (left / skillCd(sk)).toFixed(3) : 0);
    b.querySelector('.cdv').textContent = locked ? 'Lv ' + sk.lvl : left > 0.05 && skillCd(sk) > 1.5 ? Math.ceil(left) : '';
    if (sk.range) { const t = target && !target.dead ? dist(target) - target.T.radius : 0; b.classList.toggle('oor', !!target && t > sk.range); }
  });
  const ps = $('potSlot'); if (ps) { $('potN').textContent = P.potions; ps.style.setProperty('--cd', (cds.potion || 0) > 0 ? cds.potion / 3 : 0); }
}

/* ---------------- HUD ---------------- */
const BUFF_INFO = { stealth: ['Stealth', 0x5a4a6a], poison: ['Poison', 0x6fd04a], flurry: ['Flurry', 0xff6a6a], dance: ['Dance', 0x9a5aff], rapid: ['Rapid', 0xff9a3a], hot: ['Regen', 0x7ae08a], tranq: ['Tranq', 0xbfff9a], dash: ['Dash', 0xe0d05a], fury: ['Fury', 0xff9a3a] };
function updateHUD(skyTxt) {
  $('pName').textContent = CH.name; $('pLvl').textContent = P.lvl;
  $('pHp').style.width = (P.hp / P.maxHp * 100) + '%'; $('pHpTxt').textContent = `${Math.ceil(P.hp)} / ${P.maxHp}`; $('pSt').style.width = P.stam + '%';
  const xn = xpNext(P.lvl); $('xpFill').style.width = (P.lvl >= MAX_LVL ? 100 : P.xp / xn * 100) + '%'; $('xpTxt').textContent = P.lvl >= MAX_LVL ? 'Max level' : `XP ${P.xp} / ${xn}`;
  $('clock').textContent = skyTxt;
  const t = target && !target.dead ? target : null; $('tframe').hidden = !t;
  if (t) { $('tName').textContent = t.name; $('tLvl').textContent = t.boss ? 'Boss' : t.lvl; $('tLvl').style.color = diffColor(t.lvl); $('tframe').classList.toggle('elite', t.elite || t.boss);
    $('tHp').style.width = (t.hp / t.maxHp * 100) + '%'; $('tHpTxt').textContent = `${Math.max(0, Math.ceil(t.hp))} / ${t.maxHp}`; $('tPortrait').textContent = t.name[0]; $('tPortrait').style.background = hex(t.def.color || 0x8a6a6a); }
  const boss = enemies.find((e) => e.boss && !e.dead && e.state === 'chase' && dist(e) < 60);
  $('boss').hidden = !boss; if (boss) { $('bossName').textContent = boss.name; $('bossBar').style.width = (boss.hp / boss.maxHp * 100) + '%'; }
  $('buffs').innerHTML = Object.entries(P.buffs).map(([k, b]) => { const inf = BUFF_INFO[k] || [k, 0x888888]; return `<div class="buff" style="border-color:${hex(inf[1])}" data-tip="txt:${encodeURIComponent(inf[0])}">${inf[0].slice(0, 4)}<b>${Math.ceil(b.t)}</b></div>`; }).join('')
    + pets.map((p) => `<div class="buff" style="border-color:#ff9a5a">${p.kind.slice(0, 4)}<b>${p.perm ? '' : Math.ceil(p.t)}</b></div>`).join('');
  const near = !P.dead && !anyOpen() ? nearestInteract() : null, pe = $('prompt');
  if (near) { const k = isTouch() ? 'Tap Use' : 'Press E'; pe.textContent = near.kind === 'npc' ? `${k} to talk to ${near.n.def.name}` : `${k} to ${GATHER[near.nd.kind].verb.toLowerCase()} ${GATHER[near.nd.kind].name}`; pe.hidden = false; } else pe.hidden = true;
  updateBar();
}

/* ---------------- nameplates ---------------- */
const platesEl = $('plates'), plates = [];
let showPlates = store.get('ev-plates', true);
function plate(i) { if (!plates[i]) { const d = document.createElement('div'); d.className = 'plate'; platesEl.appendChild(d); plates[i] = { el: d, key: '' }; } return plates[i]; }
function updatePlates() {
  let n = 0;
  const put = (x, y, z, key, html, cls) => { _v3.set(x, y, z).project(camera); if (_v3.z > 1 || Math.abs(_v3.x) > 1.1 || Math.abs(_v3.y) > 1.1) return;
    const p = plate(n++); if (p.key !== key) { p.el.innerHTML = html; p.key = key; p.el.className = 'plate ' + cls; } p.el.style.display = '';
    p.el.style.left = ((_v3.x * 0.5 + 0.5) * innerWidth) + 'px'; p.el.style.top = ((-_v3.y * 0.5 + 0.5) * innerHeight) + 'px'; };
  for (const nn of npcs) {
    const d = Math.hypot(nn.x - P.x, nn.z - P.z); if (d > 40) continue; const mk = npcMarker(nn.def);
    const mkH = mk === 'ready' ? '<span class="mk">?</span>' : mk === 'avail' ? '<span class="mk">!</span>' : mk === 'active' ? '<span class="mk grey">?</span>' : '';
    if (d > 26 && !mk) continue;
    put(nn.x, nn.y + nn.model.height + 0.35, nn.z, 'n' + nn.def.id + mk + (d > 26), mkH + (d <= 26 ? `${esc(nn.def.name)}<small>&lt;${esc(nn.def.title)}&gt;</small>` : ''), 'npc');
  }
  if (showPlates) {
    const list = enemies.filter((e) => !e.dead && e.g.visible && (dist(e) < 32 || e === target)).sort((a, b) => dist(a) - dist(b)).slice(0, 14);
    for (const e of list) {
      const hpP = Math.round(e.hp / e.maxHp * 100), tg = e === target, showBar = tg || hpP < 100 || e.state === 'chase';
      put(e.x, e.y + e.h + 0.35, e.z, 'e' + e.lvl + e.name + hpP + tg + showBar,
        `<span style="color:${e.boss ? 'var(--gold)' : diffColor(e.lvl)}">${e.boss ? '' : e.lvl}${e.elite || e.boss ? '<span class="st">★</span>' : ''}</span> ${esc(e.name)}${showBar ? `<div class="pb"><i style="width:${hpP}%"></i></div>` : ''}`, tg ? 'tgt' : '');
    }
  }
  for (let i = n; i < plates.length; i++) if (plates[i].el.style.display !== 'none') { plates[i].el.style.display = 'none'; plates[i].key = ''; }
}

/* ---------------- maps ---------------- */
const mapBase = document.createElement('canvas'); mapBase.width = mapBase.height = 300;
{
  const x = mapBase.getContext('2d'), img = x.createImageData(300, 300), c = new THREE.Color();
  for (let py = 0; py < 300; py++) for (let px = 0; px < 300; px++) {
    const wx = -HALF + (px + 0.5) * 4, wz = -HALF + (py + 0.5) * 4, h = groundAt(wx, wz);
    if (h < 0) c.set(0x3a9ad8).lerp(tmpC.set(0x1a5a8a), clamp(-h / 8, 0, 1)); else { groundColor(wx, wz, h, c); c.multiplyScalar(clamp(1 + (h - groundAt(wx + 6, wz + 6)) * 0.05, 0.7, 1.25)); }
    const i = (py * 300 + px) * 4; img.data[i] = clamp(c.r * 255, 0, 255); img.data[i + 1] = clamp(c.g * 255, 0, 255); img.data[i + 2] = clamp(c.b * 255, 0, 255); img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}
function questPoints() {
  const pts = [];
  for (const id in CH.quests.active) {
    const q = QUEST[id], a = CH.quests.active[id];
    if (qState(q) === 'ready') { const n = npcs.find((n) => n.def.id === (q.turnin || q.giver)); pts.push({ x: n.x, z: n.z, ready: true }); continue; }
    q.obj.forEach((o, i) => {
      if (a.p[i] >= o.n) return; let best = null, bd = 1e9;
      if (o.t === 'gather') { for (const nd of nodes) if (nd.on && nd.kind === o.k) { const d = Math.hypot(nd.x - P.x, nd.z - P.z); if (d < bd) { bd = d; best = nd; } } }
      else for (const e of enemies) if (!e.dead && (o.t === 'kill' ? e.type === o.m : o.m.includes(e.base) && !e.named)) { const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; best = e; } }
      if (best) pts.push({ x: best.x, z: best.z });
    });
  }
  return pts;
}
function arrowAt(x, px, py, ang, s, fill) { x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = fill; x.strokeStyle = '#0b0d18'; x.lineWidth = 1.5 * s; x.beginPath(); x.moveTo(7 * s, 0); x.lineTo(-5 * s, 5 * s); x.lineTo(-2 * s, 0); x.lineTo(-5 * s, -5 * s); x.closePath(); x.fill(); x.stroke(); x.restore(); }
let mmQuest = [];
function drawMinimap() {
  const c = $('map'), r = c.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(devicePixelRatio, 2), W = Math.round(r.width * dpr); if (c.width !== W) { c.width = c.height = W; }
  const x = c.getContext('2d'), span = 220, s = W / 160;
  x.save(); x.clearRect(0, 0, W, W); x.beginPath(); x.arc(W / 2, W / 2, W / 2, 0, 7); x.clip();
  const sx = (P.x - span / 2 + HALF) / 4, sz = (P.z - span / 2 + HALF) / 4; x.imageSmoothingEnabled = true;
  x.drawImage(mapBase, sx, sz, span / 4, span / 4, 0, 0, W, W);
  const toM = (wx, wz) => [((wx - P.x) / span + 0.5) * W, ((wz - P.z) / span + 0.5) * W];
  for (const e of enemies) { if (e.dead || dist(e) > span * 0.7) continue; const [a, b] = toM(e.x, e.z); x.fillStyle = e.boss ? '#ff5a2a' : e.elite ? '#ffd479' : '#ff6a6a'; x.beginPath(); x.arc(a, b, (e.boss ? 4 : e.elite ? 3 : 1.8) * s, 0, 7); x.fill(); }
  for (const p of pets) { const [a, b] = toM(p.x, p.z); x.fillStyle = '#7fd8ff'; x.beginPath(); x.arc(a, b, 2 * s, 0, 7); x.fill(); }
  x.font = `800 ${13 * s}px Cinzel, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const n of npcs) { const mk = npcMarker(n.def); const [a, b] = toM(n.x, n.z); if (a < -10 || a > W + 10 || b < -10 || b > W + 10) continue;
    if (mk) { x.fillStyle = mk === 'active' ? '#aab' : '#ffd479'; x.strokeStyle = '#0b0d18'; x.lineWidth = 3; const ch = mk === 'avail' ? '!' : '?'; x.strokeText(ch, a, b); x.fillText(ch, a, b); }
    else { x.fillStyle = '#7dff7a'; x.beginPath(); x.arc(a, b, 1.6 * s, 0, 7); x.fill(); } }
  for (const q of mmQuest) { const [a, b] = toM(q.x, q.z); const R = W / 2, dx = a - R, dy = b - R, d = Math.hypot(dx, dy);
    if (d < R - 8 * s) { x.strokeStyle = '#ffd479'; x.lineWidth = 2 * s; x.beginPath(); x.arc(a, b, (4 + Math.sin(clock * 5)) * s, 0, 7); x.stroke(); }
    else arrowAt(x, R + (dx / d) * (R - 9 * s), R + (dy / d) * (R - 9 * s), Math.atan2(dy, dx), s * 0.9, '#ffd479'); }
  arrowAt(x, W / 2, W / 2, Math.atan2(Math.cos(P.face), Math.sin(P.face)), s, '#ffffff');
  x.restore();
}
function renderBigMap() {
  const c = $('bigmap'), x = c.getContext('2d'), W = c.width, k = W / SIZE, toM = (wx, wz) => [(wx + HALF) * k, (wz + HALF) * k];
  x.drawImage(mapBase, 0, 0, W, W);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const Z of ZONES) { const [a, b] = toM(Z.x, Z.z - Z.r * 0.55); x.font = '800 17px Cinzel, serif'; x.lineWidth = 4; x.strokeStyle = 'rgba(10,12,26,.8)'; x.strokeText(Z.name, a, b); x.fillStyle = '#fff'; x.fillText(Z.name, a, b);
    x.font = '700 12px system-ui'; x.strokeText(`Level ${Z.lv[0]}-${Z.lv[1]}`, a, b + 17); x.fillStyle = '#ffd479'; x.fillText(`Level ${Z.lv[0]}-${Z.lv[1]}`, a, b + 17); }
  for (const t of TOWNS) { const [a, b] = toM(t.x, t.z), known = CH.towns[t.id]; x.fillStyle = known ? '#ffd479' : '#8a8a9a'; x.strokeStyle = '#0b0d18'; x.lineWidth = 2; x.fillRect(a - 5, b - 5, 10, 10); x.strokeRect(a - 5, b - 5, 10, 10);
    x.font = '700 11px system-ui'; x.lineWidth = 3; x.strokeStyle = 'rgba(10,12,26,.85)'; x.strokeText(t.name, a, b + 15); x.fillStyle = known ? '#fff' : '#aab'; x.fillText(t.name, a, b + 15); }
  for (const id in NAMED) { const n = NAMED[id]; if (!n.boss) continue; const p = PLACES[n.place], [a, b] = toM(p.x, p.z); x.fillStyle = '#ff5a3a'; x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); x.strokeStyle = '#0b0d18'; x.lineWidth = 2; x.stroke(); }
  for (const n of npcs) { const mk = npcMarker(n.def); if (!mk || mk === 'active') continue; const [a, b] = toM(n.x, n.z); x.font = '800 16px Cinzel, serif'; x.lineWidth = 3; x.strokeStyle = '#0b0d18'; x.strokeText(mk === 'avail' ? '!' : '?', a + 8, b - 10); x.fillStyle = '#ffd479'; x.fillText(mk === 'avail' ? '!' : '?', a + 8, b - 10); }
  for (const q of questPoints()) { const [a, b] = toM(q.x, q.z); x.strokeStyle = '#ffd479'; x.lineWidth = 2; x.beginPath(); x.arc(a, b, 6, 0, 7); x.stroke(); }
  const [pa, pb] = toM(P.x, P.z); arrowAt(x, pa, pb, Math.atan2(Math.cos(P.face), Math.sin(P.face)), 1.6, '#ffffff');
}

/* ---------------- NPC dialogue ---------------- */
let curNpc = null, curQuestView = null, rewardPick = -1;
function openNpc(n) {
  curNpc = n; curQuestView = null; $('npcName').textContent = n.def.name; $('winNpc').hidden = false; $('winVendor').hidden = true; curVendor = null;
  const qs = QUESTS.filter((q) => (qState(q) === 'ready' && (q.turnin || q.giver) === n.def.id) || (qState(q) === 'avail' && q.giver === n.def.id) || (qState(q) === 'active' && (q.turnin || q.giver) === n.def.id));
  let h = `<p class="npct">${esc(n.def.greet.replace('{name}', CH.name))}</p><div class="opts">`;
  for (const q of qs) { const st = qState(q); h += `<button class="opt" data-q="${q.id}"><span class="mk ${st === 'active' ? 'grey' : ''}">${st === 'avail' ? '!' : '?'}</span>${esc(q.title)}<small style="color:${diffColor(q.lvl)}">Level ${q.lvl}</small></button>`; }
  if (n.def.vendor) h += `<button class="opt" id="optShop"><span class="mk">$</span>Browse goods</button>`;
  if (n.def.flight) h += `<button class="opt" id="optFly"><span class="mk">✈</span>Fly to another town</button>`;
  h += `<button class="opt" id="optBye"><span class="mk"> </span>Goodbye</button></div>`;
  const soon = QUESTS.filter((q) => q.giver === n.def.id && qState(q) === 'soon');
  if (soon.length && !qs.length) h += `<p style="color:var(--muted);font-size:13px;margin:10px 0 0">Come back when you're level ${Math.min(...soon.map((q) => q.lvl - 2))}. I may have work for you then.</p>`;
  $('npcBody').innerHTML = h;
  $('npcBody').querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => showQuest(b.dataset.q)));
  if ($('optShop')) $('optShop').onclick = () => openVendor(n);
  if ($('optFly')) $('optFly').onclick = () => showFlights(n);
  $('optBye').onclick = () => closeWin('winNpc');
  const first = $('npcBody').querySelector('button'); if (first && !isTouch()) first.focus();
}
function showQuest(id) {
  const q = QUEST[id], st = qState(q); curQuestView = id; if (rewardPick < 0 || rewardPick > 2) rewardPick = -1;
  const items = st === 'ready' || st === 'avail' ? questRewards(q) : [];
  const a = CH.quests.active[id];
  let h = `<h4 style="margin:0 0 8px;font-family:var(--display);color:var(--gold);font-size:18px">${esc(q.title)}</h4>`;
  h += `<p class="npct">${esc((st === 'ready' ? q.done || 'Well done.' : q.text).replace('{name}', CH.name))}</p>`;
  if (st !== 'ready') h += `<span class="lab">Objectives</span><ul class="qobj">${q.obj.length ? q.obj.map((o, i) => `<li class="${a && a.p[i] >= o.n ? 'ok' : ''}">${objText(q, o, a ? a.p[i] : 0)}</li>`).join('') : `<li>Speak with ${esc(NPC[q.turnin].name)} in ${TOWN[NPC[q.turnin].town].name}.</li>`}</ul>`;
  h += `<span class="lab">Rewards</span><div class="rew"><span class="goldv">${questXP(q)} xp · ${questGold(q)} g${q.reward === 'potions' ? ' · 3 potions' : ''}</span></div>`;
  if (items.length) h += `<div style="font-size:13px;color:var(--muted)">${st === 'ready' ? 'Choose one:' : 'You will be able to choose one of:'}</div><div class="rew">${items.map((it, i) => itemSlotHtml(it, 'r:' + i, (st === 'ready' ? 'pickable ' : '') + (rewardPick === i ? 'chosen' : ''))).join('')}</div>`;
  h += '<div class="btnrow">';
  if (st === 'avail') h += '<button class="btn" id="qAccept">Accept</button>';
  if (st === 'ready') h += `<button class="btn" id="qDone" ${items.length && rewardPick < 0 ? 'disabled' : ''}>Complete quest</button>`;
  h += '<button class="btn ghost" id="qBack">Back</button></div>';
  $('npcBody').innerHTML = h;
  $('npcBody').querySelectorAll('.isl.pickable').forEach((el) => el.addEventListener('click', () => { rewardPick = +el.dataset.ref.split(':')[1]; showQuest(id); }));
  if ($('qAccept')) $('qAccept').onclick = () => { acceptQuest(id); rewardPick = -1; openNpc(curNpc); };
  if ($('qDone')) $('qDone').onclick = () => { turnIn(id, rewardPick); rewardPick = -1; openNpc(curNpc); };
  $('qBack').onclick = () => { rewardPick = -1; openNpc(curNpc); };
}
function showFlights(n) {
  const here = n.def.town, list = TOWNS.filter((t) => t.id !== here);
  $('npcBody').innerHTML = `<p class="npct">Where to? I can only fly to places you have already visited.</p><div class="opts">${list.map((t) => CH.towns[t.id]
    ? `<button class="opt" data-fly="${t.id}"><span class="mk">✈</span>${t.name}<small>${flightCost(t.id)} g</small></button>`
    : `<div class="opt" style="opacity:.45;cursor:default"><span class="mk"> </span>${t.name}<small>Not discovered</small></div>`).join('')}<button class="opt" id="flyBack"><span class="mk"> </span>Back</button></div>`;
  $('npcBody').querySelectorAll('[data-fly]').forEach((b) => (b.onclick = () => flyTo(b.dataset.fly)));
  $('flyBack').onclick = () => openNpc(n);
}

/* ---------------- menu & settings ---------------- */
$('mResume').onclick = () => closeWin('winMenu');
$('mSettings').onclick = () => { closeWin('winMenu'); openWin('winSet'); };
$('mSelect').onclick = () => { saveChar(); closeAllWindows(); toSelect(); };
$('mExit').onclick = () => { saveChar(); if (IS_APP) window.close(); else { closeAllWindows(); toSelect(); toast('Progress saved.'); } };
if (!IS_APP) $('mExit').textContent = 'Save and exit';
let SENS = store.get('ev-sens', 1);
function renderSettings() {
  document.querySelectorAll('#setGfx button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === GFX)));
  document.querySelectorAll('#setPlates button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.v === 'on') === showPlates)));
  $('setSens').value = SENS;
}
$('setGfx').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; GFX = b.dataset.v; store.set('ev-gfx', GFX); applyGfx(); renderSettings(); });
$('setPlates').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; showPlates = b.dataset.v === 'on'; store.set('ev-plates', showPlates); renderSettings(); });
$('setSens').addEventListener('input', (e) => { SENS = +e.target.value; store.set('ev-sens', SENS); });
function applyGfx() {
  renderer.setPixelRatio(GFX === 'high' ? Math.min(devicePixelRatio, 2) : 1); renderer.setSize(innerWidth, innerHeight);
  const sh = GFX !== 'low'; if (renderer.shadowMap.enabled !== sh) { renderer.shadowMap.enabled = sh; sun.castShadow = sh; scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => (m.needsUpdate = true)); } }); }
  cullChunks(P.x, P.z);
}
