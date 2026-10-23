/* Character select and character creator. */

let selId = null, previewYaw = 0;
const PREVIEW_SPOT = { x: -2, z: 9 };
function setMode(m) { mode = m; document.body.dataset.mode = m; onResize(); }
function portraitHtml(c) { return `<span class="portrait" style="background:${hex(CLASSES[c.cls].color)}">${esc(c.name[0] || '?')}</span>`; }
function previewChar(c) {
  CH = c; P.form = 'caster'; P.x = PREVIEW_SPOT.x; P.z = PREVIEW_SPOT.z; P.y = groundAt(P.x, P.z); P.face = 0; P.buffs = {};
  rebuildHero(); hero.g.rotation.y = 0;
}
function toSelect() {
  saveChar(); setMode('select'); dismissPets(); target = null;
  $('select').hidden = false; $('creator').hidden = true; $('dead').hidden = true; $('delBox').innerHTML = '';
  if (!STORE.chars.length) { openCreator(); return; }
  if (!STORE.chars.find((c) => c.id === selId)) selId = STORE.last && STORE.chars.find((c) => c.id === STORE.last) ? STORE.last : STORE.chars[0].id;
  renderSelect();
}
function renderSelect() {
  $('cList').innerHTML = STORE.chars.map((c) => `<button class="ccard" data-id="${c.id}" aria-pressed="${c.id === selId}">${portraitHtml(c)}<span><b>${esc(c.name)}</b><small>Level ${c.lvl} ${RACES[c.race].name} ${CLASSES[c.cls].name}<br>${ZONE[c.zone || 'vale'].name}</small></span></button>`).join('')
    || '<div class="cempty">No characters yet.</div>';
  $('cList').querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => { selId = b.dataset.id; $('delBox').innerHTML = ''; renderSelect(); }));
  $('btnDelete').disabled = !selId; $('btnEnter').disabled = !selId;
  $('btnCreate').disabled = STORE.chars.length >= 8; $('btnCreate').textContent = STORE.chars.length >= 8 ? 'Character slots full (8)' : 'Create new character';
  const c = STORE.chars.find((c) => c.id === selId); if (c) previewChar(c);
}
$('btnEnter').onclick = () => { const c = STORE.chars.find((c) => c.id === selId); if (c) enterWorld(c); };
$('btnCreate').onclick = () => openCreator();
$('btnDelete').onclick = () => {
  const c = STORE.chars.find((c) => c.id === selId); if (!c) return;
  $('delBox').innerHTML = `<div class="confirm">Delete <b>${esc(c.name)}</b>, level ${c.lvl}? This can't be undone.<div class="btnrow" style="margin:0"><button class="btn danger sm" id="delYes">Delete</button><button class="btn ghost sm" id="delNo">Keep</button></div></div>`;
  $('delYes').onclick = () => { STORE.chars = STORE.chars.filter((x) => x.id !== c.id); store.set(SAVE_KEY, STORE); selId = null; $('delBox').innerHTML = ''; toSelect(); };
  $('delNo').onclick = () => { $('delBox').innerHTML = ''; };
};

function enterWorld(c) {
  CH = c; STORE.last = c.id;
  if (!CH.quests) CH.quests = { active: {}, done: {} };
  if (!CH.talents) CH.talents = {}; if (!CH.towns) CH.towns = { emberfall: true }; if (!CH.inv) CH.inv = new Array(32).fill(null); if (!CH.equip) CH.equip = starterGear(CH.cls);
  Object.assign(P, { lvl: c.lvl, xp: c.xp, gold: c.gold, potions: c.potions, form: CH.cls === 'druid' ? c.form || 'caster' : 'caster', dead: false, buffs: {}, attackT: -1, dash: null, vy: 0, invuln: 0, stam: 100 });
  P.x = c.x ?? 0; P.z = c.z ?? 12; if (Math.hypot(P.x, P.z) > 560 || groundAt(P.x, P.z) < -2) { P.x = 0; P.z = 12; }
  P.y = groundAt(P.x, P.z); P.face = Math.PI; dayT = c.dayT ?? 0.1;
  for (const k in cds) delete cds[k];
  recalcStats(false); P.hp = P.maxHp; rebuildHero(); dismissPets(); target = null;
  $('select').hidden = true; $('creator').hidden = true; setMode('play');
  camYaw = 0; camPitch = 0.36; camLook.set(P.x, P.y + 1.7, P.z); lastZone = null;
  buildBar(); renderTracker(); canvas.focus(); cullChunks(P.x, P.z);
  $('pPortrait').textContent = CH.name[0]; $('pPortrait').style.background = hex(CLASSES[CH.cls].color);
  if (!Object.keys(CH.quests.done).length && !Object.keys(CH.quests.active).length) setTimeout(() => toast(`Welcome, ${CH.name}! Elder Maren, by the fire, has a gold ! over her head. ${isTouch() ? 'Walk up and tap Use.' : 'Walk up and press E.'}`), 900);
  saveChar();
}

/* ---------------- creator ---------------- */
let draft = null, suggested = '';
function openCreator() {
  setMode('create'); $('select').hidden = true; $('creator').hidden = false; $('nameErr').hidden = true;
  draft = { name: '', race: 'elf', sex: 'female', cls: 'rogue', skin: 0, hair: 4, style: 2, eye: 1 };
  suggested = pick(RACES.elf.names); $('charName').value = ''; previewYaw = 0; renderCreator();
}
function renderCreator() {
  const opt = (wrap, items, cur, onPick) => { wrap.innerHTML = ''; for (const [k, v] of items) { const b = document.createElement('button'); b.className = 'copt'; b.setAttribute('aria-pressed', k === cur); b.innerHTML = `<b>${v.name}</b><small>${v.blurb}</small>`; b.onclick = () => onPick(k); wrap.appendChild(b); } };
  opt($('raceOpts'), Object.entries(RACES), draft.race, (k) => { draft.race = k; draft.skin = 0; if (!$('charName').value) suggested = pick(RACES[k].names); renderCreator(); });
  opt($('classOpts'), Object.entries(CLASSES), draft.cls, (k) => { draft.cls = k; renderCreator(); });
  const seg = (wrap, items, cur, onPick) => { wrap.innerHTML = ''; items.forEach(([k, label]) => { const b = document.createElement('button'); b.textContent = label; b.setAttribute('aria-pressed', k === cur); b.onclick = () => onPick(k); wrap.appendChild(b); }); };
  seg($('sexOpts'), [['female', 'Female'], ['male', 'Male']], draft.sex, (k) => { draft.sex = k; renderCreator(); });
  const fish = draft.race === 'fishfolk'; $('hairLab').textContent = fish ? 'Fins' : 'Hair';
  seg($('styleOpts'), (fish ? ['Crest', 'Frills', 'Spines'] : ['Spiky', 'Long', draft.sex === 'female' ? 'Twin tails' : 'Ponytail']).map((l, i) => [i, l]), draft.style, (k) => { draft.style = k; renderCreator(); });
  const sw = (wrap, cols, cur, onPick, label) => { wrap.innerHTML = ''; cols.forEach((c, i) => { const b = document.createElement('button'); b.className = 'sw'; b.style.background = hex(c); b.setAttribute('aria-pressed', i === cur); b.setAttribute('aria-label', `${label} ${i + 1}`); b.onclick = () => onPick(i); wrap.appendChild(b); }); };
  sw($('skinOpts'), RACES[draft.race].skins, draft.skin, (i) => { draft.skin = i; renderCreator(); }, 'Skin');
  sw($('eyeOpts'), EYES, draft.eye, (i) => { draft.eye = i; renderCreator(); }, 'Eyes');
  sw($('hairOpts'), HAIRS, draft.hair, (i) => { draft.hair = i; renderCreator(); }, 'Color');
  $('charName').placeholder = suggested;
  const list = classSkills(draft.cls).filter((s) => s.lvl <= 6 && (!s.inForm || s.lvl <= 2)).slice(0, 6);
  $('charInfo').innerHTML = `<div class="trait">${RACES[draft.race].trait}</div><div><b>${CLASSES[draft.cls].name}.</b> ${CLASSES[draft.cls].blurb} Wears ${CLASSES[draft.cls].armor}. Learns 8 skills by level 18 and talents from level 10.</div><ul>${list.map((a) => `<li><b>${a.name}.</b> ${a.desc}</li>`).join('')}</ul>`;
  const c = Object.assign({}, draft, { name: draft.name || suggested, equip: starterGear(draft.cls) });
  CH = c; P.form = 'caster'; P.x = PREVIEW_SPOT.x; P.z = PREVIEW_SPOT.z; P.y = groundAt(P.x, P.z); P.buffs = {}; rebuildHero();
}
$('btnBack').onclick = () => { if (STORE.chars.length) toSelect(); };
$('btnMake').onclick = () => {
  const name = ($('charName').value.trim() || suggested).replace(/\s+/g, ' ');
  const err = (m) => { $('nameErr').textContent = m; $('nameErr').hidden = false; };
  if (!/^[\p{L}][\p{L}' -]{1,15}$/u.test(name)) return err('Names need 2 to 16 letters.');
  if (STORE.chars.some((c) => c.name.toLowerCase() === name.toLowerCase())) return err('You already have a character with that name.');
  if (STORE.chars.length >= 8) return err('All 8 character slots are full. Delete one first.');
  const c = newChar(Object.assign({}, draft, { name }));
  STORE.chars.push(c); store.set(SAVE_KEY, STORE); selId = c.id; enterWorld(c);
};
