import { useEffect, useState } from 'react';
import { CLASS_FEATURES, INVENTORY, MAGIC_ITEMS, QUESTS, SPELLS, WEAPONS } from '../../data/sheetLists.js';
import { ABILITIES, SKILLS } from '../../data/abilities.js';
import { QUEST_STATUSES } from '../../data/questStatuses.js';
import { SECTIONS, foldField, sectionAnchor } from '../../data/sections.js';
import { normalizeTileLayout } from '../../data/tileLayout.js';
import { listRowCount } from '../../services/sheetRows.js';
import { abilityModifier, formatModifier, savingThrowBonus, skillBonus } from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';

const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const withoutIcon = (label) => label.replace(/^\S+\s/, '');
const badge = (label, value, tone = 'category') => ({ label, value, tone });

function sheetSearchEntries(data) {
  const entries = [];
  SECTIONS.forEach(({ id, label }) => {
    entries.push({
      title: label,
      badges: [],
      searchText: label,
      section: id,
      kind: 'section',
      targetSelector: `#${sectionAnchor(id)}`,
    });
  });
  ABILITIES.forEach((ability) => {
    const score = data[ability.key] || '—';
    const modifier = formatModifier(abilityModifier(data[ability.key]));
    const save = formatModifier(savingThrowBonus(data, ability.key));
    entries.push({
      title: withoutIcon(ability.label),
      badges: [
        badge('Score', score, 'score'),
        badge('Mod', modifier, 'modifier'),
        badge('Jet de sauvegarde', save, save.startsWith('-') ? 'negative' : 'positive'),
      ],
      searchText: `${ability.label} ${score} ${modifier} ${save} jet de sauvegarde sauvegarde`,
      section: 'caracteristiques',
      field: ability.key,
    });
  });
  SKILLS.forEach((skill) => {
    const abilityLabel = withoutIcon(ABILITIES.find(({ key }) => key === skill.ability)?.label || skill.ability);
    const bonus = formatModifier(skillBonus(data, skill));
    entries.push({
      title: skill.label,
      detail: `Compétence · ${abilityLabel}`,
      badges: [
        badge('Bonus', bonus, bonus.startsWith('-') ? 'negative' : 'positive'),
      ],
      searchText: `${skill.label} ${skill.ability} ${abilityLabel} ${bonus}`,
      section: 'caracteristiques',
      targetSelector: `[data-skill="${skill.key}"]`,
    });
  });
  const addRows = (list, section, titleField, detailFields = [], getBadges = () => [], options = {}) => {
    for (let row = 0; row < listRowCount(data, list); row += 1) {
      const title = String(data[list.field(row, titleField)] || '').trim();
      if (!title) continue;
      const detail = detailFields.map((field) => data[list.field(row, field)]).filter(Boolean).join(' · ');
      const badges = getBadges(row);
      entries.push({
        title,
        detail,
        badges,
        searchText: [title, detail, ...badges.flatMap(({ label, value }) => [label, value])].join(' '),
        hideDetail: options.hideDetail,
        field: list.field(row, titleField),
        section,
        row,
      });
    }
  };
  addRows(SPELLS, 'sorts', 'nom', ['notes'], (row) => {
    const level = SPELLS.field(row, 'niveau');
    const cantrip = data[SPELLS.field(row, 'cantrip')] === 'true';
    return [badge('Niveau', cantrip ? 'Mineur' : data[level] || '—', 'score')];
  });
  addRows(WEAPONS, 'armes', 'nom', ['notes'], (row) => [
    ...(data[WEAPONS.field(row, 'bonus')] ? [badge('Attaque', data[WEAPONS.field(row, 'bonus')], 'modifier')] : []),
    ...(data[WEAPONS.field(row, 'degats')] ? [badge('Dégâts', data[WEAPONS.field(row, 'degats')], 'score')] : []),
  ]);
  addRows(INVENTORY, 'equipement', 'nom', [], (row) => [
    badge('Quantité', String(Math.max(0, Number.parseInt(data[INVENTORY.field(row, 'quantite')], 10) || 0)), 'score'),
  ]);
  addRows(MAGIC_ITEMS, 'equipement');
  addRows(CLASS_FEATURES, 'capacites', 'titre', ['description'], (row) => [
    ...(data[CLASS_FEATURES.field(row, 'repos_court')] === 'true' ? [badge('Recharge', 'Repos court')] : []),
    ...(data[CLASS_FEATURES.field(row, 'repos_long')] === 'true' ? [badge('Recharge', 'Repos long')] : []),
  ], { hideDetail: true });
  addRows(QUESTS, 'quetes', 'titre', ['pnj', 'lieu', 'recompense', 'description', 'notes'], (row) => {
    const status = QUEST_STATUSES.find(({ value }) => value === data[QUESTS.field(row, 'statut')]);
    return [
      ...(status?.value ? [badge('Statut', status.label, status.value === 'terminee' ? 'positive' : status.value === 'echouee' || status.value === 'abandonnee' ? 'negative' : 'score')] : []),
    ];
  });
  return entries;
}

export default function SheetSearch({ open, onToggle }) {
  const { data, apply } = useSheet();
  const layout = normalizeTileLayout(data.tile_layout, data.tile_order, data.tile_sides, data.tile_widths);
  const visibleSections = new Set([...layout.top, ...layout.left, ...layout.right, ...layout.bottom]);
  const [query, setQuery] = useState('');
  const [pendingTarget, setPendingTarget] = useState(null);
  const matchingResults = query.trim().length >= 2
    ? sheetSearchEntries(data)
      .filter((entry) => visibleSections.has(entry.section))
      .filter((entry) => normalized(entry.searchText).includes(normalized(query.trim())))
    : [];
  const searchResults = [
    ...matchingResults.filter((entry) => entry.kind !== 'section'),
    ...matchingResults.filter((entry) => entry.kind === 'section'),
  ].slice(0, 8);
  const contentGroups = searchResults
    .filter((entry) => entry.kind !== 'section')
    .reduce((groups, entry) => {
      const label = SECTIONS.find(({ id }) => id === entry.section)?.label || 'Autres';
      const group = groups.find(({ section }) => section === entry.section);
      if (group) group.entries.push(entry);
      else groups.push({ section: entry.section, label, entries: [entry] });
      return groups;
    }, []);
  const sectionResults = searchResults.filter((entry) => entry.kind === 'section');
  const groupedResults = sectionResults.length
    ? [...contentGroups, { section: 'sections', label: 'Sections', entries: sectionResults }]
    : contentGroups;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!pendingTarget) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(pendingTarget.selector);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (pendingTarget.focus) target?.focus({ preventScroll: true });
      setPendingTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data, pendingTarget]);

  const openSearchResult = (entry) => {
    window.dispatchEvent(new CustomEvent('sheet-search-reset', { detail: { section: entry.section } }));
    apply((current) => ({
      ...current,
      [foldField(entry.section)]: 'false',
      ...(entry.section === 'quetes' && entry.row !== undefined
        ? { [QUESTS.field(entry.row, 'replie')]: 'false' }
        : {}),
    }));
    setPendingTarget({
      selector: entry.targetSelector || `[data-field="${entry.field}"]`,
      focus: Boolean(entry.field),
    });
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
            <div className="search-input-block">
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
                  placeholder="Section, caractéristique, compétence, sort, objet…"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            {query.trim().length >= 2 && (
              <div className="sheet-search-results" role="listbox" aria-label="Résultats de recherche">
                {groupedResults.length ? groupedResults.map((group) => (
                  <div className="sheet-search-result-group" data-section={group.section} role="group" aria-label={group.label} key={group.section}>
                    <h3>{group.label}</h3>
                    {group.entries.map((entry) => (
                      <button type="button" role="option" aria-selected="false" key={entry.field || entry.targetSelector || entry.title} onClick={() => openSearchResult(entry)}>
                          <strong>{entry.title}</strong>
                          {entry.detail && !entry.hideDetail && <span>{entry.detail}</span>}
                          {entry.badges?.length > 0 && (
                            <span className="search-result-values" aria-label={entry.badges.map(({ label, value }) => `${label} ${value}`).join(', ')}>
                              {entry.badges.map(({ label, value, tone }) => (
                                <span className={`search-result-value search-result-value-${tone}`} key={`${label}-${value}`}>
                                  <small>{label}</small>
                                  <b>{value}</b>
                                </span>
                              ))}
                              </span>
                          )}
                      </button>
                    ))}
                  </div>
                )) : <p>Aucun résultat.</p>}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
