import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  getSheetChanges,
  getSheetActionMergeKey,
  MAX_HISTORY_ENTRIES,
  recordSheetAction,
  rollbackSheetHistory,
  type SheetHistoryEntry,
} from './sheetHistory';

const action = (
  id: string,
  before: number,
  timestamp: number,
  mergeKey: string | null = null,
): SheetHistoryEntry<number> => ({
  id, before, timestamp, mergeKey, label: id, changes: [],
});

describe('sheet history', () => {
  test('keeps only the ten newest actions', () => {
    const history = Array.from({ length: 12 }, (_, index) => (
      action(String(index), index, index * 2000)
    )).reduce((current, entry) => recordSheetAction(current, entry, false), []);

    assert.equal(history.length, MAX_HISTORY_ENTRIES);
    assert.equal(history[0].id, '11');
    assert.equal(history.at(-1)?.id, '2');
  });

  test('groups rapid updates to the same field into one rollback point', () => {
    const firstEntry = {
      ...action('first', 0, 1000, 'name'),
      changes: [{
        field: 'name', before: 'A', after: 'B', beforePresent: true, afterPresent: true,
      }],
    };
    const secondEntry = {
      ...action('second', 1, 1500, 'name'),
      changes: [{
        field: 'name', before: 'B', after: 'C', beforePresent: true, afterPresent: true,
      }],
    };
    const first = recordSheetAction([], firstEntry, false);
    const updated = recordSheetAction(first, secondEntry, true);

    assert.equal(updated.length, 1);
    assert.equal(updated[0].id, 'first');
    assert.equal(updated[0].before, 0);
    assert.equal(updated[0].timestamp, 1500);
    assert.deepEqual(updated[0].changes, [{
      field: 'name', before: 'A', after: 'C', beforePresent: true, afterPresent: true,
    }]);
  });

  test('does not group unrelated or later actions', () => {
    const first = recordSheetAction([], action('first', 0, 1000, 'name'), false);
    const otherField = recordSheetAction(first, action('other', 1, 1100, 'level'), false);
    const later = recordSheetAction(otherField, action('later', 2, 2200, 'level'), false);

    assert.deepEqual(later.map(({ id }) => id), ['later', 'other', 'first']);
  });

  test('restores the state before the selected action and removes it and newer actions', () => {
    const history = [
      {
        ...action('newest', 2, 3000),
        before: { hp: '2' },
        changes: [{
          field: 'hp', before: '2', after: '3', beforePresent: true, afterPresent: true,
        }],
      },
      {
        ...action('selected', 1, 2000),
        before: { hp: '1' },
        changes: [{
          field: 'hp', before: '1', after: '2', beforePresent: true, afterPresent: true,
        }],
      },
      {
        ...action('older', 0, 1000),
        before: { hp: '0' },
        changes: [{
          field: 'hp', before: '0', after: '1', beforePresent: true, afterPresent: true,
        }],
      },
    ];
    const result = rollbackSheetHistory(history, 'selected');

    assert.deepEqual(result.data, { hp: '1' });
    assert.deepEqual(result.history.map(({ id }) => id), ['older']);
  });

  test('rolls back the only history entry and removes it', () => {
    const onlyAction: SheetHistoryEntry<Record<string, unknown>> = {
      ...action('only', 1, 2000),
      before: { hp: '1' },
      changes: [{
        field: 'hp', before: '1', after: '2', beforePresent: true, afterPresent: true,
      }],
    };

    const result = rollbackSheetHistory([onlyAction], 'only');

    assert.deepEqual(result.data, { hp: '1' });
    assert.deepEqual(result.history, []);
  });

  test('leaves history unchanged when the selected action no longer exists', () => {
    const history: SheetHistoryEntry<Record<string, unknown>>[] = [{
      ...action('newest', 2, 3000),
      before: { hp: '2' },
    }];
    const result = rollbackSheetHistory(history, 'missing');

    assert.equal(result.data, undefined);
    assert.equal(result.history, history);
  });

  test('tracks each field value before and after the action', () => {
    assert.deepEqual(
      getSheetChanges({ nom: 'Aria', niveau: '2' }, { nom: 'Aria', niveau: '3' }),
      [{
        field: 'niveau',
        before: '2',
        after: '3',
        beforePresent: true,
        afterPresent: true,
      }],
    );
  });

  test('marks only explicitly designated textarea fields for inline diff display', () => {
    assert.deepEqual(
      getSheetChanges(
        { name: 'Aria', notes: 'old note' },
        { name: 'Ariana', notes: 'new note' },
        new Set(['notes']),
      ),
      [
        {
          field: 'name',
          before: 'Aria',
          after: 'Ariana',
          beforePresent: true,
          afterPresent: true,
        },
        {
          field: 'notes',
          before: 'old note',
          after: 'new note',
          beforePresent: true,
          afterPresent: true,
          textArea: true,
        },
      ],
    );
  });

  test('uses the same merge key for repeated changes to the same fields', () => {
    const first = getSheetChanges(
      { points_vie_actuel: '20' },
      { points_vie_actuel: '19' },
    );
    const second = getSheetChanges(
      { points_vie_actuel: '19' },
      { points_vie_actuel: '18' },
    );

    assert.equal(getSheetActionMergeKey(first), getSheetActionMergeKey(second));
  });

  test('lets related actions share a key even when their changed fields vary', () => {
    const temporaryHpLoss = getSheetChanges(
      { points_vie_temp: '2', points_vie_actuel: '20' },
      { points_vie_temp: '1', points_vie_actuel: '20' },
    );
    const hitPointLoss = getSheetChanges(
      { points_vie_temp: '0', points_vie_actuel: '20' },
      { points_vie_temp: '0', points_vie_actuel: '19' },
    );

    assert.equal(
      getSheetActionMergeKey(temporaryHpLoss, 'hit-points:damage'),
      getSheetActionMergeKey(hitPointLoss, 'hit-points:damage'),
    );
  });
});
