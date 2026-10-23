/* Class skills (unlocked by level) and talent trees (points from level 10). */

// Talent modifiers, rebuilt whenever talents change. Read by combat code.
let M = null;
function freshMods() { return { dmg: 0, crit: 0, haste: 0, hp: 0, armor: 0, speed: 0, leech: 0, dot: 0, pet: 0, heal: 0, cdr: {}, sdmg: {}, form: { caster: 0, cat: 0, bear: 0 }, flags: {} }; }
const sd = (id, mult) => atk() * mult * (1 + (M.sdmg[id] || 0));

const SK = {
  // ---------------- rogue ----------------
  eviscerate: { cls: 'rogue', lvl: 1, cd: 6, name: 'Eviscerate', color: 0xd8394a, desc: 'A vicious strike for heavy damage.', range: 4,
    use() { const t = meleeTarget(4); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('dagger', 0.26); dealDamage(t, sd('eviscerate', 2.2), { critBonus: M.flags.coldBlood ? 1 : 0, kb: 4 }); } },
  fan: { cls: 'rogue', lvl: 2, cd: 8, name: 'Fan of Knives', color: 0xbfc6cc, desc: 'Hurl blades in every direction, hitting all nearby enemies.',
    use() { spawnRing(P.x, P.z, 0xdfe6ec, 6, 0.35); const from = handPos(); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; fire({ kind: 'arrow', color: 0xcfd5da, pos: from, dir: new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), speed: 26, life: 0.24, noHit: true }); }
      aoe(P.x, P.z, 6, (e) => dealDamage(e, sd('fan', 1.1), { kb: 5 })); } },
  shadowstep: { cls: 'rogue', lvl: 4, cd: 12, name: 'Shadowstep', color: 0x7a5aaa, desc: 'Teleport behind a target and strike with a guaranteed critical hit.', range: 18,
    use() { const t = findTarget(18); if (!t) return fail('No target in range.'); spawnRing(P.x, P.z, 0x7a5aaa, 2.5); const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz) || 1, o = t.T.radius + 1.1;
      P.x = t.x + (dx / d) * o; P.z = t.z + (dz / d) * o; collide(P, 0.5); P.y = Math.max(groundAt(P.x, P.z), -1.1); faceTo(t); spawnRing(P.x, P.z, 0x7a5aaa, 2.5); playAnim('dagger', 0.26); dealDamage(t, sd('shadowstep', 1.4), { critBonus: 1, kb: 4 }); } },
  poison: { cls: 'rogue', lvl: 6, cd: 20, name: 'Poison Blades', color: 0x6fd04a, desc: 'For 12 seconds your hits poison enemies for damage over time.', use() { buff('poison', 12); toast('Your blades drip with poison.'); } },
  vanish: { cls: 'rogue', lvl: 8, cd: 30, name: 'Vanish', color: 0x3a3452, desc: 'Turn invisible for 8 seconds. Enemies lose you, and your next attack hits much harder.',
    use() { buff('stealth', 8); spawnRing(P.x, P.z, 0x5a4a6a, 3); for (const e of enemies) if (e.state === 'chase') e.state = 'return'; } },
  kidney: { cls: 'rogue', lvl: 10, cd: 18, name: 'Kidney Shot', color: 0xe0a030, desc: 'Strike a vital spot, stunning the target for 3 seconds.', range: 4,
    use() { const t = meleeTarget(4); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('dagger', 0.26); dealDamage(t, sd('kidney', 0.8)); stun(t, 3); } },
  flurry: { cls: 'rogue', lvl: 14, cd: 35, name: 'Blade Flurry', color: 0xff6a6a, desc: 'For 8 seconds attack 40% faster and your basic attacks hit every enemy in front of you.', use() { buff('flurry', 8); } },
  dance: { cls: 'rogue', lvl: 18, cd: 45, name: 'Shadow Dance', color: 0x9a5aff, desc: 'For 8 seconds gain 40% critical strike and Shadowstep has no cooldown.', use() { buff('dance', 8); } },
  // ---------------- archer ----------------
  multishot: { cls: 'archer', lvl: 1, cd: 6, name: 'Multi-Shot', color: 0xc9a86a, desc: 'Fire five arrows in a spread.',
    use() { const from = handPos(), t = findTarget(32); faceTo(t); const base = aimAt(t, from); playAnim('bow', 0.42);
      for (let i = -2; i <= 2; i++) fire({ kind: 'arrow', pos: from, dir: base.clone().applyAxisAngle(UP, i * 0.13), speed: 42, dmg: sd('multishot', 0.8) }); } },
  power: { cls: 'archer', lvl: 2, cd: 9, name: 'Power Shot', color: 0xffd25a, desc: 'A huge arrow that pierces every enemy in a line.',
    use() { const from = handPos(), t = findTarget(40); faceTo(t); playAnim('bow', 0.42); fire({ kind: 'arrow', big: true, glow: 0xffd25a, pos: from, dir: aimAt(t, from), speed: 62, dmg: sd('power', 3), pierce: true, life: 1 }); } },
  disengage: { cls: 'archer', lvl: 4, cd: 10, name: 'Disengage', color: 0x8fbf5a, desc: 'Leap backward out of danger.',
    use() { const f = facing(); P.dash = { t: 0.32, vx: -f.x * 19, vz: -f.z * 19 }; P.vy = 7.5; P.onGround = false; spawnRing(P.x, P.z, 0x8fbf5a, 2.5); } },
  sting: { cls: 'archer', lvl: 6, cd: 3, name: 'Serpent Sting', color: 0x5ad08a, desc: 'Poison a target for heavy damage over 8 seconds.', range: 32,
    use() { const t = findTarget(32); if (!t) return fail('No target in range.'); faceTo(t); playAnim('bow', 0.42); const from = handPos();
      fire({ kind: 'arrow', color: 0x5ad08a, glow: 0x5ad08a, pos: from, dir: aimAt(t, from), speed: 44, dmg: sd('sting', 0.4), onHit: (e) => addDot(e, sd('sting', 0.5), 8, 'sting') }); } },
  rain: { cls: 'archer', lvl: 8, cd: 16, name: 'Rain of Arrows', color: 0xe08a4a, desc: 'Arrows rain on an area, hitting everything inside.',
    use() { const t = findTarget(32), f = facing(); const cx = t ? t.x : P.x + f.x * 10, cz = t ? t.z : P.z + f.z * 10; faceTo(t); playAnim('bow', 0.42); spawnRing(cx, cz, 0xe08a4a, 6, 0.9); const gy = groundAt(cx, cz);
      for (let i = 0; i < 18; i++) { const a = rand(0, 6.283), r = rand(0, 5.5); fire({ kind: 'arrow', pos: new THREE.Vector3(cx + Math.cos(a) * r, gy + 16 + rand(0, 4), cz + Math.sin(a) * r), dir: new THREE.Vector3(rand(-0.05, 0.05), -1, rand(-0.05, 0.05)).normalize(), speed: 32, life: 1.2, noHit: true }); }
      after(0.5, () => aoe(cx, cz, 6, (e) => dealDamage(e, sd('rain', 1.7)))); } },
  concuss: { cls: 'archer', lvl: 10, cd: 14, name: 'Concussive Shot', color: 0x7a9ad8, desc: 'A heavy blunt arrow that stuns the target for 2.5 seconds.', range: 32,
    use() { const t = findTarget(32); if (!t) return fail('No target in range.'); faceTo(t); playAnim('bow', 0.42); const from = handPos(); fire({ kind: 'arrow', color: 0x7a9ad8, pos: from, dir: aimAt(t, from), speed: 50, dmg: sd('concuss', 1), onHit: (e) => stun(e, 2.5) }); } },
  rapid: { cls: 'archer', lvl: 14, cd: 40, name: 'Rapid Fire', color: 0xff9a3a, desc: 'For 10 seconds shoot 60% faster.', use() { buff('rapid', 10); } },
  wolfpet: { cls: 'archer', lvl: 18, cd: 60, name: 'Spirit Wolf', color: 0x7ac8ff, desc: 'Call a spirit wolf to fight beside you for 40 seconds.', use() { summonPet('wolf', M.flags.packLeader ? 0 : 40); } },
  // ---------------- warlock ----------------
  corruption: { cls: 'warlock', lvl: 1, cd: 2, name: 'Corruption', color: 0x8a3ad0, desc: 'Curse a target with shadow damage over 10 seconds.', range: 28,
    use() { const t = findTarget(28); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); addDot(t, sd('corruption', 0.45), 10, 'shadow'); aggro(t); spawnRing(t.x, t.z, 0x8a3ad0, 2); } },
  drain: { cls: 'warlock', lvl: 2, cd: 8, name: 'Drain Life', color: 0x5ad08a, desc: 'Rip the life out of a target and heal yourself for the damage dealt.', range: 25,
    use() { const t = findTarget(25); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); spawnBeam(handPos(), new THREE.Vector3(t.x, t.y + t.cy, t.z), 0x7ae08a, 0.45); const d = dealDamage(t, sd('drain', 1.8)); heal(d * (M.flags.soulSiphon ? 2 : 1)); } },
  imp: { cls: 'warlock', lvl: 4, cd: 30, name: 'Summon Imp', color: 0xe0502a, desc: 'Call a fiery imp that fights beside you for 45 seconds.', use() { summonPet('imp', M.flags.demonLord ? 0 : 45); } },
  immolate: { cls: 'warlock', lvl: 6, cd: 6, name: 'Immolate', color: 0xff7a2a, desc: 'Burn a target, then keep it burning for 6 seconds.', range: 28,
    use() { const t = findTarget(28); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); spawnRing(t.x, t.z, 0xff7a2a, 2.5); dealDamage(t, sd('immolate', 0.8)); if (!t.dead) addDot(t, sd('immolate', 0.4), 6, 'fire'); } },
  shadowfury: { cls: 'warlock', lvl: 8, cd: 16, name: 'Shadowfury', color: 0x5a2a8a, desc: 'Blast an area with shadow, damaging and stunning enemies for 2.5 seconds.',
    use() { const t = findTarget(25), f = facing(); const cx = t ? t.x : P.x + f.x * 7, cz = t ? t.z : P.z + f.z * 7; faceTo(t); playAnim('cast2', 0.5); spawnRing(cx, cz, 0x9a4dff, 6, 0.6); aoe(cx, cz, 6, (e) => { dealDamage(e, sd('shadowfury', 1.4)); stun(e, 2.5); }); } },
  fear: { cls: 'warlock', lvl: 10, cd: 20, name: 'Fear', color: 0x3a1a5a, desc: 'Terrify a target so it runs away for 5 seconds.', range: 25,
    use() { const t = findTarget(25); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); if (t.boss) return fail('Bosses are immune to fear.'); t.fearT = 5; aggro(t); floatText('Feared', t.x, t.y + t.h + 0.5, t.z, 'dot'); } },
  chaos: { cls: 'warlock', lvl: 14, cd: 14, name: 'Chaos Bolt', color: 0x5aff8a, desc: 'A slow bolt of chaos that always critically strikes.', range: 30,
    use() { const t = findTarget(30); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast2', 0.5); const from = handPos();
      fire({ kind: 'orb', color: 0x5aff8a, size: 0.45, pos: from, dir: aimAt(t, from), speed: 16, dmg: 0, life: 3, onHit: (e) => dealDamage(e, sd('chaos', 2.6), { critBonus: 1 }) }); } },
  infernal: { cls: 'warlock', lvl: 18, cd: 90, name: 'Summon Infernal', color: 0xff5a1a, desc: 'Call down an infernal that stuns nearby enemies on impact, then fights for 30 seconds.',
    use() { const t = findTarget(25), f = facing(); const cx = t ? t.x : P.x + f.x * 6, cz = t ? t.z : P.z + f.z * 6; spawnRing(cx, cz, 0xff5a1a, 7, 0.8);
      after(0.5, () => { aoe(cx, cz, 7, (e) => { dealDamage(e, sd('infernal', 2)); stun(e, 2); }); summonPet('infernal', 30, cx, cz); shake = Math.max(shake, 0.4); }); } },
  // ---------------- druid ----------------
  formCaster: { cls: 'druid', lvl: 1, cd: 1.5, cdId: 'shift', form: 'caster', abbr: 'Hu', name: 'Caster Form', color: 0x9fe05a, desc: 'Your natural form. Hurl nature bolts and heal yourself (ranged damage).', use() { return setForm('caster'); } },
  formCat: { cls: 'druid', lvl: 1, cd: 1.5, cdId: 'shift', form: 'cat', abbr: 'Ca', name: 'Cat Form', color: 0x9a7ae0, desc: 'Fast feline form with quick, high-critical claws (melee damage).', use() { return setForm('cat'); } },
  formBear: { cls: 'druid', lvl: 1, cd: 1.5, cdId: 'shift', form: 'bear', abbr: 'Be', name: 'Bear Form', color: 0xb07a3a, desc: 'Huge bear form. Take 45% less damage and maul everything in front of you (tank).', use() { return setForm('bear'); } },
  regrowth: { cls: 'druid', lvl: 1, cd: 12, inForm: 'caster', name: 'Regrowth', color: 0x7ae08a, desc: 'Caster: heal 30% of your health now and more over 6 seconds.', use() { heal(P.maxHp * 0.3 * (1 + M.heal)); buff('hot', 6, { hps: P.maxHp * 0.04 * (1 + M.heal) }); spawnRing(P.x, P.z, 0x7ae08a, 3); playAnim('cast', 0.4); } },
  moonfire: { cls: 'druid', lvl: 2, cd: 4, inForm: 'caster', name: 'Moonfire', color: 0x9ab8ff, desc: 'Caster: burn a target with moonlight, then keep burning it for 10 seconds.', range: 28,
    use() { const t = findTarget(28); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); spawnBeam(new THREE.Vector3(t.x, t.y + 14, t.z), new THREE.Vector3(t.x, t.y, t.z), 0x9ab8ff, 0.4); dealDamage(t, sd('moonfire', 0.9)); if (!t.dead) addDot(t, sd('moonfire', 0.35), 10, 'moon'); } },
  roots: { cls: 'druid', lvl: 6, cd: 16, inForm: 'caster', name: 'Entangling Roots', color: 0x6a8a3a, desc: 'Caster: roots burst from the ground and hold a target in place for 5 seconds.', range: 28,
    use() { const t = findTarget(28); if (!t) return fail('No target in range.'); faceTo(t); playAnim('cast', 0.4); stun(t, 5); aggro(t); spawnRing(t.x, t.z, 0x6a8a3a, 2.5, 0.8); } },
  starfall: { cls: 'druid', lvl: 12, cd: 30, inForm: 'caster', name: 'Starfall', color: 0xd8c8ff, desc: 'Caster: stars rain down on enemies near your target for 3 seconds.',
    use() { const t = findTarget(28), f = facing(); const cx = t ? t.x : P.x + f.x * 8, cz = t ? t.z : P.z + f.z * 8; playAnim('cast2', 0.5);
      for (let i = 0; i < 6; i++) after(i * 0.5, () => { const list = enemies.filter((e) => !e.dead && Math.hypot(e.x - cx, e.z - cz) < 10); const e = list.length ? pick(list) : null; if (!e) return; spawnBeam(new THREE.Vector3(e.x, e.y + 18, e.z), new THREE.Vector3(e.x, e.y, e.z), 0xd8c8ff, 0.3); dealDamage(e, sd('starfall', 0.9)); }); } },
  tranq: { cls: 'druid', lvl: 16, cd: 60, inForm: 'caster', name: 'Tranquility', color: 0xbfff9a, desc: 'Caster: heal 8% of your health every second for 8 seconds.', use() { buff('tranq', 8, { hps: P.maxHp * 0.08 * (1 + M.heal) }); spawnRing(P.x, P.z, 0xbfff9a, 5, 1); playAnim('cast2', 0.5); } },
  rake: { cls: 'druid', lvl: 1, cd: 5, inForm: 'cat', name: 'Rake', color: 0xc84a3a, desc: 'Cat: a heavy claw strike that makes the target bleed.', range: 4,
    use() { const t = meleeTarget(4); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('beast', 0.24); dealDamage(t, sd('rake', 1.8), { kb: 3 }); if (!t.dead) addDot(t, sd('rake', 0.4), 6, 'bleed'); } },
  bite: { cls: 'druid', lvl: 4, cd: 10, inForm: 'cat', name: 'Ferocious Bite', color: 0xff5a5a, desc: 'Cat: a savage bite for huge damage.', range: 4,
    use() { const t = meleeTarget(4); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('beast', 0.3); dealDamage(t, sd('bite', 3), { kb: 4 }); } },
  dash: { cls: 'druid', lvl: 8, cd: 30, inForm: 'cat', name: 'Dash', color: 0xe0d05a, desc: 'Cat: run 70% faster for 6 seconds.', use() { buff('dash', 6); } },
  swipe: { cls: 'druid', lvl: 12, cd: 6, inForm: 'cat', name: 'Swipe', color: 0xd8a0ff, desc: 'Cat: claw every enemy in front of you.', use() { playAnim('beast', 0.3); const f = facing(); aoe(P.x + f.x * 2, P.z + f.z * 2, 4.5, (e) => dealDamage(e, sd('swipe', 1.3), { kb: 3 })); spawnRing(P.x + f.x * 2, P.z + f.z * 2, 0xd8a0ff, 4.5, 0.3); } },
  fury: { cls: 'druid', lvl: 16, cd: 30, inForm: 'cat', name: 'Tiger\'s Fury', color: 0xff9a3a, desc: 'Cat: deal 30% more damage for 8 seconds.', use() { buff('fury', 8); } },
  thrash: { cls: 'druid', lvl: 1, cd: 6, inForm: 'bear', name: 'Thrash', color: 0xb07a3a, desc: 'Bear: maul all nearby enemies, make them bleed and force them to attack you.',
    use() { spawnRing(P.x, P.z, 0xb07a3a, 6, 0.45); shake = Math.max(shake, 0.2); playAnim('beast', 0.4); aoe(P.x, P.z, 6, (e) => { dealDamage(e, sd('thrash', 1.3), { kb: 5 }); if (!e.dead) addDot(e, sd('thrash', 0.25), 4, 'bleed'); }); for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 18) aggro(e); } },
  maul: { cls: 'druid', lvl: 4, cd: 5, inForm: 'bear', name: 'Maul', color: 0x8a5a34, desc: 'Bear: a crushing swipe for heavy damage.', range: 4.5,
    use() { const t = meleeTarget(4.5); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('beast', 0.4); dealDamage(t, sd('maul', 2), { kb: 7 }); } },
  regen: { cls: 'druid', lvl: 8, cd: 30, inForm: 'bear', name: 'Frenzied Regeneration', color: 0x7ae08a, desc: 'Bear: heal 35% of your health over 6 seconds.', use() { buff('hot', 6, { hps: (P.maxHp * 0.35 * (1 + M.heal + (M.flags.savage || 0))) / 6 }); spawnRing(P.x, P.z, 0x7ae08a, 3); } },
  bash: { cls: 'druid', lvl: 12, cd: 20, inForm: 'bear', name: 'Bash', color: 0xe0a030, desc: 'Bear: stun the target for 3 seconds.', range: 4.5,
    use() { const t = meleeTarget(4.5); if (!t) return fail('Get closer to your target.'); faceTo(t); playAnim('beast', 0.4); dealDamage(t, sd('bash', 0.6)); stun(t, 3); } },
  roar: { cls: 'druid', lvl: 16, cd: 25, inForm: 'bear', name: 'Demoralizing Roar', color: 0xa86a3a, desc: 'Bear: enemies within 10 yards deal 30% less damage for 10 seconds.',
    use() { spawnRing(P.x, P.z, 0xa86a3a, 10, 0.6); shake = Math.max(shake, 0.25); for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 10) { e.weakT = 10; aggro(e); } } },
};
for (const id in SK) SK[id].id = id;
const BAR = {
  rogue: ['eviscerate', 'fan', 'shadowstep', 'poison', 'vanish', 'kidney', 'flurry', 'dance'],
  archer: ['multishot', 'power', 'disengage', 'sting', 'rain', 'concuss', 'rapid', 'wolfpet'],
  warlock: ['corruption', 'drain', 'imp', 'immolate', 'shadowfury', 'fear', 'chaos', 'infernal'],
  druidForms: ['formCaster', 'formCat', 'formBear'],
  caster: ['regrowth', 'moonfire', 'roots', 'starfall', 'tranq'],
  cat: ['rake', 'bite', 'dash', 'swipe', 'fury'],
  bear: ['thrash', 'maul', 'regen', 'bash', 'roar'],
};
function barSkills() { if (CH.cls !== 'druid') return BAR[CH.cls].map((k) => SK[k]); return BAR.druidForms.concat(BAR[P.form]).map((k) => SK[k]); }
function classSkills(cls) { if (cls !== 'druid') return BAR[cls].map((k) => SK[k]); return BAR.druidForms.concat(BAR.caster, BAR.cat, BAR.bear).map((k) => SK[k]); }

/* ---------------- talents ---------------- */
const T = (n, max, d, f, cap = false) => ({ n, max, d, f, cap });
const TALENTS = {
  rogue: [
    { name: 'Assassination', desc: 'Poisons and lethal strikes.', color: 0x6fd04a, list: [
      T('Malice', 3, (r) => `+${2 * r}% critical strike.`, (m, r) => { m.crit += 2 * r; }),
      T('Lethality', 3, (r) => `Eviscerate deals ${15 * r}% more damage.`, (m, r) => { m.sdmg.eviscerate = (m.sdmg.eviscerate || 0) + 0.15 * r; }),
      T('Improved Poisons', 2, (r) => `Damage over time effects deal ${15 * r}% more damage.`, (m, r) => { m.dot += 0.15 * r; }),
      T('Seal Fate', 2, (r) => `Kidney Shot cooldown reduced by ${3 * r} sec.`, (m, r) => { m.cdr.kidney = (m.cdr.kidney || 0) + 3 * r; }),
      T('Cold Blood', 1, () => 'Eviscerate always critically strikes.', (m) => { m.flags.coldBlood = 1; }, true)] },
    { name: 'Combat', desc: 'Relentless blade work.', color: 0xd8394a, list: [
      T('Precision', 3, (r) => `+${4 * r}% damage.`, (m, r) => { m.dmg += 0.04 * r; }),
      T('Lightning Reflexes', 3, (r) => `+${4 * r}% haste.`, (m, r) => { m.haste += 4 * r; }),
      T('Blade Twisting', 2, (r) => `Fan of Knives deals ${25 * r}% more damage.`, (m, r) => { m.sdmg.fan = (m.sdmg.fan || 0) + 0.25 * r; }),
      T('Combat Potency', 2, (r) => `Blade Flurry cooldown reduced by ${8 * r} sec.`, (m, r) => { m.cdr.flurry = (m.cdr.flurry || 0) + 8 * r; }),
      T('Adrenaline Rush', 1, () => 'Each basic attack reduces all your cooldowns by 0.5 sec.', (m) => { m.flags.adrenaline = 1; }, true)] },
    { name: 'Subtlety', desc: 'Shadows, stealth and survival.', color: 0x7a5aaa, list: [
      T('Elusiveness', 3, (r) => `Vanish cooldown reduced by ${4 * r} sec.`, (m, r) => { m.cdr.vanish = (m.cdr.vanish || 0) + 4 * r; }),
      T('Deadened Nerves', 3, (r) => `+${10 * r}% armor.`, (m, r) => { m.armor += 0.1 * r; }),
      T('Shadow Walk', 2, (r) => `Shadowstep cooldown reduced by ${3 * r} sec.`, (m, r) => { m.cdr.shadowstep = (m.cdr.shadowstep || 0) + 3 * r; }),
      T('Master of Deception', 2, (r) => `+${8 * r}% maximum health.`, (m, r) => { m.hp += 0.08 * r; }),
      T('Shadowmaster', 1, () => 'Attacks from stealth deal double damage instead of +50%.', (m) => { m.flags.shadowmaster = 1; }, true)] },
  ],
  archer: [
    { name: 'Marksmanship', desc: 'Precise, devastating shots.', color: 0xffd25a, list: [
      T('Lethal Shots', 3, (r) => `+${2 * r}% critical strike.`, (m, r) => { m.crit += 2 * r; }),
      T('Careful Aim', 3, (r) => `Power Shot deals ${15 * r}% more damage.`, (m, r) => { m.sdmg.power = (m.sdmg.power || 0) + 0.15 * r; }),
      T('Barrage', 2, (r) => `Multi-Shot deals ${25 * r}% more damage.`, (m, r) => { m.sdmg.multishot = (m.sdmg.multishot || 0) + 0.25 * r; }),
      T('Mortal Shots', 2, (r) => `+${5 * r}% damage.`, (m, r) => { m.dmg += 0.05 * r; }),
      T('Trueshot', 1, () => 'Power Shot cooldown reduced by 4 sec and it deals 30% more damage.', (m) => { m.cdr.power = (m.cdr.power || 0) + 4; m.sdmg.power = (m.sdmg.power || 0) + 0.3; }, true)] },
    { name: 'Survival', desc: 'Toughness and tricks.', color: 0x8fbf5a, list: [
      T('Thick Hide', 3, (r) => `+${10 * r}% armor.`, (m, r) => { m.armor += 0.1 * r; }),
      T('Endurance', 3, (r) => `+${5 * r}% maximum health.`, (m, r) => { m.hp += 0.05 * r; }),
      T('Swift Retreat', 2, (r) => `Disengage cooldown reduced by ${3 * r} sec.`, (m, r) => { m.cdr.disengage = (m.cdr.disengage || 0) + 3 * r; }),
      T('Serpent\'s Bite', 2, (r) => `Damage over time effects deal ${20 * r}% more damage.`, (m, r) => { m.dot += 0.2 * r; }),
      T('Survivalist', 1, () => 'While below 35% health you take 30% less damage.', (m) => { m.flags.survivalist = 1; }, true)] },
    { name: 'Beast Mastery', desc: 'Fight beside the spirit wolf.', color: 0x7ac8ff, list: [
      T('Bestial Swiftness', 3, (r) => `+${4 * r}% movement speed.`, (m, r) => { m.speed += 0.04 * r; }),
      T('Spirit Bond', 3, (r) => `Your pets deal ${15 * r}% more damage.`, (m, r) => { m.pet += 0.15 * r; }),
      T('Rapid Recovery', 2, (r) => `Rapid Fire cooldown reduced by ${10 * r} sec.`, (m, r) => { m.cdr.rapid = (m.cdr.rapid || 0) + 10 * r; }),
      T('Ferocity', 2, (r) => `+${5 * r}% haste.`, (m, r) => { m.haste += 5 * r; }),
      T('Pack Leader', 1, () => 'Your Spirit Wolf stays until it is dismissed or you die.', (m) => { m.flags.packLeader = 1; }, true)] },
  ],
  warlock: [
    { name: 'Affliction', desc: 'Curses that eat away at life.', color: 0x8a3ad0, list: [
      T('Improved Corruption', 3, (r) => `Damage over time effects deal ${10 * r}% more damage.`, (m, r) => { m.dot += 0.1 * r; }),
      T('Siphon Life', 3, (r) => `Heal for ${2 * r}% of all damage you deal.`, (m, r) => { m.leech += 0.02 * r; }),
      T('Grim Reach', 2, (r) => `Drain Life deals ${25 * r}% more damage.`, (m, r) => { m.sdmg.drain = (m.sdmg.drain || 0) + 0.25 * r; }),
      T('Nightfall', 2, (r) => `Fear cooldown reduced by ${5 * r} sec.`, (m, r) => { m.cdr.fear = (m.cdr.fear || 0) + 5 * r; }),
      T('Soul Siphon', 1, () => 'Drain Life heals you for double the damage dealt.', (m) => { m.flags.soulSiphon = 1; }, true)] },
    { name: 'Destruction', desc: 'Raw, explosive chaos.', color: 0xff7a2a, list: [
      T('Ruin', 3, (r) => `+${2 * r}% critical strike.`, (m, r) => { m.crit += 2 * r; }),
      T('Bane', 3, (r) => `+${4 * r}% damage.`, (m, r) => { m.dmg += 0.04 * r; }),
      T('Devastation', 2, (r) => `Chaos Bolt deals ${20 * r}% more damage.`, (m, r) => { m.sdmg.chaos = (m.sdmg.chaos || 0) + 0.2 * r; }),
      T('Backlash', 2, (r) => `Shadowfury cooldown reduced by ${3 * r} sec.`, (m, r) => { m.cdr.shadowfury = (m.cdr.shadowfury || 0) + 3 * r; }),
      T('Backdraft', 1, () => 'Your critical strikes reduce Chaos Bolt\'s cooldown by 2 sec.', (m) => { m.flags.backdraft = 1; }, true)] },
    { name: 'Demonology', desc: 'Demons that serve and protect.', color: 0xe0502a, list: [
      T('Demonic Embrace', 3, (r) => `+${5 * r}% maximum health.`, (m, r) => { m.hp += 0.05 * r; }),
      T('Fel Vitality', 3, (r) => `Your demons deal ${15 * r}% more damage.`, (m, r) => { m.pet += 0.15 * r; }),
      T('Master Summoner', 2, (r) => `Summon Infernal cooldown reduced by ${20 * r} sec.`, (m, r) => { m.cdr.infernal = (m.cdr.infernal || 0) + 20 * r; }),
      T('Demonic Armor', 2, (r) => `+${15 * r}% armor.`, (m, r) => { m.armor += 0.15 * r; }),
      T('Demon Lord', 1, () => 'Your imp stays until it is dismissed or you die.', (m) => { m.flags.demonLord = 1; }, true)] },
  ],
  druid: [
    { name: 'Balance', desc: 'Moon and star magic in caster form.', color: 0x9ab8ff, list: [
      T('Starlight Wrath', 3, (r) => `Caster form deals ${5 * r}% more damage.`, (m, r) => { m.form.caster += 0.05 * r; }),
      T('Moonglow', 3, (r) => `Your heals are ${10 * r}% stronger.`, (m, r) => { m.heal += 0.1 * r; }),
      T('Improved Moonfire', 2, (r) => `Moonfire deals ${25 * r}% more damage.`, (m, r) => { m.sdmg.moonfire = (m.sdmg.moonfire || 0) + 0.25 * r; }),
      T('Celestial Focus', 2, (r) => `Starfall cooldown reduced by ${6 * r} sec.`, (m, r) => { m.cdr.starfall = (m.cdr.starfall || 0) + 6 * r; }),
      T('Moonkin', 1, () => 'Caster form deals 15% more damage and takes 10% less damage.', (m) => { m.form.caster += 0.15; m.flags.moonkin = 1; }, true)] },
    { name: 'Feral', desc: 'Speed and claws in cat form.', color: 0x9a7ae0, list: [
      T('Sharpened Claws', 3, (r) => `+${2 * r}% critical strike.`, (m, r) => { m.crit += 2 * r; }),
      T('Feline Swiftness', 3, (r) => `+${4 * r}% movement speed.`, (m, r) => { m.speed += 0.04 * r; }),
      T('Shredding Attacks', 2, (r) => `Rake and Ferocious Bite deal ${20 * r}% more damage.`, (m, r) => { m.sdmg.rake = (m.sdmg.rake || 0) + 0.2 * r; m.sdmg.bite = (m.sdmg.bite || 0) + 0.2 * r; }),
      T('Primal Fury', 2, (r) => `Cat form deals ${6 * r}% more damage.`, (m, r) => { m.form.cat += 0.06 * r; }),
      T('Predator', 1, () => 'Killing an enemy resets Rake and Ferocious Bite.', (m) => { m.flags.predator = 1; }, true)] },
    { name: 'Guardian', desc: 'Unbreakable in bear form.', color: 0xb07a3a, list: [
      T('Thick Hide', 3, (r) => `+${10 * r}% armor.`, (m, r) => { m.armor += 0.1 * r; }),
      T('Heart of the Wild', 3, (r) => `+${5 * r}% maximum health.`, (m, r) => { m.hp += 0.05 * r; }),
      T('Savage Defense', 2, (r) => `Frenzied Regeneration heals ${25 * r}% more.`, (m, r) => { m.flags.savage = 0.25 * r; }),
      T('Brutal Impact', 2, (r) => `Bash cooldown reduced by ${4 * r} sec.`, (m, r) => { m.cdr.bash = (m.cdr.bash || 0) + 4 * r; }),
      T('Ursoc\'s Might', 1, () => 'Bear form gives 20% more maximum health.', (m) => { m.flags.ursoc = 1; }, true)] },
  ],
};
const TAL_ROW_REQ = [0, 2, 4, 6, 8];
const talentPoints = () => Math.max(0, P.lvl - 9);
const talentSpent = () => Object.values(CH.talents || {}).reduce((a, b) => a + b, 0);
const treeSpent = (ti) => TALENTS[CH.cls][ti].list.reduce((a, _, i) => a + (CH.talents[ti + '-' + i] || 0), 0);
function rebuildMods() {
  M = freshMods();
  const trees = TALENTS[CH.cls];
  trees.forEach((t, ti) => t.list.forEach((tal, i) => { const r = CH.talents[ti + '-' + i] || 0; if (r) tal.f(M, r); }));
}
