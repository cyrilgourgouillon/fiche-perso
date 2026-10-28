import AddRowButton from '../fields/AddRowButton';
import Panel from './Panel';
import ListItem from '../common/ListItem';
import TextField from '../fields/TextField';
import Checkbox from '../fields/Checkbox';
import CombatIncludeToggle from '../fields/CombatIncludeToggle';
import TextAreaField from '../fields/TextAreaField';
import { CLASS_FEATURES, CLASS_FEATURES_USED } from '../../data/sheetLists';
import { useListRows } from '../../hooks/useListRows';
import { range } from '../../utils/range';

export default function ClassFeaturesPanel() {
  const { rowCount, removable, isRowEmpty, addRow, removeRow } = useListRows(CLASS_FEATURES);

  return (
    <Panel id="capacites" title="Capacités de Classe">
      <ul className="capacite-list">
        {range(rowCount).map((index) => (
          <ListItem
            key={index}
            remove={
              removable
                ? {
                    label: `Supprimer la capacité ${index + 1}`,
                    confirm: !isRowEmpty(index),
                    onClick: () => removeRow(index),
                  }
                : undefined
            }
          >
            <TextField name={CLASS_FEATURES.field(index)} placeholder="Titre" aria-label={`Titre de la capacité ${index + 1}`} />
            <TextAreaField name={CLASS_FEATURES.field(index, 'description')} placeholder="Description" aria-label={`Description de la capacité ${index + 1}`} />
            <div className="capacite-options">
              <label className="capacite-used"><Checkbox name={CLASS_FEATURES_USED.field(index)} /> Utilisée</label>
              <span>Réinitialiser après :</span>
              <label><Checkbox name={CLASS_FEATURES.field(index, 'repos_court')} /> Repos court</label>
              <label><Checkbox name={CLASS_FEATURES.field(index, 'repos_long')} /> Repos long</label>
              <CombatIncludeToggle
                name={CLASS_FEATURES.field(index, 'combat')}
                defaultField={CLASS_FEATURES.field(index)}
                ariaLabel={`Inclure capacité ${index + 1} dans le résumé de combat`}
              />
            </div>
          </ListItem>
        ))}
      </ul>
      <AddRowButton label="Ajouter une capacité" onClick={addRow} />
    </Panel>
  );
}
