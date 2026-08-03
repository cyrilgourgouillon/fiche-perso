import { MAX_SPELL_LEVEL, SPELL_SLOTS_BY_LEVEL } from '../data/spellSlotTable.js';
import { characterLevel, isFlagged } from './characterMath.js';
import { range } from '../utils/range.js';

export const spellSlotField = (spellLevel, slotIndex) => `emplacement_sort_${spellLevel}_${slotIndex + 1}`;

const spentSlots = (data, spellLevel, total) =>
  range(total).filter((slotIndex) => isFlagged(data, spellSlotField(spellLevel, slotIndex))).length;

/** One row per spell level, with how many slots the character has and has spent. */
export const spellSlotRows = (data) => {
  const slots = SPELL_SLOTS_BY_LEVEL[characterLevel(data)];
  return range(MAX_SPELL_LEVEL).map((index) => {
    const spellLevel = index + 1;
    const total = slots[index] || 0;
    return { spellLevel, total, spent: spentSlots(data, spellLevel, total) };
  });
};
