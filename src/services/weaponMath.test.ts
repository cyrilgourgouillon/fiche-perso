import assert from 'node:assert/strict';
import test from 'node:test';
import { WEAPONS } from '../data/sheetLists';
import {
  legacyWeaponDamage,
  parseLegacyWeaponDamage,
  weaponAttackBonus,
  weaponDamageBonus,
  weaponDamageRoll,
  weaponDetails,
} from './weaponMath';

test('weapon details read legacy damage strings without modifying them', () => {
  const data = {
    [WEAPONS.field(0, 'nom')]: 'Pique',
    [WEAPONS.field(0, 'degats')]: '2d8 perforant',
  };

  assert.deepEqual(parseLegacyWeaponDamage(data[WEAPONS.field(0, 'degats')]), {
    dice: '2d8',
    type: 'perforant',
  });
  assert.equal(weaponDetails(data, 0).damageDice, '2d8');
  assert.equal(weaponDetails(data, 0).damageType, 'perforant');
  assert.equal(data[WEAPONS.field(0, 'degats')], '2d8 perforant');
});

test('weapon details prefer explicit new damage fields, including cleared values', () => {
  const data = {
    [WEAPONS.field(0, 'degats')]: '1d8 tranchant',
    [WEAPONS.field(0, 'degats_de')]: '2d6',
    [WEAPONS.field(0, 'type_degats')]: '',
  };

  assert.deepEqual(weaponDetails(data, 0), {
    name: '',
    bonus: '',
    damageBonus: '',
    damageDice: '2d6',
    damageType: '',
    proficient: false,
    ability: '',
    notes: '',
  });
  assert.equal(legacyWeaponDamage('2d6', ''), '2d6');
});

test('weapon attack bonus adds proficiency only when the weapon is marked proficient', () => {
  const data = {
    niveau: '5',
    [WEAPONS.field(0, 'bonus')]: '2',
    [WEAPONS.field(0, 'bonus_degats')]: '3',
    [WEAPONS.field(0, 'maitrise')]: 'true',
  };

  assert.equal(weaponAttackBonus(data, 0), 5);
  assert.equal(weaponAttackBonus({ ...data, [WEAPONS.field(0, 'maitrise')]: 'false' }, 0), 2);
});

test('weapon attack bonus adds the selected ability modifier', () => {
  const data = {
    niveau: '5',
    force: '18',
    dexterite: '16',
    [WEAPONS.field(0, 'bonus')]: '2',
    [WEAPONS.field(0, 'caracteristique')]: 'force',
  };

  assert.equal(weaponAttackBonus(data, 0), 6);
  assert.equal(weaponAttackBonus({
    ...data,
    [WEAPONS.field(0, 'caracteristique')]: 'dexterite',
  }, 0), 5);
  assert.equal(weaponAttackBonus({
    ...data,
    [WEAPONS.field(0, 'caracteristique')]: '',
  }, 0), 2);
});

test('weapon damage roll adds the damage bonus and ability modifier but excludes attack bonus and proficiency', () => {
  const data = {
    niveau: '5',
    force: '18',
    [WEAPONS.field(0, 'bonus')]: '2',
    [WEAPONS.field(0, 'bonus_degats')]: '3',
    [WEAPONS.field(0, 'degats_de')]: '2d8+1',
    [WEAPONS.field(0, 'maitrise')]: 'true',
    [WEAPONS.field(0, 'caracteristique')]: 'force',
  };

  assert.deepEqual(weaponDamageRoll(data, 0), {
    expression: '2d8+8',
    modifier: 8,
  });
  assert.equal(weaponDamageBonus(data, 0), 7);
  assert.deepEqual(weaponDamageRoll({
    ...data,
    [WEAPONS.field(0, 'maitrise')]: 'false',
  }, 0), {
    expression: '2d8+8',
    modifier: 8,
  });
});

test('weapon damage bonus defaults safely when the manual value is invalid', () => {
  const data = {
    force: '18',
    [WEAPONS.field(0, 'bonus_degats')]: 'invalid',
    [WEAPONS.field(0, 'caracteristique')]: 'force',
  };

  assert.equal(weaponDamageBonus(data, 0), 4);
});
