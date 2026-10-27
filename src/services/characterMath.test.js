import assert from 'node:assert/strict';
import test from 'node:test';
import {
  abilityModifier,
  characterLevel,
  derivedInitiative,
  derivedPassivePerception,
  derivedProficiencyBonus,
  derivedSpellAttackBonus,
  derivedSpellSaveDC,
  derivedSpellcastingModifier,
  formatModifier,
  isFlagged,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  spellcastingAbility,
  spellcastingModifier,
} from './characterMath.js';

test('should calculate ability modifiers when scores are missing, even, or odd', () => {
  assert.equal(abilityModifier(undefined), 0);
  assert.equal(abilityModifier('20'), 5);
  assert.equal(abilityModifier('9'), -1);
  assert.equal(formatModifier(0), '+0');
  assert.equal(formatModifier(-2), '-2');
});

test('should bound character level and derive proficiency when a level is supplied', () => {
  assert.equal(characterLevel({ niveau: '5' }), 5);
  assert.equal(characterLevel({ niveau: '0' }), 1);
  assert.equal(characterLevel({ niveau: '25' }), 20);
  assert.equal(characterLevel({ niveau: 'invalid' }), 1);
  assert.equal(derivedProficiencyBonus({ niveau: '1' }), 2);
  assert.equal(derivedProficiencyBonus({ niveau: '5' }), 3);
  assert.equal(derivedProficiencyBonus({ niveau: '17' }), 6);
  assert.equal(proficiencyBonus({ niveau: '5', bonus_maitrise: '4' }), 4);
});

test('should add proficiency when saves and skills use string flags', () => {
  const data = {
    niveau: '5',
    force: '18',
    save_force: 'true',
    acrobaties: 'true',
    acrobaties_particularite: '2',
    dexterite: '14',
  };

  assert.equal(isFlagged(data, 'save_force'), true);
  assert.equal(isFlagged({ save_force: true }, 'save_force'), false);
  assert.equal(savingThrowBonus(data, 'force'), 7);
  assert.equal(savingThrowBonus({ ...data, save_force: 'false' }, 'force'), 4);
  assert.equal(skillBonus(data, { key: 'acrobaties', ability: 'dexterite' }), 8);
});

test('should derive initiative, passive perception, and spellcasting values when ability scores are set', () => {
  const data = {
    niveau: '5',
    dexterite: '14',
    sagesse: '16',
    perception: 'true',
    intelligence: '18',
  };

  assert.equal(derivedInitiative(data), 2);
  assert.equal(derivedPassivePerception(data), 16);
  assert.equal(spellcastingAbility(data), 'intelligence');
  assert.equal(derivedSpellcastingModifier(data), 4);
  assert.equal(derivedSpellSaveDC(data), 15);
  assert.equal(derivedSpellAttackBonus(data), 7);

  const overridden = {
    ...data,
    caracteristique_incantation: 'sagesse',
    modificateur_incantation: '5',
  };
  assert.equal(spellcastingAbility(overridden), 'sagesse');
  assert.equal(spellcastingModifier(overridden), 5);
});
