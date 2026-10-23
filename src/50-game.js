/* Game state and systems: stats, combat, monsters, pets, loot, quests, saving. */

const UP = new THREE.Vector3(0, 1, 0);
const SAVE_KEY = 'emberfall-vale-v2';
let CH = null;      // the character being played (saved record)
let mode = 'select';
let clock = 0, shake = 0, dayT = 0.1;
let hero = null, cat = null, bear = null;
let target = null;
const enemies = [], npcs = [], pets = [], projs = [], fxs = [], teles = [], timers = [];
const cds = {};
const P = { x: 0, z: 10, y: 4, vy: 0, face: Math.PI, hp: 100, maxHp: 100, stam: 100, lvl: 1, xp: 0, gold: 0, potions: 3, form: 'caster',
  attackT: -1, attackSpec: null, hitDone: true, dead: false, invuln: 0, lastHurt: -99, lastCombat: -99, walk: 0, onGround: true, dash: null, buffs: {}, swing: 0,
  power: 10, critPct: 5, haste: 0, armor: 0, speedMul: 1, stats: {} };
function after(t, fn) { timers.push({ t, fn }); }

/* ---------------- saving ---------------- */
function loadStore() {
  let s = store.get(SAVE_KEY, null);
  if (!s || !Array.isArray(s.chars)) s = { v: 2, chars: [], last: null };
  // Bring a character over from the previous version of the game.
  const old = store.get('emberfall-vale-v1', null);
  if (old && old.char && !s.migrated) {
    const c = newChar(Object.assign({}, old.char, { eye: 1, hair: Math.min(old.char.hair || 1, HAIRS.length - 1) }));
    c.lvl = clamp(old.lvl || 1, 1, MAX_LVL); c.gold = old.gold || 0; c.potions = old.potions || 3;
    s.chars.push(c); s.migrated = true; store.set(SAVE_KEY, s);
  }
  return s;
}
let STORE = null;
function newChar(o) {
  return { id: uid(), name: o.name, race: o.race, sex: o.sex, cls: o.cls, skin: o.skin || 0, hair: o.hair ?? 1, style: o.style || 0, eye: o.eye || 0,
    lvl: 1, xp: 0, gold: 0, potions: 3, x: 0, z: 12, form: 'caster', quests: { active: {}, done: {} }, inv: new Array(32).fill(null), equip: starterGear(o.cls),
    talents: {}, towns: { emberfall: true }, created: Date.now(), played: 0, dayT: 0.1 };
}
function saveChar() {
  if (!CH || mode !== 'play') return;
  Object.assign(CH, { lvl: P.lvl, xp: P.xp, gold: P.gold, potions: P.potions, x: P.x, z: P.z, form: P.form, dayT, zone: zoneAt(P.x, P.z).id });
  STORE.last = CH.id; store.set(SAVE_KEY, STORE);
}

/* ---------------- stats ---------------- */
function recalcStats(keepRatio = true) {
  rebuildMods();
  const R = RACES[CH.race], C = CLASSES[CH.cls], g = { sta: 0, agi: 0, int: 0, crit: 0, haste: 0, armor: 0 }; let wd = 0;
  for (const s of GEAR_SLOTS) { const it = CH.equip[s]; if (!it) continue; for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k]; wd += it.dmg || 0; }
  const base = 8 + P.lvl * 3, prim = primaryOf(CH.cls, P.form);
  const st = { sta: base + g.sta, agi: (CH.cls === 'warlock' ? 5 : base) + g.agi, int: (CH.cls === 'rogue' || CH.cls === 'archer' ? 5 : base) + g.int, critR: g.crit, hasteR: g.haste, armorG: g.armor, wd };
  P.stats = st;
  const ratio = P.maxHp > 0 ? P.hp / P.maxHp : 1;
  const bearForm = CH.cls === 'druid' && P.form === 'bear';
  P.maxHp = Math.round((60 + st.sta * 10) * (R.hp || 1) * C.hp * (1 + M.hp) * (bearForm ? (M.flags.ursoc ? 1.45 : 1.25) : 1));
  P.hp = keepRatio ? Math.max(1, Math.round(P.maxHp * ratio)) : P.maxHp;
  P.power = 6 + st[prim] * 1.2 + wd;
  P.critPct = 5 + st.critR / 8 + (R.crit || 0) * 100 + M.crit + (CH.cls === 'druid' && P.form === 'cat' ? 12 : 0);
  P.haste = st.hasteR / 8 + (R.haste || 0) + M.haste;
  P.armor = Math.round((st.armorG + P.lvl * 6 + (C.armor === 'mail' ? 20 : C.armor === 'leather' ? 10 : 0)) * (1 + M.armor) * (bearForm ? 2.5 : 1));
  P.speedMul = (R.speed || 1) * (1 + M.speed);
}
function atk() {
  let a = P.power * (1 + M.dmg);
  if (CH.cls === 'druid') a *= 1 + (M.form[P.form] || 0);
  if (P.buffs.fury) a *= 1.3;
  return a;
}
const hasteMul = () => 1 + (P.haste + (P.buffs.flurry ? 40 : 0) + (P.buffs.rapid ? 60 : 0)) / 100;
const armorDR = (lvl) => P.armor / (P.armor + 250 + lvl * 45);

/* ---------------- effects ---------------- */
const ringGeo = new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2);
function spawnRing(x, z, color, radius, dur = 0.45) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  m.position.set(x, groundAt(x, z) + 0.2, z); scene.add(m); fxs.push({ m, t: 0, dur, kind: 'ring', r: radius });
}
const beamGeo = new THREE.BoxGeometry(0.16, 0.16, 1);
function spawnBeam(a, b, color, dur = 0.4) {
  const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.scale.z = a.distanceTo(b); scene.add(m); fxs.push({ m, t: 0, dur, kind: 'beam' });
}
function updateFx(dt) {
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]; f.t += dt; const k = f.t / f.dur;
    if (f.kind === 'ring') { const s = 0.2 * f.r + k * 0.8 * f.r; f.m.scale.set(s, 1, s); } else { f.m.scale.x = f.m.scale.y = 1 - k * 0.7; }
    f.m.material.opacity = Math.max(0, 0.9 * (1 - k)); if (k >= 1) { scene.remove(f.m); f.m.material.dispose(); fxs.splice(i, 1); }
  }
}
// Telegraphed boss attacks: a red circle fills up, then hits whoever is still inside.
const teleGeo = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
function telegraph(x, z, r, delay, dmg, color = 0xff3a3a) {
  const y = groundAt(x, z) + 0.15;
  const edge = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); edge.scale.set(r, 1, r); edge.position.set(x, y + 0.02, z);
  const fill = new THREE.Mesh(teleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide })); fill.position.set(x, y, z); fill.scale.set(0.01, 1, 0.01);
  scene.add(edge, fill); teles.push({ x, z, r, t: 0, dur: delay, dmg, edge, fill, color });
}
function updateTeles(dt) {
  for (let i = teles.length - 1; i >= 0; i--) {
    const t = teles[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fill.scale.set(t.r * k, 1, t.r * k);
    if (t.t >= t.dur) { if (!P.dead && Math.hypot(P.x - t.x, P.z - t.z) < t.r) hurtPlayer(t.dmg, 30); spawnRing(t.x, t.z, t.color, t.r, 0.4); shake = Math.max(shake, 0.3);
      scene.remove(t.edge, t.fill); teles.splice(i, 1); }
  }
}

/* ---------------- projectiles ---------------- */
const arrowGeo = new THREE.BoxGeometry(0.05, 0.05, 0.9), tipGeo = new THREE.BoxGeometry(0.1, 0.1, 0.16), orbGeo = new THREE.SphereGeometry(1, 10, 8);
function fire(o) {
  const mesh_ = new THREE.Group();
  if (o.kind === 'arrow') { mesh_.add(new THREE.Mesh(arrowGeo, basic(o.color || 0xc9a86a))); const t = new THREE.Mesh(tipGeo, basic(0xb8bcc0)); t.position.z = 0.5; mesh_.add(t);
    if (o.glow) { const gl = new THREE.Mesh(orbGeo, glow(o.glow, 0.35)); gl.scale.set(0.25, 0.25, 0.7); mesh_.add(gl); } if (o.big) mesh_.scale.setScalar(1.6); }
  else { const c = new THREE.Mesh(orbGeo, basic(o.color)); c.scale.setScalar(o.size || 0.2); const gl = new THREE.Mesh(orbGeo, glow(o.color, 0.3)); gl.scale.setScalar((o.size || 0.2) * 2.4); mesh_.add(c, gl); }
  mesh_.position.copy(o.pos); scene.add(mesh_);
  projs.push({ mesh: mesh_, pos: o.pos.clone(), vel: o.dir.clone().multiplyScalar(o.speed), dmg: o.dmg || 0, life: o.life || 1.6, pierce: !!o.pierce, hit: new Set(), gravity: o.gravity || 0, noHit: !!o.noHit, onHit: o.onHit, kind: o.kind, hostile: !!o.hostile, pet: !!o.pet, lvl: o.lvl || 1 });
}
const tmpV = new THREE.Vector3();
function updateProjectiles(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i]; p.vel.y -= p.gravity * dt; p.pos.addScaledVector(p.vel, dt); p.life -= dt; p.mesh.position.copy(p.pos);
    if (p.kind === 'arrow') p.mesh.lookAt(tmpV.copy(p.pos).add(p.vel));
    let dead = p.life <= 0 || p.pos.y < groundAt(p.pos.x, p.pos.z) - 0.2;
    if (!dead && p.hostile) { if (!P.dead && Math.hypot(P.x - p.pos.x, P.z - p.pos.z) < 0.9 && p.pos.y > P.y - 0.3 && p.pos.y < P.y + 2.8) { hurtPlayer(p.dmg, p.lvl); dead = true; } }
    else if (!dead && !p.noHit) {
      for (const e of enemies) {
        if (e.dead || p.hit.has(e) || !e.g.visible) continue;
        const dx = e.x - p.pos.x, dz = e.z - p.pos.z; if (dx * dx + dz * dz > (e.T.radius + 0.45) ** 2) continue;
        if (p.pos.y < e.y - 0.4 || p.pos.y > e.y + e.h + 0.5) continue;
        p.hit.add(e); if (p.dmg > 0) dealDamage(e, p.dmg, { kb: p.kind === 'arrow' ? 3 : 2, pet: p.pet }); if (p.onHit) p.onHit(e);
        if (!p.pierce) { dead = true; break; }
      }
    }
    if (dead) { scene.remove(p.mesh); projs.splice(i, 1); }
  }
}

/* ---------------- floating text ---------------- */
const floatsEl = $('floats'), _v3 = new THREE.Vector3();
function floatText(txt, x, y, z, cls) {
  _v3.set(x, y, z).project(camera); if (_v3.z > 1 || Math.abs(_v3.x) > 1.2 || Math.abs(_v3.y) > 1.2) return;
  const d = document.createElement('div'); d.className = 'ft ' + cls; d.textContent = txt;
  d.style.left = ((_v3.x * 0.5 + 0.5) * innerWidth + rand(-14, 14)) + 'px'; d.style.top = ((-_v3.y * 0.5 + 0.5) * innerHeight) + 'px';
  floatsEl.appendChild(d); setTimeout(() => d.remove(), 1000);
}
function toast(msg, cls) {
  const log = $('log'), d = document.createElement('div'); d.className = 'toast'; if (cls) d.innerHTML = msg; else d.textContent = msg; log.appendChild(d);
  while (log.children.length > 5) log.firstChild.remove();
  setTimeout(() => { d.classList.add('fade'); setTimeout(() => d.remove(), 500); }, 3400);
}
let bannerTO; function bannerMsg(t) { const b = $('banner'); b.textContent = t; b.classList.add('show'); clearTimeout(bannerTO); bannerTO = setTimeout(() => b.classList.remove('show'), 1900); }
function fail(msg) { toast(msg); return false; }

/* ---------------- monsters ---------------- */
const RADIUS = { slime: 0.9, quad: 1.1, spider: 1.3, biped: 0.6, treant: 1.3, wisp: 0.7, wraith: 0.8, crab: 1.2, lurker: 0.9, toad: 1.2, yeti: 1.5, imp: 0.6, golem: 2.2 };
function mobStats(def, lvl, elite, boss) {
  const hp = Math.round((30 + lvl * 24 + lvl * lvl * 0.6) * (def.hp || 1) * (elite ? 3 : 1) * (boss ? 9 : 1));
  const dmg = (5 + lvl * 3.2) * (def.dmg || 1) * (elite ? 1.5 : 1) * (boss ? 1.7 : 1);
  return { hp, dmg };
}
function spawnEnemy(type, x, z, o = {}) {
  const named = o.named ? NAMED[o.named] : null;
  const def = Object.assign({}, MOBS[named ? named.base : type], named || {});
  if (named) def.scale = MOBS[named.base].scale || 1;
  if (def.hero && !named) def.hero = Object.assign({}, def.hero, { sex: Math.random() < 0.4 ? 'female' : 'male', style: def.hero.style === -1 ? -1 : randi(0, 2), hairColor: def.hero.style === -1 ? undefined : pick([0x4a2a1a, 0x2b2f4a, 0x7a4a2a, 0xe0483a]) });
  const elite = !!(o.elite || (named && named.elite)), boss = !!(named && named.boss);
  const lvl = named ? named.lvl : o.lvl || randi(def.lv[0], def.lv[1]);
  const scale = named ? named.scale : elite ? 1.35 : 1;
  const mk = buildMobModel(def, scale, elite || boss);
  const st = mobStats(def, lvl, elite, boss), sc = scale * (def.scale || 1);
  const T = { dmg: st.dmg, speed: def.speed || 4.5, aggro: (def.aggro || 14) + (boss ? 6 : 0), range: (def.range || 2.2) * (def.ranged ? 1 : Math.max(1, sc * 0.85)), ranged: !!def.ranged, proj: def.proj,
    cd: def.cd || (boss ? 2 : 1.4), windup: def.windup || (boss ? 0.7 : def.ranged ? 0.5 : 0.35), radius: (RADIUS[def.model] || 1) * sc, leash: boss ? 40 : 46 };
  const e = { type: named ? o.named : type, base: named ? named.base : type, named: o.named || null, def, name: def.name, lvl, elite, boss, T, maxHp: st.hp, hp: st.hp, x, z, y: groundAt(x, z),
    home: { x, z }, state: 'idle', cd: 0, windup: 0, face: rand(0, 6.28), wanderT: rand(0, 4), wx: null, wz: null, anim: rand(0, 6), atkAnim: -1, kbx: 0, kbz: 0, flashT: 0,
    dead: false, deathT: 0, respawnT: 0, dots: [], stunT: 0, fearT: 0, weakT: 0, specialT: 6, slam: false, sc, mk, g: mk.g, parts: mk.parts, flash: mk.flash, h: mk.h * sc, cy: mk.h * sc * 0.45, respawn: named ? named.respawn : 35 };
  mk.g.position.set(x, e.y, z); scene.add(mk.g); enemies.push(e); return e;
}
function spawnAll() {
  for (const [type, where, n, rad] of SPAWNS) {
    for (let i = 0; i < n; i++) {
      let x = 0, z = 0;
      for (let k = 0; k < 80; k++) {
        if (PLACES[where]) { const p = PLACES[where], a = rand(0, 6.283), r = rand(p.name ? 8 : 0, rad || p.r); x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r; }
        else { const Z = ZONE[where], a = rand(0, 6.283), r = rand(30, Z.r); x = Z.x + Math.cos(a) * r; z = Z.z + Math.sin(a) * r; }
        if (groundAt(x, z) > 0.4 && !nearTown(x, z, 55) && roadDist(x, z) > 6 && Math.hypot(x, z) < 520) break;
      }
      spawnEnemy(type, x, z, { elite: Math.random() < 0.07 });
    }
  }
  for (const id in NAMED) { const n = NAMED[id], p = PLACES[n.place]; spawnEnemy(n.base, p.x + 2, p.z + 2, { named: id }); }
}
function respawnEnemy(e) {
  e.dead = false; e.hp = e.maxHp; e.x = e.home.x; e.z = e.home.z; e.state = 'idle'; e.g.visible = true; e.g.scale.setScalar(e.sc); e.windup = 0; e.slam = false; e.dots = []; e.stunT = 0; e.fearT = 0; e.weakT = 0;
}
function aggro(e) {
  if (e.dead) return; const was = e.state; e.state = 'chase'; P.lastCombat = clock;
  if (!target || target.dead) setTarget(e);
  if (was !== 'chase') for (const o of enemies) if (o !== e && !o.dead && o.state === 'idle' && o.base === e.base && Math.hypot(o.x - e.x, o.z - e.z) < 7) { o.state = 'chase'; }
}
function stun(e, t) { if (e.dead) return; t = e.boss ? t * 0.4 : t; e.stunT = Math.max(e.stunT, t); e.windup = 0; aggro(e); floatText('Stunned', e.x, e.y + e.h + 0.4, e.z, 'info'); }
function aoe(x, z, r, fn) { for (const e of enemies.slice()) if (!e.dead && e.g.visible && Math.hypot(e.x - x, e.z - z) < r + e.T.radius) fn(e); }
function addDot(e, dps, dur, kind) { dps *= 1 + M.dot; const ex = e.dots.find((d) => d.kind === kind); if (ex) { ex.t = dur; ex.dps = Math.max(ex.dps, dps); return; } e.dots.push({ dps, t: dur, tick: 1, kind }); aggro(e); }
function diffColor(lvl) { const d = lvl - P.lvl; return d >= 5 ? '#ff4a3a' : d >= 3 ? '#ff9a3a' : d >= -2 ? '#ffe066' : d >= -5 ? '#6fdc5a' : '#a0a0a0'; }

function dealDamage(e, base, o = {}) {
  if (e.dead) return 0;
  const R = RACES[CH.race]; let crit = false, mult = 1;
  if (!o.dot && !o.pet) {
    let cc = P.critPct / 100 + (o.critBonus || 0) + (P.buffs.dance ? 0.4 : 0);
    if (P.buffs.stealth) { cc = 1; mult = M.flags.shadowmaster ? 2 : 1.5; breakStealth(); }
    crit = Math.random() < cc;
  }
  const dmg = Math.max(1, Math.round(base * mult * rand(0.92, 1.08) * (crit ? 2 : 1)));
  e.hp -= dmg;
  if (!o.dot) { e.flashT = 0.12; for (const m of e.flash) if (m.emissive) m.emissive.setHex(0x882020); }
  aggro(e);
  floatText(String(dmg), e.x, e.y + e.h + 0.3, e.z, o.dot ? 'dot' : o.pet ? 'pet' : crit ? 'crit' : 'dmg');
  if (o.kb && !e.boss && !e.elite) { const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 1; e.kbx = (dx / d) * o.kb; e.kbz = (dz / d) * o.kb; }
  const leech = (R.leech || 0) + M.leech; if (leech && !o.pet) heal(dmg * leech, false);
  if (!o.dot && !o.pet && P.buffs.poison && CH.cls === 'rogue') addDot(e, atk() * 0.3, 5, 'poison');
  if (crit && M.flags.backdraft && cds.chaos > 0) cds.chaos = Math.max(0, cds.chaos - 2);
  if (e.hp <= 0) killEnemy(e);
  return dmg;
}
function killEnemy(e) {
  e.dead = true; e.deathT = 0; e.respawnT = e.respawn; e.dots = []; e.stunT = 0; e.fearT = 0;
  for (const m of e.flash) if (m.emissive) m.emissive.setHex(0);
  if (target === e) after(0.6, () => { if (target === e) setTarget(null); });
  const diff = e.lvl - P.lvl, mod = diff <= -6 ? 0.1 : clamp(1 + diff * 0.08, 0.3, 1.4);
  const xp = Math.round((12 + e.lvl * 7) * (e.elite ? 3 : 1) * (e.boss ? 10 : 1) * mod);
  if (P.lvl < MAX_LVL) floatText(`+${xp} xp`, e.x, e.y + 1.5, e.z, 'xpf');
  gainXP(xp);
  dropLoot(e);
  onKillQuest(e);
  if (M.flags.predator) { cds.rake = 0; cds.bite = 0; }
  if (e.boss) { bannerMsg(e.name + ' defeated!'); }
  saveChar();
}
function dropLoot(e) {
  const g = Math.round(rand(1, 3) * e.lvl * (e.elite ? 3 : 1) * (e.boss ? 8 : 1)); P.gold += g;
  setTimeout(() => floatText(`+${g} g`, e.x, e.y + 1, e.z, 'gold'), 180);
  const zone = zoneAt(e.x, e.z).id;
  const items = [];
  if (e.boss) { items.push(genItem(e.lvl + 1, rollRarity('boss'), pick(GEAR_SLOTS), CH.cls, zone)); items.push(genItem(e.lvl + 1, rollRarity('elite'), pick(GEAR_SLOTS), CH.cls, zone)); P.potions += 2; }
  else if (e.elite) { items.push(genItem(e.lvl + 1, rollRarity('elite'), pick(GEAR_SLOTS), CH.cls, zone)); if (Math.random() < 0.5) P.potions++; }
  else {
    if (Math.random() < 0.45 && e.def.junk) items.push(genJunk(e.def.junk, e.lvl));
    if (Math.random() < 0.17) items.push(genItem(e.lvl, rollRarity('mob'), pick(GEAR_SLOTS), CH.cls, zone));
    if (Math.random() < 0.06) { P.potions++; toast('You found a healing potion.'); }
  }
  for (const it of items) if (addItem(it)) toast(`You receive loot: <span class="q${it.rarity}">[${esc(it.name)}]</span>`, true);
}

/* ---------------- items ---------------- */
function addItem(it) { const i = CH.inv.indexOf(null); if (i < 0) { toast('Your bags are full.'); return false; } CH.inv[i] = it; refreshPanels(); return true; }
function equipFromBag(i) {
  const it = CH.inv[i]; if (!it) return;
  if (it.slot === 'junk') return fail('You can\'t equip that.');
  if (it.req > P.lvl) return fail(`You must be level ${it.req} to equip that.`);
  const old = CH.equip[it.slot] || null; CH.equip[it.slot] = it; CH.inv[i] = old;
  afterGearChange();
}
function unequip(slot) { const it = CH.equip[slot]; if (!it) return; const i = CH.inv.indexOf(null); if (i < 0) return fail('Your bags are full.'); CH.inv[i] = it; delete CH.equip[slot]; afterGearChange(); }
function afterGearChange() { recalcStats(); rebuildHero(); refreshPanels(); saveChar(); }
function sellItem(i) { const it = CH.inv[i]; if (!it) return; P.gold += it.sell; CH.inv[i] = null; toast(`Sold ${it.name} for ${it.sell} g.`); refreshPanels(); saveChar(); }
function destroyItem(i) { const it = CH.inv[i]; if (!it) return; CH.inv[i] = null; toast(`Destroyed ${it.name}.`); refreshPanels(); saveChar(); }
function sortBags() { const items = CH.inv.filter(Boolean).sort((a, b) => (a.slot === 'junk') - (b.slot === 'junk') || b.rarity - a.rarity || b.ilvl - a.ilvl); CH.inv = items.concat(new Array(32 - items.length).fill(null)); refreshPanels(); }

/* ---------------- player ---------------- */
function heal(n, show = true) { if (P.dead) return; const h = Math.min(P.maxHp - P.hp, n); if (h <= 0) return; P.hp += h; if (show && h >= 1) floatText('+' + Math.round(h), P.x, P.y + 2.8, P.z, 'heal'); }
function buff(id, dur, data = {}) { P.buffs[id] = Object.assign({ t: dur, max: dur }, data); if (id === 'stealth') setGhostAll(true); if (id === 'poison') for (const m of hero.blades) m.emissive.setHex(0x3a8a1a); }
function setGhostAll(on) { setGhost(hero, on); if (cat) setGhost(cat, on); if (bear) setGhost(bear, on); }
function breakStealth() { if (P.buffs.stealth) { delete P.buffs.stealth; setGhostAll(false); } }
function hurtPlayer(dmg, lvl = 1) {
  if (P.invuln > 0 || P.dead) return;
  let dr = armorDR(lvl) + (RACES[CH.race].dr || 0) + (CH.cls === 'druid' && P.form === 'bear' ? 0.45 : 0) + (M.flags.moonkin && P.form === 'caster' ? 0.1 : 0);
  if (M.flags.survivalist && P.hp < P.maxHp * 0.35) dr += 0.3;
  dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1) * (1 - clamp(dr, 0, 0.8))));
  P.hp -= dmg; P.lastHurt = clock; P.lastCombat = clock; P.invuln = 0.2; shake = Math.max(shake, 0.2); breakStealth();
  floatText('-' + dmg, P.x, P.y + 2.8, P.z, 'hurt'); $('hurt').style.opacity = 1; setTimeout(() => ($('hurt').style.opacity = 0), 140);
  if (P.hp <= 0) { P.hp = 0; die(); }
}
function die() {
  P.dead = true; closeAllWindows(); breakStealth(); dismissPets(); target = null;
  for (const e of enemies) if (e.state === 'chase') e.state = 'return';
  setTimeout(() => { $('dead').hidden = false; $('btnRespawn').focus(); }, 1000);
}
function respawnPlayer() {
  const t = TOWNS.filter((t) => CH.towns[t.id]).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0] || TOWNS[0];
  P.dead = false; P.x = t.x; P.z = t.z + 10; P.y = groundAt(P.x, P.z); P.vy = 0; P.hp = Math.round(P.maxHp * 0.6); $('dead').hidden = true; saveChar(); canvas.focus();
}
function gainXP(n) {
  if (P.lvl >= MAX_LVL) return;
  P.xp += n;
  while (P.lvl < MAX_LVL && P.xp >= xpNext(P.lvl)) {
    P.xp -= xpNext(P.lvl); P.lvl++;
    recalcStats(false); bannerMsg('Level ' + P.lvl);
    const learned = classSkills(CH.cls).filter((s) => s.lvl === P.lvl);
    toast(`You reached level ${P.lvl}!` + (learned.length ? ` New skill: ${learned.map((s) => s.name).join(', ')}.` : ''));
    if (P.lvl >= 10) toast('You gained a talent point. Press N to spend it.');
    spawnRing(P.x, P.z, 0xffd479, 4, 0.8);
    buildBar();
  }
  if (P.lvl >= MAX_LVL) P.xp = 0;
}
function drinkPotion() {
  if (P.dead || mode !== 'play') return;
  if (P.potions <= 0) return fail('No potions left. Merchants sell them.');
  if (P.hp >= P.maxHp) return fail('You are already at full health.');
  if ((cds.potion || 0) > 0) return;
  P.potions--; cds.potion = 3; heal(P.maxHp * 0.45);
}

/* ---------------- targeting ---------------- */
function setTarget(e) { target = e && !e.dead ? e : null; }
function facing() { return { x: Math.sin(P.face), z: Math.cos(P.face) }; }
const dist = (e) => Math.hypot(e.x - P.x, e.z - P.z);
function autoTarget(range) {
  const f = facing(); let best = null, bs = 1e9;
  for (const e of enemies) { if (e.dead || !e.g.visible) continue; const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) - e.T.radius; if (d > range) continue;
    const dot = (dx * f.x + dz * f.z) / (Math.hypot(dx, dz) || 1); const s = d * (dot > 0.5 ? 1 : dot > -0.2 ? 1.8 : 3) * (e.state === 'chase' ? 0.7 : 1); if (s < bs) { bs = s; best = e; } }
  return best;
}
function findTarget(range) {
  if (target && !target.dead && dist(target) - target.T.radius <= range) return target;
  const t = autoTarget(range); if (t) setTarget(t); return t;
}
function meleeTarget(range) {
  if (target && !target.dead && dist(target) - target.T.radius <= range) return target;
  const t = autoTarget(range); if (t) setTarget(t); return t;
}
function cycleTarget() {
  const list = enemies.filter((e) => !e.dead && e.g.visible && dist(e) < 40).sort((a, b) => dist(a) - dist(b));
  if (!list.length) return setTarget(null);
  const i = list.indexOf(target); setTarget(list[(i + 1) % list.length]);
}
function handPos() { const f = facing(); return new THREE.Vector3(P.x + f.x * 0.6, P.y + 1.6 * (RACE_SHAPE[CH.race].h), P.z + f.z * 0.6); }
function aimAt(e, from) { if (!e) { const f = facing(); return new THREE.Vector3(f.x, 0, f.z); } return new THREE.Vector3(e.x, e.y + e.cy, e.z).sub(from).normalize(); }
function faceTo(e) { if (e) P.face = Math.atan2(e.x - P.x, e.z - P.z); }
function playAnim(kind, dur) { P.attackT = 0; P.attackSpec = { kind: 'none', anim: kind, dur }; P.hitDone = true; }

/* ---------------- basic attacks & skills ---------------- */
function basicSpec() {
  const c = CH.cls;
  if (c === 'rogue') return { kind: 'melee', anim: 'dagger', dur: 0.32, mult: 0.75, range: 2.6, arc: 0.2, kb: 3 };
  if (c === 'archer') return { kind: 'proj', anim: 'bow', dur: 0.55, mult: 0.95, proj: 'arrow', speed: 44, range: 34 };
  if (c === 'warlock') return { kind: 'proj', anim: 'cast', dur: 0.6, mult: 1, proj: 'orb', color: 0x9a4dff, speed: 24, range: 28 };
  if (P.form === 'cat') return { kind: 'melee', anim: 'beast', dur: 0.3, mult: 0.85, range: 2.8, arc: 0.2, kb: 3 };
  if (P.form === 'bear') return { kind: 'melee', anim: 'beast', dur: 0.55, mult: 0.95, range: 3.6, arc: -0.15, kb: 8 };
  return { kind: 'proj', anim: 'cast', dur: 0.6, mult: 1, proj: 'orb', color: 0x9fe05a, speed: 26, range: 28 };
}
function startAttack() {
  if (P.dead || P.attackT >= 0 || mode !== 'play' || anyModal()) return;
  const s = basicSpec(); s.dur /= hasteMul();
  const t = s.kind === 'melee' ? meleeTarget(4.5) : findTarget(s.range); if (t) faceTo(t);
  P.attackT = 0; P.attackSpec = s; P.hitDone = false; if (s.anim === 'dagger') P.swing ^= 1;
  if (M.flags.adrenaline) for (const k in cds) if (cds[k] > 0) cds[k] = Math.max(0, cds[k] - 0.5);
}
function doMelee(s) {
  const f = facing(); let any = false; const cleave = P.buffs.flurry || CH.cls === 'druid';
  const t = target && !target.dead && dist(target) < s.range + target.T.radius + 0.5 ? target : null;
  for (const e of enemies) {
    if (e.dead || !e.g.visible) continue; const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
    if (!(d < s.range + e.T.radius && (d < 1.3 || (dx * f.x + dz * f.z) / d > s.arc))) continue;
    if (!cleave && t && e !== t) continue;
    dealDamage(e, atk() * s.mult, { kb: s.kb }); any = true; if (!cleave && !t) break;
  }
  if (any) shake = Math.max(shake, 0.08);
}
function doBasicRanged(s) { const from = handPos(), t = findTarget(s.range); faceTo(t); fire({ kind: s.proj, pos: from, dir: aimAt(t, from), speed: s.speed, dmg: atk() * s.mult, color: s.color, size: 0.2 }); }
function skillCd(sk) { return Math.max(0.5, sk.cd - (M.cdr[sk.id] || 0)); }
function useSlot(i) {
  if (mode !== 'play' || P.dead || anyModal()) return;
  const sk = barSkills()[i]; if (!sk) return;
  if (P.lvl < sk.lvl) return fail(`${sk.name} unlocks at level ${sk.lvl}.`);
  const id = sk.cdId || sk.id;
  if ((cds[id] || 0) > 0) return;
  if (sk.id === 'shadowstep' && P.buffs.dance) cds.shadowstep = 0;
  const r = sk.use(); if (r === false) return;
  cds[id] = P.buffs.dance && sk.id === 'shadowstep' ? 0.5 : skillCd(sk);
  if (sk.id !== 'vanish') breakStealth();
}
function setForm(f) {
  if (P.form === f) return false;
  P.form = f; breakStealth(); applyForm(); recalcStats();
  spawnRing(P.x, P.z, f === 'bear' ? 0xb07a3a : f === 'cat' ? 0x9a7ae0 : 0x9fe05a, 3);
  floatText(SK['form' + f[0].toUpperCase() + f.slice(1)].name, P.x, P.y + 3, P.z, 'info'); buildBar(); saveChar();
}
function applyForm() {
  if (!hero) return; const druid = CH.cls === 'druid';
  hero.g.visible = !druid || P.form === 'caster'; if (cat) cat.g.visible = druid && P.form === 'cat'; if (bear) bear.g.visible = druid && P.form === 'bear';
}
function rebuildHero() {
  if (hero) scene.remove(hero.g); hero = buildHero(CH, CH.equip); scene.add(hero.g);
  if (CH.cls === 'druid') { if (!cat) cat = buildBeast('cat'); if (!bear) bear = buildBeast('bear'); }
  else { if (cat) { scene.remove(cat.g); cat = null; } if (bear) { scene.remove(bear.g); bear = null; } }
  hero.g.position.set(P.x, P.y, P.z); hero.g.rotation.y = P.face; applyForm();
  if (P.buffs.stealth) setGhostAll(true);
  if (P.buffs.poison) for (const m of hero.blades) m.emissive.setHex(0x3a8a1a);
}

/* ---------------- pets ---------------- */
function summonPet(kind, dur, x, z) {
  for (const p of pets.filter((p) => p.kind === kind)) removePet(p);
  const mk = buildPet(kind), f = facing(); mk.g.visible = true;
  const p = { kind, mk, g: mk.g, parts: mk.parts, x: x ?? P.x - f.x * 1.5, z: z ?? P.z - f.z * 1.5, y: 0, t: dur, perm: !dur, cd: 0.5, face: P.face, anim: 0, windup: 0, atkAnim: -1, T: { windup: 0.3 } };
  p.y = groundAt(p.x, p.z); scene.add(mk.g); pets.push(p); spawnRing(p.x, p.z, kind === 'wolf' ? 0x7ac8ff : 0xff7a2a, 3);
  toast({ imp: 'Your imp answers the call.', wolf: 'A spirit wolf joins you.', infernal: 'The infernal crashes down!' }[kind]);
}
function removePet(p) { scene.remove(p.g); pets.splice(pets.indexOf(p), 1); }
function dismissPets() { for (const p of pets.slice()) removePet(p); }
function updatePets(dt) {
  for (const p of pets.slice()) {
    if (!p.perm) { p.t -= dt; if (p.t <= 0) { spawnRing(p.x, p.z, 0xffffff, 2); removePet(p); continue; } }
    let tg = target && !target.dead && dist(target) < 30 ? target : null;
    if (!tg) { let bd = 20; for (const e of enemies) if (!e.dead && e.state === 'chase' && Math.hypot(e.x - p.x, e.z - p.z) < bd) { bd = Math.hypot(e.x - p.x, e.z - p.z); tg = e; } }
    const ranged = p.kind === 'imp', range = ranged ? 13 : 2.2 + (tg ? tg.T.radius : 0), spd = p.kind === 'infernal' ? 5 : 8;
    let moving = false; p.cd -= dt;
    if (tg) {
      const dx = tg.x - p.x, dz = tg.z - p.z, d = Math.hypot(dx, dz); p.face = Math.atan2(dx, dz);
      if (d > range) { p.x += (dx / d) * spd * dt; p.z += (dz / d) * spd * dt; moving = true; }
      else if (p.cd <= 0) {
        const pm = (1 + M.pet) * atk();
        if (ranged) { const from = new THREE.Vector3(p.x, p.y + 1.2, p.z); fire({ kind: 'orb', color: 0xff8a3a, size: 0.14, pos: from, dir: new THREE.Vector3(tg.x, tg.y + tg.cy, tg.z).sub(from).normalize(), speed: 22, dmg: pm * 0.5, pet: true }); p.cd = 1.4; }
        else if (p.kind === 'infernal') { aoe(p.x + Math.sin(p.face) * 1.5, p.z + Math.cos(p.face) * 1.5, 3.5, (e) => dealDamage(e, pm * 0.6, { pet: true })); p.cd = 1.6; p.windup = 0.3; }
        else { dealDamage(tg, pm * 0.55, { pet: true }); p.cd = 1.1; p.windup = 0.25; }
      }
    } else {
      const f = facing(), tx = P.x - f.z * 2 - f.x * 1.2, tz = P.z + f.x * 2 - f.z * 1.2, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d > 30) { p.x = tx; p.z = tz; } else if (d > 1) { const s = Math.min(d * 2.2, 10); p.x += (dx / d) * s * dt; p.z += (dz / d) * s * dt; p.face = Math.atan2(dx, dz); moving = true; }
    }
    if (p.windup > 0) p.windup -= dt;
    p.y = groundAt(p.x, p.z); p.g.position.set(p.x, p.y + (ranged ? 0.6 + Math.sin(clock * 4) * 0.15 : 0), p.z); p.g.rotation.y = lerpAngle(p.g.rotation.y, p.face, Math.min(1, dt * 10));
    animMob(p, dt, moving, spd);
  }
}

/* ---------------- monster AI ---------------- */
function updateEnemy(e, dt) {
  const T = e.T, dxp = P.x - e.x, dzp = P.z - e.z, d = Math.hypot(dxp, dzp);
  if (e.dead) {
    if (e.deathT < 1) { e.deathT += dt * 1.8; const s = Math.max(0.01, 1 - e.deathT); e.g.scale.setScalar(s * e.sc); if (e.deathT >= 1) e.g.visible = false; }
    e.respawnT -= dt; if (e.respawnT <= 0 && Math.hypot(P.x - e.home.x, P.z - e.home.z) > 50) respawnEnemy(e);
    return;
  }
  const far = d > 120 && e.state !== 'chase';
  e.g.visible = !far; if (far) return;
  if (e.flashT > 0) { e.flashT -= dt; if (e.flashT <= 0) for (const m of e.flash) if (m.emissive) m.emissive.setHex(0); }
  for (let i = e.dots.length - 1; i >= 0; i--) { const o = e.dots[i]; o.t -= dt; o.tick -= dt; if (o.tick <= 0) { o.tick += 1; dealDamage(e, o.dps, { dot: true }); if (e.dead) return; } if (o.t <= 0) e.dots.splice(i, 1); }
  e.cd -= dt; if (e.weakT > 0) e.weakT -= dt;
  if (e.stunT > 0) { e.stunT -= dt; e.g.position.set(e.x, e.y, e.z); animMob(e, dt, false, 0); return; }
  let speed = 0, tx = 0, tz = 0;
  const seen = !P.dead && !(P.buffs.stealth && d > 1.5);
  const homeD = Math.hypot(e.x - e.home.x, e.z - e.home.z);
  if (e.fearT > 0) { e.fearT -= dt; tx = -dxp / (d || 1); tz = -dzp / (d || 1); speed = T.speed * 0.8; e.face = Math.atan2(tx, tz); e.windup = 0; }
  else {
    if (seen && e.state === 'idle' && d < T.aggro && e.lvl - P.lvl > -8) aggro(e);
    if (e.state === 'chase' && (!seen || homeD > T.leash + (e.boss ? 0 : 10) || d > T.aggro * 3)) e.state = 'return';
    if (e.state === 'chase') {
      e.face = Math.atan2(dxp, dzp);
      if (e.boss) { e.specialT -= dt; if (e.specialT <= 0 && d < 30) { e.specialT = 7.5; const dmg = T.dmg * 2.2;
          if (e.def.special === 'spit') { telegraph(P.x, P.z, 4.5, 1.3, dmg, 0x9a5aff); floatText('!', e.x, e.y + e.h + 0.6, e.z, 'crit'); }
          else { telegraph(e.x, e.z, 7 + T.radius, 1.5, dmg); e.windup = 1.5; e.slam = true; } } }
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          const dm = T.dmg * (e.weakT > 0 ? 0.7 : 1);
          if (e.slam) e.slam = false;
          else if (T.ranged) { const from = new THREE.Vector3(e.x, e.y + e.cy * 1.4, e.z); fire({ kind: 'orb', color: T.proj || 0xffffff, size: 0.22, pos: from, dir: new THREE.Vector3(P.x, P.y + 1.3, P.z).sub(from).normalize(), speed: 18, dmg: dm, hostile: true, lvl: e.lvl, life: 2 }); }
          else if (d < T.range + T.radius + 0.9) hurtPlayer(dm, e.lvl);
          e.cd = T.cd; e.atkAnim = 0;
        }
      } else {
        const want = T.ranged ? T.range - 1 : T.range + T.radius - 0.2;
        if (d > want) { tx = dxp / d; tz = dzp / d; speed = T.speed; } else if (e.cd <= 0) e.windup = T.windup;
      }
    } else if (e.state === 'return') {
      const hx = e.home.x - e.x, hz = e.home.z - e.z, hd = Math.hypot(hx, hz);
      if (hd < 2) e.state = 'idle'; else { tx = hx / hd; tz = hz / hd; speed = T.speed * 1.2; e.face = Math.atan2(hx, hz); }
      if (!e.dots.length) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.5 * dt); e.windup = 0;
    } else {
      e.wanderT -= dt;
      if (e.wanderT <= 0) { e.wanderT = rand(3, 7); if (Math.random() < 0.55) { const a = rand(0, 6.283), r = rand(2, 10); e.wx = e.home.x + Math.cos(a) * r; e.wz = e.home.z + Math.sin(a) * r; } else e.wx = null; }
      if (e.wx != null) { const wx = e.wx - e.x, wz = e.wz - e.z, wd = Math.hypot(wx, wz); if (wd > 0.5) { tx = wx / wd; tz = wz / wd; speed = T.speed * 0.3; e.face = Math.atan2(wx, wz); } else e.wx = null; }
    }
  }
  let moving = false;
  if (speed > 0) { const nx = e.x + tx * speed * dt, nz = e.z + tz * speed * dt; if (groundAt(nx, nz) > -0.6 || e.state === 'chase') { e.x = nx; e.z = nz; moving = true; } else e.wx = null; }
  if (e.kbx || e.kbz) { e.x += e.kbx * dt; e.z += e.kbz * dt; const f = Math.pow(0.002, dt); e.kbx *= f; e.kbz *= f; if (Math.abs(e.kbx) + Math.abs(e.kbz) < 0.1) e.kbx = e.kbz = 0; }
  if (d < T.radius + 0.5 && d > 0.01) { e.x -= (dxp / d) * (T.radius + 0.5 - d); e.z -= (dzp / d) * (T.radius + 0.5 - d); }
  if (e.T.radius < 1.6) collide(e, T.radius * 0.6);
  e.y = groundAt(e.x, e.z); if (e.y < -0.6) e.y = -0.6;
  e.g.position.set(e.x, e.y, e.z); e.g.rotation.y = lerpAngle(e.g.rotation.y, e.face, Math.min(1, dt * 8));
  animMob(e, dt, moving, speed);
}

/* ---------------- quests ---------------- */
function qState(q) {
  const Qs = CH.quests;
  if (Qs.done[q.id]) return 'done';
  const a = Qs.active[q.id];
  if (a) return q.obj.every((o, i) => a.p[i] >= o.n) ? 'ready' : 'active';
  if (!q.req.every((r) => Qs.done[r])) return 'locked';
  return P.lvl >= q.lvl - 2 ? 'avail' : 'soon';
}
function acceptQuest(id) {
  const q = QUEST[id]; if (Object.keys(CH.quests.active).length >= 20) return fail('Your quest log is full.');
  CH.quests.active[id] = { p: q.obj.map(() => 0) }; toast(`Quest accepted: ${q.title}`); refreshPanels(); saveChar();
}
function abandonQuest(id) { delete CH.quests.active[id]; toast(`Quest abandoned: ${QUEST[id].title}`); refreshPanels(); saveChar(); }
function questProgress(match, label) {
  for (const id in CH.quests.active) {
    const q = QUEST[id], a = CH.quests.active[id]; let changed = false;
    q.obj.forEach((o, i) => { if (a.p[i] >= o.n) return; const r = match(o); if (r) { a.p[i]++; changed = true; toast(`${r === true ? label(o) : r}: ${a.p[i]}/${o.n}`); } });
    if (changed && qState(q) === 'ready') { const tn = NPC[q.turnin || q.giver]; toast(`Quest complete: ${q.title}. Return to ${tn.name}.`); spawnRing(P.x, P.z, 0xffd479, 3); }
  }
  refreshPanels();
}
function onKillQuest(e) {
  questProgress((o) => {
    if (o.t === 'kill' && (o.m === e.type || o.m === e.named || (!e.named && o.m === e.base))) return true;
    if (o.t === 'loot' && o.m.includes(e.named ? '' : e.base) && Math.random() < o.p) return o.item;
    return false;
  }, (o) => (o.t === 'kill' ? (MOBS[o.m] ? MOBS[o.m].name : NAMED[o.m].name) + ' slain' : o.item));
}
function questRewards(q) {
  if (!q._choices) {
    const src = { green: 'quest', blue: 'quest-blue', epic: 'quest-epic' }[q.reward];
    if (src) { const slots = GEAR_SLOTS.slice().sort(() => Math.random() - 0.5).slice(0, 2); const zone = TOWN[NPC[q.giver].town].zone; q._choices = slots.map((s) => genItem(q.lvl + 1, rollRarity(src), s, CH.cls, zone)); }
    else q._choices = [];
  }
  return q._choices;
}
function turnIn(id, choice) {
  const q = QUEST[id]; if (qState(q) !== 'ready') return;
  const items = questRewards(q);
  if (items.length && !items[choice]) return fail('Choose a reward first.');
  if (items.length && CH.inv.indexOf(null) < 0) return fail('Your bags are full.');
  delete CH.quests.active[id]; CH.quests.done[id] = true;
  const xp = questXP(q), gold = questGold(q);
  gainXP(xp); P.gold += gold; if (q.reward === 'potions') P.potions += 3;
  if (items.length) addItem(items[choice]);
  q._choices = null;
  toast(`Quest complete: ${q.title}. +${xp} xp, +${gold} g`); spawnRing(P.x, P.z, 0xffd479, 4, 0.8);
  refreshPanels(); saveChar();
}

/* ---------------- world interaction ---------------- */
function spawnNpcs() {
  for (const n of NPCS) {
    const t = TOWN[n.town], x = t.x + n.dx, z = t.z + n.dz, model = buildHero(n.look);
    model.g.position.set(x, groundAt(x, z), z); model.g.rotation.y = Math.atan2(t.x - x, t.z - z); scene.add(model.g);
    addCollider(x, z, 0.6); npcs.push({ def: n, model, x, z, y: groundAt(x, z), baseRot: model.g.rotation.y, phase: rand(0, 6) });
  }
}
function npcMarker(n) {
  let best = null;
  for (const q of QUESTS) {
    const st = qState(q);
    if (st === 'ready' && (q.turnin || q.giver) === n.id) return 'ready';
    if (st === 'avail' && q.giver === n.id) best = 'avail';
    else if (st === 'active' && (q.turnin || q.giver) === n.id && !best) best = 'active';
  }
  return best;
}
function nearestInteract() {
  for (const n of npcs) if (Math.hypot(P.x - n.x, P.z - n.z) < 4.2) return { kind: 'npc', n };
  for (const nd of nodes) if (nd.on && Math.hypot(P.x - nd.x, P.z - nd.z) < 2.6) return { kind: 'node', nd };
  return null;
}
function gatherNode(nd) {
  const needed = Object.keys(CH.quests.active).some((id) => QUEST[id].obj.some((o, i) => o.t === 'gather' && o.k === nd.kind && CH.quests.active[id].p[i] < o.n));
  if (!needed && nd.kind !== 'emberbloom') return fail(`You have no use for ${GATHER[nd.kind].name} right now.`);
  nd.on = false; nd.g.visible = false; nd.t = 45; spawnRing(nd.x, nd.z, 0xffd479, 1.5);
  if (needed) questProgress((o) => (o.t === 'gather' && o.k === nd.kind ? true : false), () => GATHER[nd.kind].name);
  else { heal(P.maxHp * 0.15); gainXP(5); }
}
function discoverTowns() {
  for (const t of TOWNS) if (!CH.towns[t.id] && Math.hypot(P.x - t.x, P.z - t.z) < 45) {
    CH.towns[t.id] = true; const xp = 30 * ZONE[t.zone].lv[0]; gainXP(xp); toast(`Discovered: ${t.name}. +${xp} xp`); saveChar();
  }
}
function flyTo(id) {
  const t = TOWN[id], cost = flightCost(id); if (P.gold < cost) return fail('You can\'t afford that flight.');
  P.gold -= cost; closeAllWindows(); const f = $('fade'); f.textContent = `Flying to ${t.name}…`; f.classList.add('on');
  setTimeout(() => { P.x = t.x - 8; P.z = t.z + 10; P.y = groundAt(P.x, P.z); P.vy = 0; dismissPets(); target = null; camLook.set(P.x, P.y + 1.7, P.z); saveChar(); }, 650);
  setTimeout(() => f.classList.remove('on'), 1300);
}
function flightCost(id) { const t = TOWN[id]; return Math.max(1, Math.round(Math.hypot(t.x - P.x, t.z - P.z) / 40)); }
function vendorStock(n) {
  if (!n._stock || n._stockLvl !== P.lvl) { const zone = TOWN[n.town].zone, lv = clamp(P.lvl, ZONE[zone].lv[0], ZONE[zone].lv[1]); n._stock = []; n._stockLvl = P.lvl;
    for (let i = 0; i < 6; i++) { const it = genItem(lv, rollRarity('vendor'), pick(GEAR_SLOTS), CH.cls, zone); it.price = it.sell * 4; n._stock.push(it); } }
  return n._stock;
}
const potionPrice = () => 5 + P.lvl * 2;
