# Fiche Perso

<https://github.com/cyrilgourgouillon/fiche-perso>

A D&D 5e character sheet that runs entirely in the browser. No account, no server, no database —
the sheet lives in your browser's local storage and travels as a JSON file. The interface is in
French.

## Features

**The sheet**

- Identity, hit points, hit dice, death saves, combat stats, the six abilities with saves and all
  eighteen skills, weapons, class features, spells, spell slots, equipment, coins, proficiencies,
  a quest journal and free-form notes.
- **Computed values as hints** — proficiency bonus, initiative, passive perception, skill and save
  bonuses, and the spell slots for your level are derived from what you typed. They appear as
  placeholders; type your own value and it wins, cascading through everything downstream.
- **Growable lists** — weapons, class features, spells, magic items and quests take extra rows on
  demand. Removing a row that holds data takes two clicks; quests fold away instead of being
  deleted, so old ones stay readable.
- **Foldable sections** with a jump nav and *tout replier / tout déplier*. Points de vie, Combat and
  Caractéristiques always stay open.
- **Rests** — a short or long rest restores hit points and spell slots and clears death saves. Both
  ask for confirmation first, since they overwrite tracked values.

**Dice**

- A tray for d4 through d100, plus free expressions like `2d6+3`.
- A die beside every skill, save and ability rolls it with the right bonus. A global
  normal / avantage / désavantage mode colours those dice so you can see which way the next d20
  goes.
- Rolls tumble before settling, land in a centred toast, and a natural 20 or 1 gets its own
  animation. The last ten rolls stay in a log (not saved — they are not part of the character).
- All of the motion respects `prefers-reduced-motion`.

**Everything else**

- **12 themes**, one per class, switched from the toolbar and saved with the sheet.
- **Autosave** to local storage on every keystroke, with a status that only claims *sauvegardé*
  when a write actually happened. **Export / import** the whole sheet as JSON.
- **Works offline** — a hand-written manifest and service worker make it installable, with no PWA
  dependency.
- Responsive down to 320px, with touch-sized targets and a 16px floor on text inputs so iOS does
  not zoom on focus.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/fiche-perso/
npm run build
npm run preview
```

React 19 and Vite are the only dependencies. There is no test suite and no linter configured.

## How the data works

The whole character is one flat map of string keys to string values, stored under the
`perso_sheet` key inside `{ metadata, data }`. Checkboxes are the strings `'true'` / `'false'`.

Every setting is just another field in that map — row counts, fold state, the chosen theme — so
saving, exporting and importing them came for free and older files keep loading.

## Layout of the code

| Path | What lives there |
| --- | --- |
| `src/components/sheet/` | The panels of the sheet |
| `src/components/fields/` | Inputs, checkboxes, add/remove row buttons |
| `src/components/dice/` | Tray, roll buttons, results, animations |
| `src/context/` | Sheet state and dice state providers |
| `src/hooks/` | Autosave, file import/export, list rows, animations |
| `src/services/` | Pure logic: character maths, spell slots, dice, rests, serialisation |
| `src/data/` | Tables and static definitions (abilities, themes, sections, slot progression) |
| `styles/` | One stylesheet per area; `style.css` is only an index of `@import`s in cascade order |

`styles/responsive.css` must stay last in that index — it holds every breakpoint override.

## Deployment

Pushing to `master` builds the app and publishes it to GitHub Pages via
`.github/workflows/github-pages.yml`, which serves it at
<https://cyrilgourgouillon.github.io/fiche-perso/>. The Vite `base` is `/fiche-perso/`, which the
repository name has to match.
