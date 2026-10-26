import { useEffect, useState } from 'react';
import { CLASS_FEATURES, INVENTORY, MAGIC_ITEMS, QUESTS, SPELLS, WEAPONS } from '../../data/sheetLists.js';
import { SECTIONS, foldField } from '../../data/sections.js';
import { listRowCount } from '../../services/sheetRows.js';
import { useSheet } from '../../context/SheetContext.js';

const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

function sheetSearchEntries(data) {
  const entries = [];
  const addRows = (list, section, titleField, detailFields = []) => {
    for (let row = 0; row < listRowCount(data, list); row += 1) {
      const title = String(data[list.field(row, titleField)] || '').trim();
      if (!title) continue;
      const detail = detailFields.map((field) => data[list.field(row, field)]).filter(Boolean).join(' · ');
      entries.push({ title, detail, searchText: [title, detail].join(' '), field: list.field(row, titleField), section, row });
    }
  };
  addRows(SPELLS, 'sorts', 'nom', ['niveau', 'notes']);
  addRows(WEAPONS, 'armes', 'nom', ['degats', 'notes']);
  addRows(INVENTORY, 'equipement', 'nom');
  addRows(MAGIC_ITEMS, 'equipement');
  addRows(CLASS_FEATURES, 'capacites', 'titre', ['description']);
  addRows(QUESTS, 'quetes', 'titre', ['pnj', 'lieu', 'recompense', 'description', 'notes']);
  return entries;
}

export default function SheetSearch({ open, onToggle }) {
  const { data, apply } = useSheet();
  const [query, setQuery] = useState('');
  const [pendingField, setPendingField] = useState('');
  const searchResults = query.trim().length >= 2
    ? sheetSearchEntries(data).filter((entry) => normalized(entry.searchText).includes(normalized(query.trim()))).slice(0, 8)
    : [];

  useEffect(() => {
    if (!pendingField) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(`[data-field="${pendingField}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
      setPendingField('');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data, pendingField]);

  const openSearchResult = (entry) => {
    window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: entry.section } }));
    apply((current) => ({
      ...current,
      [foldField(entry.section)]: 'false',
      ...(entry.section === 'quetes' ? { [QUESTS.field(entry.row, 'replie')]: 'false' } : {}),
    }));
    setPendingField(entry.field);
    setQuery('');
    onToggle();
  };

  return (
    <div className="sheet-search-widget">
      <button
        type="button"
        className="sheet-tools-launcher sheet-search-launcher"
        aria-expanded={open}
        aria-controls="sheet-search-panel"
        aria-label="Rechercher dans la fiche"
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
        <span>Rechercher</span>
      </button>
      {open && (
        <div className="search-overlay" onMouseDown={(event) => event.target === event.currentTarget && onToggle()}>
          <section id="sheet-search-panel" className="global-search-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-search-title">
            <div className="search-modal-heading">
              <h2 id="sheet-search-title">Rechercher dans la fiche</h2>
              <kbd>Échap</kbd>
            </div>
            <div className="sheet-search">
              <input
                id="sheet-search-input"
                className="ef"
                type="search"
                aria-label="Rechercher dans la fiche"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sort, quête, capacité, objet…"
                autoComplete="off"
                autoFocus
              />
              {query.trim().length >= 2 && (
                <div className="sheet-search-results" role="listbox" aria-label="Résultats de recherche">
                  {searchResults.length ? searchResults.map((entry) => (
                    <button type="button" role="option" aria-selected="false" key={entry.field} onClick={() => openSearchResult(entry)}>
                      <strong>{entry.title}</strong>
                      <span>{SECTIONS.find(({ id }) => id === entry.section)?.label}{entry.detail ? ` · ${entry.detail}` : ''}</span>
                    </button>
                  )) : <p>Aucun résultat.</p>}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
