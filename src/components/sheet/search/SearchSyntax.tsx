import { useMemo } from 'react';
import { SECTIONS } from '../../../data/sections';
import { normalized, SECTION_FILTERS } from '../../../services/search';
import {
  isPositiveAmount, parseCommand, recognizedValueLength, syntaxKeyword,
} from '../../../services/searchCommands';
import type { QuickAction } from '../../../services/searchCommands';
import { withoutIcon } from '../../../services/searchIndex';
import type { SearchEntry } from '../../../services/searchIndex';

type Entries = ReadonlyArray<Pick<SearchEntry, 'section' | 'title'>>;

const NO_ENTRIES: Entries = [];

/** `sort` keyword, then the part naming something on the sheet, then free text. */
function KeywordArgument({ command, argument, entries }: { command: string; argument: string; entries: Entries }) {
  const keyword = useMemo(() => syntaxKeyword(command, argument), [command, argument]);
  if (!keyword) return null;

  const leadingSpace = keyword.remainder.match(/^\s*/u)?.[0].length || 0;
  const remainder = keyword.remainder.slice(leadingSpace);
  const exactEntry = entries.some((entry) => (
    entry.section === keyword.target.section && normalized(entry.title) === normalized(remainder.trimEnd())
  ));
  const quantityMatch = /^(.*?)\s+(\d+)$/u.exec(remainder.trimEnd());
  const hasQuantity = Boolean(
    !exactEntry && quantityMatch?.[1].trim() && isPositiveAmount(Number(quantityMatch[2])),
  );
  const value = hasQuantity ? quantityMatch?.[1].trimEnd() || '' : remainder;
  const recognizedLength = recognizedValueLength({ ...keyword, remainder: value }, entries);
  return (
    <>
      <span className="search-token-argument is-valid">{keyword.label}</span>
      {remainder && (
        <span className="search-token-keyword-remainder">
          {recognizedLength > 0 && <span className="search-token-argument is-recognized-value">{value.slice(0, recognizedLength)}</span>}
          {recognizedLength < value.length && <span className="search-token-argument is-user-text">{value.slice(recognizedLength)}</span>}
          {hasQuantity && (
            <>
              <span> </span>
              <span className="search-token-argument is-quantity">{quantityMatch?.[2]}</span>
            </>
          )}
        </span>
      )}
    </>
  );
}

type SearchExampleProps = {
  prefix: string;
  children: string;
  /** A section filter (`sort:`) rather than a `>` command. */
  filter?: boolean;
  entries?: Entries;
};

/** A syntax-coloured example query, as shown in the help and next to suggestions. */
export function SearchExample({
  prefix, children, filter = false, entries = NO_ENTRIES,
}: SearchExampleProps) {
  const hasKeyword = !filter && Boolean(syntaxKeyword(prefix, children));
  return (
    <code>
      {!filter && <span className="search-token-marker">&gt;</span>}
      <span className={filter ? 'search-token-filter' : 'search-token-command'}>{prefix}</span>
      <span className="search-token-separator">:</span>
      {hasKeyword
        ? <KeywordArgument command={prefix} argument={children} entries={entries} />
        : <span className={`search-token-argument is-${filter ? 'query' : 'valid'}`}>{children}</span>}
    </code>
  );
}

function exampleFor(action: QuickAction): [string, string] {
  switch (action.type) {
    case 'expression': return ['t', action.value];
    case 'skill': return ['t', action.skill.label];
    case 'save': return ['t', withoutIcon(action.ability.label)];
    case 'add': {
      const value = action.prefillValue ? ` ${action.prefillValue}` : '';
      const quantity = action.prefillQuantity > 1 ? ` ${action.prefillQuantity}` : '';
      return ['a', `${action.names[0]}${value}${quantity}`];
    }
    case 'inventory-add': return ['a', `équipement ${action.itemName}${action.amount > 1 ? ` ${action.amount}` : ''}`];
    case 'coin': return [action.direction === 'add' ? 'a' : 'r', `${action.names[0]} ${action.amount} ${action.coin}`];
    case 'inventory': return ['r', `${action.itemName}${action.amount > 1 ? ` ${action.amount}` : ''}`];
    case 'goto': return ['g', SECTIONS.find(({ id }) => id === action.section)?.label || action.section];
    default: return ['o', action.names[0]];
  }
}

/** The command that would produce `action`, written out as an example. */
export function QuickActionExample({ action, entries }: { action: QuickAction; entries: Entries }) {
  const [prefix, argument] = exampleFor(action);
  return <SearchExample prefix={prefix} entries={entries}>{argument}</SearchExample>;
}

type HighlightedQueryProps = {
  query: string;
  /** Whether the command currently has something to run. */
  hasMatches: boolean;
  entries: Entries;
};

/** The typed query, coloured token by token. */
export function HighlightedQuery({ query, hasMatches, entries }: HighlightedQueryProps) {
  const parsed = parseCommand(query);
  if (parsed) {
    const {
      rawCommand, command, hasSeparator, spacing, argument, wellFormed, text,
    } = parsed;
    let argumentState = 'invalid';
    if (command && !argument.trim()) argumentState = 'pending';
    else if (command && hasMatches) argumentState = 'valid';
    const hasKeyword = Boolean(command && syntaxKeyword(command, argument));
    return (
      <>
        <span className="search-token-marker">&gt;</span>
        {rawCommand && (
          <span className={command ? 'search-token-command' : 'search-token-argument is-invalid'}>{rawCommand}</span>
        )}
        {hasSeparator && (
          <>
            <span className="search-token-separator">:</span>
            {spacing}
            {hasKeyword
              ? <KeywordArgument command={command} argument={argument} entries={entries} />
              : <span className={`search-token-argument is-${argumentState}`}>{argument}</span>}
          </>
        )}
        {!wellFormed && text && <span className="search-token-argument is-invalid">{text}</span>}
      </>
    );
  }

  const match = /^(\s*)([^:\s]+)(:)(\s*)([\s\S]*)$/u.exec(query);
  const isFilter = match && SECTION_FILTERS.some(({ alias }) => alias === normalized(match[2]));
  if (!isFilter) return <span className="search-token-query">{query}</span>;

  const [, leading, rawPrefix, separator, spacing, argument] = match;
  return (
    <>
      {leading}
      <span className="search-token-filter">{rawPrefix}</span>
      <span className="search-token-separator">{separator}</span>
      {spacing}
      <span className="search-token-argument is-query">{argument}</span>
    </>
  );
}
