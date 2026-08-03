import AddRowButton from '../fields/AddRowButton.jsx';
import Panel from './Panel.jsx';
import RemoveRowButton from '../fields/RemoveRowButton.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';
import TextField from '../fields/TextField.jsx';
import { MAGIC_ITEMS } from '../../data/sheetLists.js';
import { useListRows } from '../../hooks/useListRows.js';
import { range } from '../../utils/range.js';

export default function EquipmentPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(MAGIC_ITEMS);

  return (
    <Panel as="div" className="panel equipment-panel" id="equipement" title="Équipement">
      <TextAreaField name="equipement" className="ef tall" />
      <div className="magic-items">
        <div className="meta-label">✨ Liens magiques</div>
        {range(rowCount).map((index) => (
          <div className="magic-item-row" key={index}>
            <TextField name={MAGIC_ITEMS.field(index)} placeholder={`Objet ${index + 1}`} />
            {removable && (
              <RemoveRowButton
                label={`Supprimer le lien ${index + 1}`}
                confirm={!isRowEmpty(index)}
                onClick={() => removeRow(index)}
              />
            )}
          </div>
        ))}
        <AddRowButton label="Ajouter un lien" onClick={addRow} />
      </div>
    </Panel>
  );
}
