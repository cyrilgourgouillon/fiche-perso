import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  PACT_MAGIC_FIELD,
  spellSlotField,
  spellSlotOverrideField,
  spellSlotRows,
  usesPactMagic,
} from './spellSlots';

describe('spellSlots', () => {
  test('should build ordinary spell slots and count spent slots when using spellcasting progression', () => {
    const rows = spellSlotRows({
      niveau: '5',
      [spellSlotField(1, 0)]: 'true',
      [spellSlotField(1, 1)]: 'false',
      [spellSlotField(2, 0)]: 'true',
    });

    assert.equal(rows.length, 9);
    assert.deepEqual(rows.slice(0, 4), [
      {
        spellLevel: 1, total: 4, defaultTotal: 4, spent: 1,
      },
      {
        spellLevel: 2, total: 3, defaultTotal: 3, spent: 1,
      },
      {
        spellLevel: 3, total: 2, defaultTotal: 2, spent: 0,
      },
      {
        spellLevel: 4, total: 0, defaultTotal: 0, spent: 0,
      },
    ]);
  });

  test('should use pact magic progression and slot overrides when pact magic is enabled', () => {
    const data = {
      niveau: '5',
      [PACT_MAGIC_FIELD]: 'true',
      [spellSlotField(3, 0)]: 'true',
      [spellSlotOverrideField(1)]: '2',
      [spellSlotOverrideField(2)]: 'invalid',
      [spellSlotOverrideField(3)]: '22',
      [spellSlotOverrideField(4)]: '-2',
    };
    const rows = spellSlotRows(data);

    assert.equal(usesPactMagic(data), true);
    assert.deepEqual(rows.slice(0, 5), [
      {
        spellLevel: 1, total: 2, defaultTotal: 0, spent: 0,
      },
      {
        spellLevel: 2, total: 0, defaultTotal: 0, spent: 0,
      },
      {
        spellLevel: 3, total: 20, defaultTotal: 2, spent: 1,
      },
      {
        spellLevel: 4, total: 0, defaultTotal: 0, spent: 0,
      },
      {
        spellLevel: 5, total: 0, defaultTotal: 0, spent: 0,
      },
    ]);
    assert.equal(usesPactMagic({ [PACT_MAGIC_FIELD]: true }), false);
  });
});
