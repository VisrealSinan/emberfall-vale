/* Input, camera, day/night, player movement and the main loop. */

const keys = {};
let camYaw = 0, camPitch = 0.36, camDist = 10, lastZone = null;
const camLook = new THREE.Vector3();
const joy = { x: 0, y: 0 };

/* ---------------- keyboard ---------------- */
addEventListener('keydown', (ev) => {
  if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
  if (mode !== 'play') return;
  if (ev.code === 'Escape') {
    if (!iact.hidden) iact.hidden = true;
    else if (anyOpen()) closeAllWindows();
    else if (target) setTarget(null);
    else openWin('winMenu');
    return;
  }
  if (anyModal()) return;
  keys[ev.code] = true;
  if (ev.repeat) return;
  const c = ev.code;
  if (c === 'Space') { ev.preventDefault(); jump(); }
  else if (c === 'Tab') { ev.preventDefault(); cycleTarget(); }
  else if (c === 'KeyF') startAttack();
  else if (c === 'KeyE') interact();
  else if (c === 'KeyQ') drinkPotion();
  else if (c === 'KeyC') toggleWin('winChar');
  else if (c === 'KeyB' || c === 'KeyI') toggleWin('winBags');
  else if (c === 'KeyN') toggleWin('winTal');
  else if (c === 'KeyL') toggleWin('winQuest');
  else if (c === 'KeyP' || c === 'KeyK') toggleWin('winSpell');
  else if (c === 'KeyM') toggleWin('winMap');
  else { const m = /^(?:Digit|Numpad)([1-8])$/.exec(c); if (m) useSlot(+m[1] - 1); }
});
addEventListener('keyup', (ev) => { keys[ev.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function jump() { if (P.dead || mode !== 'play') return; if (P.onGround && (groundAt(P.x, P.z) > -0.4 || RACES[CH.race].swim)) { P.vy = 9.5; P.onGround = false; } }
function interact() {
  if (P.dead || mode !== 'play') return;
  if (!$('winNpc').hidden) { closeWin('winNpc'); return; }
  const near = nearestInteract(); if (!near) return;
  if (near.kind === 'npc') { const n = near.n; openNpc(n); } else if (near.kind === 'gate') enterDungeon(near.d); else if (near.kind === 'exit') leaveDungeon(); else if (near.kind === 'chest') openChest(); else gatherNode(near.nd);
}

/* ---------------- pointer ---------------- */
const pointers = new Map(); let stickId = null; const stick = $('stick'), knob = $('knob');
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (ev) => {
  if (ev.pointerType === 'touch' && !isTouch()) { document.body.classList.add('touch'); if (mode === 'play') buildBar(); }
  if (mode === 'select' || mode === 'create') { pointers.set(ev.pointerId, { role: 'preview', x: ev.clientX }); try { canvas.setPointerCapture(ev.pointerId); } catch (e) {} return; }
  if (mode !== 'play') return; canvas.focus();
  try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  const touch = ev.pointerType === 'touch';
  const role = touch && ev.clientX < innerWidth * 0.42 && ev.clientY > innerHeight * 0.35 && stickId === null ? 'stick' : 'cam';
  pointers.set(ev.pointerId, { role, x: ev.clientX, y: ev.clientY, sx: ev.clientX, sy: ev.clientY, moved: 0, button: ev.button, touch, t: clock });
  if (role === 'stick') { stickId = ev.pointerId; stick.style.left = (ev.clientX - 58) + 'px'; stick.style.top = (ev.clientY - 58) + 'px'; stick.style.bottom = 'auto'; }
});
canvas.addEventListener('pointermove', (ev) => {
  const p = pointers.get(ev.pointerId); if (!p) return;
  if (p.role === 'preview') { previewYaw -= (ev.clientX - p.x) * 0.01; p.x = ev.clientX; return; }
  const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
  if (p.role === 'cam') { const k = (p.touch ? 0.008 : 0.006) * SENS; camYaw -= dx * k; camPitch = clamp(camPitch + dy * k * 0.7, 0.05, 1.25); }
  else { let vx = ev.clientX - p.sx, vy = ev.clientY - p.sy; const l = Math.hypot(vx, vy), m = 46; if (l > m) { vx = (vx / l) * m; vy = (vy / l) * m; } joy.x = vx / m; joy.y = vy / m; knob.style.transform = `translate(${vx}px,${vy}px)`; }
});
function endPointer(ev) {
  const p = pointers.get(ev.pointerId); if (!p) return; pointers.delete(ev.pointerId);
  if (p.role === 'stick') { stickId = null; joy.x = joy.y = 0; stick.style.left = ''; stick.style.top = ''; stick.style.bottom = ''; knob.style.transform = ''; return; }
  if (p.role !== 'cam' || ev.type !== 'pointerup' || p.moved > 8) return;
  if (p.touch || p.button === 0) clickWorld(ev.clientX, ev.clientY, p.touch);
}
canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (ev) => { ev.preventDefault(); camDist = clamp(camDist + ev.deltaY * 0.01, 4, 24); }, { passive: false });
function screenOf(x, y, z) { _v3.set(x, y, z).project(camera); return _v3.z > 1 ? null : [(_v3.x * 0.5 + 0.5) * innerWidth, (-_v3.y * 0.5 + 0.5) * innerHeight]; }
function clickWorld(cx, cy, touch) {
  if (anyModal()) return;
  let best = null, bd = touch ? 60 : 44;
  for (const n of npcs) { const s = screenOf(n.x, n.y + 1.3, n.z); if (!s) continue; const d = Math.hypot(s[0] - cx, s[1] - cy); if (d < bd) { bd = d; best = { n }; } }
  for (const e of enemies) { if (e.dead || !e.g.visible) continue; const s = screenOf(e.x, e.y + e.cy, e.z); if (!s) continue; const d = Math.hypot(s[0] - cx, s[1] - cy) - e.T.radius * 6; if (d < bd) { bd = d; best = { e }; } }
  if (best && best.n) { if (Math.hypot(best.n.x - P.x, best.n.z - P.z) < 7) openNpc(best.n); else toast(`Walk closer to talk to ${best.n.def.name}.`); return; }
  if (best && best.e) { setTarget(best.e); if (!touch) startAttack(); return; }
  if (!touch) startAttack();
}
const tbtn = (id, fn) => $(id).addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); fn(); });
tbtn('bAtk', startAttack); tbtn('bJump', jump); tbtn('bUse', interact); tbtn('bPot', drinkPotion); tbtn('bTab', cycleTarget);
if (matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
$('btnRespawn').onclick = respawnPlayer;

/* ---------------- day / night ---------------- */
const DAY_LEN = 600, sky = { day: ST.day, dusk: ST.dusk, night: ST.night };
let LOCK_T = ST.lockT;
try { const q = new URLSearchParams(location.search).get('t'); if (q) LOCK_T = +q; } catch (e) {}
const cA = new THREE.Color(), cB = new THREE.Color(), sunDir = new THREE.Vector3();
function updateSky(dt) {
  dayT = LOCK_T !== undefined ? LOCK_T : (dayT + dt / DAY_LEN) % 1;
  const a = dayT < 0.65 ? (dayT / 0.65) * Math.PI : Math.PI + ((dayT - 0.65) / 0.35) * Math.PI, sh = Math.sin(a);
  sunDir.set(Math.cos(a), sh, 0.35).normalize();
  const df = smooth(-0.15, 0.3, sh), dusk = Math.max(0, 1 - Math.abs(sh) / 0.3) * 0.8;
  cA.set(sky.night[0]).lerp(tmpC.set(sky.day[0]), df).lerp(tmpC.set(sky.dusk[0]), dusk * 0.5); cB.set(sky.night[1]).lerp(tmpC.set(sky.day[1]), df).lerp(tmpC.set(sky.dusk[1]), dusk * 0.8);
  skyU.top.value.copy(cA); skyU.hor.value.copy(cB); skyU.bot.value.copy(cB).multiplyScalar(0.8); skyU.sunDir.value.copy(sunDir); skyU.sunCol.value.setHex(sh > 0 ? 0xfff2c8 : 0x9ab0ff);
  scene.fog.color.copy(cB); scene.fog.near = (70 + df * 90) * ST.fog; scene.fog.far = ((GFX === 'low' ? 240 : 320) + df * 120) * Math.min(1.15, ST.fog);
  hemi.intensity = (0.3 + 0.32 * df) * ST.hemi; hemi.color.setHSL(0.58, 0.6, 0.6 + 0.3 * df);
  if (sh < 0) { sun.position.copy(sunDir).multiplyScalar(-1); sun.position.y = Math.abs(sun.position.y) + 0.4; sun.intensity = 0.3 * ST.hemi; sun.color.setHex(0x9ab0ff); }
  else { sun.position.copy(sunDir); sun.intensity = (0.2 + 0.6 * df) * ST.sun; sun.color.set(ST.sunCol).lerp(tmpC.set(0xffa070), dusk * 0.6); }
  sun.position.normalize().multiplyScalar(110).add(_v3.set(P.x, P.y, P.z)); sun.target.position.set(P.x, P.y, P.z);
  stars.material.opacity = 1 - smooth(-0.2, 0.1, sh);
  const cc = 0.35 + 0.65 * df; for (const c of clouds) { const u = c.userData; u.a += u.sp * dt; c.position.set(camera.position.x + Math.cos(u.a) * u.r, u.y, camera.position.z + Math.sin(u.a) * u.r); c.material.color.setRGB(cc, cc, cc + 0.05 * (1 - df)).lerp(tmpC.set(0xffb08a), dusk * 0.4); }
  fires.forEach((f, i) => { f.l.intensity = (f.base + (1 - df) * 1.2) * (0.96 + 0.04 * Math.sin(clock * 2.2 + i * 1.7)); f.f.scale.y = 0.95 + 0.06 * Math.sin(clock * 3 + i); });
  if (lavaLight) lavaLight.intensity = 1.5 + 0.1 * Math.sin(clock * 1.3);
  skyDome.position.copy(camera.position); stars.position.copy(camera.position);
  if (DUN.cur) dungeonEnv();
  const hrs = dayT < 0.65 ? 6 + (dayT / 0.65) * 12 : (18 + ((dayT - 0.65) / 0.35) * 12) % 24, hh = Math.floor(hrs), mm = Math.floor((hrs - hh) * 6) * 10;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/* ---------------- player ---------------- */
function animateBeast(m, moving) {
  if (!m) return;
  m.g.position.set(P.x, P.y, P.z); m.g.rotation.y = P.face;
  const s = moving ? Math.sin(P.walk * (m === cat ? 1.3 : 0.8)) * 0.7 : 0; m.legs[0].rotation.x = s; m.legs[3].rotation.x = s; m.legs[1].rotation.x = -s; m.legs[2].rotation.x = -s;
  const lunge = P.attackT >= 0 ? Math.sin(Math.min(1, P.attackT) * Math.PI) : 0;
  m.head.rotation.x = lunge * 0.5; m.b.position.z = lunge * 0.4;
}
function updatePlayer(dt) {
  const druidForm = CH.cls === 'druid' && P.form !== 'caster';
  if (P.dead) { const m = druidForm ? (P.form === 'cat' ? cat : bear) : hero; m.g.rotation.z = lerpAngle(m.g.rotation.z, Math.PI / 2, dt * 4); m.g.position.set(P.x, P.y + 0.4, P.z); return; }
  hero.g.rotation.z = 0; if (cat) cat.g.rotation.z = 0; if (bear) bear.g.rotation.z = 0;
  const R = RACES[CH.race]; let ix = 0, iz = 0;
  if (!anyModal()) { if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1; ix += joy.x; iz -= joy.y; }
  const len = Math.hypot(ix, iz), gh = groundAt(P.x, P.z), inWater = gh < -0.35;
  let moving = false, sprint = false;
  const inCombat = clock - P.lastCombat < 5;
  const formSpd = CH.cls === 'druid' ? (P.form === 'cat' ? 1.25 : P.form === 'bear' ? 0.95 : 1) : 1;
  const px0 = P.x, pz0 = P.z;
  if (len > 0.08 && !P.dash) {
    const n = Math.max(1, len); ix /= n; iz /= n;
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = -fz, rz = fx, mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
    sprint = (keys.ShiftLeft || keys.ShiftRight || (isTouch() && len > 0.95)) && P.stam > 2 && (!inWater || R.swim);
    const spd = 6.4 * P.speedMul * formSpd * (inCombat ? 1 : 1.25) * (sprint ? 1.55 : 1) * (P.buffs.dash ? 1.7 : 1) * (inWater && !R.swim ? 0.55 : 1) * Math.min(1, len) * (P.attackT >= 0 && P.attackSpec && P.attackSpec.kind === 'proj' ? 0.5 : 1);
    P.x += mx * spd * dt; P.z += mz * spd * dt; if (P.attackT < 0 || P.attackSpec.kind === 'melee') P.face = lerpAngle(P.face, Math.atan2(mx, mz), Math.min(1, dt * 12)); moving = true;
  }
  if (P.dash) { P.x += P.dash.vx * dt; P.z += P.dash.vz * dt; P.dash.t -= dt; if (P.dash.t <= 0) P.dash = null; }
  P.stam = clamp(P.stam + (sprint && moving ? -24 : 20) * dt, 0, 100);
  collide(P, druidForm && P.form === 'bear' ? 0.9 : 0.5);
  if (DUN.cur) { if (!walkable(P.x, P.z)) { if (walkable(P.x, pz0)) P.z = pz0; else if (walkable(px0, P.z)) P.x = px0; else { P.x = px0; P.z = pz0; } if (!walkable(P.x, P.z)) { P.x = DUN.cur.ox + DUN_START.x; P.z = DUN.cur.oz + DUN_START.z; } } }
  else { const r = Math.hypot(P.x, P.z); if (r > 548) { P.x *= 548 / r; P.z *= 548 / r; } }
  const g2 = Math.max(groundAt(P.x, P.z), -1.15);
  P.vy -= 26 * dt; P.y += P.vy * dt;
  if (P.y <= g2 || (P.onGround && P.y - g2 < 0.7 && P.vy <= 0)) { P.y = g2; P.vy = 0; P.onGround = true; } else P.onGround = false;
  // regeneration and timers
  if (clock - P.lastHurt > 6) heal(P.maxHp * (inCombat ? 0.005 : 0.025) * dt, false);
  if (R.swim && inWater) heal(P.maxHp * 0.05 * dt, false);
  for (const k in P.buffs) { const b = P.buffs[k]; if (b.hps) heal(b.hps * dt, false); b.t -= dt; if (b.t <= 0) { delete P.buffs[k]; if (k === 'stealth') setGhostAll(false); if (k === 'poison') for (const m of hero.blades) m.emissive.setHex(0x111111); } }
  const hm = hasteMul(); for (const k in cds) if (cds[k] > 0) cds[k] -= dt * (k === 'potion' ? 1 : hm);
  P.invuln -= dt;
  updateRes(dt); updateCast(dt, moving || !!P.dash); updateAuto(dt);
  // attack
  P.walk += dt * (moving ? (sprint ? 15 : 10) : 0);
  let act = -1, actKind = null;
  if (P.attackT >= 0) {
    const s = P.attackSpec; P.attackT += dt / s.dur; act = Math.min(1, P.attackT);
    actKind = s.anim === 'dagger' ? (P.swing ? 'daggerL' : 'dagger') : s.anim;
    if (act >= 0.5 && !P.hitDone) { P.hitDone = true; if (s.kind === 'melee') doMelee(s); else if (s.kind === 'proj') doBasicRanged(s); }
    if (P.attackT >= 1) P.attackT = -1;
  }
  animBiped(hero, P.walk, moving, act, actKind);
  hero.g.position.set(P.x, P.y, P.z); hero.g.rotation.y = P.face;
  if (CH.cls === 'druid') animateBeast(P.form === 'cat' ? cat : P.form === 'bear' ? bear : null, moving);
  const blink = P.invuln > 0 && Math.floor(clock * 30) % 2;
  applyForm(); if (blink) { hero.g.visible = false; if (cat) cat.g.visible = false; if (bear) bear.g.visible = false; }
  if (target && (target.dead || dist(target) > 70)) setTarget(null);
}

/* ---------------- camera ---------------- */
function updateCamera(dt) {
  if (mode === 'select' || mode === 'create') {
    previewYaw += dt * 0.12; const m = CH && CH.cls === 'druid' && P.form === 'bear' ? 1.4 : 1, d = 5.6 * m, h = RACE_SHAPE[CH ? CH.race : 'human'].h;
    if (hero) { hero.g.position.set(P.x, P.y, P.z); hero.g.rotation.y = previewYaw; animBiped(hero, 0, false, -1); }
    for (const m of [cat, bear]) if (m) { m.g.position.set(P.x, P.y, P.z); m.g.rotation.y = previewYaw; }
    camera.position.set(P.x + Math.sin(0.5) * d, P.y + 2.0 * h, P.z + Math.cos(0.5) * d); camera.lookAt(P.x, P.y + 1.25 * h, P.z); return;
  }
  const tx = P.x, ty = P.y + 1.7, tz = P.z;
  camLook.x += (tx - camLook.x) * Math.min(1, dt * 10); camLook.y += (ty - camLook.y) * Math.min(1, dt * 6); camLook.z += (tz - camLook.z) * Math.min(1, dt * 10);
  let d = camDist * (CH.cls === 'druid' && P.form === 'bear' ? 1.2 : 1);
  if (DUN.cur) { while (d > 2.5 && !walkable(camLook.x + Math.sin(camYaw) * Math.cos(camPitch) * d, camLook.z + Math.cos(camYaw) * Math.cos(camPitch) * d)) d -= 0.5; }
  const cx = camLook.x + Math.sin(camYaw) * Math.cos(camPitch) * d, cz = camLook.z + Math.cos(camYaw) * Math.cos(camPitch) * d;
  let cy = camLook.y + Math.sin(camPitch) * d; cy = Math.max(cy, Math.max(groundAt(cx, cz), 0) + 0.8);
  camera.position.set(cx, cy, cz);
  if (shake > 0) { shake = Math.max(0, shake - dt); camera.position.x += rand(-1, 1) * shake * 0.6; camera.position.y += rand(-1, 1) * shake * 0.6; }
  camera.lookAt(camLook);
}

/* ---------------- loop ---------------- */
let last = performance.now(), t05 = 0, t01 = 0, saveT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  const play = mode === 'play';
  const skyTxt = updateSky(play ? dt : dt * 0.3);
  if (play) {
    updatePlayer(dt);
    for (const e of enemies) updateEnemy(e, dt);
    updatePets(dt); updateProjectiles(dt); updateTeles(dt); updateDungeon(dt);
    for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].fn; timers.splice(i, 1); f(); } }
  }
  updateFx(dt);
  for (const nd of nodes) { if (!nd.on) { nd.t -= dt; if (nd.t <= 0) { nd.on = true; nd.g.visible = Math.hypot(nd.x - P.x, nd.z - P.z) < 110; } } else if (nd.g.visible) nd.g.rotation.y += dt * 0.6; }
  for (const n of npcs) { const nd = Math.hypot(n.x - (play ? P.x : camera.position.x), n.z - (play ? P.z : camera.position.z)); n.model.g.visible = nd < 110; if (nd > 110) continue; const near = play && nd < 9; n.model.g.rotation.y = lerpAngle(n.model.g.rotation.y, near ? Math.atan2(P.x - n.x, P.z - n.z) : n.baseRot, dt * 3); n.model.b.position.y = Math.sin(clock * 1.6 + n.phase) * 0.012; }
  water.position.y = Math.sin(clock * 0.6) * 0.05;
  updateCamera(dt);
  t05 -= dt; t01 -= dt;
  if (t05 <= 0) {
    t05 = 0.5; cullChunks(play ? P.x : camera.position.x, play ? P.z : camera.position.z);
    if (play) { discoverTowns(); mmQuest = questPoints();
      const z = DUN.cur ? { name: DUN.cur.name, sub: 'Dungeon', lv: DUN.cur.lv, id: DUN.cur.id } : zoneAt(P.x, P.z); if (z.id !== (lastZone && lastZone.id)) { lastZone = z; $('zoneName').textContent = z.name; $('zbName').textContent = z.name; $('zbSub').textContent = `${z.sub} · Level ${z.lv[0]}-${z.lv[1]}`; const zb = $('zoneBanner'); zb.classList.add('show'); setTimeout(() => zb.classList.remove('show'), 3500); } }
  }
  if (play) {
    if (t01 <= 0) { t01 = 0.1; updateHUD(skyTxt); drawMinimap(); }
    updatePlates(); renderPreview(dt);
    const cb = $('castbar'); if (P.cast) { cb.hidden = false; $('castFill').style.width = Math.min(100, P.cast.t / P.cast.dur * 100) + '%'; $('castTxt').textContent = P.cast.sk.name; } else if (!cb.hidden) cb.hidden = true;
    if (!$('winMap').hidden && Math.floor(clock * 2) !== Math.floor((clock - dt) * 2)) renderBigMap();
    saveT += dt; if (saveT > 15) { saveT = 0; saveChar(); }
    if (curNpc && !$('winNpc').hidden && Math.hypot(curNpc.x - P.x, curNpc.z - P.z) > 8) closeWin('winNpc');
    if (curVendor && !$('winVendor').hidden && Math.hypot(curVendor.x - P.x, curVendor.z - P.z) > 8) closeWin('winVendor');
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
function onResize() {
  renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight;
  if (mode === 'select' || mode === 'create') { const W = innerWidth, Hh = innerHeight; if (W > 820) camera.setViewOffset(W, Hh, -Math.min(mode === 'create' ? 480 : 360, W) * 0.5, 0, W, Hh); else camera.setViewOffset(W, Hh, 0, Hh * 0.25, W, Hh); }
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
addEventListener('resize', onResize);
addEventListener('beforeunload', () => saveChar());
document.addEventListener('visibilitychange', () => { if (document.hidden) saveChar(); });

/* ---------------- start ---------------- */
spawnNpcs();
spawnAll();
initPreview();
STORE = loadStore();
window.__emberfall = { P, enemies, npcs, nodes, renderer, hurtPlayer, scene, chunks, DUN, DUNGEONS, dealDamage, get CH() { return CH; }, gainXP, setTarget, addItem, genItem };
M = freshMods();
toSelect();
requestAnimationFrame(frame);
