import { useEffect, useState } from 'react';
import AddRowButton from '../fields/AddRowButton';
import CombatIncludeToggle from '../fields/CombatIncludeToggle';
import Checkbox from '../fields/Checkbox';
import Panel from './Panel';
import ListItem from '../common/ListItem';
import SelectField from '../fields/SelectField';
import TextField from '../fields/TextField';
import TextAreaField from '../fields/TextAreaField';
import { ABILITIES } from '../../data/abilities';
import { SPELLS } from '../../data/sheetLists';
import { useListRows } from '../../hooks/useListRows';
import { useSheet } from '../../context/SheetContext';
import { isCantrip } from '../../services/spells';
import { range } from '../../utils/range';
import {
  DEFAULT_SPELLCASTING_ABILITY,
  derivedSpellAttackBonus,
  derivedSpellSaveDC,
  derivedSpellcastingModifier,
  formatModifier,
} from '../../services/characterMath';

const SPELLCASTING_ABILITIES = ABILITIES.map(({ key, label }) => ({ value: key, label }));
const SPELL_META_FIELDS = [
  {
    label: "Modificateur d'incantation",
    name: 'modificateur_incantation',
    hint: (data) => formatModifier(derivedSpellcastingModifier(data)),
  },
  {
    label: 'DD de sauvegarde',
    name: 'dd_sauvegarde',
    hint: (data) => String(derivedSpellSaveDC(data)),
  },
  {
    label: "Bonus d'attaque des sorts",
    name: 'bonus_attaque_sort',
    hint: (data) => formatModifier(derivedSpellAttackBonus(data)),
  },
];
const SPELL_FLAGS = [
  { field: 'concentration', letter: 'Concentration' },
  { field: 'rituel', letter: 'Rituel' },
  { field: 'materiel', letter: 'Mat\u00e9riel' },
];

export default function SpellsPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(SPELLS);
  const { data, update } = useSheet();
  const [nameFilter, setNameFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [ritualOnly, setRitualOnly] = useState(false);
  const [concentrationOnly, setConcentrationOnly] = useState(false);
  const [combatOnly, setCombatOnly] = useState(false);
  useEffect(() => {
    const reset = (event) => {
      if (event.detail?.section !== 'sorts') return;
      setNameFilter('');
      setLevelFilter('all');
      setRitualOnly(false);
      setConcentrationOnly(false);
      setCombatOnly(false);
    };
    window.addEventListener('sheet-search-reset', reset);
    return () => window.removeEventListener('sheet-search-reset', reset);
  }, []);
  const visibleSpells = range(rowCount).filter((index) => {
    const name = String(data[SPELLS.field(index, 'nom')] || '');
    const level = String(data[SPELLS.field(index, 'niveau')] ?? '');
    return (!nameFilter || name.toLocaleLowerCase().includes(nameFilter.trim().toLocaleLowerCase()))
      && (levelFilter === 'all' || (levelFilter === 'cantrip' ? isCantrip(data, index) : !isCantrip(data, index) && level === levelFilter))
      && (!ritualOnly || data[SPELLS.field(index, 'rituel')] === 'true')
      && (!concentrationOnly || data[SPELLS.field(index, 'concentration')] === 'true')
      && (!combatOnly || (data[SPELLS.field(index, 'combat')] ?? (name ? 'true' : 'false')) === 'true');
  });

  return (
    <Panel id="sorts" title="Sorts Mineurs & Sorts Préparés">
      <div className="spell-meta-grid">
        <div>
          <div className="meta-label">Caractéristique d'incantation</div>
          <SelectField
            name="caracteristique_incantation"
            options={SPELLCASTING_ABILITIES}
            fallback={DEFAULT_SPELLCASTING_ABILITY}
            className="ef center"
            aria-label="Caractéristique d’incantation"
          />
        </div>
        {SPELL_META_FIELDS.map(({ label, name, hint }) => (
          <div className="spell-derived-field" key={name}>
            <label htmlFor={name}>{label}</label>
            <TextField
              id={name}
              name={name}
              className="ef center derived"
              placeholder={hint(data)}
            />
          </div>
        ))}
      </div>
      <p className="combat-include-help">Cochez "Résumé combat" pour ajouter un sort au résumé de combat.</p>
      <div className="spell-filter-row" role="group" aria-label="Filtres de sorts">
        <label className="spell-filter-search">
          <span>Rechercher</span>
          <input className="ef" type="search" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Nom du sort" />
        </label>
        <label className="spell-filter-level">
          <span>Niveau</span>
          <select className="ef" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="all">Tous</option>
            <option value="cantrip">Cantrips / sorts mineurs</option>
            {range(9).map((level) => <option value={String(level + 1)} key={level}>{level + 1}</option>)}
          </select>
        </label>
        <label><input type="checkbox" checked={ritualOnly} onChange={(event) => setRitualOnly(event.target.checked)} /> Rituel</label>
        <label><input type="checkbox" checked={concentrationOnly} onChange={(event) => setConcentrationOnly(event.target.checked)} /> Concentration</label>
        <label><input type="checkbox" checked={combatOnly} onChange={(event) => setCombatOnly(event.target.checked)} /> Combat</label>
        <span className="spell-filter-count">{visibleSpells.length} / {rowCount}</span>
      </div>
      <ul className="capacite-list spell-list">
        {visibleSpells.map((index) => (
          <ListItem
            key={index}
            contentClassName="capacite-content spell-content"
            remove={
              removable
                ? {
                    label: `Supprimer le sort ${index + 1}`,
                    confirm: !isRowEmpty(index),
                    onClick: () => removeRow(index),
                  }
                : undefined
            }
          >
            <div className="spell-title-line">
              <TextField
                name={SPELLS.field(index, 'nom')}
                className="ef spell-name"
                placeholder="Nom du sort"
                aria-label={`Nom du sort ${index + 1}`}
              />
              <TextField
                name={SPELLS.field(index, 'niveau')}
                className="ef center spell-level"
                placeholder="Niv."
                aria-label={`Niveau du sort ${index + 1}`}
              />
            </div>

            <div className="spell-facts">
              <div>
                <label htmlFor={`spell-time-${index + 1}`}>Temps d’incantation</label>
                <TextField id={`spell-time-${index + 1}`} name={SPELLS.field(index, 'temps')} className="ef" />
              </div>
              <div>
                <label htmlFor={`spell-range-${index + 1}`}>Portée</label>
                <TextField id={`spell-range-${index + 1}`} name={SPELLS.field(index, 'portee')} className="ef" />
              </div>
            </div>

            <div className="capacite-options spell-flags">
              <label className="spell-cantrip">
                <input
                  type="checkbox"
                  checked={isCantrip(data, index)}
                  onChange={(event) => update(SPELLS.field(index, 'cantrip'), String(event.target.checked))}
                />
                Cantrip / sort mineur
              </label>
              {SPELL_FLAGS.map(({ field, letter }) => (
                <label key={field}>
                  <Checkbox name={SPELLS.field(index, field)} /> {letter}
                </label>
              ))}
              <CombatIncludeToggle
                name={SPELLS.field(index, 'combat')}
                defaultField={SPELLS.field(index, 'nom')}
                ariaLabel={`Inclure sort ${index + 1} dans le résumé de combat`}
              />
            </div>

            <div className="spell-notes-field">
              <label htmlFor={`spell-notes-${index + 1}`}>Notes et description</label>
              <TextAreaField
                id={`spell-notes-${index + 1}`}
                name={SPELLS.field(index, 'notes')}
                className="ef spell-notes-input"
                placeholder="Description, effets, détails…"
                aria-label={`Notes et description du sort ${index + 1}`}
              />
            </div>
          </ListItem>
        ))}
      </ul>
      {visibleSpells.length === 0 && <p className="filter-empty">Aucun sort ne correspond à ces filtres.</p>}
      <AddRowButton label="Ajouter un sort" onClick={addRow} />
    </Panel>
  );
}
