import AddRowButton from '../fields/AddRowButton.jsx';
import CombatIncludeCheckbox from '../fields/CombatIncludeCheckbox.jsx';
import FieldTable from '../fields/FieldTable.jsx';
import Panel from './Panel.jsx';
import TextField from '../fields/TextField.jsx';
import { WEAPONS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';

const WEAPON_COLUMNS = [
  {
    field: 'nom',
    header: 'Nom',
    render: (row) => (
      <div className="name-with-combat">
        <CombatIncludeCheckbox
          name={WEAPONS.field(row, 'combat')}
          defaultField={WEAPONS.field(row, 'nom')}
          aria-label={'Inclure arme ' + (row + 1) + ' dans le résumé de combat'}
          title="Inclure dans le résumé de combat"
        />
        <TextField name={WEAPONS.field(row, 'nom')} className="ef" placeholder="—" />
      </div>
    ),
  },
  { field: 'bonus', header: 'Bonus Att', align: 'center' },
  { field: 'degats', header: 'Dégâts & Type' },
  { field: 'notes', header: 'Notes' },
];

export default function WeaponsPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(WEAPONS);

  return (
    <Panel id="armes" title="Armes & Sorts Mineurs">
      <p className="combat-include-help">Cochez la case à côté d’un nom pour l’inclure au résumé de combat.</p>
      <FieldTable
        className="weapons-table"
        columns={WEAPON_COLUMNS}
        rowCount={rowCount}
        fieldName={WEAPONS.field}
        onRemoveRow={removable ? removeRow : undefined}
        isRowEmpty={isRowEmpty}
      />
      <AddRowButton label="Ajouter une arme" onClick={addRow} />
    </Panel>
  );
}
