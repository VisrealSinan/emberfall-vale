/* Terrain, water, vegetation (chunked so far-away parts are skipped), towns, landmarks, gather nodes. */

const terrain = (() => {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), ix = Math.round((x + HALF) / STEP), iz = Math.round((z + HALF) / STEP), h = H[iz * (SEG + 1) + ix];
    pos.setY(i, h); groundColor(x, z, h, c); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, toon(0xffffff, { vertexColors: true })); m.receiveShadow = true; scene.add(m); return m;
})();
const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE * 2, SIZE * 2).rotateX(-Math.PI / 2), toon(0x4cb6ea, { transparent: true, opacity: 0.8 }));
water.position.y = 0; scene.add(water);

/* ---------------- chunked instancing ---------------- */
const CHUNK = 150, chunks = new Map();
function chunkOf(x, z) {
  const k = Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK);
  if (!chunks.has(k)) chunks.set(k, { x: (Math.floor(x / CHUNK) + 0.5) * CHUNK, z: (Math.floor(z / CHUNK) + 0.5) * CHUNK, groups: {}, meshes: [] });
  return chunks.get(k);
}
function addInst(group, x, y, z, s, ry, color, sy = 1) { chunkOf(x, z).groups[group] = chunkOf(x, z).groups[group] || []; chunkOf(x, z).groups[group].push({ x, y, z, s, ry, color, sy }); }
const dummy = new THREE.Object3D();
function outlineGeo(g, w) { const o = g.clone(); o.computeBoundingSphere(); const c = o.boundingSphere.center.clone(), r = o.boundingSphere.radius; o.translate(-c.x, -c.y, -c.z); o.scale((r + w) / r, (r + w) / r, (r + w) / r); o.translate(c.x, c.y, c.z); return o; }

const trunkGeo = G.cyl(0.2, 0.32, 2.4, 7).translate(0, 1.2, 0);
const roundGeo = mergeGeos([G.sph(1.6, 9, 7).translate(0, 3.6, 0), G.sph(1.15, 8, 6).translate(1.0, 3.1, 0.3), G.sph(1.2, 8, 6).translate(-0.9, 3.2, -0.4), G.sph(1.1, 8, 6).translate(0.1, 4.5, -0.2)]);
const pineGeo = mergeGeos([G.cone(1.7, 2.6, 8).translate(0, 2.4, 0), G.cone(1.3, 2.3, 8).translate(0, 3.7, 0), G.cone(0.85, 1.9, 8).translate(0, 4.9, 0)]);
const willowGeo = (() => { const parts = [G.sph(2.0, 12, 8).scale(1, 0.62, 1).translate(0, 3.9, 0)]; for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; parts.push(G.cone(0.38, 2.2, 5).rotateX(Math.PI).translate(Math.cos(a) * 1.7, 2.6, Math.sin(a) * 1.7)); } return mergeGeos(parts); })();
const deadGeo = mergeGeos([G.cyl(0.08, 0.16, 1.8, 5).rotateZ(0.9).translate(0.7, 2.4, 0), G.cyl(0.07, 0.14, 1.5, 5).rotateZ(-1.0).translate(-0.6, 2.8, 0.1), G.cyl(0.06, 0.12, 1.3, 5).rotateX(0.9).translate(0, 3.1, 0.5)]);
const rockGeo = new THREE.DodecahedronGeometry(1, 0);
const grassGeo = mergeGeos([G.cone(0.07, 0.7, 3).translate(0, 0.35, 0), G.cone(0.06, 0.55, 3).rotateZ(0.35).translate(0.12, 0.25, 0.02), G.cone(0.06, 0.6, 3).rotateZ(-0.3).translate(-0.1, 0.28, -0.05), G.cone(0.05, 0.5, 3).rotateX(0.3).translate(0, 0.24, 0.1)]);
const flowerGeo = mergeGeos([G.sph(0.16, 6, 4).translate(0, 0.45, 0), G.cyl(0.02, 0.02, 0.45, 3).translate(0, 0.22, 0)]);

const INST = {
  trunk: { geo: trunkGeo, mat: toon(0xffffff), shadow: true },
  trunkDark: { geo: trunkGeo, mat: toon(0xffffff), shadow: true },
  round: { geo: roundGeo, mat: toon(0xffffff), shadow: true, outline: 0.09 },
  pine: { geo: pineGeo, mat: toon(0xffffff), shadow: true, outline: 0.09 },
  willow: { geo: willowGeo, mat: toon(0xffffff), shadow: true, outline: 0.09 },
  dead: { geo: deadGeo, mat: toon(0xffffff), shadow: true },
  rock: { geo: rockGeo, mat: toon(0xffffff), shadow: true, outline: 0.07 },
  grass: { geo: grassGeo, mat: toon(0xffffff), shadow: false, near: true },
  flower: { geo: flowerGeo, mat: toon(0xffffff), shadow: false, near: true },
};
const TREE_PLAN = {
  vale: { n: 750, dens: 0.5, kinds: [['round', 0.55, () => tmpC.setHSL(rand(0.24, 0.31), rand(0.55, 0.7), rand(0.42, 0.5))], ['sakura', 0.45, () => tmpC.setHSL(rand(0.92, 0.97), rand(0.7, 0.85), rand(0.78, 0.86))]] },
  wood: { n: 1700, dens: 0.38, kinds: [['round', 0.55, () => tmpC.setHSL(rand(0.27, 0.34), rand(0.5, 0.65), rand(0.28, 0.38))], ['pine', 0.45, () => tmpC.setHSL(rand(0.36, 0.42), rand(0.45, 0.6), rand(0.22, 0.3))]] },
  marsh: { n: 480, dens: 0.45, kinds: [['willow', 0.7, () => tmpC.setHSL(rand(0.2, 0.26), rand(0.35, 0.5), rand(0.3, 0.4))], ['deadM', 0.3, () => tmpC.set(0x5a4a3a)]] },
  frost: { n: 900, dens: 0.42, kinds: [['pine', 1, () => tmpC.setHSL(rand(0.42, 0.5), rand(0.2, 0.35), rand(0.45, 0.62))]] },
  cinder: { n: 300, dens: 0.4, kinds: [['deadC', 1, () => tmpC.set(0x2e2626)]] },
};
(() => {
  for (const zid in TREE_PLAN) {
    const plan = TREE_PLAN[zid], Z = ZONE[zid]; let placed = 0;
    for (let k = 0; k < plan.n * 6 && placed < plan.n; k++) {
      const a = rand(0, 6.283), r = Math.sqrt(Math.random()) * Z.r * 1.25, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r;
      if (Math.abs(x) > HALF - 20 || Math.abs(z) > HALF - 20 || zoneAt(x, z) !== Z) continue;
      const h = groundAt(x, z); if (h < 1 || h > (zid === 'frost' ? 62 : 45)) continue;
      if (nearTown(x, z, 48) || roadDist(x, z) < 7 || nearPlace(x, z, 4)) continue;
      if (fbm(x * 0.02 + 40, z * 0.02) < plan.dens) continue;
      let roll = Math.random(), kind = plan.kinds[0]; for (const kd of plan.kinds) { if (roll < kd[1]) { kind = kd; break; } roll -= kd[1]; }
      const s = rand(0.8, 1.5) * (zid === 'wood' ? 1.2 : 1), ry = rand(0, 6.28), col = kind[2]().getHex(), y = h - 0.15;
      const nm = kind[0];
      if (nm === 'round' || nm === 'sakura') { addInst('trunk', x, y, z, s, ry, nm === 'sakura' ? 0x5a3a3a : 0x7a5236); addInst('round', x, y, z, s, ry, col, nm === 'sakura' ? 0.85 : 1); }
      else if (nm === 'pine') { addInst('trunk', x, y, z, s * 0.8, ry, 0x6a4a32); addInst('pine', x, y, z, s, ry, col); }
      else if (nm === 'willow') { addInst('trunk', x, y, z, s, ry, 0x5a4632); addInst('willow', x, y, z, s, ry, col); }
      else { addInst('trunkDark', x, y, z, s, ry, col); addInst('dead', x, y, z, s, ry, col); }
      addCollider(x, z, 0.45 * s); placed++;
    }
  }
  // rocks
  for (let k = 0; k < 900; k++) {
    const x = rand(-HALF + 15, HALF - 15), z = rand(-HALF + 15, HALF - 15), h = groundAt(x, z);
    if (h < -0.5 || nearTown(x, z, 45) || roadDist(x, z) < 6) continue;
    const zid = zoneAt(x, z).id, s = rand(0.4, 2);
    const col = zid === 'frost' ? tmpC.setHSL(0.6, 0.12, rand(0.62, 0.75)) : zid === 'cinder' ? tmpC.setHSL(0.02, 0.2, rand(0.22, 0.32)) : tmpC.setHSL(0.1, 0.08, rand(0.55, 0.68));
    addInst('rock', x, h + s * 0.25, z, s, rand(0, 6), col.getHex(), rand(0.6, 1));
    if (s > 1.2) addCollider(x, z, s * 0.85);
  }
  // grass and flowers
  for (let k = 0; k < 16000; k++) {
    const x = rand(-HALF + 10, HALF - 10), z = rand(-HALF + 10, HALF - 10), zid = zoneAt(x, z).id;
    if (zid === 'cinder' || zid === 'frost') continue;
    const h = groundAt(x, z); if (h < 0.8 || h > 32 || roadDist(x, z) < 4 || nearTown(x, z, 16)) continue;
    const c = zid === 'vale' ? tmpC.setHSL(rand(0.24, 0.3), 0.65, rand(0.42, 0.55)) : zid === 'wood' ? tmpC.setHSL(rand(0.28, 0.34), 0.55, rand(0.3, 0.42)) : tmpC.setHSL(rand(0.17, 0.22), 0.45, rand(0.38, 0.48));
    addInst('grass', x, h - 0.05, z, rand(0.8, 1.6), rand(0, 6), c.getHex());
    if (zid === 'vale' && Math.random() < 0.3) addInst('flower', x + rand(-1, 1), h - 0.05, z + rand(-1, 1), rand(0.8, 1.3), 0, pick([0xffffff, 0xffe066, 0xff9ac8, 0xb0a0ff, 0xff7a7a]));
  }
  for (const ch of chunks.values()) {
    for (const g in ch.groups) {
      const list = ch.groups[g], def = INST[g === 'sakura' ? 'round' : g]; if (!def) continue;
      const im = new THREE.InstancedMesh(def.geo, def.mat, list.length);
      list.forEach((p, i) => { dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.ry, 0); dummy.scale.set(p.s, p.s * p.sy, p.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); im.setColorAt(i, tmpC.setHex(p.color)); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = def.shadow; im.receiveShadow = true; im.frustumCulled = false; im.userData.near = !!def.near; im.userData.shadow = def.shadow;
      scene.add(im); ch.meshes.push(im);
      if (def.outline) {
        if (!def.ogeo) def.ogeo = outlineGeo(def.geo, def.outline);
        const om = new THREE.InstancedMesh(def.ogeo, OUTLINE, list.length);
        for (let i = 0; i < list.length; i++) { im.getMatrixAt(i, dummy.matrix); om.setMatrixAt(i, dummy.matrix); }
        om.frustumCulled = false; om.userData.outline = true; scene.add(om); ch.meshes.push(om);
      }
    }
  }
})();
function cullChunks(cx, cz) {
  const far = GFX === 'low' ? 220 : 320, near = GFX === 'low' ? 60 : 110, ol = GFX === 'low' ? 0 : 170;
  for (const ch of chunks.values()) {
    const d = Math.hypot(ch.x - cx, ch.z - cz) - CHUNK * 0.71;
    for (const m of ch.meshes) {
      m.visible = d < (m.userData.near ? near : m.userData.outline ? ol : far);
      if (m.userData.shadow) m.castShadow = d < 60;
    }
  }
  const pf = GFX === 'low' ? 200 : 280;
  for (const o of props) o.visible = Math.hypot(o.position.x - cx, o.position.z - cz) < pf;
  for (const nd of nodes) nd.g.visible = nd.on && Math.hypot(nd.x - cx, nd.z - cz) < 110;
}

/* ---------------- towns ---------------- */
const fires = [], props = [];
const addProp = (o) => { scene.add(o); props.push(o); return o; };
function roofGeo(w, len, hgt) { const g = G.cyl(1, 1, len, 3); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI); g.rotateY(Math.PI / 2); g.scale(1, hgt, w); return g; }
function house(style, x, z, rot, i) {
  const g = new THREE.Group(), h0 = groundAt(x, z);
  const roofCols = [0x3f7fd0, 0xd84a3a, 0x2fa89a, 0xe8833a, 0x7a5ad0];
  if (style === 'vale' || style === 'frost' || style === 'wood') {
    const wallC = style === 'vale' ? 0xfff2de : style === 'wood' ? 0x9a6a42 : 0xc4ccd8;
    const roofC = style === 'frost' ? 0xf4f8ff : style === 'wood' ? 0x4f8a42 : roofCols[i % roofCols.length];
    const w = mesh(G.box(5.6, 3.4, 4.4), toon(wallC), 0, 1.7, 0); w.receiveShadow = true; g.add(w);
    const base = mesh(G.box(6, 0.5, 4.8), toon(0x8a8478), 0, 0.1, 0); g.add(base);
    if (style !== 'frost') { const tc = toon(style === 'wood' ? 0x5a3a22 : 0x6a4a32); for (const sx of [-2.75, 2.75]) for (const sz of [-2.15, 2.15]) g.add(mesh(G.box(0.3, 3.4, 0.3), tc, sx, 1.7, sz)); g.add(mesh(G.box(5.7, 0.25, 0.3), tc, 0, 2.1, 2.2)); }
    const roof = mesh(roofGeo(3.4, 6.4, 2.6), toon(roofC), 0, 3.4 + 1.25, 0); g.add(roof);
    if (style === 'frost') g.add(mesh(G.box(6.6, 0.25, 0.4), toon(0x4a7ac8), 0, 3.45, 2.3));
    g.add(mesh(G.box(1.1, 2, 0.12), toon(0x5a3a22), 0, 1, 2.22));
    const winM = basic(0xffe6a0); for (const sx of [-1.7, 1.7]) g.add(mesh(G.box(0.9, 0.8, 0.1), winM, sx, 2, 2.22, false));
    g.add(mesh(G.box(0.7, 1.6, 0.7), toon(0x8a7a6a), 1.8, 5.4, -0.8));
  } else if (style === 'marsh') {
    const postC = toon(0x5a4632);
    for (const sx of [-2.2, 2.2]) for (const sz of [-1.8, 1.8]) g.add(mesh(G.cyl(0.15, 0.18, 2.4), postC, sx, 0.6, sz));
    g.add(mesh(G.box(5.2, 0.3, 4.2), toon(0x8a6a42), 0, 1.8, 0));
    g.add(mesh(G.cyl(2.1, 2.3, 2.6, 10), toon(0xc8b07a), 0, 3.1, 0));
    g.add(mesh(G.cone(3.2, 2.6, 10), toon(0xd9b85a), 0, 5.6, 0));
    g.add(mesh(G.box(1, 1.8, 0.2), toon(0x5a3a22), 0, 2.7, 2.15));
  } else {
    const tc = toon(i % 2 ? 0xd8743a : 0x9a3a2a);
    g.add(mesh(G.cone(3, 4.2, 8), tc, 0, 2.1, 0));
    g.add(mesh(G.cyl(0.08, 0.08, 5, 4), toon(0x4a3a2a), 0, 2.5, 0));
    g.add(mesh(G.box(1.2, 1.6, 0.1), toon(0x2a1a14), 0, 0.8, 2.25));
  }
  bake(g); outline(g, 0.06);
  g.position.set(x, h0, z); g.rotation.y = rot; addProp(g);
  addCollider(x, z, style === 'cinder' ? 2.6 : 3.2);
}
function campfire(x, z, big = false) {
  const g = new THREE.Group(), stone = toon(0x8a8680);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; g.add(mesh(G.sph(0.32, 6, 5), stone, Math.cos(a) * 1.1, 0.15, Math.sin(a) * 1.1)); }
  const f1 = mesh(G.cone(0.55, 1.5, 7), basic(0xff7a2a), 0, 0.9, 0, false), f2 = mesh(G.cone(0.3, 1, 7), basic(0xffe07a), 0, 0.75, 0, false);
  f1.userData.keep = true; g.add(f1, f2); bake(g); outline(g, 0.04);
  const l = new THREE.PointLight(0xff9a4a, big ? 1.4 : 1, big ? 30 : 20, 1.6); l.position.y = 1.8; g.add(l);
  g.position.set(x, groundAt(x, z), z); addProp(g); addCollider(x, z, 1.3); fires.push({ f: f1, l, base: big ? 1.4 : 1 });
}
function banner(x, z, col) {
  const g = new THREE.Group(); g.add(mesh(G.cyl(0.08, 0.1, 5, 6), toon(0x6a4a32), 0, 2.5, 0));
  const cloth = mesh(G.box(1.2, 2, 0.05), toon(col), 0.65, 3.6, 0); g.add(cloth); bake(g); outline(g, 0.03);
  g.position.set(x, groundAt(x, z), z); addProp(g);
}
function lamp(x, z) {
  const g = new THREE.Group(); g.add(mesh(G.cyl(0.07, 0.09, 3.2, 6), toon(0x3a3a46), 0, 1.6, 0));
  g.add(mesh(G.sph(0.28, 10, 8), basic(0xfff0b0), 0, 3.35, 0, false)); const h = mesh(G.sph(0.7, 10, 8), glow(0xffd88a, 0.25), 0, 3.35, 0, false); h.userData.noOutline = true; g.add(h);
  bake(g); outline(g, 0.03); g.position.set(x, groundAt(x, z), z); addProp(g);
}
for (const t of TOWNS) {
  const n = t.style === 'cinder' ? 5 : 7; const roadAng = Math.atan2(-t.z, -t.x);
  for (let i = 0; i < n; i++) {
    let a = (i / n) * 6.283 + 0.35; if (t.id !== 'emberfall' && Math.abs(lerpAngle(0, a - roadAng, 1)) < 0.4) a += 0.5;
    const r = rand(23, 29), x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
    house(t.style, x, z, Math.atan2(t.x - x, t.z - z), i);
  }
  campfire(t.x - 6, t.z + 4, true);
  const bc = { vale: 0xd84a3a, wood: 0x3f9a4c, marsh: 0xd9b85a, frost: 0x4a7ac8, cinder: 0xe8833a }[t.style];
  banner(t.x + 9, t.z - 9, bc); banner(t.x - 10, t.z - 8, bc);
  lamp(t.x + 12, t.z + 8); lamp(t.x - 13, t.z + 10); lamp(t.x + 2, t.z - 14);
}
// Emberfall well
{ const g = new THREE.Group(); g.add(mesh(G.cyl(1.2, 1.3, 1, 12), toon(0x9a958c), 0, 0.5, 0)); g.add(mesh(G.cone(1.7, 1.1, 4), toon(0x3f7fd0), 0, 3, 0)); for (const sx of [-1.1, 1.1]) g.add(mesh(G.box(0.15, 2.6, 0.15), toon(0x6b4a2f), sx, 1.3, 0)); outline(g, 0.04); g.position.set(9, groundAt(9, -3), -3); scene.add(g); addCollider(9, -3, 1.4); }

/* ---------------- landmarks ---------------- */
let lavaLight = null;
(() => {
  const P = PLACES;
  // bandit camp: tents and crates
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283, x = P.banditCamp.x + Math.cos(a) * 12, z = P.banditCamp.z + Math.sin(a) * 12; house('cinder', x, z, Math.atan2(P.banditCamp.x - x, P.banditCamp.z - z), i); }
  campfire(P.banditCamp.x, P.banditCamp.z);
  // thorn circle: standing stones
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, x = P.cultCamp.x + Math.cos(a) * 13, z = P.cultCamp.z + Math.sin(a) * 13; const s = mesh(G.box(1.4, rand(3, 5), 0.9), toon(0x6a6a7a), x, groundAt(x, z) + 1.6, z); s.rotation.y = a; outline(s, 0.05); addProp(s); addCollider(x, z, 1); }
  { const c = mesh(G.cyl(4, 4, 0.1, 24), glow(0xb05aff, 0.35), P.cultCamp.x, groundAt(P.cultCamp.x, P.cultCamp.z) + 0.1, P.cultCamp.z, false); addProp(c); }
  // silk hollow: webs and egg sacs
  for (let i = 0; i < 10; i++) { const x = P.silkHollow.x + rand(-18, 18), z = P.silkHollow.z + rand(-18, 18); const w = mesh(G.box(rand(3, 6), rand(2, 4), 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), x, groundAt(x, z) + 2, z, false); w.rotation.y = rand(0, 3); addProp(w); }
  for (let i = 0; i < 12; i++) { const x = P.silkHollow.x + rand(-16, 16), z = P.silkHollow.z + rand(-16, 16); const e = mesh(G.sph(rand(0.5, 0.9), 10, 8), toon(0xf0ead8), x, groundAt(x, z) + 0.5, z); e.scale.y = 1.3; outline(e, 0.04); addProp(e); }
  // rime hollow: ice spikes
  for (let i = 0; i < 16; i++) { const a = rand(0, 6.283), r = rand(10, 22), x = P.rimeHollow.x + Math.cos(a) * r, z = P.rimeHollow.z + Math.sin(a) * r; const s = mesh(G.cone(rand(0.6, 1.2), rand(3, 7), 6), toon(0xa8e0ff, { emissive: 0x1a3a5a }), x, groundAt(x, z) + 1.5, z); s.rotation.z = rand(-0.3, 0.3); outline(s, 0.05); addProp(s); }
  // molten ruins: pillars and lava
  const mr = P.moltenRuins, h0 = groundAt(mr.x, mr.z);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283, x = mr.x + Math.cos(a) * 16, z = mr.z + Math.sin(a) * 16, ph = i % 3 === 1 ? 2.5 : rand(4, 9); const p = mesh(G.cyl(0.9, 1, ph, 10), toon(0x8c8578), x, h0 + ph / 2, z); outline(p, 0.05); addProp(p); addCollider(x, z, 1.1); }
  const lava = mesh(G.cyl(5, 5, 0.2, 24), basic(0xff6a1a), mr.x + 8, h0 + 0.12, mr.z - 6, false); addProp(lava);
  lavaLight = new THREE.PointLight(0xff6a2a, 1.6, 40, 1.5); lavaLight.position.set(mr.x, h0 + 4, mr.z); scene.add(lavaLight);
  // drowning pool: dead trees
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, x = P.mawPool.x + Math.cos(a) * 18, z = P.mawPool.z + Math.sin(a) * 18; addInstLate('dead', x, z); }
  function addInstLate(kind, x, z) { const g = new THREE.Group(); g.add(new THREE.Mesh(trunkGeo, toon(0x3a3028)), new THREE.Mesh(deadGeo, toon(0x3a3028))); outline(g, 0.05); g.position.set(x, groundAt(x, z), z); g.scale.setScalar(1.4); addProp(g); }
})();

/* ---------------- gather nodes ---------------- */
const GATHER = {
  emberbloom: { name: 'Emberbloom', verb: 'Pick', zone: 'vale', n: 16, spread: 'zone' },
  crate: { name: 'Supply Crate', verb: 'Search', place: 'banditCamp', n: 7 },
  tome: { name: 'Cult Tome', verb: 'Take', place: 'cultCamp', n: 6 },
  glowcap: { name: 'Glowcap', verb: 'Pick', zone: 'marsh', n: 14, spread: 'zone' },
  shard: { name: 'Rimecrystal Shard', verb: 'Mine', place: 'rimeHollow', n: 8, alt: 'wraithField' },
  ore: { name: 'Cinder Ore', verb: 'Mine', zone: 'cinder', n: 14, spread: 'zone' },
};
const nodes = [];
function nodeModel(kind) {
  const g = new THREE.Group();
  if (kind === 'emberbloom') { g.add(mesh(G.cyl(0.04, 0.05, 0.6, 4), toon(0x3f8a2a), 0, 0.3, 0)); g.add(mesh(new THREE.OctahedronGeometry(0.28), toon(0xff5a3a, { emissive: 0xc8301a }), 0, 0.72, 0)); }
  else if (kind === 'crate') { g.add(mesh(G.box(1.1, 0.9, 0.9), toon(0xb07a42), 0, 0.45, 0)); g.add(mesh(G.box(1.15, 0.12, 0.95), toon(0x6a4a2a), 0, 0.7, 0)); }
  else if (kind === 'tome') { g.add(mesh(G.box(0.9, 0.8, 0.9), toon(0x6a6a7a), 0, 0.4, 0)); g.add(mesh(G.box(0.6, 0.15, 0.45), toon(0x7a2aa8, { emissive: 0x3a0a5a }), 0, 0.88, 0)); }
  else if (kind === 'glowcap') { g.add(mesh(G.cyl(0.1, 0.14, 0.6, 6), toon(0xe8e0c8), 0, 0.3, 0)); g.add(mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, 6.3, 0, 1.6), toon(0x4ad8ff, { emissive: 0x1a6a9a }), 0, 0.6, 0)); }
  else if (kind === 'shard') { for (let i = 0; i < 3; i++) { const c = mesh(G.cone(0.25, 1.2, 5), toon(0xa8e8ff, { emissive: 0x2a6a9a }), rand(-0.3, 0.3), 0.5, rand(-0.3, 0.3)); c.rotation.z = rand(-0.4, 0.4); g.add(c); } }
  else { g.add(mesh(new THREE.DodecahedronGeometry(0.8, 0), toon(0x4a3a36), 0, 0.5, 0)); g.add(mesh(G.box(0.3, 0.3, 0.3), basic(0xff8a3a), 0.4, 0.8, 0.3, false)); g.add(mesh(G.box(0.25, 0.25, 0.25), basic(0xff8a3a), -0.3, 0.6, 0.4, false)); }
  bake(g); outline(g, 0.04);
  const halo = mesh(G.sph(0.9, 10, 8), glow(kind === 'tome' ? 0xb05aff : kind === 'glowcap' || kind === 'shard' ? 0x7fd8ff : 0xffb05a, 0.18), 0, 0.6, 0, false); halo.userData.noOutline = true; g.add(halo);
  return g;
}
for (const kind in GATHER) {
  const def = GATHER[kind];
  for (let i = 0; i < def.n; i++) {
    let x, z;
    for (let k = 0; k < 60; k++) {
      if (def.place) { const p = PLACES[i % 2 && def.alt ? def.alt : def.place]; const a = rand(0, 6.283), r = rand(3, p.r); x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r; }
      else { const Z = ZONE[def.zone], a = rand(0, 6.283), r = rand(40, Z.r); x = Z.x + Math.cos(a) * r; z = Z.z + Math.sin(a) * r; }
      if (groundAt(x, z) > 0.6 && !nearTown(x, z, 35)) break;
    }
    const g = nodeModel(kind); g.position.set(x, groundAt(x, z), z); scene.add(g);
    nodes.push({ kind, x, z, g, on: true, t: 0 });
  }
}
