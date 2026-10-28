import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { afterLongRest, afterShortRest } from './rest';

const deathSaves = {
  mort_succes_1: 'true',
  mort_succes_2: 'false',
  mort_succes_3: 'true',
  mort_echecs_1: 'true',
  mort_echecs_2: 'true',
  mort_echecs_3: 'false',
};

describe('rest', () => {
  test('should clear death saves and short-rest features when taking a short rest', () => {
    const data = {
      ...deathSaves,
      capacite_utilisee1: 'true',
      capacite1_repos_court: 'true',
      capacite_utilisee2: 'true',
      capacite2_repos_long: 'true',
      capacite_utilisee3: 'true',
      capacite3_repos_court: 'false',
      points_vie_temp: '4',
      emplacement_sort_1_1: 'true',
    };
    const rested = afterShortRest(data);

    for (const field of Object.keys(deathSaves)) assert.equal(field in rested, false);
    assert.equal(rested.capacite_utilisee1, undefined);
    assert.equal(rested.capacite_utilisee2, 'true');
    assert.equal(rested.capacite_utilisee3, 'true');
    assert.equal(rested.points_vie_temp, '4');
    assert.equal(rested.emplacement_sort_1_1, 'true');
    assert.equal(data.mort_succes_1, 'true');
  });

  test('should restore hit points and clear spent resources when taking a long rest', () => {
    const data = {
      ...deathSaves,
      points_vie_max: '42',
      points_vie_actuel: '8',
      points_vie_temp: '5',
      des_vie_max: '5',
      des_vie: '2',
      capacite_utilisee1: 'true',
      capacite1_repos_long: 'true',
      capacite_utilisee2: 'true',
      capacite2_repos_court: 'true',
      emplacement_sort_1_1: 'true',
      emplacement_sort_9_3: 'true',
    };
    const rested = afterLongRest(data);

    assert.equal(rested.points_vie_actuel, '42');
    assert.equal(rested.points_vie_temp, undefined);
    assert.equal(rested.des_vie, '5');
    assert.equal(rested.capacite_utilisee1, undefined);
    assert.equal(rested.capacite_utilisee2, 'true');
    assert.equal(rested.emplacement_sort_1_1, undefined);
    assert.equal(rested.emplacement_sort_9_3, undefined);
    for (const field of Object.keys(deathSaves)) assert.equal(field in rested, false);
  });
});
