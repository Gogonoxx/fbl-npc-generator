# FBL NPC Generator

A small Foundry VTT module for [Forbidden Lands](https://freeleaguepublishing.com/games/forbidden-lands/) that adds a one-click NPC generator to the Journal directory.

Click the button, pick a kin (or leave it on Random), and a fully-rolled NPC actor lands in your world — with attributes, skills, equipment, a kin-appropriate name, and three independent personal quirks.

![Button location](https://github.com/Gogonoxx/fbl-npc-generator/blob/main/.github/screenshot.png?raw=true)

## Requirements

- Foundry VTT v12+
- The official **Forbidden Lands** game system (v5.0.0+)

The module sits next to the Adventure Site button if you have `fbl-core-game` (the official Free League content module) active, but it works standalone too — the button shows up in the Journal directory header either way.

## Installation

In Foundry's "Install Module" dialog, paste this manifest URL:

```
https://github.com/Gogonoxx/fbl-npc-generator/releases/latest/download/module.json
```

## What it rolls

When you click **Generate NPC**, a dialog asks for:

- **Kin** — Random, or one of: Human, Elf, Half-Elf, Dwarf, Halfling, Wolfkin, Orc, Goblin
- **Sex** — Random, Female, Male
- **NPC Type** — Random, or one of the 10 archetypes: Bandit, Soldier, Rider, Thief, Hunter, Priest, Trader, Minstrel, Sorcerer, Villager
- **Personal Quirks** — toggle to roll three independent D66s for occupation, characteristic and quirk

Hit Roll. The module:

1. Picks a kin-appropriate name from the Players Handbook (p.17–23)
2. Builds a `character` actor with `system.subtype.type = "npc"` so the system routes it to the NPC sheet
3. Fills in attributes and skills from the typical NPC entry in the GM Guide (p.184–185)
4. Drops the equipment line and a bio summary into `system.bio.note`
5. Optionally rolls three D66s on the Personal Quirks table (GM Guide p.185–187) — one per column, since that's how the table is meant to be used (36 × 36 × 36 = 46,656 unique combinations)
6. Whispers a chat card to you with the same summary, ready to read aloud

The actor opens immediately if you leave **Open Sheet** checked.

## Why three independent quirk rolls?

The Personal Quirks table is laid out as three columns (Occupation, Characteristic, Quirk) with 36 rows each. Reading it row-by-row gives you 36 fixed combinations — but the way the table is intended to be used (and how most groups use it in practice) is to roll D66 three times, once per column. That gives you a much wider creative pool and avoids the "Soldier with Ice Blue Eyes who Dreams of a Family" paragraph showing up twice in a campaign.

## Usage tips

- The chat card is whispered to you (the GM) so the NPC entry doesn't immediately leak the personality to players.
- The module also exposes `game.modules.get("fbl-npc-generator").api.generateNPC()` and a `/npc` chat command, in case you'd rather bind it to a macro.

## Acknowledgements

NPC tables and kin name pools are reproduced from Forbidden Lands by Free League Publishing. This module is a GM tool for personal use at the table — it does not replace any official content and requires the Forbidden Lands system to function. Forbidden Lands is © Free League Publishing.

## License

MIT for the module code. Forbidden Lands content is reproduced for personal/GM use under fair-use principles for unofficial tools; if Free League objects to any specific reproduction, open an issue and it'll be paraphrased.
