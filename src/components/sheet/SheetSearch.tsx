import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import Modal from '../common/Modal';
import { INVENTORY, QUESTS } from '../../data/sheetLists';
import { SECTIONS, foldField, sectionAnchor } from '../../data/sections';
import { normalizeTileLayout } from '../../data/tileLayout';
import { withRowRemoved } from '../../services/sheetRows';
import { savingThrowBonus, skillBonus } from '../../services/characterMath';
import { scopedSearch } from '../../services/search';
import {
  buildSearchIndex, searchSheet, withoutIcon,
} from '../../services/searchIndex';
import type { SearchEntry, SearchGroup } from '../../services/searchIndex';
import {
  coinChange, commandSuggestions, isActiveCommand, parseCommand, quickActionKey, resolveCommand, wantsSearchHelp,
} from '../../services/searchCommands';
import type { CommandLetter, CommandResolution, QuickAction } from '../../services/searchCommands';
import type { NotifyStatus } from '../../hooks/useStatusMessage';
import { useSheet } from '../../context/SheetContext';
import { useDice } from '../../context/DiceContext';
import SearchHelp from './search/SearchHelp';
import { HighlightedQuery, QuickActionExample } from './search/SearchSyntax';
import { usePendingTarget } from './search/usePendingTarget';

type SheetPatch = (current: Record<string, unknown>) => Record<string, unknown>;

const NO_ENTRIES: SearchEntry[] = [];
const NO_ACTIONS: QuickAction[] = [];
const NO_SECTIONS: ReadonlySet<string> = new Set();
const NO_RESOLUTION: CommandResolution = { action: null };
const NO_RESULTS: { groups: SearchGroup[]; options: SearchEntry[] } = { groups: [], options: [] };

const EMPTY_COMMAND_MESSAGES: Record<CommandLetter, string> = {
  t: 'Saisissez une compétence, une caractéristique ou une formule de dés, comme d20+4.',
  a: 'Aucun élément à ajouter ne correspond à cette recherche.',
  r: 'Aucune pièce ou aucun objet disponible ne correspond à cette recherche.',
  g: 'Aucune section ne correspond à cette recherche.',
  o: 'Aucun outil ne correspond à cette recherche.',
};

const COMMAND_HINTS: Partial<Record<CommandLetter, string>> = {
  t: 'Choisissez une compétence, une caractéristique ou une expression de dés.',
  g: 'Choisissez une section à ouvrir.',
  o: 'Choisissez l’outil à ouvrir.',
  r: 'Choisissez des pièces ou un objet de l’inventaire à retirer.',
};

function searchContextHint(command: CommandLetter | null, isQuickCommand: boolean, query: string) {
  if (isQuickCommand) return (command && COMMAND_HINTS[command]) || '';
  const { section: scope } = scopedSearch(query);
  if (scope) return `Recherche limitée à ${SECTIONS.find(({ id }) => id === scope)?.label || 'cette section'}.`;
  return 'Résultats regroupés par section ; ↑ ↓ pour parcourir, → pour afficher les détails, Entrée pour ouvrir.';
}

/** Older versions kept a search history; it is removed once per page load. */
const SEARCH_HISTORY_KEY = 'fiche-perso-search-history';
let legacyHistoryCleared = false;
function clearLegacySearchHistory() {
  if (legacyHistoryCleared) return;
  legacyHistoryCleared = true;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Unable to remove saved search history.', error);
  }
}

/** Keeps focus in the combobox input when an option or toggle is clicked. */
const keepInputFocus = (event: MouseEvent) => event.preventDefault();

type SheetSearchProps = {
  // Quoted: with the Babel parser a bare `open` key trips no-restricted-globals.
  'open': boolean;
  onToggle: () => void;
  notify: NotifyStatus;
};

export default function SheetSearch({ open, onToggle, notify }: SheetSearchProps) {
  const { data, apply } = useSheet();
  const { roll, rollExpression } = useDice();
  const [query, setQuery] = useState('');
  const [searchHelpOpen, setSearchHelpOpen] = useState(true);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const setPendingTarget = usePendingTarget(apply, notify);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const optionRefs = useRef(new Map<number, HTMLElement>());

  // Everything below is only computed while the panel is open: the component stays mounted.
  const visibleSections = useMemo(() => {
    if (!open) return NO_SECTIONS;
    const layout = normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths);
    return new Set<string>([...layout.top, ...layout.left, ...layout.right, ...layout.bottom]);
  }, [open, data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths]);
  const entries = useMemo(() => (open ? buildSearchIndex(data) : NO_ENTRIES), [open, data]);
  const parsed = useMemo(() => parseCommand(query), [query]);
  const isQuickCommand = Boolean(parsed);
  const activeCommand = isActiveCommand(parsed) ? parsed.command : null;
  const resolution = useMemo(
    () => (open ? resolveCommand(parsed, data, visibleSections) : NO_RESOLUTION),
    [open, parsed, data, visibleSections],
  );
  const quickSuggestions = useMemo(
    () => (open ? commandSuggestions(parsed, data, visibleSections, resolution) : NO_ACTIONS),
    [open, parsed, data, visibleSections, resolution],
  );
  const search = useMemo(
    () => (open && !isQuickCommand ? searchSheet(entries, query, visibleSections) : NO_RESULTS),
    [open, isQuickCommand, entries, query, visibleSections],
  );
  // Keyboard order is display order: suggestions as listed, results flattened group by group.
  const optionCount = isQuickCommand ? quickSuggestions.length : search.options.length;
  const activeIndex = activeResultIndex < optionCount ? activeResultIndex : 0;

  useEffect(clearLegacySearchHistory, []);

  useEffect(() => {
    if (open) return;
    setQuery('');
    setSearchHelpOpen(true);
    setExpandedResults({});
    setActiveResultIndex(0);
  }, [open]);

  useEffect(() => {
    const setCommandQuery = (event) => {
      const nextQuery = event.detail?.query;
      if (typeof nextQuery !== 'string') return;
      setQuery(nextQuery);
      setSearchHelpOpen(wantsSearchHelp(nextQuery));
      setExpandedResults({});
      setActiveResultIndex(0);
    };
    window.addEventListener('sheet-search-set-query', setCommandQuery);
    return () => window.removeEventListener('sheet-search-set-query', setCommandQuery);
  }, []);

  useEffect(() => {
    optionRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, query]);

  /** Typing only opens or closes the help when the query crosses into or out of "needs help". */
  const changeQuery = (nextQuery: string) => {
    const wantsHelp = wantsSearchHelp(nextQuery);
    if (wantsHelp !== wantsSearchHelp(query)) setSearchHelpOpen(wantsHelp);
    setQuery(nextQuery);
    setExpandedResults({});
    setActiveResultIndex(0);
  };

  const toggleHelp = useCallback(() => setSearchHelpOpen((current) => !current), []);

  const toggleExpanded = (key: string) => setExpandedResults((current) => ({ ...current, [key]: !current[key] }));

  const optionRef = (index: number) => (element: HTMLElement | null) => {
    if (element) optionRefs.current.set(index, element);
    else optionRefs.current.delete(index);
  };

  /** Clears the section's filters and unfolds it, applying `patch` in the same update. */
  const revealSection = (section: string, patch?: SheetPatch) => {
    window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section } }));
    apply((current) => ({ ...(patch ? patch(current) : current), [foldField(section)]: 'false' }));
  };

  const finish = (closePanel = true) => {
    setQuery('');
    setExpandedResults({});
    setActiveResultIndex(0);
    if (closePanel) onToggle();
  };

  const openSearchResult = (entry: SearchEntry) => {
    revealSection(entry.section, entry.section === 'quetes' && entry.row !== undefined
      ? (current) => ({ ...current, [QUESTS.field(entry.row, 'replie')]: 'false' })
      : undefined);
    setPendingTarget({
      selector: entry.targetSelector || `[data-field="${entry.field}"]`,
      focusTarget: Boolean(entry.field),
    });
    finish();
  };

  const runQuickAction = (action: QuickAction) => {
    switch (action.type) {
      case 'expression':
        rollExpression(action.value);
        break;
      case 'skill':
        roll(action.skill.label, skillBonus(data, action.skill));
        break;
      case 'save':
        roll(`${withoutIcon(action.ability.label)} · Sauvegarde`, savingThrowBonus(data, action.ability.key));
        break;
      case 'add':
        revealSection(action.section);
        setPendingTarget({
          selector: `#${sectionAnchor(action.section)}`,
          action: 'add',
          stage: 'add',
          buttonLabel: action.buttonLabel,
          fieldPrefix: action.fieldPrefix,
          fieldSuffix: action.fieldSuffix,
          fieldPattern: action.fieldPattern,
          prefillValue: action.prefillValue,
          prefillQuantity: action.prefillQuantity,
        });
        break;
      case 'inventory-add': {
        const nextQuantity = action.quantity + action.amount;
        if (!Number.isSafeInteger(nextQuantity)) {
          notify(`⚠ Quantité trop élevée pour ${action.itemName}`, 'warning');
          return;
        }
        revealSection('equipement', (current) => ({
          ...current,
          [INVENTORY.field(action.row, 'quantite')]: String(nextQuantity),
        }));
        notify(`✓ Ajout réussi : ${action.amount} × ${action.itemName}`, 'success');
        setPendingTarget({ selector: `#${sectionAnchor('equipement')}` });
        break;
      }
      case 'coin': {
        const change = coinChange(data, action);
        if (!change) {
          notify(`⚠ Montant trop élevé pour la bourse (${action.coin})`, 'warning');
          return;
        }
        if (!change.changed) {
          notify(`⚠ Aucune pièce à retirer (${action.coin})`, 'warning');
          return;
        }
        apply((current) => ({ ...current, [action.coin]: change.value }));
        notify(`✓ ${action.direction === 'remove' ? 'Retrait' : 'Ajout'} réussi : ${change.changed} ${action.coin}`, 'success');
        setPendingTarget({ selector: `#${sectionAnchor('pieces')}`, focusTarget: true });
        break;
      }
      case 'inventory': {
        if (action.amount > action.quantity) {
          notify(`⚠ Quantité insuffisante : ${action.itemName} en stock (${action.quantity})`, 'warning');
          return;
        }
        const nextQuantity = action.quantity - action.amount;
        revealSection('equipement', (current) => (nextQuantity === 0
          ? withRowRemoved(current, INVENTORY, action.row)
          : { ...current, [INVENTORY.field(action.row, 'quantite')]: String(nextQuantity) }));
        notify(`✓ Retrait réussi : ${action.amount} × ${action.itemName}`, 'success');
        setPendingTarget({ selector: `#${sectionAnchor('equipement')}` });
        break;
      }
      case 'goto':
        revealSection(action.section);
        setPendingTarget({ selector: `#${sectionAnchor(action.section)}` });
        break;
      default:
        window.dispatchEvent(new CustomEvent('sheet-search-open-tool', { detail: { tool: action.tool } }));
    }
    // Opening a tool swaps the active panel, which closes this one already.
    finish(action.type !== 'tool');
  };

  const activateOption = () => {
    if (isQuickCommand) {
      const action = quickSuggestions[activeIndex] || resolution.action;
      if (action) runQuickAction(action);
      return;
    }
    const entry = search.options[activeIndex];
    if (entry) openSearchResult(entry);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && optionCount) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveResultIndex((activeIndex + step + optionCount) % optionCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      activateOption();
    } else if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && !isQuickCommand) {
      // With the caret at the end, → shows the active result's details and ← hides them.
      const entry = search.options[activeIndex];
      const input = event.currentTarget;
      const caretAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      const expand = event.key === 'ArrowRight';
      if (entry?.preview && caretAtEnd && expand !== Boolean(expandedResults[entry.key])) {
        event.preventDefault();
        toggleExpanded(entry.key);
      }
    }
  };

  const hint = query.trim() ? searchContextHint(activeCommand, isQuickCommand, query) : '';
  const showResults = isQuickCommand ? Boolean(activeCommand) : Boolean(query.trim());
  let emptyMessage = '';
  if (resolution.error) emptyMessage = resolution.error;
  else if (activeCommand && !quickSuggestions.length) emptyMessage = EMPTY_COMMAND_MESSAGES[activeCommand];
  else if (!isQuickCommand && !search.options.length) emptyMessage = 'Aucun résultat pour cette recherche.';

  const renderQuickAction = (action: QuickAction, index: number) => (
    <button
      type="button"
      role="option"
      id={optionId(index)}
      ref={optionRef(index)}
      tabIndex={-1}
      aria-selected={activeIndex === index}
      className={activeIndex === index ? 'search-option-active' : undefined}
      key={quickActionKey(action)}
      onMouseDown={keepInputFocus}
      onClick={() => runQuickAction(action)}
    >
      <strong>{action.title}</strong>
      <span>
        {action.detail}
        {' · Exemple : '}
        <QuickActionExample action={action} entries={entries} />
      </span>
    </button>
  );

  const renderSearchResult = (entry: SearchEntry, index: number) => {
    const expanded = Boolean(entry.preview && expandedResults[entry.key]);
    const previewId = `${optionId(index)}-details`;
    return (
      <div className="search-result-item" role="presentation" key={entry.key}>
        <button
          type="button"
          role="option"
          id={optionId(index)}
          ref={optionRef(index)}
          tabIndex={-1}
          aria-selected={activeIndex === index}
          aria-describedby={expanded ? previewId : undefined}
          className={activeIndex === index ? 'search-option-active' : undefined}
          onMouseDown={keepInputFocus}
          onClick={() => openSearchResult(entry)}
        >
          <strong>{entry.title}</strong>
          {entry.detail && !entry.hideDetail && <span>{entry.detail}</span>}
          {entry.badges.length > 0 && (
            <span className="search-result-values" aria-label={entry.badges.map(({ label, value }) => `${label} ${value}`).join(', ')}>
              {entry.badges.map(({ label, value, tone }) => (
                <span className={`search-result-value search-result-value-${tone}`} key={`${label}-${value}`}>
                  <small>{label}</small>
                  <b>{value}</b>
                </span>
              ))}
            </span>
          )}
          <span className="search-result-open-label">Aller au champ →</span>
          {entry.matchContext && <span className="search-match-context">{entry.matchContext}</span>}
        </button>
        {/* Mouse shortcut only: the keyboard uses → / ← on the input, and the details are the option's description. */}
        {entry.preview && (
          <button
            type="button"
            className="search-result-details-toggle"
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={keepInputFocus}
            onClick={() => toggleExpanded(entry.key)}
          >
            {expanded ? 'Masquer les détails' : 'Afficher les détails'}
          </button>
        )}
        {expanded && <p className="search-result-preview" id={previewId} aria-hidden="true">{entry.preview}</p>}
      </div>
    );
  };

  const renderGroup = (section: string, label: string, children: ReactNode) => {
    const headingId = `${baseId}-group-${section}`;
    return (
      <div className="sheet-search-result-group" data-section={section} role="group" aria-labelledby={headingId} key={section}>
        <h3 id={headingId} aria-hidden="true">{label}</h3>
        {children}
      </div>
    );
  };

  return (
    <div className="sheet-search-widget">
      <button
        type="button"
        className="sheet-tools-launcher sheet-search-launcher"
        aria-expanded={open}
        aria-controls="sheet-search-panel"
        aria-label="Rechercher et commandes rapides"
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Rechercher</span>
      </button>
      <Modal
        id="sheet-search-panel"
        isOpen={open}
        onClose={onToggle}
        title="Rechercher et commandes rapides"
        headerActions={<kbd>Échap</kbd>}
        initialFocus="#sheet-search-input"
        closeLabel="Fermer la recherche"
        className="app-modal--search"
      >
        {open && (
          <div className="global-search-panel">
            <div className="search-input-block">
              <div className="sheet-search">
                <div className="search-field">
                  <input
                    id="sheet-search-input"
                    className="ef"
                    type="search"
                    role="combobox"
                    aria-label="Rechercher et commandes rapides"
                    aria-autocomplete="list"
                    aria-expanded={showResults && optionCount > 0}
                    aria-controls={listboxId}
                    aria-activedescendant={showResults && optionCount > 0 ? optionId(activeIndex) : undefined}
                    value={query}
                    onChange={(event) => changeQuery(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
              {query && (
                <div className="search-query-preview" aria-hidden="true">
                  <span className="search-query-preview-label">Syntaxe</span>
                  <span className="search-query-preview-value">
                    <HighlightedQuery query={query} hasMatches={quickSuggestions.length > 0} entries={entries} />
                  </span>
                </div>
              )}
              <SearchHelp expanded={searchHelpOpen} onToggle={toggleHelp} entries={entries} />
            </div>
            {hint && <p className="search-context-hint" aria-live="polite">{hint}</p>}
            {isQuickCommand && !activeCommand && query.trim() !== '>' && (
              <p className="search-context-hint search-command-error" role="status" aria-live="polite">
                <span className="search-command-error-icon" aria-hidden="true">!</span>
                <span>
                  <strong>Commande inconnue</strong>
                  <small>Utilisez &gt;t:, &gt;a:, &gt;r:, &gt;g: ou &gt;o:.</small>
                </span>
              </p>
            )}
            {showResults && (
              <div className="sheet-search-results">
                {optionCount > 0 && (
                  <div role="listbox" id={listboxId} aria-label={isQuickCommand ? 'Actions rapides' : 'Résultats de recherche'}>
                    {isQuickCommand
                      ? renderGroup('quick-actions', 'Actions rapides', quickSuggestions.map(renderQuickAction))
                      : search.groups.map((group) => renderGroup(
                        group.section,
                        group.label,
                        group.entries.map((entry) => renderSearchResult(entry, search.options.indexOf(entry))),
                      ))}
                  </div>
                )}
                {emptyMessage && <p className="search-empty-state" role="status">{emptyMessage}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
