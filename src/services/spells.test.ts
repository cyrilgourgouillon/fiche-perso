import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { SPELLS } from '../data/sheetLists';
import { isCantrip } from './spells';

describe('spells', () => {
  test('should recognize legacy level-zero spells as cantrips when no explicit flag exists', () => {
    assert.equal(isCantrip({ [SPELLS.field(0, 'niveau')]: '0' }, 0), true);
    assert.equal(isCantrip({ [SPELLS.field(0, 'niveau')]: 0 }, 0), true);
    assert.equal(isCantrip({ [SPELLS.field(0, 'niveau')]: '1' }, 0), false);
    assert.equal(isCantrip({}, 0), false);
  });

  test('should prefer the explicit cantrip flag when a spell level is present', () => {
    assert.equal(isCantrip({
      [SPELLS.field(0, 'cantrip')]: 'true',
      [SPELLS.field(0, 'niveau')]: '1',
    }, 0), true);
    assert.equal(isCantrip({
      [SPELLS.field(0, 'cantrip')]: 'false',
      [SPELLS.field(0, 'niveau')]: '0',
    }, 0), false);
    assert.equal(isCantrip({
      [SPELLS.field(0, 'cantrip')]: false,
      [SPELLS.field(0, 'niveau')]: '0',
    }, 0), false);
  });
});
