import { WEAPONS } from '../data/sheetLists';
import { ABILITIES } from '../data/abilities';
import { abilityModifier, isFlagged, proficiencyBonus } from './characterMath';
import { parseDiceExpression } from './dice';

const text = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const LEGACY_DAMAGE_EXPRESSION = /\b\d*d\d+(?:\s*[+-]\s*\d+)?\b/i;

export function parseLegacyWeaponDamage(value: unknown) {
  const legacy = text(value);
  const match = LEGACY_DAMAGE_EXPRESSION.exec(legacy);
  if (!match) return { dice: '', type: legacy };
  return {
    dice: match[0].replace(/\s+/g, ''),
    type: legacy.replace(match[0], '').trim(),
  };
}

export function weaponDetails(data: Record<string, unknown>, row: number) {
  const legacy = parseLegacyWeaponDamage(data[WEAPONS.field(row, 'degats')]);
  const diceField = WEAPONS.field(row, 'degats_de');
  const typeField = WEAPONS.field(row, 'type_degats');
  return {
    name: text(data[WEAPONS.field(row, 'nom')]),
    bonus: text(data[WEAPONS.field(row, 'bonus')]),
    damageBonus: text(data[WEAPONS.field(row, 'bonus_degats')]),
    damageDice: data[diceField] === undefined ? legacy.dice : text(data[diceField]),
    damageType: data[typeField] === undefined ? legacy.type : text(data[typeField]),
    proficient: isFlagged(data, WEAPONS.field(row, 'maitrise')),
    ability: ABILITIES.some(({ key }) => key === data[WEAPONS.field(row, 'caracteristique')])
      ? text(data[WEAPONS.field(row, 'caracteristique')])
      : '',
    notes: text(data[WEAPONS.field(row, 'notes')]),
  };
}

export function weaponAttackBonus(data: Record<string, unknown>, row: number) {
  const details = weaponDetails(data, row);
  const manualBonus = Number(details.bonus);
  return (Number.isFinite(manualBonus) ? manualBonus : 0)
    + (details.ability ? abilityModifier(data[details.ability]) : 0)
    + (details.proficient ? proficiencyBonus(data) : 0);
}

export function weaponDamageBonus(data: Record<string, unknown>, row: number) {
  const { ability, damageBonus } = weaponDetails(data, row);
  const manualBonus = Number(damageBonus);
  return (Number.isFinite(manualBonus) ? manualBonus : 0)
    + (ability ? abilityModifier(data[ability]) : 0);
}

export function weaponDamageRoll(data: Record<string, unknown>, row: number) {
  const { damageDice } = weaponDetails(data, row);
  const parsed = parseDiceExpression(damageDice);
  if (!parsed) return null;

  const modifier = parsed.modifier + weaponDamageBonus(data, row);
  const expression = `${parsed.count}d${parsed.sides}${modifier === 0 ? '' : `${modifier > 0 ? '+' : ''}${modifier}`}`;
  return { expression, modifier };
}

export function legacyWeaponDamage(dice: unknown, type: unknown) {
  return [text(dice), text(type)].filter(Boolean).join(' ');
}
