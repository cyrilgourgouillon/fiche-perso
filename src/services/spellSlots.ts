import { MAX_SPELL_LEVEL, PACT_SLOTS_BY_LEVEL, SPELL_SLOTS_BY_LEVEL } from '../data/spellSlotTable';
import { characterLevel, isFlagged } from './characterMath';
import { range } from '../utils/range';

export const spellSlotField = (spellLevel, slotIndex) => `emplacement_sort_${spellLevel}_${slotIndex + 1}`;
export const spellSlotOverrideField = (spellLevel) => `emplacements_sorts_niveau_${spellLevel}`;
export const PACT_MAGIC_FIELD = 'magie_pacte';

const spentSlots = (data, spellLevel, total) =>
  range(total).filter((slotIndex) => isFlagged(data, spellSlotField(spellLevel, slotIndex))).length;

export const usesPactMagic = (data) => isFlagged(data, PACT_MAGIC_FIELD);

const defaultSlots = (data) => {
  const level = characterLevel(data);
  if (!usesPactMagic(data)) return SPELL_SLOTS_BY_LEVEL[level];
  const [count, slotLevel] = PACT_SLOTS_BY_LEVEL[level];
  return range(slotLevel).map((index) => (index === slotLevel - 1 ? count : 0));
};

/** One row per spell level, with how many slots the character has and has spent. */
export const spellSlotRows = (data) => {
  const pactMagic = usesPactMagic(data);
  const slots = defaultSlots(data);
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
