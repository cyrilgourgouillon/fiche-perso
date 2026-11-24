export const MAX_HISTORY_ENTRIES = 10;

export interface SheetChange {
  field: string;
  before: unknown;
  after: unknown;
  beforePresent: boolean;
  afterPresent: boolean;
  textArea?: boolean;
}

export interface SheetHistoryEntry<T> {
  id: string;
  label: string;
  timestamp: number;
  mergeKey: string | null;
  before: T;
  changes: SheetChange[];
}

export function getSheetChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
  textAreaFields: ReadonlySet<string> = new Set(),
): SheetChange[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields]
    .filter((field) => (
      (field in before) !== (field in after)
      || JSON.stringify(before[field]) !== JSON.stringify(after[field])
    ))
    .map((field) => ({
      field,
      before: before[field],
      after: after[field],
      beforePresent: field in before,
      afterPresent: field in after,
      ...(textAreaFields.has(field) ? { textArea: true } : {}),
    }));
}

export function getSheetActionMergeKey(
  changes: SheetChange[],
  actionKey?: string,
): string | null {
  if (actionKey) return `action:${actionKey}`;
  if (!changes.length) return null;
  return `fields:${changes.map(({ field }) => field).sort().join(',')}`;
}

export function recordSheetAction<T>(
  history: SheetHistoryEntry<T>[],
  action: SheetHistoryEntry<T>,
  merge: boolean,
): SheetHistoryEntry<T>[] {
  const [latest, ...older] = history;
  if (
    merge
    && latest
    && action.mergeKey
    && latest.mergeKey === action.mergeKey
  ) {
    const changes = new Map(latest.changes.map((change) => [change.field, change]));
    action.changes.forEach((change) => {
      const original = changes.get(change.field);
      changes.set(change.field, original
        ? {
          ...original,
          after: change.after,
          afterPresent: change.afterPresent,
        }
        : change);
    });
    return [{
      ...latest,
      timestamp: action.timestamp,
      changes: [...changes.values()].filter(
        ({
          before, after, beforePresent, afterPresent,
        }) => beforePresent !== afterPresent || JSON.stringify(before) !== JSON.stringify(after),
      ),
    }, ...older];
  }
  return [action, ...history].slice(0, MAX_HISTORY_ENTRIES);
}

export function rollbackSheetHistory<T extends Record<string, unknown>>(
  history: SheetHistoryEntry<T>[],
  id: string,
): { data: T | undefined; history: SheetHistoryEntry<T>[] } {
  const index = history.findIndex((entry) => entry.id === id);
  if (index < 0) return { data: undefined, history };
  return {
    data: history[index].before,
    history: history.slice(index + 1),
  };
}
