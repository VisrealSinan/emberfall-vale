# Emberfall Vale

A small open-world 3D RPG that runs in the browser. It's built with [three.js](https://threejs.org/) and lives in a single `index.html` file.

## Play

- **Windows app:** download the latest `EmberfallVale-Setup` from the [Releases page](https://github.com/VisrealSinan/emberfall-vale/releases). The launcher shows news and patch notes, has display and graphics settings, and downloads new game versions automatically.
- **Browser:** open `index.html`, or turn on GitHub Pages (Settings → Pages → Deploy from branch → `main`, root folder) to get a playable link.

## Releasing an update

1. Change the game in `index.html`.
2. In `updates.json`, raise `gameVersion` (for example `1.2.0` → `1.3.0`) and add a news entry at the top.
3. Push to `main`. Everyone's launcher picks up the new version the next time they open it.

To ship a new launcher program (only needed when files in `launcher/` change), raise `version` in `launcher/package.json` and push a tag like `v1.0.1`. GitHub builds the Windows installer and attaches it to a new release.

## Create your hero

**Races**

| Race | Trait |
| --- | --- |
| Elf | +10% critical chance, 8% faster movement |
| Dwarf | +20% health, take 10% less damage |
| Fishfolk | Swim at full speed, heal quickly in water |
| Undead | Heal for 8% of all damage dealt |

Pick male or female, skin colour, hair (or fin) colour and style, and a name.

**Classes**

| Class | Role | Abilities (keys 1–4) |
| --- | --- | --- |
| Druid | Shapeshifter | Caster Form (ranged DPS), Cat Form (melee DPS), Bear Form (tank), plus a form skill: Regrowth / Rake / Thrash |
| Rogue | Melee assassin | Shadowstep, Fan of Knives, Vanish, Poison Blades |
| Archer | Ranged hunter | Multi-Shot, Power Shot, Disengage, Rain of Arrows |
| Warlock | Shadow caster | Corruption, Drain Life, Summon Imp, Shadowfury |

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move (hold Shift to sprint) |
| Mouse drag | Turn the camera (scroll to zoom) |
| Click / F | Basic attack |
| 1 2 3 4 | Class abilities |
| Space | Jump |
| E | Talk or pick herbs |
| Q | Drink a potion |

On phones and tablets you get an on-screen stick, buttons and a tappable ability bar.
