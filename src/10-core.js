/* Core helpers, world layout, height map, renderer, cel-shading and sky. */

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerpAngle = (a, b, t) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let _uid = Date.now() % 1e7;
const uid = () => (++_uid).toString(36) + Math.floor(Math.random() * 1296).toString(36);
const IS_APP = /Electron/i.test(navigator.userAgent);
const isTouch = () => document.body.classList.contains('touch');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
let GFX = 'high';
try { const q = new URLSearchParams(location.search).get('gfx'); GFX = q || store.get('ev-gfx', 'high'); } catch (e) {}

/* ---------------- world layout ---------------- */
const SIZE = 1200, HALF = SIZE / 2, SEG = 300, STEP = SIZE / SEG;
const ZONES = [
  { id: 'vale', name: 'Emberfall Vale', lv: [1, 7], x: 0, z: 0, r: 200, sub: 'Meadows, cherry blossoms and a village in need' },
  { id: 'wood', name: 'Whisperwood', lv: [6, 11], x: -380, z: 40, r: 190, sub: 'An old forest where the trees still listen' },
  { id: 'marsh', name: 'Mirefen Marsh', lv: [9, 14], x: 30, z: 380, r: 185, sub: 'Reeds, black water and things that lurk below' },
  { id: 'frost', name: 'Frostpeak Highlands', lv: [13, 18], x: -20, z: -385, r: 195, sub: 'Snowfields under the high peaks' },
  { id: 'cinder', name: 'Cinderwaste', lv: [17, 23], x: 385, z: -60, r: 190, sub: 'Ash plains around the burning ruins' },
];
const ZONE = Object.fromEntries(ZONES.map((z) => [z.id, z]));
const TOWNS = [
  { id: 'emberfall', name: 'Emberfall Village', zone: 'vale', x: 0, z: 0, style: 'vale' },
  { id: 'thornhold', name: 'Thornhold', zone: 'wood', x: -310, z: 50, style: 'wood' },
  { id: 'reedwater', name: 'Reedwater', zone: 'marsh', x: 20, z: 305, style: 'marsh' },
  { id: 'frostwatch', name: 'Frostwatch', zone: 'frost', x: -30, z: -305, style: 'frost' },
  { id: 'ashfall', name: 'Ashfall Camp', zone: 'cinder', x: 305, z: -50, style: 'cinder' },
];
const TOWN = Object.fromEntries(TOWNS.map((t) => [t.id, t]));
// Named places used by spawns and quests. Each one is flattened a little.
const PLACES = {
  banditCamp: { x: 125, z: -95, r: 26, name: 'Bandit Camp' },
  boarField: { x: -90, z: 70, r: 40 },
  wolfDen: { x: 120, z: 110, r: 36 },
  slimeMeadow: { x: 40, z: -60, r: 50 },
  cultCamp: { x: -440, z: -40, r: 26, name: 'Thorn Circle' },
  silkHollow: { x: -460, z: 140, r: 28, name: 'Silk Hollow' },
  oldGrove: { x: -380, z: 160, r: 40 },
  crabShore: { x: 120, z: 360, r: 40 },
  lurkerReeds: { x: -60, z: 420, r: 45 },
  mawPool: { x: 90, z: 470, r: 28, name: 'The Drowning Pool' },
  wraithField: { x: 80, z: -420, r: 45 },
  yetiCaves: { x: -130, z: -440, r: 40 },
  rimeHollow: { x: -40, z: -500, r: 28, name: 'Rime Hollow' },
  impFlats: { x: 390, z: 20, r: 45 },
  boneYard: { x: 430, z: -110, r: 40 },
  moltenRuins: { x: 470, z: -190, r: 30, name: 'Molten Ruins' },
};
const ROADS = TOWNS.slice(1).map((t) => [TOWNS[0], t]).concat([[TOWN.ashfall, PLACES.moltenRuins]]);

function hash(i, j) { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, o = 5) { let s = 0, a = 0.5, f = 1; for (let k = 0; k < o; k++) { s += a * noise(x * f, z * f); f *= 2.03; a *= 0.5; } return s; }
const ridged = (x, z) => 1 - Math.abs(2 * fbm(x, z, 4) - 1);
function segDist(px, pz, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
  const t = clamp(((px - a.x) * dx + (pz - a.z) * dz) / l2, 0, 1);
  return Math.hypot(px - (a.x + dx * t), pz - (a.z + dz * t));
}
const roadDist = (x, z) => { let m = 1e9; for (const [a, b] of ROADS) m = Math.min(m, segDist(x, z, a, b)); return m; };

const _zw = new Float32Array(ZONES.length);
function zoneWeights(x, z) {
  let sum = 0;
  for (let i = 0; i < ZONES.length; i++) { const Z = ZONES[i]; const d = Math.hypot(x - Z.x, z - Z.z) / Z.r; _zw[i] = Math.exp(-5 * d); sum += _zw[i]; }
  for (let i = 0; i < ZONES.length; i++) _zw[i] /= sum || 1;
  return _zw;
}
function zoneAt(x, z) {
  let best = ZONES[0], bd = 1e9;
  for (const Z of ZONES) { const d = Math.hypot(x - Z.x, z - Z.z) / Z.r; if (d < bd) { bd = d; best = Z; } }
  return best;
}
const ZH = {
  vale: (x, z) => 3 + (fbm(x * 0.011 + 3.7, z * 0.011 - 1.3) - 0.45) * 26 + Math.max(0, fbm(x * 0.006 + 9, z * 0.006 + 4) - 0.55) * 90,
  wood: (x, z) => 6 + (fbm(x * 0.008 + 11, z * 0.008 + 7) - 0.45) * 38,
  marsh: (x, z) => 0.7 + (fbm(x * 0.03 + 21, z * 0.03 - 5, 3) - 0.5) * 5 + (fbm(x * 0.006, z * 0.006, 3) - 0.5) * 7,
  frost: (x, z) => 8 + Math.pow(ridged(x * 0.006 + 2, z * 0.006 + 8), 2.6) * 46 * smooth(0.35, 0.65, fbm(x * 0.004 + 5, z * 0.004 - 3, 3)) + (fbm(x * 0.02, z * 0.02, 3) - 0.5) * 7,
  cinder: (x, z) => { const t = (fbm(x * 0.009 + 31, z * 0.009 + 2) - 0.38) * 26; const s = Math.floor(t / 4) * 4 + smooth(0.6, 1, (t / 4) - Math.floor(t / 4)) * 4; return Math.max(2.5, 5 + s); },
};
function heightRaw(x, z) {
  const w = zoneWeights(x, z); let h = 0;
  for (let i = 0; i < ZONES.length; i++) if (w[i] > 0.002) h += w[i] * ZH[ZONES[i].id](x, z);
  const r = Math.hypot(x, z);
  h += Math.max(0, r - 535) * 1.4;
  return h;
}
const FLATS = [];
for (const t of TOWNS) FLATS.push({ x: t.x, z: t.z, r: 46, h: Math.max(2.5, heightRaw(t.x, t.z)) });
for (const k in PLACES) { const p = PLACES[k]; if (p.name) FLATS.push({ x: p.x, z: p.z, r: p.r + 10, h: Math.max(2.5, heightRaw(p.x, p.z)) }); }
function heightAt(x, z) {
  let h = heightRaw(x, z);
  const rd = roadDist(x, z);
  if (rd < 7) { const k = 1 - smooth(4, 7, rd); h = Math.max(h, 1.5 * k + h * (1 - k)); }
  for (const f of FLATS) { const d = Math.hypot(x - f.x, z - f.z); if (d < f.r) h = lerp(f.h, h, smooth(f.r * 0.55, f.r, d)); }
  return h;
}
const H = new Float32Array((SEG + 1) * (SEG + 1));
for (let iz = 0; iz <= SEG; iz++) for (let ix = 0; ix <= SEG; ix++) H[iz * (SEG + 1) + ix] = heightAt(-HALF + ix * STEP, -HALF + iz * STEP);
function groundAt(x, z) {
  const gx = clamp((x + HALF) / STEP, 0, SEG - 1e-4), gz = clamp((z + HALF) / STEP, 0, SEG - 1e-4);
  const ix = Math.floor(gx), iz = Math.floor(gz), u = gx - ix, v = gz - iz, W = SEG + 1;
  const ha = H[iz * W + ix], hd = H[iz * W + ix + 1], hb = H[(iz + 1) * W + ix], hc = H[(iz + 1) * W + ix + 1];
  return u + v <= 1 ? ha + (hd - ha) * u + (hb - ha) * v : hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
}

const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
const ZCOL = {
  vale: (h, n, c) => h < 0.7 ? c.set(0xe8d08a) : h > 34 ? c.set(0xb8b2a8).lerp(tmpC2.set(0xffffff), smooth(44, 60, h)) : c.set(0x6cc24a).lerp(tmpC2.set(0x96d65a), n),
  wood: (h, n, c) => h < 0.7 ? c.set(0xc9b98a) : h > 36 ? c.set(0x8e9a84) : c.set(0x3f9a4c).lerp(tmpC2.set(0x67b44e), n),
  marsh: (h, n, c) => h < 0.4 ? c.set(0x6a5a3e) : c.set(0x7d9a52).lerp(tmpC2.set(0x9aa85e), n),
  frost: (h, n, c) => h < 0.7 ? c.set(0xb8cce0) : c.set(0xdde7f3).lerp(tmpC2.set(0xb8cbe6), n).lerp(tmpC2.set(0x7a889c), smooth(0.5, 0.9, noise(h * 0.3, n * 9)) * 0.45),
  cinder: (h, n, c) => c.set(0x6e5d5a).lerp(tmpC2.set(0xa0503e), smooth(0.45, 0.85, n)).lerp(tmpC2.set(0x3d3233), smooth(0.6, 1, noise(h, n * 4)) * 0.5),
};
function groundColor(x, z, h, c) {
  const w = zoneWeights(x, z), n = noise(x * 0.07, z * 0.07);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < ZONES.length; i++) { if (w[i] < 0.01) continue; ZCOL[ZONES[i].id](h, n, tmpC); r += tmpC.r * w[i]; g += tmpC.g * w[i]; b += tmpC.b * w[i]; }
  c.setRGB(r, g, b);
  const rd = roadDist(x, z);
  if (rd < 5) c.lerp(tmpC.set(0xc49a64), 1 - smooth(2.5, 5, rd));
  for (const t of TOWNS) { const d = Math.hypot(x - t.x, z - t.z); if (d < 22) c.lerp(tmpC.set(t.style === 'frost' ? 0xd6dee8 : t.style === 'cinder' ? 0x7a6a62 : 0xb89466), 1 - smooth(14, 22, d)); }
  return c;
}

/* ---------------- renderer ---------------- */
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: GFX !== 'low' });
renderer.setPixelRatio(GFX === 'high' ? Math.min(devicePixelRatio, 2) : 1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = GFX !== 'low';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1500);
scene.fog = new THREE.Fog(0xcfe9ff, 110, 380);
const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x6a7a58, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 0.9);
sun.castShadow = GFX !== 'low';
sun.shadow.mapSize.set(GFX === 'high' ? 2048 : 1024, GFX === 'high' ? 2048 : 1024);
Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 });
sun.shadow.bias = -0.0006;
scene.add(sun); scene.add(sun.target);

/* ---------------- art styles ---------------- */
const STYLES = {
  bright: { name: 'Bright Anime', grad: [88, 150, 205, 235], ink: 0x1b1626, tint: 0xffffff, day: [0x3a9cff, 0xb8dcff], dusk: [0x5a5aa8, 0xffb08a], night: [0x0a1030, 0x28305a], hemi: 1, sun: 1, sunCol: 0xfff4e0, fog: 1, css: '' },
  painted: { name: 'Painted Meadow', grad: [125, 150, 175, 200, 222, 240], ink: 0x5a4636, tint: 0xfff0d8, day: [0x7ab4e8, 0xf6e8d0], dusk: [0x8a6aa8, 0xffc890], night: [0x1a1a3a, 0x3a3a5a], hemi: 1.2, sun: 0.8, sunCol: 0xffdca8, fog: 0.7, css: 'saturate(0.78) sepia(0.2) contrast(0.9) brightness(1.05)' },
  crisp: { name: 'Crisp Cel', grad: [105, 250], ink: 0x0c0c16, tint: 0xf2f8ff, day: [0x1468ff, 0x9ed2ff], dusk: [0x3a4ab8, 0xff9a7a], night: [0x060a24, 0x1a2250], hemi: 0.8, sun: 1.4, sunCol: 0xffffff, fog: 1.4, css: 'saturate(1.3) contrast(1.15)' },
  twilight: { name: 'Twilight Festival', grad: [70, 130, 195, 240], ink: 0x1a1030, tint: 0xffe2cc, day: [0x3a9cff, 0xb8dcff], dusk: [0x4a3aa8, 0xff9a6a], night: [0x0a1030, 0x28305a], hemi: 1.05, sun: 1.1, sunCol: 0xfff4e0, fog: 0.9, lockT: 0.615, css: 'saturate(1.15)' },
  moonlit: { name: 'Moonlit Night', grad: [70, 120, 190, 235], ink: 0x0a0a20, tint: 0xd8e4ff, day: [0x3a9cff, 0xb8dcff], dusk: [0x4a3aa8, 0xff9a6a], night: [0x101c58, 0x3a4a90], hemi: 1.6, sun: 1, sunCol: 0xfff4e0, fog: 0.8, lockT: 0.86, css: 'brightness(1.2) saturate(1.1)' },
};
let STYLE_ID = 'bright';
try { const q = new URLSearchParams(location.search).get('style'); STYLE_ID = STYLES[q] ? q : STYLES[store.get('ev-style', 'bright')] ? store.get('ev-style', 'bright') : 'bright'; } catch (e) {}
const ST = STYLES[STYLE_ID];
if (ST.css) canvas.style.filter = ST.css;

/* ---------------- cel shading ---------------- */
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array(ST.grad), ST.grad.length, 1, THREE.LuminanceFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
const toon = (color, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: GRAD }, o));
const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));
const glow = (color, opacity = 0.35) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
const OUTLINE = new THREE.MeshBasicMaterial({ color: ST.ink, side: THREE.BackSide });
// Ink outline: a slightly larger back-faced copy of each mesh.
function outline(root, w = 0.03) {
  const list = [];
  root.traverse((o) => { if (o.isMesh && !o.userData.noOutline && !o.userData.isOutline && !(o.material && o.material.transparent)) list.push(o); });
  for (const m of list) {
    const g = m.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    const r = g.boundingSphere.radius || 1, s = (r + w) / r;
    const om = new THREE.Mesh(g, OUTLINE); om.userData.isOutline = true; om.scale.setScalar(s);
    om.position.copy(g.boundingSphere.center).multiplyScalar(1 - s);
    m.add(om);
  }
  return root;
}
const G = {
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs),
  cyl: (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
};
function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; return m; }
// Join several geometries into one (used for tree canopies and grass tufts).
function mergeGeos(list) {
  const parts = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const withUv = parts.every((p) => p.attributes.uv);
  let n = 0; for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = withUv ? new Float32Array(n * 2) : null; let o = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); if (uv) uv.set(p.attributes.uv.array, o * 2); o += p.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere(); return g;
}
// Merge sibling meshes that share a material into one mesh (fewer draw calls).
// Groups (animated limbs) are kept and baked recursively; meshes with children or userData.keep are left alone.
function bake(parent) {
  const byMat = new Map();
  for (const c of parent.children.slice()) {
    if (c.isMesh && !c.children.length && !c.userData.keep) { const k = c.material.uuid; if (!byMat.has(k)) byMat.set(k, []); byMat.get(k).push(c); }
    else if (c.children && c.children.length) bake(c);
  }
  for (const list of byMat.values()) {
    if (list.length < 2) continue;
    const geos = list.map((m) => { m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); return g; });
    const mm = new THREE.Mesh(mergeGeos(geos), list[0].material);
    mm.castShadow = list.some((m) => m.castShadow); mm.userData.noOutline = list.every((m) => m.userData.noOutline);
    for (const m of list) parent.remove(m);
    parent.add(mm);
  }
  return parent;
}

/* ---------------- sky ---------------- */
const skyU = { top: { value: new THREE.Color(0x4aa8ff) }, hor: { value: new THREE.Color(0xd8f0ff) }, bot: { value: new THREE.Color(0xa8c8e0) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(0xfff2c8) } };
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP;
    void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, smoothstep(0.0, 0.55, h)) : mix(hor, bot, smoothstep(0.0, 0.25, -h));
      float s = max(dot(normalize(vP), normalize(sunDir)), 0.0);
      c += sunCol * (pow(s, 900.0) * 1.6 + pow(s, 12.0) * 0.25);
      gl_FragColor = vec4(c, 1.0); }`,
}));
skyDome.renderOrder = -10; scene.add(skyDome);

function cloudTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const puffs = []; for (let i = 0; i < 9; i++) puffs.push([rand(50, 206), rand(58, 82), rand(22, 42)]);
  x.fillStyle = '#c9dcf2'; for (const [px, py, r] of puffs) { x.beginPath(); x.arc(px, py + 8, r, 0, 7); x.fill(); }
  x.fillStyle = '#ffffff'; for (const [px, py, r] of puffs) { x.beginPath(); x.arc(px - 3, py - 3, r * 0.92, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); return t;
}
const clouds = [];
{
  const texs = [cloudTexture(), cloudTexture(), cloudTexture()];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: pick(texs), transparent: true, fog: false, depthWrite: false }));
    const s = rand(90, 190); m.scale.set(s, s / 2, 1);
    m.userData = { a: rand(0, 6.283), r: rand(420, 760), y: rand(150, 260), sp: rand(0.004, 0.012) };
    m.renderOrder = -9; scene.add(m); clouds.push(m);
  }
}
const stars = (() => {
  const p = []; for (let i = 0; i < 900; i++) { const u = rand(0.05, 1), a = rand(0, 6.283), r = Math.sqrt(1 - u * u); p.push(Math.cos(a) * r * 900, u * 900, Math.sin(a) * r * 900); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  m.renderOrder = -8; scene.add(m); return m;
})();

/* ---------------- colliders ---------------- */
const CELL = 8, colGrid = new Map();
function addCollider(x, z, r) { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); if (!colGrid.has(k)) colGrid.set(k, []); colGrid.get(k).push({ x, z, r }); }
function collide(o, rad) {
  const cx = Math.floor(o.x / CELL), cz = Math.floor(o.z / CELL);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const a = colGrid.get((cx + i) + ',' + (cz + j)); if (!a) continue;
    for (const c of a) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), m = c.r + rad; if (d < m && d > 1e-4) { o.x = c.x + (dx / d) * m; o.z = c.z + (dz / d) * m; } }
  }
}
const nearTown = (x, z, r = 50) => TOWNS.some((t) => Math.hypot(x - t.x, z - t.z) < r);
const nearPlace = (x, z, pad = 6) => Object.values(PLACES).some((p) => p.name && Math.hypot(x - p.x, z - p.z) < p.r + pad);
