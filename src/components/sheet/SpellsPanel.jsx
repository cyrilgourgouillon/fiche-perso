import AddRowButton from '../fields/AddRowButton.jsx';
import Checkbox from '../fields/Checkbox.jsx';
import FieldTable from '../fields/FieldTable.jsx';
import LabeledField from '../fields/LabeledField.jsx';
import Panel from './Panel.jsx';
import SelectField from '../fields/SelectField.jsx';
import { ABILITIES } from '../../data/abilities.js';
import { SPELLS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';
import { useSheet } from '../../context/SheetContext.js';
import {
  DEFAULT_SPELLCASTING_ABILITY,
  derivedSpellAttackBonus,
  derivedSpellSaveDC,
  derivedSpellcastingModifier,
  formatModifier,
} from '../../services/characterMath.js';

const SPELLCASTING_ABILITIES = ABILITIES.map(({ key, label }) => ({ value: key, label }));

/** Empty fields show what the casting ability implies; a typed value wins. */
const SPELL_META_FIELDS = [
  {
    label: '🔮 Mod. d’incantation',
    name: 'modificateur_incantation',
    hint: (data) => formatModifier(derivedSpellcastingModifier(data)),
  },
  {
    label: '🎯 DD Sauvegarde',
    name: 'dd_sauvegarde',
    hint: (data) => String(derivedSpellSaveDC(data)),
  },
  {
    label: '🔥 Bonus d’attaque sort',
    name: 'bonus_attaque_sort',
    hint: (data) => formatModifier(derivedSpellAttackBonus(data)),
  },
];

const SPELL_FLAGS = [
  { field: 'concentration', letter: 'C' },
  { field: 'rituel', letter: 'R' },
  { field: 'materiel', letter: 'M' },
];

const SPELL_COLUMNS = [
  { field: 'niveau', header: 'Niv', align: 'center' },
  { field: 'nom', header: 'Nom' },
  { field: 'temps', header: 'Temps', align: 'center' },
  { field: 'portee', header: 'Portée', align: 'center' },
  {
    field: 'flags',
    header: 'C R M',
    cellClassName: 'spell-flags',
    render: (row) =>
      SPELL_FLAGS.map(({ field, letter }) => (
        <label key={field}>
          {letter}
          <Checkbox name={SPELLS.field(row, field)} />
        </label>
      )),
  },
  { field: 'notes', header: 'Notes' },
];

export default function SpellsPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(SPELLS);
  const { data } = useSheet();

  return (
    <Panel id="sorts" title="Sorts Mineurs & Sorts Préparés">
      <div className="spell-meta-grid">
        <div>
          <div className="meta-label">✨ Caractéristique</div>
          <SelectField
            name="caracteristique_incantation"
            options={SPELLCASTING_ABILITIES}
            fallback={DEFAULT_SPELLCASTING_ABILITY}
            className="ef center"
            aria-label="Caractéristique d’incantation"
          />
        </div>
        {SPELL_META_FIELDS.map(({ label, name, hint }) => (
          <LabeledField
            key={name}
            label={label}
            name={name}
            className="ef center derived"
            placeholder={hint(data)}
          />
        ))}
      </div>
      <FieldTable
        className="spells-table"
        columns={SPELL_COLUMNS}
        rowCount={rowCount}
        fieldName={SPELLS.field}
        onRemoveRow={removable ? removeRow : undefined}
        isRowEmpty={isRowEmpty}
      />
      <AddRowButton label="Ajouter un sort" onClick={addRow} />
    </Panel>
  );
}
