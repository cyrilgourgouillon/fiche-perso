import AddRowButton from '../fields/AddRowButton';
import Panel from './Panel';
import AideddSearchButton from '../common/AideddSearchButton';
import ListItem from '../common/ListItem';
import TextField from '../fields/TextField';
import Checkbox from '../fields/Checkbox';
import SelectField from '../fields/SelectField';
import CombatIncludeToggle from '../fields/CombatIncludeToggle';
import TextAreaField from '../fields/TextAreaField';
import FoldButton from '../fields/FoldButton';
import ListFoldControls from '../common/ListFoldControls';
import ListOrderItem from '../common/ListOrderItem';
import { CLASS_FEATURES, CLASS_FEATURES_USED } from '../../data/sheetLists';
import { useListRows } from '../../hooks/useListRows';
import { useListFolding } from '../../hooks/useListFolding';
import { useSheet, useSheetFlag } from '../../context/SheetContext';
import { range } from '../../utils/range';

export default function ClassFeaturesPanel() {
  const { data } = useSheet();
  const {
    rowCount,
    removable,
    isRowEmpty,
    addRow,
    removeRow,
    isOrdering,
    order,
    startOrdering,
    cancelOrdering,
    saveOrdering,
    moveRow,
  } = useListRows(CLASS_FEATURES);
  const { foldedCount, foldAll, unfoldAll } = useListFolding(CLASS_FEATURES, rowCount);

  return (
    <Panel id="capacites" title="Capacités de Classe">
      <ListFoldControls
        foldedCount={foldedCount}
        rowCount={rowCount}
        foldAll={foldAll}
        unfoldAll={unfoldAll}
        isOrdering={isOrdering}
        onStartOrdering={startOrdering}
        onSaveOrdering={saveOrdering}
        onCancelOrdering={cancelOrdering}
      />
      <ul className="capacite-list">
        {(isOrdering ? order : range(rowCount)).map((index, position) => (
          <ClassFeatureRow
            key={index}
            index={index}
            title={data[CLASS_FEATURES.field(index)]}
            isOrdering={isOrdering}
            position={position}
            rowCount={rowCount}
            moveRow={moveRow}
            removable={removable}
            isRowEmpty={isRowEmpty}
            removeRow={removeRow}
          />
        ))}
      </ul>
      {!isOrdering && <AddRowButton label="Ajouter une capacité" onClick={addRow} />}
    </Panel>
  );
}

function ClassFeatureRow({
  index,
  title,
  isOrdering,
  position,
  rowCount,
  moveRow,
  removable,
  isRowEmpty,
  removeRow,
}) {
  const [folded, setFolded] = useSheetFlag(CLASS_FEATURES.field(index, 'replie'));
  const [innate] = useSheetFlag(CLASS_FEATURES.field(index, 'innee'));
  const featureTypeField = CLASS_FEATURES.field(index, 'innee');
  if (isOrdering) {
    return (
      <ListOrderItem
        title={title}
        position={position}
        rowCount={rowCount}
        onMove={moveRow}
      />
    );
  }

  return (
    <ListItem
      className={
        folded ? 'folded' : undefined
      }
      bottomRight={(
        <CombatIncludeToggle
          name={CLASS_FEATURES.field(index, 'combat')}
          defaultField={CLASS_FEATURES.field(index)}
          ariaLabel={`Inclure capacité ${index + 1} dans le résumé de combat`}
        />
      )}
      remove={
        removable
          ? {
            label: `Supprimer la capacité ${index + 1}`,
            requiresConfirmation: !isRowEmpty(index),
            onClick: () => removeRow(index),
          }
          : undefined
      }
    >
      <div className="class-feature-title-line">
        <TextField name={CLASS_FEATURES.field(index)} placeholder="Titre" aria-label={`Titre de la capacité ${index + 1}`} />
        <SelectField
          name={featureTypeField}
          className="ef class-feature-type-select"
          fallback="false"
          aria-label={`Type de capacité ${index + 1}`}
          options={[
            { value: 'false', label: "🔋 Suivi d'usage" },
            { value: 'true', label: '✨ Innée' },
          ]}
        />
        <AideddSearchButton fieldName={CLASS_FEATURES.field(index)} />
        <FoldButton
          folded={folded}
          onToggle={() => setFolded(!folded)}
          label={folded ? `D\u00e9plier la capacit\u00e9 ${index + 1}` : `Replier la capacit\u00e9 ${index + 1}`}
        />
      </div>
      {!folded && (
        <>
          <TextAreaField name={CLASS_FEATURES.field(index, 'description')} placeholder="Description" aria-label={`Description de la capacité ${index + 1}`} />
          <div className="capacite-options">
            {!innate && (
              <>
                <label className="capacite-used">
                  <Checkbox name={CLASS_FEATURES_USED.field(index)} />
                  {' '}
                  Utilisée
                </label>
                <span>Réinitialiser après :</span>
                <label>
                  <Checkbox name={CLASS_FEATURES.field(index, 'repos_court')} />
                  {' '}
                  Repos court
                </label>
                <label>
                  <Checkbox name={CLASS_FEATURES.field(index, 'repos_long')} />
                  {' '}
                  Repos long
                </label>
              </>
            )}
          </div>
        </>
      )}
    </ListItem>
  );
}
