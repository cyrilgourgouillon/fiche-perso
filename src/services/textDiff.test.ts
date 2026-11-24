import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { diffText } from './textDiff';

describe('text diff', () => {
  test('shows only the changed word within a long value', () => {
    const before = `A long character backstory says that ${'many details '.repeat(20)}the village was quiet.`;
    const after = before.replace('quiet', 'empty');
    const diff = diffText(before, after);

    assert.ok(diff.some(({ type, text }) => type === 'removed' && text === 'quiet'));
    assert.ok(diff.some(({ type, text }) => type === 'added' && text === 'empty'));
    assert.ok(diff.every(({ text }) => !text.includes('many details many details many details')));
  });

  test('preserves separate edits in a multiline value', () => {
    const diff = diffText('First old line\nunchanged line\nLast old line', 'First new line\nunchanged line\nLast new line');

    assert.deepEqual(
      diff.filter(({ type }) => type !== 'context'),
      [
        { type: 'removed', text: 'old' },
        { type: 'added', text: 'new' },
        { type: 'removed', text: 'old' },
        { type: 'added', text: 'new' },
      ],
    );
    assert.ok(diff.some(({ type, text }) => type === 'context' && text.includes('unchanged line')));
  });

  test('handles inserted and deleted text', () => {
    assert.deepEqual(diffText('Before after', 'Before newly after'), [
      { type: 'context', text: 'Before ' },
      { type: 'added', text: 'newly ' },
      { type: 'context', text: 'after' },
    ]);
  });

  test('supports unicode characters', () => {
    assert.deepEqual(diffText('A 🐉 dragon', 'A 🐈 dragon'), [
      { type: 'context', text: 'A ' },
      { type: 'removed', text: '🐉' },
      { type: 'added', text: '🐈' },
      { type: 'context', text: ' dragon' },
    ]);
  });
});
