import assert from 'node:assert/strict';
import test from 'node:test';
import { INVENTORY, WEAPONS } from '../data/sheetLists';
import {
  isRowEmpty,
  listRowCount,
  rowCountField,
  withRowAdded,
  withRowRemoved,
} from './sheetRows';

test('should use stored row counts when valid and defaults when absent or invalid', () => {
  assert.equal(rowCountField(WEAPONS), 'armes_lignes');
  assert.equal(listRowCount({}, WEAPONS), 6);
  assert.equal(listRowCount({ armes_lignes: '3' }, WEAPONS), 3);
  assert.equal(listRowCount({ armes_lignes: '0' }, WEAPONS), 6);
  assert.equal(listRowCount({ armes_lignes: 'invalid' }, WEAPONS), 6);
});

test('should recognize rows as empty when fields are blank or checkboxes are unchecked', () => {
  assert.equal(isRowEmpty({
    inventaire1_nom: '',
    inventaire1_quantite: '',
  }, INVENTORY, 0), true);

  assert.equal(isRowEmpty({
    arme1_nom: '',
    arme1_bonus: 'false',
    arme1_degats: '',
    arme1_notes: '',
    arme1_combat: 'false',
  }, WEAPONS, 0), true);
  assert.equal(isRowEmpty({
    arme1_nom: '',
    arme1_bonus: 'false',
    arme1_degats: '1d8',
  }, WEAPONS, 0), false);
  assert.equal(isRowEmpty({ arme1_combat: 'true' }, WEAPONS, 0), false);
});

test('should add a row without mutation when a list row is added', () => {
  const data = { inventaire_lignes: '1', inventaire1_nom: 'Potion' };
  const next = withRowAdded(data, INVENTORY);

  assert.deepEqual(next, { ...data, inventaire_lignes: '2' });
  assert.deepEqual(data, { inventaire_lignes: '1', inventaire1_nom: 'Potion' });
  assert.equal(withRowAdded({}, INVENTORY).inventaire_lignes, '2');
});

test('should shift later fields and clean the last row when removing a middle row', () => {
  const data = {
    armes_lignes: '3',
    arme1_nom: 'Épée',
    arme1_degats: '1d8',
    arme2_nom: 'Hache',
    arme2_combat: 'true',
    arme3_nom: 'Arc',
    arme3_notes: 'À distance',
  };
  const next = withRowRemoved(data, WEAPONS, 1);

  assert.equal(next.armes_lignes, '2');
  assert.equal(next.arme1_nom, 'Épée');
  assert.equal(next.arme1_degats, '1d8');
  assert.equal(next.arme2_nom, 'Arc');
  assert.equal(next.arme2_notes, 'À distance');
  assert.equal(next.arme2_combat, undefined);
  assert.equal(next.arme3_nom, undefined);
  assert.equal(next.arme3_notes, undefined);
  assert.equal(data.arme2_nom, 'Hache');
});

test('should keep one row when removing the final remaining row', () => {
  const next = withRowRemoved({
    inventaire_lignes: '1',
    inventaire1_nom: 'Potion',
    inventaire1_quantite: '2',
  }, INVENTORY, 0);

  assert.deepEqual(next, { inventaire_lignes: '1' });
});
