import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  fuzzyScore, matchingEntries, normalized, scopedSearch,
} from './search';

describe('search', () => {
  test('should normalize accents and case when comparing search text', () => {
    assert.equal(normalized('  Équipement  '), '  equipement  ');
  });

  test('should score exact prefixes and substrings ahead of fuzzy matches when ranking candidates', () => {
    assert.equal(fuzzyScore('sort', 'Sortilège'), 0);
    assert.equal(fuzzyScore('sort', 'Grand sort'), 1);
    assert.equal(fuzzyScore('bouclierr', 'bouclier'), 3);
  });

  test('should reject empty or distant queries when scoring candidates', () => {
    assert.equal(fuzzyScore('  ', 'Sortilège'), Infinity);
    assert.equal(fuzzyScore('sort', ''), Infinity);
    assert.equal(fuzzyScore('dragon', 'épée'), Infinity);
  });

  test('should require every query token to match a candidate word when scoring multi-token queries', () => {
    assert.equal(fuzzyScore('bouclier feu', 'Bouclier de feu'), 4);
    assert.equal(fuzzyScore('bouclier froid', 'Bouclier de feu'), Infinity);
  });

  test('should rank results by match quality and apply the limit when matching entries', () => {
    const entries = [
      { title: 'Fuzzy', searchText: 'sor' },
      { title: 'Substring', searchText: 'Grand sort' },
      { title: 'Prefix', searchText: 'Sortilège' },
      { title: 'Other', searchText: 'épée' },
    ];

    assert.deepEqual(matchingEntries(entries, 'sort', 2).map(({ title }) => title), ['Prefix', 'Substring']);
  });

  test('should return the matching sentence when a query occurs in large text', () => {
    const entry = {
      title: 'Ancien grimoire',
      searchText: 'Ancien grimoire',
      largeText: [{
        text: 'Première phrase. Une porte secrète est dissimulée ici. Dernière phrase.',
        normalized: 'premiere phrase. une porte secrete est dissimulee ici. derniere phrase.',
      }],
    };

    assert.equal(matchingEntries([entry], 'porte secrète')[0].matchContext, 'Une porte secrète est dissimulée ici.');
  });

  test('should scope searches to a section when a recognized alias is entered', () => {
    assert.deepEqual(scopedSearch(' Équipement:  potion '), { section: 'equipement', term: 'potion' });
    assert.deepEqual(scopedSearch('weapons: épée'), { section: 'armes', term: 'épée' });
  });

  test('should preserve the full query when a prefix is unknown or absent', () => {
    assert.deepEqual(scopedSearch('unknown: term'), { section: null, term: 'unknown: term' });
    assert.deepEqual(scopedSearch('  boule de feu  '), { section: null, term: 'boule de feu' });
  });
});
