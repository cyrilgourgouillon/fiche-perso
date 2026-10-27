import { range } from '../utils/range.js';
import { usesPactMagic } from './spellSlots.js';

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
const classFeatureUsedFields = (data, rest) =>
  Object.keys(data)
    .filter((field) => /^capacite\d+_repos_(court|long)$/.test(field) && field.endsWith(rest) && data[field] === 'true')
    .map((field) => field.replace(/^capacite(\d+)_repos_(?:court|long)$/, 'capacite_utilisee$1'));

/**
 * Short rest: the character is back on their feet, and warlocks recover their
 * pact slots. Other class recovery (such as Arcane Recovery) stays manual.
 */
export const afterShortRest = (data) =>
  clearFields(data, [
    ...deathSaveFields,
    ...classFeatureUsedFields(data, 'court'),
    ...(usesPactMagic(data) ? spellSlotFields(data) : []),
  ]);

/** Long rest: full hit points, no temporary ones left, every spell slot back. */
export const afterLongRest = (data) => ({
  ...clearFields(data, [...deathSaveFields, ...spellSlotFields(data), ...classFeatureUsedFields(data, 'long'), 'points_vie_temp']),
  points_vie_actuel: data.points_vie_max || '',
});
