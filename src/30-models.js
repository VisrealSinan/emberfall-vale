/* Anime-style models: heroes and NPCs, druid forms, monsters and pets. */

/* ---------------- eyes ---------------- */
const _eyeCache = new Map();
function shade(col, k) { const c = new THREE.Color(col); if (k < 0) c.multiplyScalar(1 + k); else c.lerp(new THREE.Color(0xffffff), k); return '#' + c.getHexString(); }
function eyeTex(col, opt = {}) {
  const key = col + '|' + (opt.glow ? 1 : 0) + (opt.fem ? 1 : 0) + (opt.angry ? 1 : 0);
  if (_eyeCache.has(key)) return _eyeCache.get(key);
  const c = document.createElement('canvas'); c.width = 64; c.height = 80; const x = c.getContext('2d');
  const ell = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  x.fillStyle = '#ffffff'; ell(32, 46, 22, 27);
  const gr = x.createLinearGradient(0, 22, 0, 74); gr.addColorStop(0, shade(col, opt.glow ? 0 : -0.5)); gr.addColorStop(1, shade(col, opt.glow ? 0.6 : 0.3));
  x.fillStyle = gr; ell(32, 48, 17, 23);
  x.fillStyle = opt.glow ? shade(col, 0.7) : shade(col, -0.75); ell(32, 47, 8, 12);
  x.fillStyle = '#ffffff'; ell(23, 37, 6, 7); ell(41, 59, 3, 3.5);
  x.strokeStyle = '#1b1626'; x.lineCap = 'round'; x.lineWidth = 6;
  x.beginPath(); x.moveTo(6, 24); x.quadraticCurveTo(30, 8, 60, 21); x.stroke();
  if (opt.fem) { x.lineWidth = 4; x.beginPath(); x.moveTo(56, 24); x.lineTo(63, 16); x.stroke(); x.beginPath(); x.moveTo(52, 20); x.lineTo(58, 11); x.stroke(); }
  if (opt.angry) { x.lineWidth = 9; x.beginPath(); x.moveTo(2, 8); x.lineTo(62, 26); x.stroke(); x.globalCompositeOperation = 'destination-out'; x.fillRect(0, 0, 64, 8); }
  const t = new THREE.CanvasTexture(c); _eyeCache.set(key, t); return t;
}
const EYE_GEO = new THREE.PlaneGeometry(1, 1.25);
function addEyes(parent, col, { size = 0.15, x = 0.125, y = 0, z = 0.3, turn = 0.32, glow = false, fem = false, angry = false } = {}) {
  const m = new THREE.MeshBasicMaterial({ map: eyeTex(col, { glow, fem, angry }), transparent: true, side: THREE.DoubleSide, depthWrite: true, alphaTest: 0.1 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(EYE_GEO, m); e.scale.set(size * -s, size, 1); e.position.set(s * x, y, z); e.rotation.y = s * turn; e.userData.noOutline = true; parent.add(e); }
}
function addFaceBits(head, opt = {}) {
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.014), basic(0x5a2a2a)); mouth.position.set(0, -0.17, 0.322); mouth.userData.noOutline = true; head.add(mouth);
  if (opt.blush) { const bm = new THREE.MeshBasicMaterial({ color: 0xff8a9a, transparent: true, opacity: 0.45, depthWrite: false }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), bm); b.scale.y = 0.55; b.position.set(s * 0.17, -0.1, 0.29); b.rotation.y = s * 0.5; b.userData.noOutline = true; head.add(b); } }
}

/* ---------------- heroes & NPCs ---------------- */
const RACE_SHAPE = { elf: { h: 1.06, w: 0.94 }, dwarf: { h: 0.8, w: 1.22 }, fishfolk: { h: 1, w: 1 }, undead: { h: 1, w: 0.9 }, human: { h: 1, w: 1 } };
const CLASS_LOOK = {
  druid: { top: 0x5fae5a, trim: 0xc79a5a, pants: 0x6a5236, boots: 0x5a3a22, cape: 0x2f6a3a, weapon: 'druidstaff', robe: false },
  rogue: { top: 0x2a2d3e, trim: 0xc0394a, pants: 0x23242f, boots: 0x3a2a2a, cape: null, scarf: 0xd8394a, weapon: 'daggers' },
  archer: { top: 0x3f8a5a, trim: 0xc49a62, pants: 0x5a4632, boots: 0x6a4a2a, cape: 0x2f5a3a, weapon: 'bow' },
  warlock: { top: 0x4a2a7a, trim: 0xffd479, pants: 0x2a1a3e, boots: 0x1e1430, cape: 0x24142f, weapon: 'warstaff', robe: true },
};
function gearColor(it, fallback) { return it ? it.color : fallback; }
function buildHero(c, gear = {}) {
  const NEUTRAL = { top: 0x6a6a7a, trim: 0x4a3a32, pants: 0x4a3a32, boots: 0x3a2a22, cape: null, scarf: null, robe: false, weapon: 'none' };
  const R = RACE_SHAPE[c.race] || RACE_SHAPE.human, look = Object.assign({}, c.outfit || !CLASS_LOOK[c.cls] ? NEUTRAL : CLASS_LOOK[c.cls], c.outfit || {});
  if (c.robe) look.robe = true;
  const fem = c.sex === 'female', skinC = c.skinColor ?? (RACES[c.race] ? RACES[c.race].skins[c.skin || 0] : 0xf5cba7);
  const hairC = c.hairColor ?? HAIRS[c.hair ?? 1], eyeC = c.eyeColor ?? EYES[c.eye ?? 0];
  const mats = [], M = (col, o) => { const m = toon(col, o); mats.push(m); return m; };
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); b.scale.set(R.w, R.h, R.w);
  const mSkin = M(skinC), mHair = M(hairC);
  const topC = gearColor(gear.chest, look.top), legC = gearColor(gear.legs, look.pants), bootC = gearColor(gear.feet, look.boots), gloveC = gearColor(gear.hands, look.trim);
  const mTop = M(topC), mTrim = M(look.trim), mLeg = M(legC), mBoot = M(bootC), mGlove = M(gloveC);
  // legs
  const leg = (sx) => { const p = new THREE.Group(); p.position.set(sx * 0.14, 1.05, 0);
    p.add(mesh(G.cyl(0.13, 0.11, 0.54, 10), mLeg, 0, -0.27, 0), mesh(G.cyl(0.11, 0.095, 0.46, 10), mLeg, 0, -0.73, 0), mesh(G.cyl(0.125, 0.14, 0.28, 10), mBoot, 0, -0.93, 0.02));
    b.add(p); return p; };
  const legL = leg(-1), legR = leg(1);
  b.add(mesh(G.cyl(0.25, 0.22, 0.26, 12), mLeg, 0, 1.08, 0));
  if (look.robe || (fem && c.cls === 'druid')) { const robe = mesh(new THREE.CylinderGeometry(0.25, 0.5, 0.85, 16, 1, true), M(topC, { side: THREE.DoubleSide }), 0, 0.72, 0); b.add(robe); }
  const tw = fem ? 0.26 : 0.31;
  const torso = mesh(G.cyl(tw, 0.23, 0.62, 14), mTop, 0, 1.46, 0); b.add(torso);
  b.add(mesh(G.cyl(0.255, 0.255, 0.09, 14), M(gear.waist ? gear.waist.color : look.trim), 0, 1.18, 0));
  if (fem) b.add(mesh(G.sph(0.24, 14, 10), mTop, 0, 1.56, 0.04));
  b.add(mesh(G.cyl(0.07, 0.08, 0.16, 8), mSkin, 0, 1.82, 0));
  if (c.race === 'undead') { const bone = M(0xeee6d4); for (let i = 0; i < 3; i++) { const r = mesh(G.box(0.34 - i * 0.04, 0.035, 0.03), bone, 0, 1.36 + i * 0.1, tw - 0.02); b.add(r); } }
  // head
  const head = new THREE.Group(); head.position.y = 2.1; b.add(head);
  const skull = mesh(G.sph(0.34, 20, 16), mSkin); skull.scale.set(1, 1.04, 0.98); head.add(skull);
  addEyes(head, eyeC, { y: -0.035, x: 0.13, size: c.race === 'fishfolk' ? 0.2 : 0.185, glow: c.race === 'undead' || !!c.glowEyes, fem, angry: !!c.angry });
  addFaceBits(head, { blush: c.race !== 'undead' && !c.angry });
  if (c.race === 'elf') for (const s of [-1, 1]) { const e = mesh(G.cone(0.065, 0.36, 6), mSkin, s * 0.36, 0.04, -0.03); e.rotation.z = s * -(Math.PI / 2 + 0.35); e.rotation.y = s * 0.25; head.add(e); }
  if (c.race === 'fishfolk') {
    const fin = M(hairC);
    if ((c.style || 0) === 0) { const cr = mesh(G.cone(0.32, 0.6, 3), fin, 0, 0.36, -0.08); cr.scale.set(0.18, 1, 1); cr.rotation.x = -0.4; head.add(cr); }
    else if (c.style === 1) for (const s of [-1, 1]) { const f = mesh(G.cone(0.2, 0.45, 3), fin, s * 0.34, 0.02, -0.05); f.scale.set(0.2, 1, 1); f.rotation.z = s * -1.2; head.add(f); }
    else for (let i = 0; i < 4; i++) { const sp = mesh(G.cone(0.07, 0.36, 5), fin, 0, 0.3 - i * 0.05, 0.1 - i * 0.14); sp.rotation.x = -0.6 - i * 0.2; head.add(sp); }
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) head.add(mesh(G.box(0.02, 0.025, 0.1), M(0x1e3d4a), s * 0.32, -0.2 - i * 0.06, -0.02));
  } else if ((c.style ?? 0) >= 0) {
    const cap = mesh(new THREE.SphereGeometry(0.37, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), mHair, 0, 0.03, -0.03); cap.rotation.x = -0.62; head.add(cap);
    for (let i = -2; i <= 2; i++) { const bg = mesh(G.cone(0.075, 0.22, 6), mHair, i * 0.1, 0.25 - Math.abs(i) * 0.025, 0.26 - Math.abs(i) * 0.03); bg.rotation.x = Math.PI - 0.55; bg.rotation.z = i * 0.2; head.add(bg); }
    const st = c.style || 0;
    if (st === 0) { const dirs = [[0, 1, -0.3], [0.6, 0.7, -0.5], [-0.6, 0.7, -0.5], [0.4, 0.2, -0.9], [-0.4, 0.2, -0.9], [0, 0.5, -0.9], [0.8, 0.2, -0.3], [-0.8, 0.2, -0.3]];
      for (const [dx, dy, dz] of dirs) { const v = new THREE.Vector3(dx, dy, dz).normalize(); const sp = mesh(G.cone(0.1, fem ? 0.34 : 0.3, 6), mHair, v.x * 0.3, v.y * 0.3, v.z * 0.3); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); head.add(sp); }
      if (fem) { const back = mesh(G.cyl(0.3, 0.2, 0.45, 12), mHair, 0, -0.22, -0.15); head.add(back); } }
    else if (st === 1) { const back = mesh(G.cyl(0.32, 0.15, fem ? 1.05 : 0.75, 12), mHair, 0, fem ? -0.5 : -0.36, -0.17); back.rotation.x = 0.12; head.add(back);
      for (const s of [-1, 1]) { const lk = mesh(G.cone(0.08, fem ? 0.6 : 0.4, 6), mHair, s * 0.29, -0.25, 0.08); lk.rotation.x = Math.PI; head.add(lk); } }
    else { if (fem) for (const s of [-1, 1]) { head.add(mesh(G.sph(0.08, 8, 6), M(look.trim), s * 0.33, 0.12, -0.1)); const tail = mesh(G.cone(0.16, 0.95, 8), mHair, s * 0.4, -0.38, -0.12); tail.rotation.x = Math.PI; tail.rotation.z = s * -0.18; head.add(tail); }
      else { head.add(mesh(G.sph(0.07, 8, 6), M(look.trim), 0, 0.12, -0.36)); const tail = mesh(G.cone(0.14, 0.75, 8), mHair, 0, -0.2, -0.45); tail.rotation.x = Math.PI - 0.5; head.add(tail); } }
  }
  if (c.race === 'dwarf') {
    if (!fem) { const brd = mesh(G.cone(0.27, 0.5, 10), mHair, 0, -0.38, 0.17); brd.rotation.x = Math.PI + 0.25; head.add(brd); const mus = mesh(G.box(0.3, 0.06, 0.08), mHair, 0, -0.12, 0.31); head.add(mus); }
    else for (const s of [-1, 1]) head.add(mesh(G.cyl(0.05, 0.04, 0.5, 6), mHair, s * 0.3, -0.35, 0.05));
  }
  if (gear.head) { const ci = mesh(new THREE.TorusGeometry(0.35, 0.035, 6, 20), M(gear.head.color, { emissive: gear.head.rarity >= 3 ? 0x222222 : 0 }), 0, 0.12, 0); ci.rotation.x = Math.PI / 2 - 0.25; head.add(ci);
    const gem = mesh(new THREE.OctahedronGeometry(0.06), basic(RARITY[gear.head.rarity].glow), 0, 0.2, 0.33, false); head.add(gem); }
  if (c.crown) { const cr = mesh(G.cyl(0.3, 0.26, 0.2, 8, 1), M(0xffd479), 0, 0.36, 0); head.add(cr); }
  // arms
  const arm = (sx) => { const p = new THREE.Group(); p.position.set(sx * (tw + 0.08), 1.7, 0);
    p.add(mesh(G.cyl(0.085, 0.075, 0.36, 10), mTop, 0, -0.18, 0), mesh(G.cyl(0.078, 0.066, 0.34, 10), mGlove, 0, -0.52, 0), mesh(G.sph(0.08, 10, 8), mSkin, 0, -0.74, 0));
    if (gear.shoulders) { const pad = mesh(G.sph(0.17, 12, 8), M(gear.shoulders.color), sx * 0.03, 0.04, 0); pad.scale.set(1.25, 0.7, 1.1); p.add(pad); }
    b.add(p); return p; };
  const armL = arm(-1), armR = arm(1);
  const capeC = gear.back ? gear.back.color : look.cape;
  if (capeC != null) { const cape = mesh(G.box(fem ? 0.5 : 0.58, 1.2, 0.05), M(capeC), 0, 1.2, -0.31); cape.rotation.x = 0.13; b.add(cape); }
  if (look.scarf) { const sc = M(look.scarf); b.add(mesh(new THREE.TorusGeometry(0.12, 0.05, 6, 14), sc, 0, 1.8, 0).rotateX(Math.PI / 2)); const tl = mesh(G.box(0.13, 0.85, 0.04), sc, 0.08, 1.4, -0.28); tl.rotation.x = 0.35; tl.rotation.z = -0.15; b.add(tl); }
  if (c.cls === 'archer') { const q = mesh(G.cyl(0.11, 0.1, 0.75, 8), M(0x6a4a2a), 0.18, 1.55, -0.34); q.rotation.z = -0.4; b.add(q); for (let i = 0; i < 3; i++) b.add(mesh(G.cone(0.05, 0.15, 4), M(0xffffff), 0.32 + i * 0.05, 1.98 - i * 0.03, -0.34)); }
  if (c.cls === 'druid') for (const s of [-1, 1]) { const a1 = mesh(G.cyl(0.025, 0.035, 0.32, 5), M(0xa07a4a), s * 0.18, 0.45, -0.05); a1.rotation.z = s * -0.5; head.add(a1); const a2 = mesh(G.cyl(0.02, 0.03, 0.18, 5), M(0xa07a4a), s * 0.3, 0.6, -0.05); a2.rotation.z = s * 0.4; head.add(a2); }
  // weapons
  const blades = [], wk = c.weapon || look.weapon, mainC = gear.main ? gear.main.color : null, offC = gear.off ? gear.off.color : null;
  const wGlow = gear.main && gear.main.rarity >= 4 ? RARITY[gear.main.rarity].glow : null;
  const hand = (p) => { const w = new THREE.Group(); w.position.set(0, -0.76, 0.03); p.add(w); return w; };
  if (wk === 'daggers') for (const [p, col] of [[armL, offC], [armR, mainC]]) { const w = hand(p), bm = M(col || 0xd8dee6, { emissive: 0x111111 }); blades.push(bm); w.add(mesh(G.box(0.05, 0.035, 0.55), bm, 0, 0, 0.34), mesh(G.box(0.2, 0.05, 0.06), M(0xc79a3a), 0, 0, 0.06)); if (wGlow) { const gl = mesh(G.box(0.12, 0.1, 0.6), glow(wGlow, 0.4), 0, 0, 0.34, false); w.add(gl); } }
  if (wk === 'sword' || wk === 'axe') { const w = hand(armR); w.add(mesh(G.box(wk === 'axe' ? 0.06 : 0.07, 0.05, 0.95), M(0xc8ccd4), 0, 0, 0.55), mesh(G.box(0.26, 0.06, 0.07), M(0x6a4a2a), 0, 0, 0.08)); if (wk === 'axe') w.add(mesh(G.box(0.05, 0.36, 0.3), M(0xa8acb4), 0, 0.12, 0.9)); }
  if (wk === 'bow') { const w = hand(armL), wood = M(mainC || 0x8a5a2a); for (let i = -2; i <= 2; i++) { const s = mesh(G.cyl(0.03, 0.03, 0.3, 5), wood, 0, -Math.abs(i) * 0.1 + 0.1, i * 0.27); s.rotation.x = Math.PI / 2 + i * 0.3; w.add(s); } const str = mesh(G.box(0.01, 0.01, 1.3), basic(0xffffff), 0, -0.12, 0); str.userData.noOutline = true; w.add(str); if (wGlow) w.add(mesh(G.sph(0.3, 8, 6), glow(wGlow, 0.3), 0, 0, 0, false)); }
  if (wk === 'warstaff' || wk === 'druidstaff' || wk === 'staff') { const w = hand(armR), war = wk === 'warstaff';
    w.add(mesh(G.cyl(0.04, 0.045, 2.2, 6), M(mainC || (war ? 0x2a1f2e : 0x8a6a40)), 0, 0.2, 0));
    const orbC = wGlow || (war ? 0xb066ff : 0x8fe36a); w.add(mesh(new THREE.OctahedronGeometry(0.16), basic(orbC), 0, 1.38, 0, false));
    const h = mesh(G.sph(0.32, 10, 8), glow(orbC, 0.3), 0, 1.38, 0, false); h.userData.noOutline = true; w.add(h);
    if (!war) for (let i = 0; i < 4; i++) { const lf = mesh(G.sph(0.08, 6, 4), M(0x5fd35a), Math.cos(i * 1.57) * 0.16, 1.2, Math.sin(i * 1.57) * 0.16); lf.scale.set(1, 0.4, 1.8); w.add(lf); } }
  if (offC && wk === 'warstaff') { const w = hand(armL); w.add(mesh(G.box(0.3, 0.38, 0.08), M(offC), 0, 0.05, 0.12)); }
  if (offC && wk === 'druidstaff') { const w = hand(armL); w.add(mesh(new THREE.OctahedronGeometry(0.12), M(offC), 0, 0, 0.12)); }
  g.traverse((o) => { if (o.isMesh && !o.userData.noOutline) o.castShadow = true; });
  bake(g); outline(g, 0.022);
  return { g, b, head, torso, legL, legR, armL, armR, mats, blades, height: 2.5 * R.h };
}
function setGhost(model, on) {
  if (!model) return;
  model.g.traverse((o) => { if (o.userData.isOutline) o.visible = !on; });
  for (const m of model.mats) { m.transparent = on; m.opacity = on ? 0.3 : 1; m.needsUpdate = true; }
}
// Shared biped walk / attack animation.
function animBiped(m, phase, moving, act, actKind) {
  const s = moving ? Math.sin(phase) : 0;
  m.legL.rotation.x = s * 0.7; m.legR.rotation.x = -s * 0.7;
  m.armL.rotation.x = -s * 0.55; m.armR.rotation.x = s * 0.55 - 0.15;
  m.b.position.y = moving ? Math.abs(Math.cos(phase)) * 0.05 : Math.sin(performance.now() / 600) * 0.012;
  if (act >= 0) {
    const p = Math.min(1, act);
    if (actKind === 'dagger' || actKind === 'daggerL') { const a = actKind === 'daggerL' ? m.armL : m.armR; a.rotation.x = p < 0.35 ? -0.3 - (p / 0.35) * 1.7 : -2 + ((p - 0.35) / 0.65) * 1.8; }
    else if (actKind === 'cast') m.armR.rotation.x = -0.2 - Math.sin(p * Math.PI) * 1.5;
    else if (actKind === 'cast2') { m.armR.rotation.x = m.armL.rotation.x = -0.4 - Math.sin(p * Math.PI) * 2.2; }
    else if (actKind === 'bow') { m.armL.rotation.x = -1.55; m.armR.rotation.x = p < 0.6 ? -1.55 : -1.55 + (p - 0.6) * 2; }
    else if (actKind === 'swing') { m.armR.rotation.x = p < 0.4 ? -0.3 - (p / 0.4) * 2.4 : -2.7 + ((p - 0.4) / 0.6) * 2.5; }
  }
}

/* ---------------- druid forms ---------------- */
function buildBeast(kind, tint) {
  const mats = [], M = (c, o) => { const m = toon(c, o); mats.push(m); return m; };
  const bear = kind === 'bear', fur = M(bear ? 0x7a5236 : 0x2e2a44), belly = M(bear ? 0xb08a62 : 0x4a4466);
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  const body = mesh(G.sph(bear ? 0.95 : 0.55, 16, 12), fur, 0, bear ? 1.5 : 0.95, 0); body.scale.set(bear ? 1 : 0.85, bear ? 0.85 : 0.75, bear ? 1.35 : 1.6); b.add(body);
  if (bear) { const hump = mesh(G.sph(0.7, 12, 10), fur, 0, 2.05, 0.35); b.add(hump); }
  const head = new THREE.Group(); head.position.set(0, bear ? 2.0 : 1.25, bear ? 1.25 : 0.95); b.add(head);
  head.add(mesh(G.sph(bear ? 0.55 : 0.36, 16, 12), fur));
  const sn = mesh(G.sph(bear ? 0.26 : 0.16, 12, 8), belly, 0, -0.12, bear ? 0.45 : 0.3); sn.scale.set(1, 0.8, 1.2); head.add(sn);
  head.add(mesh(G.sph(0.06, 8, 6), basic(0x1b1626), 0, -0.05, bear ? 0.72 : 0.48, false));
  for (const s of [-1, 1]) { const ear = bear ? mesh(G.sph(0.16, 10, 8), fur, s * 0.38, 0.4, -0.05) : mesh(G.cone(0.13, 0.32, 4), fur, s * 0.2, 0.36, -0.05); head.add(ear); }
  addEyes(head, bear ? 0x7a4a2a : 0x8fff6a, { size: bear ? 0.17 : 0.13, x: bear ? 0.2 : 0.13, y: 0.1, z: bear ? 0.45 : 0.3, turn: 0.35, glow: !bear, angry: true });
  const legs = []; const lw = bear ? 0.24 : 0.12, lh = bear ? 1.0 : 0.75;
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const p = new THREE.Group(); p.position.set(sx * (bear ? 0.5 : 0.24), lh + 0.08, sz * (bear ? 0.75 : 0.62)); p.add(mesh(G.cyl(lw, lw * 0.9, lh, 10), fur, 0, -lh / 2, 0)); b.add(p); legs.push(p); }
  if (!bear) { const tail = mesh(G.cyl(0.06, 0.04, 1.2, 6), fur, 0, 1.2, -1.35); tail.rotation.x = -0.7; b.add(tail); }
  bake(g); outline(g, 0.03); g.visible = false; scene.add(g);
  return { g, b, head, legs, mats, body };
}

/* ---------------- monsters ---------------- */
function legPivot(parent, x, y, z, r, len, mat) { const p = new THREE.Group(); p.position.set(x, y, z); p.add(mesh(G.cyl(r, r * 0.85, len, 8), mat, 0, -len / 2, 0)); parent.add(p); return p; }
const MODELS = {
  slime(def) {
    const g = new THREE.Group(), m = toon(def.color), body = mesh(G.sph(0.85, 18, 14), m, 0, 0.75, 0); g.add(body);
    const shine = mesh(G.sph(0.14, 8, 6), basic(0xffffff), -0.32, 0.42, 0.55, false); shine.userData.noOutline = true; body.add(shine);
    addEyes(body, 0x2a2a3a, { size: 0.3, x: 0.27, y: 0.12, z: 0.72, turn: 0.35, angry: def.angry });
    if (def.spots) for (let i = 0; i < 5; i++) body.add(mesh(G.sph(0.14, 8, 6), toon(def.color2), rand(-0.6, 0.6), rand(0.1, 0.6), rand(-0.6, 0.3)));
    return { g, flash: [m], parts: { body }, kind: 'bounce', h: 1.7 };
  },
  toad(def) {
    const g = new THREE.Group(), m = toon(def.color), body = mesh(G.sph(0.9, 16, 12), m, 0, 0.75, 0); body.scale.set(1.25, 0.78, 1.1); body.userData.keep = true; g.add(body);
    for (const s of [-1, 1]) { const eb = mesh(G.sph(0.3, 12, 10), m, s * 0.42, 1.35, 0.45); g.add(eb); addEyes(eb, 0xffc93a, { size: 0.36, x: 0, y: 0.04, z: 0.27, turn: 0 }); }
    for (let i = 0; i < 6; i++) g.add(mesh(G.sph(0.13, 8, 6), toon(def.color2), rand(-0.8, 0.8), rand(0.9, 1.2), rand(-0.6, 0.3)));
    g.add(mesh(G.box(0.9, 0.04, 0.05), basic(0x2a1a1a), 0, 0.82, 0.98, false));
    return { g, flash: [m], parts: { body }, kind: 'bounce', h: 1.8 };
  },
  quad(def) {
    const g = new THREE.Group(), m = toon(def.color), m2 = toon(def.color2 || def.color), b = new THREE.Group(); g.add(b);
    const body = mesh(G.sph(0.7, 16, 12), m, 0, 1.08, 0); body.scale.set(0.78, 0.74, 1.45); b.add(body);
    b.add(mesh(G.sph(0.5, 12, 10), m2, 0, 1.05, 0.55));
    const head = new THREE.Group(); head.position.set(0, 1.4, 1.05); b.add(head);
    head.add(mesh(G.sph(0.44, 14, 12), m));
    const sn = mesh(G.sph(0.22, 10, 8), m2, 0, -0.1, 0.38); sn.scale.set(1, 0.8, 1.4); head.add(sn);
    head.add(mesh(G.sph(0.07, 8, 6), basic(0x1b1626), 0, -0.04, 0.68, false));
    for (const s of [-1, 1]) { const ear = mesh(G.cone(0.13, 0.32, 4), m, s * 0.24, 0.38, -0.05); ear.rotation.z = s * -0.25; head.add(ear); }
    if (def.tusks) for (const s of [-1, 1]) { const t = mesh(G.cone(0.05, 0.3, 6), toon(0xfff4dc), s * 0.15, -0.12, 0.55); t.rotation.x = -0.8; head.add(t); }
    addEyes(head, def.eye || 0xffd23a, { size: 0.15, x: 0.17, y: 0.1, z: 0.33, turn: 0.4, angry: true, glow: !!def.glowEyes });
    const legs = []; for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) legs.push(legPivot(b, sx * 0.28, 0.9, sz * 0.72, 0.11, 0.86, m));
    const tail = mesh(G.cone(0.13, 0.75, 6), m, 0, 1.3, -1.15); tail.rotation.x = -2.3; b.add(tail);
    if (def.ember) { const cg = basic(0xff7a2a); for (let i = 0; i < 4; i++) b.add(mesh(G.box(0.14, 0.04, 0.4), cg, rand(-0.3, 0.3), rand(1.2, 1.5), rand(-0.6, 0.6), false)); }
    return { g, flash: [m], parts: { head, legs, b }, kind: 'quad', h: 2.2 };
  },
  spider(def) {
    const g = new THREE.Group(), m = toon(def.color), m2 = toon(def.color2), b = new THREE.Group(); g.add(b);
    const ab = mesh(G.sph(0.78, 16, 12), m, 0, 1.05, -0.72); ab.scale.set(1, 0.85, 1.2); b.add(ab);
    for (let i = 0; i < 3; i++) b.add(mesh(G.box(0.5 - i * 0.12, 0.04, 0.12), basic(def.mark || 0xff3a6a), 0, 1.55 - i * 0.05, -0.5 - i * 0.28, false));
    const th = mesh(G.sph(0.48, 14, 12), m2, 0, 0.88, 0.35); b.add(th);
    const head = new THREE.Group(); head.position.set(0, 0.95, 0.75); b.add(head);
    for (let i = 0; i < 6; i++) head.add(mesh(G.sph(0.06, 6, 5), basic(0xff3a3a), (i % 3 - 1) * 0.13, 0.1 + Math.floor(i / 3) * 0.1, 0.08, false));
    for (const s of [-1, 1]) { const f = mesh(G.cone(0.05, 0.25, 5), toon(0xeeeeee), s * 0.1, -0.15, 0.08); f.rotation.x = Math.PI; head.add(f); }
    const legs = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.35, 0.95, 0.5 - i * 0.28); p.rotation.y = s * (0.6 - i * 0.35);
      const up = mesh(G.cyl(0.06, 0.05, 0.85, 6), m2, s * 0.35, 0.25, 0); up.rotation.z = s * -1.0; p.add(up);
      const lo = mesh(G.cyl(0.05, 0.03, 1.0, 6), m2, s * 0.85, -0.25, 0); lo.rotation.z = s * 0.45; p.add(lo);
      b.add(p); legs.push(p);
    }
    return { g, flash: [m], parts: { legs, b, head }, kind: 'spider', h: 2 };
  },
  biped(def) {
    const hero = buildHero(Object.assign({ race: 'human', sex: 'male', cls: 'rogue', style: 0, angry: true }, def.hero));
    return { g: hero.g, flash: hero.mats.slice(0, 3), parts: hero, kind: 'biped', h: hero.height, weaponAnim: def.hero.weapon === 'staff' ? 'cast' : 'swing' };
  },
  treant(def) {
    const g = new THREE.Group(), bark = toon(def.color), leaf = toon(def.color2), b = new THREE.Group(); g.add(b);
    b.add(mesh(G.cyl(0.6, 0.8, 2.6, 10), bark, 0, 2.0, 0));
    const can = mesh(G.sph(1.3, 14, 10), leaf, 0, 3.8, 0); can.scale.set(1.2, 0.9, 1.1); b.add(can);
    b.add(mesh(G.sph(0.8, 12, 8), leaf, 0.9, 3.4, 0.2), mesh(G.sph(0.75, 12, 8), leaf, -0.9, 3.5, -0.1));
    for (const s of [-1, 1]) b.add(mesh(G.sph(0.11, 8, 6), basic(0xffe45a), s * 0.25, 2.7, 0.6, false));
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.7, 2.7, 0); const a = mesh(G.cyl(0.18, 0.12, 1.6, 7), bark, 0, -0.8, 0); p.add(a); p.add(mesh(G.sph(0.35, 8, 6), leaf, 0, -1.6, 0)); p.rotation.z = s * 0.35; b.add(p); arms.push(p); }
    const legs = [legPivot(b, -0.35, 0.9, 0, 0.3, 0.9, bark), legPivot(b, 0.35, 0.9, 0, 0.3, 0.9, bark)];
    return { g, flash: [bark], parts: { legs, arms, b }, kind: 'brute', h: 4.6 };
  },
  wisp(def) {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b); b.position.y = 1.6;
    const core = mesh(G.sph(0.36, 14, 12), basic(def.color), 0, 0, 0, false); b.add(core);
    const h = mesh(G.sph(0.9, 14, 12), glow(def.color, 0.3), 0, 0, 0, false); h.userData.noOutline = true; b.add(h);
    const tail = mesh(G.cone(0.32, 1.2, 10), glow(def.color, 0.35), 0, -0.2, -0.6, false); tail.rotation.x = -1.9; tail.userData.noOutline = true; b.add(tail);
    addEyes(core, 0x2a2a6a, { size: 0.14, x: 0.12, y: 0.03, z: 0.33, turn: 0.3 });
    return { g, flash: [], parts: { b }, kind: 'float', h: 2.4, noOutline: true };
  },
  wraith(def) {
    const g = new THREE.Group(), m = toon(def.color), dark = basic(0x101024), b = new THREE.Group(); g.add(b); b.position.y = 0.4;
    const robe = mesh(new THREE.CylinderGeometry(0.2, 0.62, 2.1, 12, 1, true), toon(def.color, { side: THREE.DoubleSide }), 0, 1.15, 0); b.add(robe);
    const hood = mesh(G.sph(0.4, 14, 12), m, 0, 2.35, 0); b.add(hood);
    const face = mesh(G.sph(0.3, 12, 10), dark, 0, 2.3, 0.14, false); face.userData.noOutline = true; b.add(face);
    for (const s of [-1, 1]) b.add(mesh(G.sph(0.06, 8, 6), basic(def.eye || 0x9fe8ff), s * 0.1, 2.33, 0.4, false));
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.35, 1.9, 0); const a = mesh(G.cone(0.14, 0.9, 8), m, 0, -0.45, 0); a.rotation.x = Math.PI; p.add(a); b.add(p); arms.push(p); }
    return { g, flash: [m], parts: { b, arms }, kind: 'floatBrute', h: 3 };
  },
  crab(def) {
    const g = new THREE.Group(), m = toon(def.color), m2 = toon(def.color2), b = new THREE.Group(); g.add(b);
    const body = mesh(G.sph(0.8, 16, 10), m, 0, 0.75, 0); body.scale.set(1.35, 0.55, 1); b.add(body);
    for (const s of [-1, 1]) { const st = mesh(G.cyl(0.04, 0.04, 0.35, 5), m, s * 0.25, 1.15, 0.5); b.add(st); const eb = mesh(G.sph(0.12, 10, 8), toon(0xffffff), s * 0.25, 1.36, 0.52); b.add(eb); eb.add(mesh(G.sph(0.06, 6, 5), basic(0x1b1626), 0, 0, 0.1, false)); }
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.95, 0.85, 0.5); const a = mesh(G.cyl(0.1, 0.08, 0.7, 6), m2, 0, 0, 0.35); a.rotation.x = Math.PI / 2; p.add(a);
      const cl = mesh(G.sph(0.32, 10, 8), m, 0, 0.05, 0.85); cl.scale.set(0.8, 0.6, 1.2); p.add(cl); const pin = mesh(G.cone(0.1, 0.4, 5), m, 0, 0.18, 1.15); pin.rotation.x = 1.4; p.add(pin); b.add(p); arms.push(p); }
    const legs = []; for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.8, 0.7, 0.1 - i * 0.35); const l = mesh(G.cyl(0.05, 0.04, 0.85, 5), m2, s * 0.3, -0.25, 0); l.rotation.z = s * 0.9; p.add(l); b.add(p); legs.push(p); }
    return { g, flash: [m], parts: { b, arms, legs }, kind: 'crab', h: 1.8 };
  },
  lurker(def) {
    const g = new THREE.Group(), m = toon(def.color), m2 = toon(def.color2), b = new THREE.Group(); g.add(b);
    const body = mesh(G.sph(0.62, 14, 12), m, 0, 1.45, 0.05); body.scale.set(1, 1.2, 0.9); body.rotation.x = 0.35; b.add(body);
    b.add(mesh(G.sph(0.42, 12, 10), m2, 0, 1.35, 0.32));
    const head = new THREE.Group(); head.position.set(0, 2.15, 0.45); b.add(head);
    const hs = mesh(G.sph(0.46, 14, 12), m); hs.scale.set(1.15, 0.85, 1); head.add(hs);
    head.add(mesh(G.box(0.6, 0.06, 0.05), basic(0x1b1626), 0, -0.12, 0.4, false));
    addEyes(head, 0xfff04a, { size: 0.2, x: 0.22, y: 0.2, z: 0.3, turn: 0.4, angry: true });
    for (let i = 0; i < 3; i++) { const f = mesh(G.cone(0.14, 0.45, 4), m2, 0, 1.9 - i * 0.3, -0.45); f.scale.set(0.3, 1, 1); f.rotation.x = -0.6; b.add(f); }
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.6, 1.85, 0.2); p.add(mesh(G.cyl(0.11, 0.09, 1.2, 8), m, 0, -0.6, 0)); p.add(mesh(G.sph(0.16, 8, 6), m2, 0, -1.25, 0)); b.add(p); arms.push(p); }
    const legs = [legPivot(b, -0.28, 0.9, 0, 0.15, 0.9, m), legPivot(b, 0.28, 0.9, 0, 0.15, 0.9, m)];
    return { g, flash: [m], parts: { head, arms, legs, b }, kind: 'brute', h: 2.8 };
  },
  yeti(def) {
    const g = new THREE.Group(), m = toon(def.color), face = toon(def.color2), b = new THREE.Group(); g.add(b);
    const body = mesh(G.sph(1.0, 16, 12), m, 0, 2.0, 0); body.scale.set(1, 1.15, 0.85); b.add(body);
    const head = new THREE.Group(); head.position.set(0, 3.25, 0.25); b.add(head);
    head.add(mesh(G.sph(0.58, 14, 12), m)); const fm = mesh(G.sph(0.38, 12, 10), face, 0, -0.05, 0.3); fm.scale.z = 0.6; head.add(fm);
    addEyes(head, 0x3a8aff, { size: 0.17, x: 0.15, y: 0.05, z: 0.5, turn: 0.3, angry: true, glow: true });
    for (const s of [-1, 1]) { const h = mesh(G.cone(0.12, 0.55, 6), toon(0xd8d0bc), s * 0.42, 0.42, 0); h.rotation.z = s * -0.6; head.add(h); }
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 1.0, 2.7, 0); p.add(mesh(G.cyl(0.28, 0.24, 1.7, 10), m, 0, -0.85, 0)); p.add(mesh(G.sph(0.32, 10, 8), face, 0, -1.75, 0)); b.add(p); arms.push(p); }
    const legs = [legPivot(b, -0.42, 1.1, 0, 0.3, 1.1, m), legPivot(b, 0.42, 1.1, 0, 0.3, 1.1, m)];
    return { g, flash: [m], parts: { head, arms, legs, b }, kind: 'brute', h: 4.2 };
  },
  imp(def) {
    const g = new THREE.Group(), m = toon(def.color), b = new THREE.Group(); g.add(b);
    b.add(mesh(G.sph(0.35, 12, 10), m, 0, 0.75, 0));
    const head = new THREE.Group(); head.position.set(0, 1.25, 0.05); b.add(head); head.add(mesh(G.sph(0.32, 14, 12), m));
    addEyes(head, 0xffd23a, { size: 0.15, x: 0.12, y: 0.03, z: 0.27, turn: 0.35, angry: true, glow: true });
    for (const s of [-1, 1]) { const h = mesh(G.cone(0.06, 0.3, 5), toon(0x2a1a14), s * 0.16, 0.3, -0.02); h.rotation.z = s * -0.4; head.add(h); const w = mesh(G.box(0.04, 0.4, 0.5), toon(0x6a1e18), s * 0.32, 0.9, -0.2); w.rotation.y = s * 0.6; b.add(w); }
    const fire = mesh(G.sph(0.14, 8, 6), basic(0xffa040), 0.35, 0.8, 0.2, false); b.add(fire);
    const legs = [legPivot(b, -0.13, 0.45, 0, 0.07, 0.45, m), legPivot(b, 0.13, 0.45, 0, 0.07, 0.45, m)];
    return { g, flash: [m], parts: { head, legs, b }, kind: 'small', h: 1.7 };
  },
  golem(def) {
    const g = new THREE.Group(), m = toon(def.color), em = basic(0xff6a2a), b = new THREE.Group(); g.add(b);
    const torso = mesh(new THREE.DodecahedronGeometry(1.3, 0), m, 0, 3.4, 0); torso.scale.set(1.1, 1, 0.8); b.add(torso);
    const core = mesh(new THREE.OctahedronGeometry(0.5), em, 0, 3.5, 0.95, false); core.userData.keep = true; b.add(core);
    const cg = mesh(G.sph(0.9, 10, 8), glow(0xff7a2a, 0.3), 0, 3.5, 0.9, false); cg.userData.noOutline = true; b.add(cg);
    const head = mesh(new THREE.DodecahedronGeometry(0.6, 0), m, 0, 5.0, 0.1); b.add(head);
    for (const s of [-1, 1]) head.add(mesh(G.box(0.2, 0.1, 0.05), em, s * 0.22, 0.05, 0.52, false));
    const arms = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 1.75, 4.3, 0); p.add(mesh(new THREE.DodecahedronGeometry(0.55, 0), m, 0, -0.5, 0), mesh(new THREE.DodecahedronGeometry(0.5, 0), m, 0, -1.4, 0), mesh(new THREE.DodecahedronGeometry(0.7, 0), m, 0, -2.3, 0)); b.add(p); arms.push(p); }
    const legs = [legPivot(b, -0.75, 2.3, 0, 0.45, 2.1, m), legPivot(b, 0.75, 2.3, 0, 0.45, 2.1, m)];
    return { g, flash: [m], parts: { arms, legs, b, core }, kind: 'brute', h: 6.2 };
  },
};
function buildMobModel(def, scale = 1, elite = false) {
  const r = MODELS[def.model](def);
  const g = r.g;
  if (def.model !== 'biped') bake(g);
  if (!r.noOutline && def.model !== 'biped') outline(g, 0.03);
  g.scale.setScalar(scale * (def.scale || 1));
  g.traverse((o) => { if (o.isMesh && !o.userData.noOutline && !(o.material && o.material.blending === THREE.AdditiveBlending)) o.castShadow = true; });
  if (elite) { const ring = mesh(new THREE.RingGeometry(0.9, 1.15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }), 0, 0.08, 0, false); ring.userData.noOutline = true; g.add(ring); r.parts.ring = ring; }
  return r;
}
function animMob(e, dt, moving, speed) {
  const p = e.parts, k = e.mk.kind; e.anim += dt * (moving ? 3 + speed * 1.4 : 2.5);
  const s = Math.sin(e.anim), wind = e.windup > 0 ? 1 - e.windup / e.T.windup : 0;
  if (p.ring) p.ring.rotation.y += dt;
  if (k === 'bounce') { const bb = Math.abs(Math.sin(e.anim * (moving ? 1.6 : 0.6))); if (e.windup > 0) { p.body.scale.set(1.3, 0.62, 1.3); p.body.position.y = 0.5; } else { p.body.position.y = 0.75 + bb * (moving ? 0.55 : 0.06); const q = Math.cos(e.anim * 2) * 0.1; p.body.scale.set(1 + q, 1 - q, 1 + q); } }
  else if (k === 'quad') { const a = moving ? s * 0.8 : 0; p.legs[0].rotation.x = a; p.legs[3].rotation.x = a; p.legs[1].rotation.x = -a; p.legs[2].rotation.x = -a; p.head.rotation.x = wind * 0.5; p.b.position.z = wind * 0.3; }
  else if (k === 'spider') { p.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(e.anim * 1.5 + i) * 0.35 : 0; }); p.b.position.y = wind * 0.3; }
  else if (k === 'biped') { animBiped(p, e.anim, moving, wind > 0 ? wind * 0.5 : (e.atkAnim >= 0 ? e.atkAnim : -1), e.mk.weaponAnim); if (e.atkAnim >= 0) { e.atkAnim += dt * 3; if (e.atkAnim > 1) e.atkAnim = -1; } }
  else if (k === 'brute' || k === 'floatBrute') {
    if (p.legs) { p.legs[0].rotation.x = moving ? s * 0.5 : 0; p.legs[1].rotation.x = moving ? -s * 0.5 : 0; }
    if (p.arms) { const up = -2.6 * wind; p.arms[0].rotation.x = e.windup > 0 ? up : moving ? -s * 0.4 : 0; p.arms[1].rotation.x = e.windup > 0 ? up : moving ? s * 0.4 : 0; }
    if (k === 'floatBrute') p.b.position.y = 0.4 + Math.sin(e.anim * 0.8) * 0.15;
    if (p.core) p.core.rotation.y += dt * 2;
  }
  else if (k === 'float') { p.b.position.y = 1.6 + Math.sin(e.anim) * 0.2; p.b.scale.setScalar(1 + wind * 0.3); }
  else if (k === 'crab') { p.legs.forEach((l, i) => { l.rotation.z = moving ? Math.sin(e.anim * 2 + i) * 0.3 : 0; }); p.arms.forEach((a) => { a.rotation.x = -wind * 1.1; }); }
  else if (k === 'small') { p.legs[0].rotation.x = moving ? s * 0.8 : 0; p.legs[1].rotation.x = moving ? -s * 0.8 : 0; p.b.position.y = Math.abs(Math.sin(e.anim)) * 0.1; }
}

/* ---------------- pets ---------------- */
function buildPet(kind) {
  if (kind === 'imp') return buildMobModel({ model: 'imp', color: 0xd8483a }, 1);
  if (kind === 'wolf') { const r = buildMobModel({ model: 'quad', color: 0x7ac8ff, color2: 0xd8f0ff, eye: 0xffffff, glowEyes: true }, 0.9); r.g.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshToonMaterial) o.material.emissive = new THREE.Color(0x1a4a7a); }); return r; }
  return buildMobModel({ model: 'golem', color: 0x3a2a2a }, 0.6);
}
