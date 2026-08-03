import AddRowButton from '../fields/AddRowButton.jsx';
import FieldTable from '../fields/FieldTable.jsx';
import Panel from './Panel.jsx';
import { WEAPONS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';

const WEAPON_COLUMNS = [
  { field: 'nom', header: 'Nom', placeholder: '—' },
  { field: 'bonus', header: 'Bonus Att', align: 'center' },
  { field: 'degats', header: 'Dégâts & Type' },
  { field: 'notes', header: 'Notes' },
];

export default function WeaponsPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(WEAPONS);

  return (
    <Panel id="armes" title="Armes & Sorts Mineurs">
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
