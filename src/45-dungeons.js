/* Dungeons: one per zone. Each is a separate underground area far outside the world map,
   entered through a gate in its zone. Rooms are rectangles; you can only walk inside them. */

const DUN_ORIGIN_X = 2000, DUN_SPACING = 400;
const DUNGEONS = [
  { id: 'hideout', name: 'Bandit Hideout', zone: 'vale', gate: 'hideoutGate', lv: [6, 8], floor: 0x8a7458, wall: 0x5e4a38, fog: 0x1c140e, light: 0xffb070, mobs: ['bandit', 'sharpshooter'], mini: 'enforcer', boss: 'redfang', deco: 'crates' },
  { id: 'webwood', name: 'Webwood Hollow', zone: 'wood', gate: 'webwoodGate', lv: [10, 12], floor: 0x3e5034, wall: 0x2a3a24, fog: 0x0e160c, light: 0xb8ff9a, mobs: ['spider', 'bat'], mini: 'webguard', boss: 'aranea', deco: 'web' },
  { id: 'temple', name: 'Sunken Temple', zone: 'marsh', gate: 'templeGate', lv: [13, 15], floor: 0x6a8a84, wall: 0x3e5e5a, fog: 0x0a1a1e, light: 0x7ae0ff, mobs: ['lurker', 'serpent', 'toad'], mini: 'templeguard', boss: 'hydra', deco: 'water' },
  { id: 'catacombs', name: 'Frozen Catacombs', zone: 'frost', gate: 'catacombGate', lv: [17, 19], floor: 0xa8b8cc, wall: 0x6a7a92, fog: 0x0c1426, light: 0x9ad8ff, mobs: ['wraith', 'skeleton', 'frostgolem'], mini: 'bonewarden', boss: 'frostlich', deco: 'ice' },
  { id: 'cinderheart', name: 'Heart of Cinder', zone: 'cinder', gate: 'cinderGate', lv: [21, 24], floor: 0x4e3a36, wall: 0x302424, fog: 0x200c06, light: 0xff8a4a, mobs: ['imp', 'hound', 'cgolem', 'scorpion'], mini: 'magmaw', boss: 'ignaroth', deco: 'lava' },
];
const DUN = { cur: null, mobs: [], done: false, chest: null, chestOpen: false, exit: null };
// Rooms and corridors in local coordinates: [minX, minZ, maxX, maxZ]. The path runs north (negative z).
const DUN_ROOMS = [[-10, -10, 10, 12], [-4, -52, 4, -8], [-20, -84, 20, -50], [16, -74, 62, -62], [60, -100, 98, -42], [73, -146, 81, -98], [48, -210, 108, -144]];
const DUN_PACKS = [{ x: -9, z: -62, n: 3 }, { x: 9, z: -76, n: 3 }, { x: 38, z: -68, n: 2 }, { x: 70, z: -56, n: 3 }, { x: 77, z: -120, n: 2 }, { x: 60, z: -158, n: 2 }, { x: 98, z: -160, n: 2 }];
const DUN_MINI = { x: 86, z: -82 }, DUN_BOSS = { x: 78, z: -186 }, DUN_START = { x: 0, z: 6 };
DUNGEONS.forEach((d, i) => { d.ox = DUN_ORIGIN_X + i * DUN_SPACING; d.oz = 0; });
const DUNGEON = Object.fromEntries(DUNGEONS.map((d) => [d.id, d]));
function dunAt(x) { if (x < DUN_ORIGIN_X - 150) return null; return DUNGEONS[Math.round((x - DUN_ORIGIN_X) / DUN_SPACING)] || null; }
function walkable(x, z) {
  const d = dunAt(x); if (!d) return true; const lx = x - d.ox, lz = z - d.oz;
  return DUN_ROOMS.some((r) => lx > r[0] + 0.7 && lx < r[2] - 0.7 && lz > r[1] + 0.7 && lz < r[3] - 0.7);
}

/* ---------------- interiors ---------------- */
function buildDungeon(d) {
  const root = new THREE.Group(); root.position.set(d.ox, 0, d.oz); root.visible = false;
  const floorM = toon(d.floor), wallM = toon(d.wall), trimM = toon(new THREE.Color(d.wall).multiplyScalar(0.7).getHex());
  for (const r of DUN_ROOMS) { const w = r[2] - r[0], l = r[3] - r[1]; const f = mesh(G.box(w + 1.4, 0.4, l + 1.4), floorM, (r[0] + r[2]) / 2, -0.2, (r[1] + r[3]) / 2, false); f.receiveShadow = true; root.add(f); }
  // walls: blocks around every room edge, skipped where another room joins
  const inOther = (x, z, self) => DUN_ROOMS.some((r) => r !== self && x > r[0] - 0.2 && x < r[2] + 0.2 && z > r[1] - 0.2 && z < r[3] + 0.2);
  const spots = [];
  for (const r of DUN_ROOMS) {
    const edges = [[r[0], r[1], r[2], r[1], 0, -1], [r[0], r[3], r[2], r[3], 0, 1], [r[0], r[1], r[0], r[3], -1, 0], [r[2], r[1], r[2], r[3], 1, 0]];
    for (const [x0, z0, x1, z1, nx, nz] of edges) {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 3));
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n + nx * 1.1, z = z0 + ((z1 - z0) * i) / n + nz * 1.1; if (inOther(x - nx * 1.6, z - nz * 1.6, r)) continue; spots.push([x, z, rand(3.5, 5.5)]); }
    }
  }
  const wg = new THREE.BoxGeometry(3.2, 1, 2.2), wall = new THREE.InstancedMesh(wg, wallM, spots.length), wo = new THREE.InstancedMesh(outlineGeo(wg, 0.08), OUTLINE, spots.length);
  spots.forEach(([x, z, h], i) => { dummy.position.set(x, h / 2, z); dummy.rotation.set(0, rand(-0.15, 0.15), 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); wall.setMatrixAt(i, dummy.matrix); wo.setMatrixAt(i, dummy.matrix); });
  wall.castShadow = true; wall.receiveShadow = true; root.add(wall, wo);
  // torches and pillars
  const flameM = basic(d.light), poleM = toon(0x3a2a22);
  for (const r of DUN_ROOMS) {
    const big = (r[2] - r[0]) > 20;
    for (const [x, z] of [[r[0] + 1.2, r[1] + 1.2], [r[2] - 1.2, r[3] - 1.2], [r[0] + 1.2, r[3] - 1.2], [r[2] - 1.2, r[1] + 1.2]]) {
      if (!big && Math.random() < 0.5) continue;
      const t = new THREE.Group(); t.add(mesh(G.cyl(0.08, 0.1, 2.2, 6), poleM, 0, 1.1, 0), mesh(G.cone(0.22, 0.6, 6), flameM, 0, 2.45, 0, false));
      const h = mesh(G.sph(0.7, 10, 8), glow(d.light, 0.22), 0, 2.45, 0, false); h.userData.noOutline = true; t.add(h); t.position.set(x, 0, z); root.add(t);
    }
    if (big) for (let i = 0; i < 2; i++) { const p = mesh(G.cyl(0.8, 1, 6, 10), trimM, lerp(r[0], r[2], 0.3 + i * 0.4), 3, lerp(r[1], r[3], 0.5)); p.userData.isPillar = true; root.add(p); }
  }
  // theme decoration
  const decoN = 26;
  for (let i = 0; i < decoN; i++) {
    const r = pick(DUN_ROOMS.slice(2)), x = rand(r[0] + 2, r[2] - 2), z = rand(r[1] + 2, r[3] - 2);
    if (d.deco === 'web') { const w = mesh(G.box(rand(2, 4), rand(2, 3.5), 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }), x, 2, z, false); w.rotation.y = rand(0, 3); root.add(w); }
    else if (d.deco === 'water') { const w = mesh(G.cyl(rand(1.5, 3), rand(1.5, 3), 0.05, 16), toon(0x3a9ad8, { transparent: true, opacity: 0.7 }), x, 0.03, z, false); root.add(w); }
    else if (d.deco === 'ice') { const s = mesh(G.cone(rand(0.3, 0.6), rand(1.5, 3), 6), toon(0xbfe8ff, { emissive: 0x1a3a5a }), x, 0.8, z); s.rotation.z = rand(-0.3, 0.3); root.add(s); }
    else if (d.deco === 'lava') { const l = mesh(G.cyl(rand(1, 2.4), rand(1, 2.4), 0.06, 16), basic(0xff6a1a), x, 0.04, z, false); root.add(l); }
    else { const c = mesh(G.box(1.1, 0.9, 0.9), toon(0xa0703e), x, 0.45, z); c.rotation.y = rand(0, 3); root.add(c); }
  }
  root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !o.userData.noOutline && !(o.material && o.material.transparent) && o.material !== OUTLINE && o.material.isMeshToonMaterial) outline(o, 0.05); });
  scene.add(root); d.root = root;
}
DUNGEONS.forEach(buildDungeon);

/* ---------------- gates in the world ---------------- */
function portalModel(color, scale = 1) {
  const g = new THREE.Group(), stone = toon(0x7a7a86);
  for (const s of [-1, 1]) g.add(mesh(G.box(1, 5, 1), stone, s * 2.2, 2.5, 0));
  g.add(mesh(G.box(5.6, 0.9, 1.2), stone, 0, 5.2, 0));
  const disc = mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 2.5, 0, false);
  disc.scale.y = 1.25; disc.userData.noOutline = true; g.add(disc);
  const ring = mesh(new THREE.TorusGeometry(1.95, 0.12, 8, 32), basic(color), 0, 2.5, 0, false); ring.scale.y = 1.25; g.add(ring);
  bake(g); outline(g, 0.05); g.scale.setScalar(scale); g.userData.disc = disc; return g;
}
const gates = DUNGEONS.map((d) => { const p = PLACES[d.gate], g = portalModel(d.light); g.position.set(p.x, groundAt(p.x, p.z), p.z); g.rotation.y = Math.atan2(-p.x, -p.z); addProp(g); return { d, g, x: p.x, z: p.z }; });

/* ---------------- entering and leaving ---------------- */
const dunLight = new THREE.PointLight(0xffb070, 0, 36, 1.3); scene.add(dunLight);
function enterDungeon(d) {
  if (DUN.cur) return;
  closeAllWindows();
  const f = $('fade'); f.textContent = `Entering ${d.name}…`; f.classList.add('on');
  setTimeout(() => {
    DUN.cur = d; DUN.done = false; DUN.chestOpen = false; d.root.visible = true;
    for (const pk of DUN_PACKS) for (let i = 0; i < pk.n; i++) dunMob(pick(d.mobs), d.ox + pk.x + rand(-3, 3), d.oz + pk.z + rand(-3, 3), { lvl: randi(d.lv[0], d.lv[1]), elite: Math.random() < 0.35 });
    dunMob(NAMED[d.mini].base, d.ox + DUN_MINI.x, d.oz + DUN_MINI.z, { named: d.mini });
    DUN.boss = dunMob(NAMED[d.boss].base, d.ox + DUN_BOSS.x, d.oz + DUN_BOSS.z, { named: d.boss });
    DUN.exit = portalModel(d.light, 0.7); DUN.exit.position.set(d.ox + DUN_START.x, 0, d.oz + DUN_START.z + 4.5); scene.add(DUN.exit);
    P.x = d.ox + DUN_START.x; P.z = d.oz + DUN_START.z; P.y = 0; P.vy = 0; P.face = Math.PI; camYaw = 0; target = null; P.autoAtk = false;
    for (const p of pets) { p.x = P.x + 1; p.z = P.z + 1; }
    camLook.set(P.x, P.y + 1.7, P.z); dunLight.color.setHex(d.light); dunLight.intensity = 1.15;
    lastZone = null; toast(`${d.name}: recommended level ${d.lv[0]}-${d.lv[1]}. Defeat ${NAMED[d.boss].name}.`);
    setTimeout(() => f.classList.remove('on'), 300);
  }, 650);
}
function dunMob(type, x, z, o) {
  const e = spawnEnemy(type, x, z, o); e.dungeon = true; e.respawn = 1e9; e.T.leash = 400;
  if (!o.named) { e.maxHp = e.hp = Math.round(e.maxHp * 1.3); }
  DUN.mobs.push(e); return e;
}
function leaveDungeon(toGate = true) {
  const d = DUN.cur; if (!d) return;
  for (const e of DUN.mobs) { scene.remove(e.g); const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }
  DUN.mobs = []; d.root.visible = false;
  for (const o of [DUN.exit, DUN.chest, DUN.exit2]) if (o) scene.remove(o);
  DUN.exit = DUN.chest = DUN.exit2 = null; DUN.cur = null; dunLight.intensity = 0; target = null; P.autoAtk = false;
  if (toGate) { const g = PLACES[d.gate], L = Math.hypot(g.x, g.z); P.x = g.x - (g.x / L) * 7; P.z = g.z - (g.z / L) * 7; P.y = groundAt(P.x, P.z); camLook.set(P.x, P.y + 1.7, P.z); }
  for (const p of pets) { p.x = P.x + 1; p.z = P.z + 1; }
  skyDome.visible = true; for (const c of clouds) c.visible = true; stars.visible = true; scene.background = null;
  lastZone = null;
}
function updateDungeon(dt) {
  for (const g of gates) if (g.g.visible) g.g.userData.disc.rotation.z += dt;
  const d = DUN.cur; if (!d) return;
  dunLight.position.set(P.x, P.y + 4, P.z);
  if (DUN.exit) DUN.exit.userData.disc.rotation.z += dt;
  for (const e of DUN.mobs) if (e.boss && !e.dead && !e._adds && e.hp < e.maxHp * 0.5 && e.def.adds) {
    e._adds = true; toast(`${e.name} calls for help!`);
    for (let i = 0; i < 2; i++) { const a = dunMob(e.def.adds, e.x + rand(-4, 4), e.z + rand(-4, 4), { lvl: e.lvl - 1 }); aggro(a); }
  }
  if (!DUN.done && DUN.boss && DUN.boss.dead) {
    DUN.done = true; bannerMsg('Dungeon complete!'); toast(`You cleared ${d.name}! Open the chest for your reward.`);
    const c = new THREE.Group(); c.add(mesh(G.box(1.6, 1, 1.1), toon(0xc8902a), 0, 0.5, 0), mesh(G.box(1.7, 0.35, 1.2), toon(0xffd479), 0, 1.1, 0), mesh(G.box(0.3, 0.3, 0.1), basic(0xffffff), 0, 0.8, 0.6, false));
    const h = mesh(G.sph(1.4, 10, 8), glow(0xffd479, 0.25), 0, 0.8, 0, false); h.userData.noOutline = true; c.add(h); outline(c, 0.04);
    c.position.set(d.ox + DUN_BOSS.x, 0, d.oz + DUN_BOSS.z - 8); scene.add(c); DUN.chest = c;
    DUN.exit2 = portalModel(d.light, 0.7); DUN.exit2.position.set(d.ox + DUN_BOSS.x + 8, 0, d.oz + DUN_BOSS.z - 14); scene.add(DUN.exit2);
  }
  if (DUN.exit2) DUN.exit2.userData.disc.rotation.z += dt;
}
function openChest() {
  if (DUN.chestOpen) return; DUN.chestOpen = true; const d = DUN.cur;
  const g = Math.round(d.lv[1] * rand(12, 18)); P.gold += g; toast(`You find ${g} gold.`);
  for (const src of ['boss', 'elite']) { const it = genItem(d.lv[1] + 1, rollRarity(src), pick(GEAR_SLOTS), CH.cls, d.zone); if (addItem(it)) toast(`You receive loot: <span class="q${it.rarity}">[${esc(it.name)}]</span>`, true); }
  P.potions += 2; if (DUN.chest) DUN.chest.children[1].rotation.x = -1; saveChar();
}
function dungeonEnv() {
  const d = DUN.cur; skyDome.visible = false; for (const c of clouds) c.visible = false; stars.visible = false;
  if (!scene.background) scene.background = new THREE.Color(); scene.background.setHex(d.fog);
  scene.fog.color.setHex(d.fog); scene.fog.near = 22; scene.fog.far = 105;
  hemi.intensity = 0.42; hemi.color.setHex(d.light); sun.intensity = 0.32; sun.color.setHex(0xffffff);
}
function drawDungeonMap(x, W, s) {
  const d = DUN.cur, span = 160, toM = (wx, wz) => [((wx - P.x) / span + 0.5) * W, ((wz - P.z) / span + 0.5) * W];
  x.fillStyle = hex(d.fog); x.fillRect(0, 0, W, W);
  x.fillStyle = hex(d.floor);
  for (const r of DUN_ROOMS) { const [a, b] = toM(d.ox + r[0], d.oz + r[1]), [c, e] = toM(d.ox + r[2], d.oz + r[3]); x.fillRect(a, b, c - a, e - b); }
  for (const e of DUN.mobs) { if (e.dead) continue; const [a, b] = toM(e.x, e.z); x.fillStyle = e.boss ? '#ff5a2a' : e.elite ? '#ffd479' : '#ff6a6a'; x.beginPath(); x.arc(a, b, (e.boss ? 4 : e.elite ? 2.6 : 1.8) * s, 0, 7); x.fill(); }
}
