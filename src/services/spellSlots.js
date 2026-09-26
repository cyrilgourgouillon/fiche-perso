import { MAX_SPELL_LEVEL, SPELL_SLOTS_BY_LEVEL } from '../data/spellSlotTable.js';
import { characterLevel, isFlagged } from './characterMath.js';
import { range } from '../utils/range.js';

export const spellSlotField = (spellLevel, slotIndex) => `emplacement_sort_${spellLevel}_${slotIndex + 1}`;
export const spellSlotOverrideField = (spellLevel) => `emplacements_sorts_niveau_${spellLevel}`;

const spentSlots = (data, spellLevel, total) =>
  range(total).filter((slotIndex) => isFlagged(data, spellSlotField(spellLevel, slotIndex))).length;

/** One row per spell level, with how many slots the character has and has spent. */
export const spellSlotRows = (data) => {
  const slots = SPELL_SLOTS_BY_LEVEL[characterLevel(data)];
  return range(MAX_SPELL_LEVEL).map((index) => {
    const spellLevel = index + 1;
    const override = data[spellSlotOverrideField(spellLevel)];
    const defaultTotal = slots[index] || 0;
    const total = override === undefined || override === ''
      ? defaultTotal
      : Math.max(0, Math.min(20, Number.parseInt(override, 10) || 0));
    return { spellLevel, total, defaultTotal, spent: spentSlots(data, spellLevel, total) };
  });
};
