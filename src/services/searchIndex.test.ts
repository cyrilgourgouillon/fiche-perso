import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  buildSearchIndex, inventoryItems, safeText, searchSheet,
} from './searchIndex';

const ALL_SECTIONS = new Set([
  'combat', 'caracteristiques', 'armes', 'capacites', 'emplacements_sorts', 'sorts', 'pieces', 'equipement', 'maitrises', 'quetes', 'notes',
]);

describe('searchIndex', () => {
  test('should keep numbers and drop objects when converting values to text', () => {
    assert.equal(safeText(3), '3');
    assert.equal(safeText({ level: 3 }), '');
    assert.equal(safeText(undefined), '');
  });

  test('should index non-string imported values without crashing', () => {
    const entries = buildSearchIndex({
      sort1_nom: 'Boule de feu',
      sort1_niveau: 3,
      arme1_nom: 'Épée',
      arme1_bonus: { value: 5 },
      arme1_degats: 8,
    });
    const spell = entries.find(({ title }) => title === 'Boule de feu');
    const weapon = entries.find(({ title }) => title === 'Épée');
    assert.deepEqual(spell.badges.map(({ value }) => value), ['3']);
    assert.deepEqual(weapon.badges.map(({ label, value }) => `${label} ${value}`), ['Dégâts 8']);
  });

  test('should read inventory quantities stored as numbers or text', () => {
    assert.deepEqual(
      inventoryItems({
        inventaire_lignes: '3', inventaire1_nom: 'Corde', inventaire1_quantite: 2, inventaire2_nom: ' ', inventaire3_nom: 'Torche', inventaire3_quantite: 'x',
      }),
      [{ row: 0, itemName: 'Corde', quantity: 2 }, { row: 2, itemName: 'Torche', quantity: 0 }],
    );
  });

  test('should list options in the grouped display order', () => {
    const entries = buildSearchIndex({
      arme1_nom: 'Feu grégeois', sort1_nom: 'Boule de feu', sort2_nom: 'Feu follet',
    });
    const { groups, options } = searchSheet(entries, 'feu', ALL_SECTIONS);
    assert.deepEqual(options, groups.flatMap((group) => group.entries));
    // Score order is Feu follet, Feu grégeois, Boule de feu; display groups the two spells together.
    assert.deepEqual(groups.map(({ section }) => section), ['sorts', 'armes']);
    assert.deepEqual(options.map(({ title }) => title), ['Feu follet', 'Boule de feu', 'Feu grégeois']);
  });

  test('should leave hidden sections out of the results', () => {
    const entries = buildSearchIndex({ sort1_nom: 'Boule de feu' });
    assert.deepEqual(searchSheet(entries, 'boule', new Set(['armes'])).options, []);
  });
});
