import { range } from '../utils/range.js';

const DEATH_SAVE_GROUPS = ['mort_succes', 'mort_echecs'];
const DEATH_SAVE_BOXES = 3;

const clearFields = (data, keys) => {
  const next = { ...data };
  keys.forEach((key) => delete next[key]);
  return next;
};

const deathSaveFields = DEATH_SAVE_GROUPS.flatMap((group) =>
  range(DEATH_SAVE_BOXES).map((index) => `${group}_${index + 1}`),
);

const spellSlotFields = (data) => Object.keys(data).filter((field) => /^emplacement_sort_\d+_\d+$/.test(field));

/**
 * Short rest: the character is back on their feet. Hit dice spending and any
 * class recovery (Arcane Recovery, a warlock's slots…) stay manual, because 5e
 * gives no automatic short-rest recovery that applies to every character.
 */
export const afterShortRest = (data) => clearFields(data, deathSaveFields);

/** Long rest: full hit points, no temporary ones left, every spell slot back. */
export const afterLongRest = (data) => ({
  ...clearFields(data, [...deathSaveFields, ...spellSlotFields(data), 'points_vie_temp']),
  points_vie_actuel: data.points_vie_max || '',
});
