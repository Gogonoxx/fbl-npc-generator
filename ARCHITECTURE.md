# FBL NPC Generator — Architecture

A small companion to **fbl-core-game**'s Adventure Site generator. It adds a
"Generate NPC" button to the Journal directory header, next to the Adventure
Site button, and rolls a Forbidden Lands NPC from book tables.

## What it rolls

| Source | Tables |
|---|---|
| GM Guide p.184-185 | Typical NPCs (Bandit, Soldier, Rider, Thief, Hunter, Priest, Trader, Minstrel, Sorcerer, Villager) — attributes, skills, equipment |
| GM Guide p.185-187 | Personal Quirks D66 — occupation, characteristic, quirk (three independent rolls per the way the table is meant to be used) |
| Players Handbook p.17-23 | Per-kin name pools and key attribute / kin talent (8 kins) |

## Files

```
fbl-npc-generator/
├── module.json
├── ARCHITECTURE.md
├── manifests/
│   ├── kin-names.json        Per-kin name pools + key attribute + kin talent
│   ├── typical-npcs.json     10 NPC archetypes from GM Guide p.184-185
│   └── personal-quirks.json  D66 table with three independent columns
├── scripts/
│   ├── init.js               renderJournalDirectory hook + module API
│   └── npc-generator.js      Dialog, rolls, actor creation
├── lang/en.json
└── styles/fbl-npc-generator.css
```

## Hosting / hook docking

```js
Hooks.on("renderJournalDirectory", app => {
    const header = app.element.querySelector(".header-actions");
    // Insert our button right after #create-adventure-site (added by the
    // forbidden-lands system / fbl-core-game).
});
```

The official Adventure Site button uses the same hook and lives in the
forbidden-lands.js system bundle. We rely on it being present (it is, given
the relationship dependency on `fbl-core-game`) so our button slots in next
to it cleanly.

## Quirks rolling — three columns, three rolls

The Personal Quirks table looks row-aligned on the page, but the book's
intent (and the way it's used in practice) is to roll each column on its own
D66. We honor that:

```js
const quirks = {
    occupation:    { roll: d66(), value: tables.occupation[d66()]    },
    characteristic:{ roll: d66(), value: tables.characteristic[d66()]},
    quirk:         { roll: d66(), value: tables.quirk[d66()]         },
};
```

That gives 36 × 36 × 36 = 46,656 unique combinations from a 36-row table.

## Actor data

NPCs are created as `type: "character"` with `system.subtype.type = "npc"`
— the FBL system itself routes that combination to its NPC sheet template
(`templates/actor/character/npc-sheet.hbs`). We populate:

- `system.attribute.{strength,agility,wits,empathy}` from the typical NPC row
- `system.skill.<name>` for each skill the typical NPC has
- `system.bio.kin.value` = kin label
- `system.bio.profession.value` = NPC type label
- `system.bio.note.value` = HTML summary including kin talent, attributes, skills, equipment, rolled quirks

## Public API

```js
const api = game.modules.get("fbl-npc-generator").api;
api.generateNPC();       // opens the dialog
```

Plus a chat command: `/npc` opens the dialog.

## Out of scope (deliberate)

- No item creation. Equipment is a flavor string from the book; the GM picks
  actual items at the table.
- No spell list for the Sorcerer archetype. The book lists "Path of Runes,
  Stone, Blood or Death (2 talent)" as flavor; assigning spell items would
  guess at GM intent.
- No portrait / token. The system handles default actor images.
- No localization beyond English. All book text reproduced verbatim is
  English; there is no point translating it ourselves.
