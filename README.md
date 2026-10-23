# Emberfall Vale

An open-world, anime-styled 3D RPG that runs in the browser and as a Windows app. Built with [three.js](https://threejs.org/).

## Play

- **Windows app:** download the latest `EmberfallVale-Setup` from the [Releases page](https://github.com/VisrealSinan/emberfall-vale/releases). The launcher shows news and patch notes, has display and graphics settings, and downloads new game versions automatically.
- **Browser:** open `index.html`, or turn on GitHub Pages (Settings → Pages → Deploy from branch → `main`, root folder) to get a playable link.

## The game

- **5 zones, 5 towns:** Emberfall Vale (levels 1–7), Whisperwood (6–11), Mirefen Marsh (9–14), Frostpeak Highlands (13–18) and Cinderwaste (17–23). Wind Riders in every town fly you to towns you've discovered.
- **Up to 8 characters** on the character select screen. Every new character starts at level 1.
- **4 races** (Elf, Dwarf, Fishfolk, Undead) with racial traits, male or female, plus skin, eye, hair colour and hair style.
- **4 classes**, each with 8 skills unlocked by level 18:
  - **Druid:** Caster form (ranged damage and heals), Cat form (melee damage) and Bear form (tank), each with its own skills.
  - **Rogue:** Eviscerate, Fan of Knives, Shadowstep, Poison Blades, Vanish, Kidney Shot, Blade Flurry, Shadow Dance.
  - **Archer:** Multi-Shot, Power Shot, Disengage, Serpent Sting, Rain of Arrows, Concussive Shot, Rapid Fire, Spirit Wolf.
  - **Warlock:** Corruption, Drain Life, Summon Imp, Immolate, Shadowfury, Fear, Chaos Bolt, Summon Infernal.
- **Talent trees** from level 10: three trees per class with a capstone talent each. One point per level up to the level cap of 25.
- **18 monster types**, elite versions with gold rings, 5 wanted elites and 5 zone bosses whose big attacks are telegraphed with red circles on the ground.
- **Gear:** 13 equipment slots, 6 rarities (Poor to Legendary), stats, tooltips that compare against what you're wearing, a 32-slot bag and merchants in every town.
- **41 quests** across all five towns, with quest chains, item rewards to choose from and a quest log.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move (hold Shift to sprint) |
| Mouse drag | Turn the camera (scroll to zoom) |
| Click / F | Basic attack (click a monster to target it) |
| Tab | Cycle targets |
| 1 to 8 | Class skills |
| Q | Healing potion |
| Space | Jump |
| E | Talk, pick up, interact |
| C / B / N / L / P / M | Character, Bags, Talents, Quest log, Spellbook, World map |
| Esc | Close windows, or open the game menu (settings, character select, exit) |

On phones and tablets you get an on-screen stick, buttons and a tappable skill bar.

## Making changes

The game's code lives in `src/`. After editing, rebuild the single `index.html`:

```
node tools/build.js
```

| File | What's in it |
| --- | --- |
| `src/head.html` | Page layout and styles (HUD, windows, screens) |
| `src/10-core.js` | World layout, zones, height map, renderer, cel shading, sky |
| `src/20-world.js` | Terrain, forests, towns, landmarks, gather nodes |
| `src/30-models.js` | Anime characters, druid forms, monsters, pets |
| `src/40-data.js` | Races, classes, items, monsters, NPCs, quests |
| `src/41-skills.js` | Class skills and talent trees |
| `src/50-game.js` | Stats, combat, monster AI, loot, quests, saving |
| `src/60-ui.js` | HUD, tooltips, character sheet, bags, talents, maps, dialogue |
| `src/70-screens.js` | Character select and creator |
| `src/80-main.js` | Input, camera, day and night, main loop |

## Releasing an update

1. Change the game and run `node tools/build.js`.
2. In `updates.json`, raise `gameVersion` and add a news entry at the top.
3. Push to `main`. Everyone's launcher picks up the new version the next time they open it.

To ship a new launcher program (only needed when files in `launcher/` change), raise `version` in `launcher/package.json` and push to `main`. GitHub builds the Windows installer and publishes it as a new release.
