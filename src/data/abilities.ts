export const ABILITIES = [
  { key: 'force', label: '💪 Force' },
  { key: 'dexterite', label: '🎯 Dextérité' },
  { key: 'constitution', label: '❤️ Constitution' },
  { key: 'intelligence', label: '🧠 Intelligence' },
  { key: 'sagesse', label: '👁️ Sagesse' },
  { key: 'charisme', label: '✨ Charisme' },
];

export const SKILLS = [
  { key: 'athletisme', label: 'Athlétisme', ability: 'force' },
  { key: 'acrobaties', label: 'Acrobaties', ability: 'dexterite' },
  { key: 'discretion', label: 'Discrétion', ability: 'dexterite' },
  { key: 'escamotage', label: 'Escamotage', ability: 'dexterite' },
  { key: 'arcanes', label: 'Arcanes', ability: 'intelligence' },
  { key: 'histoire', label: 'Histoire', ability: 'intelligence' },
  { key: 'investigation', label: 'Investigation', ability: 'intelligence' },
  { key: 'nature', label: 'Nature', ability: 'intelligence' },
  { key: 'religion', label: 'Religion', ability: 'intelligence' },
  { key: 'dressage', label: 'Dressage', ability: 'sagesse' },
  { key: 'intuition', label: 'Intuition', ability: 'sagesse' },
  { key: 'medecine', label: 'Médecine', ability: 'sagesse' },
  { key: 'perception', label: 'Perception', ability: 'sagesse' },
  { key: 'survie', label: 'Survie', ability: 'sagesse' },
  { key: 'intimidation', label: 'Intimidation', ability: 'charisme' },
  { key: 'persuasion', label: 'Persuasion', ability: 'charisme' },
  { key: 'representation', label: 'Représentation', ability: 'charisme' },
  { key: 'tromperie', label: 'Tromperie', ability: 'charisme' },
];

export type SkillSortOrder = 'name' | 'ability';

export const SKILL_SORT_OPTIONS: { value: SkillSortOrder; label: string }[] = [
  { value: 'name', label: 'Nom' },
  { value: 'ability', label: 'Caractéristique puis nom' },
];

export const sortSkills = (skills: typeof SKILLS, order: SkillSortOrder = 'name') => {
  const abilityOrder = new Map(ABILITIES.map(({ key }, index) => [key, index]));
  return [...skills].sort((left, right) => {
    if (order === 'ability') {
      const abilityDifference = (abilityOrder.get(left.ability) ?? Infinity)
        - (abilityOrder.get(right.ability) ?? Infinity);
      if (abilityDifference !== 0) return abilityDifference;
    }
    return left.label.localeCompare(right.label, 'fr', { sensitivity: 'base' });
  });
};
