export type TextDiffType = 'context' | 'added' | 'removed';

export interface TextDiffSegment {
  type: TextDiffType;
  text: string;
}

type Operation = TextDiffSegment;

const MAX_EDIT_DISTANCE = 256;
const CONTEXT_LENGTH = 48;

function fallbackDiff(before: string[], after: string[]): Operation[] {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < before.length - prefix
    && suffix < after.length - prefix
    && before[before.length - suffix - 1] === after[after.length - suffix - 1]
  ) suffix += 1;

  const operations: Operation[] = [
    { type: 'context', text: before.slice(0, prefix).join('') },
    { type: 'removed', text: before.slice(prefix, before.length - suffix).join('') },
    { type: 'added', text: after.slice(prefix, after.length - suffix).join('') },
    { type: 'context', text: suffix ? before.slice(before.length - suffix).join('') : '' },
  ];
  return operations.filter(({ text }) => text.length > 0);
}

function backtrack(
  trace: Map<number, number>[],
  before: string[],
  after: string[],
): Operation[] {
  let x = before.length;
  let y = after.length;
  const operations: Operation[] = [];

  for (let distance = trace.length - 1; distance >= 0; distance -= 1) {
    const frontier = trace[distance];
    const diagonal = x - y;
    const previousDiagonal = diagonal === -distance
      || (diagonal !== distance
        && (frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY)
          < (frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY))
      ? diagonal + 1
      : diagonal - 1;
    const previousX = frontier.get(previousDiagonal) ?? 0;
    const previousY = previousX - previousDiagonal;

    while (x > previousX && y > previousY) {
      operations.push({ type: 'context', text: before[x - 1] });
      x -= 1;
      y -= 1;
    }

    if (distance === 0) break;
    if (x === previousX) {
      operations.push({ type: 'added', text: after[y - 1] });
      y -= 1;
    } else {
      operations.push({ type: 'removed', text: before[x - 1] });
      x -= 1;
    }
  }

  return operations.reverse();
}

function diffCharacters(before: string[], after: string[]): Operation[] {
  const trace: Map<number, number>[] = [];
  const frontier = new Map<number, number>([[1, 0]]);
  const maxDistance = Math.min(before.length + after.length, MAX_EDIT_DISTANCE);

  for (let distance = 0; distance <= maxDistance; distance += 1) {
    trace.push(new Map(frontier));
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      let x = diagonal === -distance
        || (diagonal !== distance
          && (frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY)
            < (frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY))
        ? frontier.get(diagonal + 1) ?? 0
        : (frontier.get(diagonal - 1) ?? 0) + 1;
      let y = x - diagonal;

      while (x < before.length && y < after.length && before[x] === after[y]) {
        x += 1;
        y += 1;
      }

      frontier.set(diagonal, x);
      if (x >= before.length && y >= after.length) return backtrack(trace, before, after);
    }
  }

  return fallbackDiff(before, after);
}

function mergeOperations(operations: Operation[]): TextDiffSegment[] {
  return operations.reduce<TextDiffSegment[]>((segments, operation) => {
    const last = segments.at(-1);
    if (last?.type === operation.type) last.text += operation.text;
    else segments.push({ ...operation });
    return segments;
  }, []);
}

function limitContext(segments: TextDiffSegment[]): TextDiffSegment[] {
  return segments.flatMap((segment, index) => {
    if (segment.type !== 'context' || segment.text.length <= CONTEXT_LENGTH * 2) return [segment];

    const hasChangesBefore = segments.slice(0, index).some(({ type }) => type !== 'context');
    const hasChangesAfter = segments.slice(index + 1).some(({ type }) => type !== 'context');
    if (hasChangesBefore && hasChangesAfter) {
      return [
        { type: 'context', text: segment.text.slice(0, CONTEXT_LENGTH) },
        { type: 'context', text: '…' },
        { type: 'context', text: segment.text.slice(-CONTEXT_LENGTH) },
      ];
    }
    if (hasChangesBefore) {
      return [{ type: 'context', text: `${segment.text.slice(0, CONTEXT_LENGTH)}…` }];
    }
    if (hasChangesAfter) {
      return [{ type: 'context', text: `…${segment.text.slice(-CONTEXT_LENGTH)}` }];
    }
    return [segment];
  });
}

function tokenize(text: string): string[] {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
}

export function diffText(beforeText: string, afterText: string): TextDiffSegment[] {
  if (beforeText === afterText) return [{ type: 'context', text: beforeText }];
  const operations = diffCharacters(tokenize(beforeText), tokenize(afterText));
  return limitContext(mergeOperations(operations));
}
