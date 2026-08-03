import { MAX_CHARACTER_LEVEL, MIN_CHARACTER_LEVEL } from '../data/spellSlotTable.js';
import { SKILLS } from '../data/abilities.js';

const DEFAULT_ABILITY_SCORE = 10;
const LEVELS_PER_PROFICIENCY_STEP = 4;
const PASSIVE_SCORE_BASE = 10;
const SPELL_SAVE_DC_BASE = 8;

/** Casters differ; INT is only the starting assumption, the sheet lets you change it. */
export const DEFAULT_SPELLCASTING_ABILITY = 'intelligence';

const PERCEPTION_SKILL = SKILLS.find((skill) => skill.key === 'perception');

/** Checkbox values are persisted as the strings 'true' / 'false'. */
export const isFlagged = (data, name) => data[name] === 'true';

/** The number the player typed over a computed one, or `null` when they left it to us. */
const override = (value) => {
  const parsed = Number(value);
  return value === '' || value === undefined || !Number.isFinite(parsed) ? null : parsed;
};

export const abilityModifier = (score) =>
  Math.floor((Number(score || DEFAULT_ABILITY_SCORE) - DEFAULT_ABILITY_SCORE) / 2);

export const formatModifier = (value) => `${value >= 0 ? '+' : ''}${value}`;

export const characterLevel = (data) =>
  Math.min(MAX_CHARACTER_LEVEL, Math.max(MIN_CHARACTER_LEVEL, Number(data.niveau) || MIN_CHARACTER_LEVEL));

/** +2 from level 1, then one more every four levels. */
export const derivedProficiencyBonus = (data) =>
  Math.ceil(characterLevel(data) / LEVELS_PER_PROFICIENCY_STEP) + 1;

export const proficiencyBonus = (data) => override(data.bonus_maitrise) ?? derivedProficiencyBonus(data);

export const savingThrowBonus = (data, ability) =>
  abilityModifier(data[ability]) + (isFlagged(data, `save_${ability}`) ? proficiencyBonus(data) : 0);

/** Expertise / half-proficiency multiplier stored alongside each skill. */
const skillMultiplier = (data, skill) => Number(data[`${skill}_particularite`] || 1);

export const skillBonus = (data, { key, ability }) =>
  abilityModifier(data[ability]) +
  (isFlagged(data, key) ? proficiencyBonus(data) * skillMultiplier(data, key) : 0);

export const derivedInitiative = (data) => abilityModifier(data.dexterite);

export const derivedPassivePerception = (data) => PASSIVE_SCORE_BASE + skillBonus(data, PERCEPTION_SKILL);

export const spellcastingAbility = (data) =>
  data.caracteristique_incantation || DEFAULT_SPELLCASTING_ABILITY;

export const derivedSpellcastingModifier = (data) => abilityModifier(data[spellcastingAbility(data)]);

/** A typed modifier flows on into the save DC and the attack bonus. */
export const spellcastingModifier = (data) =>
  override(data.modificateur_incantation) ?? derivedSpellcastingModifier(data);

export const derivedSpellSaveDC = (data) =>
  SPELL_SAVE_DC_BASE + proficiencyBonus(data) + spellcastingModifier(data);

export const derivedSpellAttackBonus = (data) => proficiencyBonus(data) + spellcastingModifier(data);
