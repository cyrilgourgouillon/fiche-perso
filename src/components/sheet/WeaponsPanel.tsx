import AddRowButton from '../fields/AddRowButton';
import CombatIncludeToggle from '../fields/CombatIncludeToggle';
import Panel from './Panel';
import ListItem from '../common/ListItem';
import TextAreaField from '../fields/TextAreaField';
import TextField from '../fields/TextField';
import { WEAPONS } from '../../data/sheetLists';
import { useListRows } from '../../hooks/useListRows';
import { range } from '../../utils/range';

export default function WeaponsPanel() {
  const {
    rowCount, removable, isRowEmpty, addRow, removeRow,
  } = useListRows(WEAPONS);

  return (
    <Panel id="armes" title="Armes">
      <p className="combat-include-help">Cochez &quot;R&eacute;sum&eacute; combat&quot; pour ajouter une arme au r&eacute;sum&eacute; de combat.</p>
      <ul className="capacite-list weapon-list">
        {range(rowCount).map((index) => (
          <ListItem
            key={index}
            contentClassName="capacite-content weapon-content"
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
                aria-label={`Nom de l&apos;arme ${index + 1}`}
              />
              <CombatIncludeToggle
                name={WEAPONS.field(index, 'combat')}
                defaultField={WEAPONS.field(index, 'nom')}
                ariaLabel={`Inclure arme ${index + 1} dans le r\u00e9sum\u00e9 de combat`}
              />
            </div>

            <div className="weapon-facts">
              <div>
                <label htmlFor={`weapon-bonus-${index + 1}`}>Bonus d&apos;attaque</label>
                <TextField
                  id={`weapon-bonus-${index + 1}`}
                  name={WEAPONS.field(index, 'bonus')}
                  className="ef"
                  aria-label={`Bonus d'attaque de l'arme ${index + 1}`}
                />
              </div>
              <div>
                <label htmlFor={`weapon-damage-${index + 1}`}>D&eacute;g&acirc;ts et type</label>
                <TextField
                  id={`weapon-damage-${index + 1}`}
                  name={WEAPONS.field(index, 'degats')}
                  className="ef"
                  aria-label={`D\u00e9g\u00e2ts et type de l'arme ${index + 1}`}
                />
              </div>
            </div>

            <div className="weapon-notes-field">
              <label htmlFor={`weapon-notes-${index + 1}`}>Notes</label>
              <TextAreaField
                id={`weapon-notes-${index + 1}`}
                name={WEAPONS.field(index, 'notes')}
                className="ef weapon-notes-input"
                placeholder="Port&eacute;e, propri&eacute;t&eacute;, d&eacute;tails..."
                aria-label={`Notes de l'arme ${index + 1}`}
              />
            </div>
          </ListItem>
        ))}
      </ul>
      <AddRowButton label="Ajouter une arme" onClick={addRow} />
    </Panel>
  );
}
