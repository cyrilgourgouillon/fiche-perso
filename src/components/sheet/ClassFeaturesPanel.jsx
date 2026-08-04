import AddRowButton from '../fields/AddRowButton.jsx';
import Panel from './Panel.jsx';
import RemoveRowButton from '../fields/RemoveRowButton.jsx';
import TextField from '../fields/TextField.jsx';
import Checkbox from '../fields/Checkbox.jsx';
import { CLASS_FEATURES, CLASS_FEATURES_USED } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';
import { range } from '../../utils/range.js';

export default function ClassFeaturesPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(CLASS_FEATURES);

  return (
    <Panel id="capacites" title="Capacités de Classe">
      <ul className="capacite-list">
        {range(rowCount).map((index) => (
          <li key={index}>
            <TextField name={CLASS_FEATURES.field(index)} placeholder="—" />
            <Checkbox name={CLASS_FEATURES_USED.field(index)} />
            {removable && (
              <RemoveRowButton
                label={`Supprimer la capacité ${index + 1}`}
                confirm={!isRowEmpty(index)}
                onClick={() => removeRow(index)}
              />
            )}
          </li>
        ))}
      </ul>
      <AddRowButton label="Ajouter une capacité" onClick={addRow} />
    </Panel>
  );
}
