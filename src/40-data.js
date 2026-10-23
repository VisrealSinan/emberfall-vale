/* Game data: races, classes, items, monsters, NPCs and quests. */

const MAX_LVL = 25;
const xpNext = (l) => Math.round(60 * Math.pow(l, 1.55));

const RACES = {
  elf: { name: 'Elf', blurb: 'Tall, quick and sharp-eyed.', trait: 'Keen Eyes: +10% critical strike and 8% faster movement.', crit: 0.10, speed: 1.08,
    skins: [0xffe3cf, 0xf5cba7, 0xd9a27a, 0xb9a3e0], names: ['Aelindra', 'Faelar', 'Sylvaris', 'Thalion', 'Elowen', 'Lirael'] },
  dwarf: { name: 'Dwarf', blurb: 'Short, broad and hard to kill.', trait: 'Stoneblood: +20% health and 10% less damage taken.', hp: 1.2, dr: 0.10,
    skins: [0xffd7bc, 0xe9b28a, 0xb07a52, 0xc9c4bc], names: ['Brunna', 'Dorin', 'Hilda', 'Thrain', 'Korga', 'Bofri'] },
  fishfolk: { name: 'Fishfolk', blurb: 'Scaled folk from the deep lakes.', trait: 'Tidebound: swim at full speed, heal fast in water, +5% haste.', swim: true, haste: 5,
    skins: [0x7fd0e8, 0x6fd0b0, 0x8fa8f0, 0x4fa0b8], names: ['Mrrgla', 'Korrish', 'Nerissa', 'Tidewyn', 'Gillan', 'Marisol'] },
  undead: { name: 'Undead', blurb: 'Risen dead who kept their wits.', trait: 'Unliving Hunger: heal for 8% of all damage you deal.', leech: 0.08,
    skins: [0xc9d1c0, 0xb8c2d4, 0xd8d0c4, 0xa8b89a], names: ['Morvain', 'Seraphine', 'Grimsby', 'Vesper', 'Ashka', 'Noctis'] },
};
const HAIRS = [0x2b2f4a, 0x7a4a2a, 0xffd27a, 0xe8eef8, 0xff8fb8, 0x5aa0ff, 0xe0483a, 0x5ad08a, 0x9a6aff];
const EYES = [0x2fae6a, 0x3a9aff, 0xe0a030, 0x9a5aff, 0xe0384a, 0x2ac0c0];
const CLASSES = {
  druid: { name: 'Druid', blurb: 'Shapeshifter: caster, cat or bear.', hp: 1, armor: 'leather', color: 0x5fae5a },
  rogue: { name: 'Rogue', blurb: 'Daggers, stealth and burst.', hp: 1, armor: 'leather', color: 0x6a6a8a, primary: 'agi' },
  archer: { name: 'Archer', blurb: 'Arrows from a safe distance.', hp: 0.95, armor: 'mail', color: 0x3f8a5a, primary: 'agi' },
  warlock: { name: 'Warlock', blurb: 'Curses, life drain and demons.', hp: 0.92, armor: 'cloth', color: 0x7a4ab0, primary: 'int' },
};
const primaryOf = (cls, form) => cls === 'druid' ? (form === 'caster' ? 'int' : 'agi') : CLASSES[cls].primary;

/* ---------------- items ---------------- */
const RARITY = [
  { name: 'Poor', mult: 0, glow: 0x9d9d9d },
  { name: 'Common', mult: 1, glow: 0xffffff },
  { name: 'Uncommon', mult: 1.3, glow: 0x3dff3a },
  { name: 'Rare', mult: 1.7, glow: 0x4aa8ff },
  { name: 'Epic', mult: 2.25, glow: 0xc27bff },
  { name: 'Legendary', mult: 3, glow: 0xff9b2e },
];
const SLOTS = [
  { id: 'head', name: 'Head', w: 1, ar: 0.13 }, { id: 'neck', name: 'Neck', w: 0.55, ar: 0 }, { id: 'shoulders', name: 'Shoulders', w: 0.75, ar: 0.1 },
  { id: 'back', name: 'Back', w: 0.55, ar: 0.06 }, { id: 'chest', name: 'Chest', w: 1, ar: 0.17 }, { id: 'hands', name: 'Hands', w: 0.75, ar: 0.08 },
  { id: 'waist', name: 'Waist', w: 0.6, ar: 0.07 }, { id: 'legs', name: 'Legs', w: 1, ar: 0.15 }, { id: 'feet', name: 'Feet', w: 0.75, ar: 0.1 },
  { id: 'ring', name: 'Ring', w: 0.55, ar: 0 }, { id: 'trinket', name: 'Trinket', w: 0.7, ar: 0 }, { id: 'main', name: 'Main Hand', w: 1.1, ar: 0 },
  { id: 'off', name: 'Off Hand', w: 0.6, ar: 0 },
];
const SLOT = Object.fromEntries(SLOTS.map((s) => [s.id, s]));
const DOLL_L = ['head', 'neck', 'shoulders', 'back', 'chest', 'waist'], DOLL_R = ['hands', 'legs', 'feet', 'ring', 'trinket'], DOLL_W = ['main', 'off'];
const WEAPON = { rogue: ['Dagger', 'Dagger'], archer: ['Bow', 'Quiver'], warlock: ['Staff', 'Tome'], druid: ['Staff', 'Idol'] };
const NOUN = {
  head: { cloth: ['Hood', 'Circlet', 'Cowl'], leather: ['Cap', 'Headband', 'Mask'], mail: ['Coif', 'Helm', 'Visor'] },
  shoulders: { cloth: ['Mantle', 'Amice'], leather: ['Shoulderpads', 'Spaulders'], mail: ['Pauldrons', 'Epaulets'] },
  chest: { cloth: ['Robe', 'Vestments'], leather: ['Tunic', 'Jerkin'], mail: ['Hauberk', 'Chainmail'] },
  hands: { cloth: ['Gloves', 'Handwraps'], leather: ['Grips', 'Gloves'], mail: ['Gauntlets', 'Handguards'] },
  waist: { cloth: ['Sash', 'Cord'], leather: ['Belt', 'Waistband'], mail: ['Girdle', 'Belt'] },
  legs: { cloth: ['Leggings', 'Trousers'], leather: ['Pants', 'Breeches'], mail: ['Legguards', 'Greaves'] },
  feet: { cloth: ['Slippers', 'Sandals'], leather: ['Boots', 'Treads'], mail: ['Sabatons', 'Boots'] },
  back: ['Cloak', 'Cape', 'Drape'], neck: ['Pendant', 'Amulet', 'Choker'], ring: ['Band', 'Ring', 'Signet'], trinket: ['Charm', 'Talisman', 'Totem'],
  Dagger: ['Dirk', 'Knife', 'Shiv', 'Kris'], Bow: ['Longbow', 'Shortbow', 'Recurve'], Staff: ['Staff', 'Rod', 'Stave'], Quiver: ['Quiver'], Tome: ['Tome', 'Grimoire'], Idol: ['Idol', 'Totem'],
};
const MATERIAL = { cloth: ['Linen', 'Woolen', 'Silk', 'Mageweave', 'Moonweave'], leather: ['Rough', 'Wolfhide', 'Thick', 'Shadowhide', 'Drakehide'], mail: ['Rusted', 'Chain', 'Scaled', 'Steelforged', 'Ironscale'], other: ['Crude', 'Sturdy', 'Fine', 'Gleaming', 'Runed'] };
const ZONE_PRE = { vale: ['Blossom', 'Emberfall', 'Meadowkeeper\'s'], wood: ['Thornweave', 'Whisperwood', 'Grovewarden\'s'], marsh: ['Mirecaller\'s', 'Bogstrider', 'Reedwater'], frost: ['Frostbound', 'Rimeforged', 'Glacial'], cinder: ['Cinderforged', 'Ashen', 'Emberheart'] };
const EPIC_SUF = ['of the Fallen Star', 'of Eclipse', 'of Endless Storms', 'of the Ninth Moon', 'of Burning Vows', 'of Silent Snow'];
const LEGEND = ['Kazehana, Wind Blossom', 'Hoshikage, Star Shadow', 'Akatsuki, Crimson Dawn', 'Tsukiyomi\'s Promise', 'Heart of the Ember Golem'];
const ICOL = [[0x8a7a62, 0x6a6a72, 0x7a5a42], [0x9a8a72, 0x7a7a86, 0x8a6a4a], [0x4a9a4a, 0x3a8a7a, 0x7a9a3a], [0x3a6ad0, 0x2a5aa8, 0x4a8ae0], [0x8a3ad0, 0x6a2aa8, 0xa04ad8], [0xe8833a, 0xd8a030, 0xff6a3a]];
const SEC_NAME = { crit: 'Critical Strike', haste: 'Haste' };
const STAT_NAME = { sta: 'Stamina', agi: 'Agility', int: 'Intellect', crit: 'Critical Strike', haste: 'Haste', armor: 'Armor' };

function genItem(ilvl, rarity, slot, cls, zone = 'vale') {
  ilvl = clamp(Math.round(ilvl), 1, 30);
  const C = CLASSES[cls], S = SLOT[slot], R = RARITY[rarity], tier = clamp(Math.floor((ilvl - 1) / 5), 0, 4);
  const isW = slot === 'main' || slot === 'off', wtype = isW ? WEAPON[cls][slot === 'main' ? 0 : 1] : null;
  const armorType = slot === 'back' ? 'cloth' : C.armor;
  const prim = cls === 'druid' ? pick(['agi', 'int']) : C.primary;
  const budget = (3 + ilvl * 1.5) * R.mult * S.w * (rarity >= 4 ? 1.1 : 1);
  const stats = {};
  stats[prim] = Math.max(1, Math.round(budget * 0.5));
  stats.sta = Math.max(1, Math.round(budget * 0.4));
  let sec = null;
  if (rarity >= 2) { sec = pick(['crit', 'haste']); stats[sec] = Math.max(1, Math.round(budget * 0.3)); }
  if (rarity >= 3) { const o = sec === 'crit' ? 'haste' : 'crit'; stats[o] = Math.max(1, Math.round(budget * 0.2)); }
  if (S.ar > 0) stats.armor = Math.round((ilvl * 1.6 + 6) * S.ar * 10 * { cloth: 1, leather: 1.7, mail: 2.6 }[armorType] * (0.85 + 0.15 * R.mult));
  let dmg = 0;
  if (slot === 'main') dmg = Math.round((4 + ilvl * 2) * R.mult * (cls === 'rogue' ? 0.75 : 1));
  if (slot === 'off' && cls === 'rogue') dmg = Math.round((4 + ilvl * 2) * R.mult * 0.45);
  // name
  const nounList = isW ? NOUN[wtype] : Array.isArray(NOUN[slot]) ? NOUN[slot] : NOUN[slot][armorType];
  const noun = pick(nounList);
  let name;
  if (rarity >= 5) name = pick(LEGEND);
  else if (rarity === 4) name = `${pick(ZONE_PRE[zone] || ZONE_PRE.vale)} ${noun} ${pick(EPIC_SUF)}`;
  else if (rarity === 3) name = `${pick(ZONE_PRE[zone] || ZONE_PRE.vale)} ${noun}`;
  else {
    const mat = (S.ar > 0 && slot !== 'back' ? MATERIAL[armorType] : MATERIAL.other)[tier];
    const suf = rarity >= 2 ? (sec === 'crit' ? ' of Precision' : sec === 'haste' ? ' of Swiftness' : '') || (prim === 'agi' ? ' of the Tiger' : ' of the Owl') : '';
    name = `${mat} ${noun}${rarity === 2 && Math.random() < 0.4 ? (prim === 'agi' ? ' of the Tiger' : ' of the Owl') : suf}`;
  }
  return { id: uid(), name, slot, rarity, ilvl, req: clamp(ilvl - 1, 1, MAX_LVL), cls, type: isW ? wtype : (S.ar > 0 ? armorType[0].toUpperCase() + armorType.slice(1) : ''), stats, dmg,
    sell: Math.round((3 + ilvl * ilvl * 0.5) * (0.5 + R.mult * R.mult * 0.5)), color: pick(ICOL[rarity]) };
}
function genJunk(name, lvl) { return { id: uid(), name, slot: 'junk', rarity: 0, ilvl: lvl, req: 0, stats: {}, dmg: 0, sell: 2 + lvl * 2, color: 0x8a8a8a }; }
function starterGear(cls) {
  const eq = {};
  for (const s of ['main', 'off', 'chest', 'legs', 'feet']) { if (s === 'off' && cls !== 'rogue') continue; const it = genItem(1, 1, s, cls); it.name = 'Worn ' + it.name.split(' ').slice(1).join(' '); eq[s] = it; }
  return eq;
}
function rollRarity(src) {
  const r = Math.random();
  if (src === 'boss') return r < 0.03 ? 5 : r < 0.38 ? 4 : 3;
  if (src === 'elite') return r < 0.07 ? 4 : r < 0.45 ? 3 : 2;
  if (src === 'quest-blue') return r < 0.1 ? 4 : 3;
  if (src === 'quest-epic') return 4;
  if (src === 'quest') return r < 0.15 ? 3 : 2;
  if (src === 'vendor') return r < 0.3 ? 2 : 1;
  return r < 0.004 ? 4 : r < 0.04 ? 3 : r < 0.3 ? 2 : 1;
}
const GEAR_SLOTS = SLOTS.map((s) => s.id);

/* ---------------- monsters ---------------- */
const BANDIT_LOOK = { race: 'human', skinColor: 0xf0c4a0, hairColor: 0x4a2a1a, eyeColor: 0x6a4a2a, outfit: { top: 0x9a3a2a, trim: 0x4a3a2a, pants: 0x4a3a2a, boots: 0x2a1a14, cape: null, scarf: null, robe: false }, weapon: 'sword', style: 0 };
const MOBS = {
  slime: { name: 'Meadow Slime', model: 'slime', color: 0x7be05a, lv: [1, 3], hp: 0.8, dmg: 0.8, speed: 3.2, aggro: 10, range: 1.9, junk: 'Slime Goo' },
  boar: { name: 'Bristleback Boar', model: 'quad', color: 0x9a6a4a, color2: 0xc8a07a, tusks: true, lv: [2, 4], speed: 5, aggro: 13, junk: 'Coarse Bristles' },
  wolf: { name: 'Vale Wolf', model: 'quad', color: 0x8a8e9a, color2: 0xd8dce6, lv: [3, 5], speed: 6, aggro: 16, junk: 'Wolf Fang' },
  bandit: { name: 'Road Bandit', model: 'biped', hero: BANDIT_LOOK, lv: [4, 6], speed: 5, aggro: 15, range: 2.4, junk: 'Stolen Trinket', human: true },
  spider: { name: 'Whisperwood Spider', model: 'spider', color: 0x4a3a6a, color2: 0x2e2448, lv: [6, 8], speed: 5.5, aggro: 14, junk: 'Spider Leg' },
  wisp: { name: 'Forest Wisp', model: 'wisp', color: 0x9ff0ff, lv: [6, 9], hp: 0.7, ranged: true, proj: 0x9ff0ff, range: 14, speed: 4, aggro: 16, junk: 'Wisp Dust' },
  treant: { name: 'Mossbark Treant', model: 'treant', color: 0x6a4a32, color2: 0x4f9a3a, lv: [7, 10], hp: 1.6, dmg: 1.3, speed: 2.8, range: 3.4, aggro: 12, scale: 0.9, junk: 'Mossy Bark' },
  cultist: { name: 'Thorn Cultist', model: 'biped', hero: { race: 'human', skinColor: 0xe8c0a8, hairColor: 0x1e1430, eyeColor: 0xb05aff, glowEyes: true, outfit: { top: 0x3a2a4a, trim: 0x8a3ad0, pants: 0x2a1a30, boots: 0x1a1020, cape: 0x2a1a3a, robe: true, scarf: null }, weapon: 'staff', style: 1 }, lv: [8, 10], ranged: true, proj: 0xb05aff, range: 15, aggro: 16, junk: 'Thorny Charm', human: true },
  crab: { name: 'Mire Crab', model: 'crab', color: 0xe06a3a, color2: 0xc8502a, lv: [9, 11], hp: 1.2, speed: 4, aggro: 12, junk: 'Muddy Shell' },
  lurker: { name: 'Bog Lurker', model: 'lurker', color: 0x4a8a6a, color2: 0x9ac8a0, lv: [10, 12], speed: 5, aggro: 15, range: 2.6, junk: 'Slimy Scale' },
  toad: { name: 'Giant Mire Toad', model: 'toad', color: 0x6a9a3a, color2: 0x3a5a2a, lv: [11, 13], hp: 1.3, speed: 3.5, aggro: 12, range: 2.4, junk: 'Toad Wart' },
  frostwolf: { name: 'Frostfang Wolf', model: 'quad', color: 0xe8f0fa, color2: 0xb8d0e8, eye: 0x5ab8ff, glowEyes: true, lv: [13, 15], speed: 6.5, aggro: 17, junk: 'Frosted Fang' },
  wraith: { name: 'Frost Wraith', model: 'wraith', color: 0xa8c8f0, lv: [14, 16], ranged: true, proj: 0x9fe8ff, range: 14, speed: 4, aggro: 16, junk: 'Ectoplasm' },
  yeti: { name: 'Snowhide Yeti', model: 'yeti', color: 0xf0f4fa, color2: 0x8a9ab0, lv: [15, 17], hp: 1.7, dmg: 1.4, speed: 4, range: 3.6, aggro: 14, junk: 'Matted Fur' },
  imp: { name: 'Cinder Imp', model: 'imp', color: 0xd83a2a, lv: [17, 19], hp: 0.8, ranged: true, proj: 0xff8a3a, range: 13, speed: 5, aggro: 16, junk: 'Smoldering Ash' },
  skeleton: { name: 'Ashen Skeleton', model: 'biped', hero: { race: 'undead', skinColor: 0xeee6d4, eyeColor: 0xff5a3a, glowEyes: true, style: -1, outfit: { top: 0x5a5048, trim: 0x3a3430, pants: 0x3a3430, boots: 0x2a2420, cape: null, scarf: null, robe: false }, weapon: 'axe' }, lv: [18, 20], speed: 4.5, aggro: 15, range: 2.6, junk: 'Ashen Bone' },
  hound: { name: 'Magma Hound', model: 'quad', color: 0x3a2a28, color2: 0x6a3a2a, eye: 0xffa03a, glowEyes: true, ember: true, lv: [19, 21], speed: 6.5, aggro: 17, junk: 'Charred Claw' },
  cgolem: { name: 'Cinder Golem', model: 'golem', color: 0x5a4a44, lv: [20, 22], hp: 2, dmg: 1.5, speed: 3, range: 4, aggro: 14, scale: 0.55, junk: 'Cooling Slag' },
};
// Named elites and bosses. `base` copies the look of a normal monster.
const NAMED = {
  oldtusk: { base: 'boar', name: 'Old Tusk', lvl: 6, elite: true, scale: 1.6, color: 0x6a4a3a, place: 'boarField', respawn: 150 },
  gorrak: { base: 'bandit', name: 'Gorrak the Bandit King', lvl: 7, boss: true, scale: 1.45, place: 'banditCamp', hero: Object.assign({}, BANDIT_LOOK, { crown: true, weapon: 'axe', outfit: Object.assign({}, BANDIT_LOOK.outfit, { top: 0x6a1a1a, cape: 0x3a0a0a }) }), respawn: 300 },
  gloomfang: { base: 'spider', name: 'Gloomfang', lvl: 10, elite: true, scale: 1.5, color: 0x2a1a3a, place: 'oldGrove', respawn: 150 },
  silkweaver: { base: 'spider', name: 'Mother Silkweaver', lvl: 11, boss: true, scale: 2.3, color: 0xe8e0f0, color2: 0x6a4a8a, place: 'silkHollow', special: 'spit', respawn: 300 },
  shellshock: { base: 'crab', name: 'Shellshock', lvl: 13, elite: true, scale: 1.7, color: 0x3a8ad0, color2: 0x2a6aa8, place: 'crabShore', respawn: 150 },
  maw: { base: 'lurker', name: 'The Drowned Maw', lvl: 14, boss: true, scale: 2.1, color: 0x2a5a4a, place: 'mawPool', respawn: 300 },
  frostmaw: { base: 'yeti', name: 'Frostmaw', lvl: 16, elite: true, scale: 1.3, color2: 0x4a6aa8, place: 'yetiCaves', respawn: 150 },
  rimefang: { base: 'frostwolf', name: 'Rimefang', lvl: 18, boss: true, scale: 2.5, place: 'rimeHollow', special: 'spit', respawn: 300 },
  scorchjaw: { base: 'hound', name: 'Scorchjaw', lvl: 21, elite: true, scale: 1.6, place: 'impFlats', respawn: 150 },
  embergolem: { base: 'cgolem', name: 'The Ember Golem', lvl: 23, boss: true, scale: 1.9, place: 'moltenRuins', respawn: 300 },
};
const SPAWNS = [
  ['slime', 'slimeMeadow', 14, 60], ['slime', 'vale', 10], ['boar', 'boarField', 10, 50], ['wolf', 'wolfDen', 11, 45], ['bandit', 'banditCamp', 10, 32], ['boar', 'vale', 5],
  ['spider', 'silkHollow', 8, 60], ['spider', 'wood', 8], ['wisp', 'oldGrove', 10, 50], ['treant', 'wood', 10], ['cultist', 'cultCamp', 10, 30],
  ['crab', 'crabShore', 14, 55], ['lurker', 'lurkerReeds', 12, 55], ['toad', 'marsh', 11],
  ['frostwolf', 'frost', 14], ['wraith', 'wraithField', 10, 55], ['yeti', 'yetiCaves', 9, 50],
  ['imp', 'impFlats', 13, 55], ['skeleton', 'boneYard', 12, 50], ['hound', 'cinder', 10], ['cgolem', 'moltenRuins', 7, 60],
];

/* ---------------- NPCs ---------------- */
const npcLook = (race, sex, hair, style, top, trim, extra = {}) => Object.assign({ race, sex, hairColor: HAIRS[hair], style, skin: 0, eye: randi(0, 5), outfit: { top, trim, pants: 0x4a3a32, boots: 0x3a2a22, cape: null, scarf: null, robe: false }, weapon: 'none' }, extra);
const NPCS = [
  { id: 'maren', name: 'Elder Maren', title: 'Village Elder', town: 'emberfall', dx: 0, dz: -6, look: npcLook('elf', 'female', 3, 1, 0x6a4a9a, 0xffd479, { outfit: { top: 0x6a4a9a, trim: 0xffd479, pants: 0x4a3a6a, boots: 0x3a2a4a, cape: 0x4a2a6a, robe: true }, weapon: 'staff' }), greet: 'Welcome to Emberfall, {name}. The vale has been restless lately.' },
  { id: 'brannoc', name: 'Captain Brannoc', title: 'Village Guard', town: 'emberfall', dx: 8, dz: 6, look: npcLook('dwarf', 'male', 6, 0, 0x8a8e9a, 0x3a5aa8, { weapon: 'axe' }), greet: 'Keep your blade sharp. The roads aren\'t safe anymore.' },
  { id: 'hobb', name: 'Farmer Hobb', title: 'Farmer', town: 'emberfall', dx: -10, dz: -4, look: npcLook('human', 'male', 1, 0, 0xc8a05a, 0x6a4a2a), greet: 'Those boars ate half my turnips again!' },
  { id: 'pell', name: 'Pell', title: 'Merchant', town: 'emberfall', dx: 5, dz: -10, vendor: true, look: npcLook('human', 'female', 4, 2, 0xe85a7a, 0xffffff), greet: 'Potions, gear, odds and ends. Have a look!' },
  { id: 'wren', name: 'Wren', title: 'Wind Rider', town: 'emberfall', dx: -12, dz: 8, flight: true, look: npcLook('elf', 'female', 5, 2, 0x4ab8e8, 0xffffff), greet: 'My griffin can take you anywhere you have already been.' },

  { id: 'sylva', name: 'Warden Sylva', title: 'Warden of Thornhold', town: 'thornhold', dx: 0, dz: -6, look: npcLook('elf', 'female', 7, 1, 0x3f8a4a, 0xc49a62, { weapon: 'bow' }), greet: 'Quietly now. The forest is listening.' },
  { id: 'fen', name: 'Herbalist Fen', title: 'Herbalist', town: 'thornhold', dx: 8, dz: 4, look: npcLook('fishfolk', 'male', 7, 0, 0x8ab86a, 0xe8d8a8), greet: 'Mind the mushrooms. Some of them bite.' },
  { id: 'kael', name: 'Ranger Kael', title: 'Ranger', town: 'thornhold', dx: -9, dz: -2, look: npcLook('elf', 'male', 0, 0, 0x2f5a3a, 0x8a6a42, { weapon: 'bow' }), greet: 'Something old is waking up in these woods.' },
  { id: 'tamsin', name: 'Tamsin', title: 'Merchant', town: 'thornhold', dx: 5, dz: -11, vendor: true, look: npcLook('dwarf', 'female', 2, 2, 0xa86a3a, 0xffd479), greet: 'Best prices this side of the vale!' },
  { id: 'aster', name: 'Aster', title: 'Wind Rider', town: 'thornhold', dx: -11, dz: 9, flight: true, look: npcLook('human', 'male', 2, 0, 0x4ab8e8, 0xffffff), greet: 'Need a lift?' },

  { id: 'halden', name: 'Reeve Halden', title: 'Reeve of Reedwater', town: 'reedwater', dx: 0, dz: -6, look: npcLook('human', 'male', 1, 1, 0x5a7a4a, 0xd9b85a), greet: 'Welcome to Reedwater. Watch your step on the boards.' },
  { id: 'moss', name: 'Old Moss', title: 'Fishfolk Elder', town: 'reedwater', dx: 9, dz: 3, look: npcLook('fishfolk', 'female', 7, 1, 0x4a8a7a, 0xe8d8a8, { robe: true }), greet: 'Mrrgl. The marsh remembers everything, little one.' },
  { id: 'wynn', name: 'Trapper Wynn', title: 'Trapper', town: 'reedwater', dx: -9, dz: -3, look: npcLook('dwarf', 'female', 6, 2, 0x7a5a3a, 0x3a2a1a, { weapon: 'sword' }), greet: 'Got traps to set and crabs to boil.' },
  { id: 'marlo', name: 'Marlo', title: 'Merchant', town: 'reedwater', dx: 5, dz: -11, vendor: true, look: npcLook('fishfolk', 'male', 2, 0, 0xd9b85a, 0x5a7a4a), greet: 'Fresh from the bog! Mostly.' },
  { id: 'juniper', name: 'Juniper', title: 'Wind Rider', town: 'reedwater', dx: -11, dz: 9, flight: true, look: npcLook('elf', 'female', 4, 0, 0x4ab8e8, 0xffffff), greet: 'Up, up and away!' },

  { id: 'ysolde', name: 'Commander Ysolde', title: 'Commander of Frostwatch', town: 'frostwatch', dx: 0, dz: -6, look: npcLook('human', 'female', 3, 1, 0x4a6aa8, 0xe8eef8, { weapon: 'sword', outfit: { top: 0x4a6aa8, trim: 0xe8eef8, pants: 0x2a3a5a, boots: 0x1a2a3a, cape: 0x2a4a8a } }), greet: 'Frostwatch holds the line. Barely.' },
  { id: 'orrin', name: 'Sage Orrin', title: 'Sage', town: 'frostwatch', dx: 9, dz: 3, look: npcLook('undead', 'male', 3, 1, 0x3a4a6a, 0x9fe8ff, { robe: true }), greet: 'Do not mind the bones. I have been cold for a very long time.' },
  { id: 'brina', name: 'Huntress Brina', title: 'Huntress', town: 'frostwatch', dx: -9, dz: -3, look: npcLook('dwarf', 'female', 6, 2, 0xe8eef8, 0x7a5a3a, { weapon: 'bow' }), greet: 'Warm boots and a sharp spear. That\'s all you need up here.' },
  { id: 'greta', name: 'Greta', title: 'Merchant', town: 'frostwatch', dx: 5, dz: -11, vendor: true, look: npcLook('human', 'female', 2, 1, 0xd84a3a, 0xffffff), greet: 'Furs! Furs for sale!' },
  { id: 'sol', name: 'Sol', title: 'Wind Rider', town: 'frostwatch', dx: -11, dz: 9, flight: true, look: npcLook('dwarf', 'male', 1, 0, 0x4ab8e8, 0xffffff), greet: 'Bundle up, it\'s cold above the clouds.' },

  { id: 'varr', name: 'Scout Varr', title: 'Scout Captain', town: 'ashfall', dx: 0, dz: -6, look: npcLook('human', 'male', 0, 0, 0x8a5a3a, 0xe8833a, { weapon: 'sword' }), greet: 'You made it through the ash. Good. We need everyone.' },
  { id: 'ilsa', name: 'Pyromancer Ilsa', title: 'Pyromancer', town: 'ashfall', dx: 9, dz: 3, look: npcLook('elf', 'female', 6, 2, 0xd84a3a, 0xffd479, { robe: true, weapon: 'staff' }), greet: 'Fire isn\'t evil. It\'s just hungry.' },
  { id: 'dorn', name: 'Quartermaster Dorn', title: 'Quartermaster', town: 'ashfall', dx: -9, dz: -3, look: npcLook('dwarf', 'male', 3, 0, 0x6a6a72, 0xe8833a, { weapon: 'axe' }), greet: 'Supplies are short. Everything is short.' },
  { id: 'zahra', name: 'Zahra', title: 'Merchant', town: 'ashfall', dx: 5, dz: -11, vendor: true, look: npcLook('human', 'female', 0, 1, 0xe8833a, 0x3a2a2a), greet: 'Fireproof goods, guaranteed. Mostly.' },
  { id: 'ember', name: 'Ember', title: 'Wind Rider', town: 'ashfall', dx: -11, dz: 9, flight: true, look: npcLook('fishfolk', 'female', 6, 2, 0x4ab8e8, 0xffffff), greet: 'Hold on tight, the thermals are rough here.' },
];
const NPC = Object.fromEntries(NPCS.map((n) => [n.id, n]));

/* ---------------- quests ---------------- */
// obj: kill {t:'kill', m, n} | loot {t:'loot', m:[types], item, n, p} | gather {t:'gather', k, n}
const QUESTS = [];
function Q(id, giver, lvl, title, text, obj, o = {}) { QUESTS.push(Object.assign({ id, giver, lvl, title, text, obj, req: [], reward: 'green' }, o)); }
const K = (m, n) => ({ t: 'kill', m, n }), L = (m, item, n, p) => ({ t: 'loot', m: [].concat(m), item, n, p }), GA = (k, n) => ({ t: 'gather', k, n });

// Emberfall Vale
Q('q_slimes', 'maren', 1, 'Slime Trouble', 'Slimes have oozed out of the marsh and into our meadows. They\'re eating the turnips and frightening the children. Clear out six of them in the fields north of the village.', [K('slime', 6)], { done: 'Six fewer slimes! The children can play outside again.' });
Q('q_bloom', 'maren', 2, 'Emberbloom', 'Our healer is out of emberbloom, the glowing red flower that grows all over the vale. Bring me five and she\'ll brew something useful.', [GA('emberbloom', 5)], { req: ['q_slimes'], reward: 'potions', done: 'Still warm to the touch. Take these potions from the healer.' });
Q('q_bacon', 'hobb', 2, 'Bristleback Bacon', 'The bristleback boars west of the village keep raiding my field. Bring me six haunches and I\'ll make sure they never go to waste.', [L('boar', 'Boar Haunch', 6, 0.6)], { done: 'That\'s a lot of bacon. Thank you, friend!' });
Q('q_wolves', 'brannoc', 3, 'Wolves at the Fence', 'Wolves have been circling the fences at night. Their den is southeast of here. Thin the pack: six should do it.', [K('wolf', 6)], { done: 'Good. The night watch can breathe easier.' });
Q('q_bandits', 'brannoc', 4, 'Road Watch', 'Bandits have set up camp northeast of the village and they\'re robbing anyone on the roads. Teach eight of them a lesson.', [K('bandit', 8)], { req: ['q_wolves'], done: 'That\'ll make them think twice.' });
Q('q_crates', 'brannoc', 5, 'Stolen Supplies', 'The bandits took our winter supplies. Search their camp for the crates and bring back what you can carry. Five crates.', [GA('crate', 5)], { req: ['q_bandits'], done: 'Grain, lamp oil and medicine. You might have saved the winter.' });
Q('q_gorrak', 'brannoc', 6, 'The Bandit King', 'Their leader calls himself Gorrak the Bandit King. He\'s strong and he hits hard. Watch for the glowing circle on the ground when he swings, and get out of it. End his reign.', [K('gorrak', 1)], { req: ['q_crates'], reward: 'blue', xpMul: 2, done: 'The Bandit King is gone! Emberfall owes you a great debt.' });
Q('q_tusk', 'hobb', 5, 'Wanted: Old Tusk', 'There\'s a boar out in the west field bigger than my barn. Old Tusk, we call him. He\'s gored three of my best fence posts. Put him down.', [K('oldtusk', 1)], { req: ['q_bacon'], reward: 'blue', xpMul: 1.5, done: 'You actually did it! Here, you\'ve earned this.' });
Q('q_letter', 'maren', 5, 'A Letter for Thornhold', 'Warden Sylva in Thornhold, deep in Whisperwood to the west, has asked for help. Follow the road west and give her this letter.', [], { req: ['q_bloom'], turnin: 'sylva', reward: 'none', done: 'A letter from Maren? Then things are worse than I feared.' });
// Whisperwood
Q('q_webs', 'sylva', 6, 'Webs in the Wood', 'Spiders are spreading out of Silk Hollow to the southwest. Kill eight of them before they choke the whole forest.', [K('spider', 8)], { done: 'The webs are thinning. Well done.' });
Q('q_silk', 'fen', 6, 'Silk for Bandages', 'Spider silk makes the best bandages. Gross, but true. Bring me six bundles.', [L('spider', 'Spider Silk', 6, 0.55)], { done: 'Perfect. Sticky, but perfect.' });
Q('q_wisps', 'kael', 7, 'Wisps of the Old Grove', 'The wisps in the Old Grove south of here have turned hostile. Something is driving them mad. Calm six of them, permanently.', [K('wisp', 6)], { done: 'They faded away peacefully. I hope.' });
Q('q_heart', 'fen', 8, 'Heartwood', 'The treants carry heartwood in their chests. It\'s the only cure for the blight. Bring me five pieces.', [L('treant', 'Mossy Heartwood', 5, 0.7)], { req: ['q_silk'], done: 'This will heal a hundred trees.' });
Q('q_cult', 'sylva', 8, 'The Thorn Cult', 'A cult has gathered at the Thorn Circle, northwest of town. They\'re the ones poisoning the forest. Stop eight of them.', [K('cultist', 8)], { req: ['q_webs'], done: 'The circle is quiet. For now.' });
Q('q_tomes', 'kael', 9, 'Cult Tomes', 'The cultists keep tomes on the stones of their circle. Bring me four so we can learn what they\'re planning.', [GA('tome', 4)], { req: ['q_wisps'], done: 'These pages speak of a Mother. A spider queen.' });
Q('q_gloom', 'kael', 9, 'Wanted: Gloomfang', 'A huge spider called Gloomfang hunts in the Old Grove. It has already killed two of my rangers. Avenge them.', [K('gloomfang', 1)], { req: ['q_wisps'], reward: 'blue', xpMul: 1.5, done: 'Rest easy, friends. It\'s done.' });
Q('q_silkweaver', 'sylva', 10, 'Mother Silkweaver', 'The spider queen nests in Silk Hollow. She spits webs that slow and burn. Watch the ground and keep moving. Kill her and the forest will heal.', [K('silkweaver', 1)], { req: ['q_cult', 'q_tomes'], reward: 'blue', xpMul: 2, done: 'Whisperwood is free. You have the forest\'s thanks, and mine.' });
Q('q_tomarsh', 'sylva', 10, 'South to the Marsh', 'Reeve Halden of Reedwater, in Mirefen Marsh to the south, sent word of trouble. Take the road back through the vale and south.', [], { req: ['q_cult'], turnin: 'halden', reward: 'none', done: 'Sylva sent you? Good. We need a fighter.' });
// Mirefen Marsh
Q('q_claws', 'halden', 9, 'Snapping Claws', 'Mire crabs crawl all over the eastern shore. They\'ve taken two fingers off my fishermen. Kill eight.', [K('crab', 8)], { done: 'That\'s one less thing snapping at us.' });
Q('q_stew', 'wynn', 10, 'Crab Meat Stew', 'Nothing beats crab stew on a cold night. Bring me eight bits of tender crab meat.', [L('crab', 'Tender Crab Meat', 8, 0.6)], { done: 'Smells like home. Want a bowl?' });
Q('q_lurkers', 'halden', 11, 'Lurkers in the Reeds', 'Bog lurkers hide in the reeds west of here and drag people into the water. Kill eight of them.', [K('lurker', 8)], { req: ['q_claws'], done: 'The reeds feel safer already.' });
Q('q_venom', 'moss', 11, 'Toad Venom', 'Mrrgl. The giant toads carry a venom that cures the bog fever. Bring Old Moss six venom sacs.', [L('toad', 'Toad Venom Sac', 6, 0.6)], { done: 'Many little ones will live because of you.' });
Q('q_glow', 'moss', 12, 'Glowcap Mushrooms', 'Glowcaps light the marsh at night. They grow everywhere here. Pick six. Old Moss needs them for the lanterns.', [GA('glowcap', 6)], { req: ['q_venom'], done: 'Now the lanterns will burn all winter.' });
Q('q_shell', 'wynn', 12, 'Wanted: Shellshock', 'A blue crab the size of a cart lives on the east shore. Shellshock. It wrecked my traps. Bring me its claw.', [K('shellshock', 1)], { req: ['q_stew'], reward: 'blue', xpMul: 1.5, done: 'Ha! That\'s going on my wall.' });
Q('q_maw', 'halden', 13, 'The Drowned Maw', 'Something enormous lives in the Drowning Pool to the far south. We call it the Maw. It has taken too many of us. Put an end to it.', [K('maw', 1)], { req: ['q_lurkers'], reward: 'blue', xpMul: 2, done: 'The Maw is dead? Then Reedwater is free!' });
Q('q_tofrost', 'halden', 13, 'North to Frostwatch', 'Commander Ysolde of Frostwatch is calling for anyone who can fight. Frostwatch lies far to the north, past the vale and up into the snow.', [], { req: ['q_lurkers'], turnin: 'ysolde', reward: 'none', done: 'Halden sent you? Then you\'re welcome here.' });
// Frostpeak
Q('q_hunger', 'ysolde', 13, 'White Hunger', 'Frostfang wolves are starving and bold. They attack our patrols. Kill eight.', [K('frostwolf', 8)], { done: 'The patrols can move again.' });
Q('q_pelts', 'brina', 14, 'Pelts for the Garrison', 'Our soldiers are freezing. Bring me eight good pelts from frostfang wolves or yetis.', [L(['frostwolf', 'yeti'], 'Frost Pelt', 8, 0.55)], { done: 'Warm soldiers fight better.' });
Q('q_spirits', 'orrin', 15, 'Restless Spirits', 'The wraiths in the snowfields east of here were once soldiers like me. Give eight of them rest.', [K('wraith', 8)], { done: 'Thank you. They were my friends, once.' });
Q('q_shards', 'orrin', 15, 'Rimecrystal Shards', 'Rimecrystal grows in the snowfields and in Rime Hollow. Its cold light holds the dead at bay. Mine six shards.', [GA('shard', 6)], { req: ['q_spirits'], done: 'Enough to ward the whole fort.' });
Q('q_yeti', 'brina', 16, 'Yeti Problem', 'Yetis from the caves to the west keep smashing our supply sleds. Six of them need to go.', [K('yeti', 6)], { req: ['q_pelts'], done: 'Sleds are moving again!' });
Q('q_frostmaw', 'brina', 16, 'Wanted: Frostmaw', 'The yeti chief, Frostmaw, leads the raids. Find him in the caves and finish it.', [K('frostmaw', 1)], { req: ['q_yeti'], reward: 'blue', xpMul: 1.5, done: 'Frostmaw is down? Drinks are on me.' });
Q('q_rimefang', 'ysolde', 17, 'Rimefang', 'A wolf as big as a house prowls Rime Hollow to the far north. Rimefang. Its frost breath freezes the ground where you stand. Keep moving.', [K('rimefang', 1)], { req: ['q_hunger', 'q_shards'], reward: 'blue', xpMul: 2, done: 'Rimefang is dead. Frostwatch will tell this story for years.' });
Q('q_tocinder', 'ysolde', 17, 'Into the Cinderwaste', 'Scout Varr holds Ashfall Camp in the Cinderwaste to the east. They\'re close to the Molten Ruins, where the worst of it began.', [], { req: ['q_rimefang'], turnin: 'varr', reward: 'none', done: 'About time someone answered. Welcome to Ashfall.' });
// Cinderwaste
Q('q_imps', 'varr', 17, 'Imp Infestation', 'Cinder imps swarm the flats north of camp. They set fire to everything. Kill ten.', [K('imp', 10)], { done: 'Fewer fires. I\'ll take it.' });
Q('q_bones', 'ilsa', 18, 'Bones of the Fallen', 'Ashen skeletons walk the bone yard southeast of here. Their rest was stolen by the fire. Return eight to the ground.', [K('skeleton', 8)], { done: 'May the ash settle on them gently.' });
Q('q_cores', 'dorn', 19, 'Magma Hound Cores', 'Magma hounds have molten cores that burn for weeks. Perfect for the forges. Bring me six.', [L('hound', 'Molten Core', 6, 0.6)], { done: 'Our forges will roar again.' });
Q('q_ore', 'dorn', 19, 'Cinder Ore', 'There\'s ore all over the waste, glowing orange in the rock. Mine six chunks for new blades.', [GA('ore', 6)], { done: 'Good ore. Great ore, even.' });
Q('q_scorch', 'varr', 20, 'Wanted: Scorchjaw', 'The alpha magma hound, Scorchjaw, hunts the imp flats. It killed my best scout. End it.', [K('scorchjaw', 1)], { req: ['q_imps'], reward: 'blue', xpMul: 1.5, done: 'You avenged her. Thank you.' });
Q('q_golems', 'ilsa', 20, 'Golem Fragments', 'Cinder golems guard the road to the Molten Ruins. Break seven of them to open the way.', [K('cgolem', 7)], { req: ['q_bones'], done: 'The road to the ruins is open.' });
Q('q_ember', 'varr', 22, 'The Ember Golem', 'At the heart of the Molten Ruins stands the Ember Golem, the source of all this fire. It slams the ground and the earth burns. Bring potions, watch the ground, and destroy it.', [K('embergolem', 1)], { req: ['q_golems', 'q_cores'], reward: 'epic', xpMul: 3, done: 'The fire is going out all across the waste. You\'re a legend now, {name}.' });
const QUEST = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
const questXP = (q) => Math.round(xpNext(q.lvl) * 0.35 * (q.xpMul || 1));
const questGold = (q) => Math.round((5 + q.lvl * 3) * (q.xpMul || 1));
