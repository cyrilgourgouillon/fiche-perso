import AddRowButton from '../fields/AddRowButton.jsx';
import Panel from './Panel.jsx';
import RemoveRowButton from '../fields/RemoveRowButton.jsx';
import TextField from '../fields/TextField.jsx';
import Checkbox from '../fields/Checkbox.jsx';
import CombatIncludeCheckbox from '../fields/CombatIncludeCheckbox.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';
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
            <div className="capacite-content">
              <TextField name={CLASS_FEATURES.field(index)} placeholder="Titre" aria-label={`Titre de la capacité ${index + 1}`} />
              <TextAreaField name={CLASS_FEATURES.field(index, 'description')} placeholder="Description" aria-label={`Description de la capacité ${index + 1}`} />
              <div className="capacite-options">
                <label className="capacite-used"><Checkbox name={CLASS_FEATURES_USED.field(index)} /> Utilisée</label>
                <span>Réinitialiser après :</span>
                <label><Checkbox name={CLASS_FEATURES.field(index, 'repos_court')} /> Repos court</label>
                <label><Checkbox name={CLASS_FEATURES.field(index, 'repos_long')} /> Repos long</label>
                <label className="combat-include-option">
                  <CombatIncludeCheckbox
                    name={CLASS_FEATURES.field(index, 'combat')}
                    defaultField={CLASS_FEATURES.field(index)}
                    aria-label={'Inclure capacité ' + (index + 1) + ' dans le résumé de combat'}
                  />
                  Résumé combat
                </label>
              </div>
            </div>
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
