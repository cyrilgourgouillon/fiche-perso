import AddRowButton from '../fields/AddRowButton';
import CombatIncludeToggle from '../fields/CombatIncludeToggle';
import Panel from './Panel';
import AideddSearchButton from '../common/AideddSearchButton';
import ListItem from '../common/ListItem';
import TextAreaField from '../fields/TextAreaField';
import TextField from '../fields/TextField';
import Checkbox from '../fields/Checkbox';
import SelectField from '../fields/SelectField';
import WeaponRollButton from '../dice/WeaponRollButton';
import FoldButton from '../fields/FoldButton';
import ListFoldControls from '../common/ListFoldControls';
import { WEAPONS } from '../../data/sheetLists';
import { useSheet, useSheetFlag } from '../../context/SheetContext';
import { useListRows } from '../../hooks/useListRows';
import { useListFolding } from '../../hooks/useListFolding';
import { range } from '../../utils/range';
import {
  legacyWeaponDamage,
  weaponAttackBonus,
  weaponDetails,
} from '../../services/weaponMath';
import { formatModifier } from '../../services/characterMath';
import { ABILITIES } from '../../data/abilities';

const WEAPON_ABILITY_OPTIONS = [
  { value: '', label: 'Aucune' },
  ...ABILITIES.map(({ key, label }) => ({
    value: key,
    label: label.replace(/^\S+\s*/, ''),
  })),
];

export default function WeaponsPanel() {
  const { data } = useSheet();
  const {
    rowCount, removable, isRowEmpty, addRow, removeRow,
  } = useListRows(WEAPONS);
  const { foldedCount, foldAll, unfoldAll } = useListFolding(WEAPONS, rowCount);

  return (
    <Panel id="armes" title="Armes">
      <p className="combat-include-help">Cochez &quot;R&eacute;sum&eacute; combat&quot; pour ajouter une arme au r&eacute;sum&eacute; de combat.</p>
      <ListFoldControls foldedCount={foldedCount} rowCount={rowCount} foldAll={foldAll} unfoldAll={unfoldAll} />
      <ul className={`capacite-list weapon-list${data.compact_weapons === 'true' ? ' compact-list' : ''}`}>
        {range(rowCount).map((index) => (
          <WeaponRow
            key={index}
            index={index}
            removable={removable}
            isRowEmpty={isRowEmpty}
            removeRow={removeRow}
          />
        ))}
      </ul>
      <AddRowButton label="Ajouter une arme" onClick={addRow} />
    </Panel>
  );
}

function WeaponRow({
  index, removable, isRowEmpty, removeRow,
}) {
  const { data, update } = useSheet();
  const [folded, setFolded] = useSheetFlag(WEAPONS.field(index, 'replie'));
  const weapon = weaponDetails(data, index);
  const updateDamage = (field, value) => {
    const next = {
      damageDice: field === 'degats_de' ? value : weapon.damageDice,
      damageType: field === 'type_degats' ? value : weapon.damageType,
    };
    update(WEAPONS.field(index, field), value);
    update(WEAPONS.field(index, 'degats'), legacyWeaponDamage(next.damageDice, next.damageType));
  };
  return (
    <ListItem
      className={
        folded ? 'folded' : undefined
      }
      contentClassName="capacite-content weapon-content"
      bottomRight={(
        <CombatIncludeToggle
          name={WEAPONS.field(index, 'combat')}
          defaultField={WEAPONS.field(index, 'nom')}
          ariaLabel={`Inclure arme ${index + 1} dans le résumé de combat`}
        />
      )}
      remove={
        removable
          ? {
            label: `Supprimer l'arme ${index + 1}`,
            requiresConfirmation: !isRowEmpty(index),
            onClick: () => removeRow(index),
          }
          : undefined
      }
    >
      <div className="weapon-title-line">
        <TextField
          name={WEAPONS.field(index, 'nom')}
          className="ef spell-name"
          placeholder="Nom de l'arme"
          aria-label={`Nom de l’arme ${index + 1}`}
        />
        <AideddSearchButton fieldName={WEAPONS.field(index, 'nom')} />
        <WeaponRollButton row={index} />
        <FoldButton
          folded={folded}
          onToggle={() => setFolded(!folded)}
          label={folded ? `D\u00e9plier l'arme ${index + 1}` : `Replier l'arme ${index + 1}`}
        />
      </div>

      {!folded && (
        <div className="weapon-facts">
          <div>
            <label htmlFor={`weapon-dice-${index + 1}`}>Dé</label>
            <TextField
              id={`weapon-dice-${index + 1}`}
              name={WEAPONS.field(index, 'degats_de')}
              className="ef"
              value={weapon.damageDice}
              placeholder="2d8"
              aria-label={`Dé de dégâts de l'arme ${index + 1}`}
              onChange={(event) => updateDamage('degats_de', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`weapon-type-${index + 1}`}>Type</label>
            <TextField
              id={`weapon-type-${index + 1}`}
              name={WEAPONS.field(index, 'type_degats')}
              className="ef"
              value={weapon.damageType}
              placeholder="Type"
              aria-label={`Type de dégâts de l'arme ${index + 1}`}
              onChange={(event) => updateDamage('type_degats', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`weapon-ability-${index + 1}`}>Carac.</label>
            <SelectField
              id={`weapon-ability-${index + 1}`}
              name={WEAPONS.field(index, 'caracteristique')}
              className="ef"
              options={WEAPON_ABILITY_OPTIONS}
              aria-label={`Caractéristique d'attaque de l'arme ${index + 1}`}
            />
          </div>
          <div>
            <label htmlFor={`weapon-bonus-${index + 1}`}>Bonus</label>
            <TextField
              id={`weapon-bonus-${index + 1}`}
              name={WEAPONS.field(index, 'bonus')}
              className="ef"
              inputMode="numeric"
              placeholder="0"
              aria-label={`Bonus d'attaque de l'arme ${index + 1}`}
            />
          </div>
          <div className="weapon-proficiency-field">
            <div>
              <label htmlFor={`weapon-proficient-${index + 1}`}>Maîtrise</label>
              <Checkbox
                id={`weapon-proficient-${index + 1}`}
                name={WEAPONS.field(index, 'maitrise')}
                aria-label={`Maîtrisé : ${weapon.name || `arme ${index + 1}`}`}
              />
              <strong>{`Total ${formatModifier(weaponAttackBonus(data, index))}`}</strong>
            </div>
          </div>
        </div>
      )}
      {!folded && (
        <div className="weapon-notes-row">
          <label htmlFor={`weapon-notes-${index + 1}`}>Notes et propriétés</label>
          <TextAreaField
            id={`weapon-notes-${index + 1}`}
            name={WEAPONS.field(index, 'notes')}
            className="ef weapon-notes-input"
            placeholder="Portée, propriétés, détails..."
            aria-label={`Notes et propriétés de l'arme ${index + 1}`}
          />
        </div>
      )}
    </ListItem>
  );
}
