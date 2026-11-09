import assert from 'node:assert/strict';
import test from 'node:test';
import { SKILLS, sortSkills } from './abilities';

test('sorts skills alphabetically by name by default', () => {
  assert.deepEqual(
    sortSkills(SKILLS).map(({ label }) => label),
    [...SKILLS].map(({ label }) => label).sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' })),
  );
});

test('sorts skills by characteristic and then name', () => {
  assert.deepEqual(
    sortSkills(SKILLS, 'ability').map(({ key }) => key),
    [
      'athletisme',
      'acrobaties', 'discretion', 'escamotage',
      'arcanes', 'histoire', 'investigation', 'nature', 'religion',
      'dressage', 'intuition', 'medecine', 'perception', 'survie',
      'intimidation', 'persuasion', 'representation', 'tromperie',
    ],
  );
});
