import AddRowButton from '../fields/AddRowButton';
import Panel from './Panel';
import RemoveRowButton from '../fields/RemoveRowButton';
import TextAreaField from '../fields/TextAreaField';
import TextField from '../fields/TextField';
import { INVENTORY, MAGIC_ITEMS } from '../../data/sheetLists';
import { useListRows } from '../../hooks/useListRows';
import { useSheet } from '../../context/SheetContext';
import { listRowCount, withRowAdded } from '../../services/sheetRows';
import { range } from '../../utils/range';

export default function EquipmentPanel() {
  const { data, update, apply } = useSheet();
  const inventory = useListRows(INVENTORY);
  const magicItems = useListRows(MAGIC_ITEMS);

  const addInventoryItem = () => apply((current) => {
    const row = listRowCount(current, INVENTORY);
    return {
      ...withRowAdded(current, INVENTORY),
      [INVENTORY.field(row, 'quantite')]: '1',
    };
  });

  return (
    <Panel as="div" className="panel equipment-panel" id="equipement" title="Inventaire & Équipement">
      <div className="inventory-list" role="table" aria-label="Inventaire">
        <div className="inventory-row inventory-header" role="row">
          <span role="columnheader">Nom de l’objet</span>
          <span role="columnheader">Quantité</span>
          <span role="columnheader">Actions</span>
        </div>
        {range(inventory.rowCount).map((index) => {
          const quantity = Math.max(0, Number.parseInt(data[INVENTORY.field(index, 'quantite')], 10) || 0);
          const itemName = data[INVENTORY.field(index, 'nom')] || `Objet ${index + 1}`;
          return (
            <div className="inventory-row" role="row" key={index}>
              <div role="cell">
                <TextField
                  name={INVENTORY.field(index, 'nom')}
                  className="ef inventory-name"
                  placeholder={`Objet ${index + 1}`}
                  aria-label={`Nom de l’objet ${index + 1}`}
                />
              </div>
              <output className="inventory-quantity" role="cell" aria-live="polite">
                {quantity}
              </output>
              <div className="inventory-actions" role="cell">
                <button
                  type="button"
                  className="inventory-quantity-button"
                  aria-label={`Réduire la quantité de ${itemName}`}
                  disabled={quantity === 0}
                  onClick={() => update(INVENTORY.field(index, 'quantite'), String(quantity - 1))}
                >
                  −
                </button>
                <button
                  type="button"
                  className="inventory-quantity-button"
                  aria-label={`Augmenter la quantité de ${itemName}`}
                  onClick={() => update(INVENTORY.field(index, 'quantite'), String(quantity + 1))}
                >
                  +
                </button>
                {inventory.removable && (
                  <RemoveRowButton
                    label={`Supprimer ${itemName}`}
                    confirm={!inventory.isRowEmpty(index)}
                    onClick={() => inventory.removeRow(index)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <AddRowButton label="Ajouter un objet" onClick={addInventoryItem} />

      <div className="equipment-notes">
        <div className="meta-label">Notes complémentaires</div>
        <TextAreaField name="equipement" className="ef tall" placeholder="Détails, poids ou emplacement…" />
      </div>

      <div className="magic-items">
        <div className="meta-label">Liens magiques</div>
        {range(magicItems.rowCount).map((index) => (
          <div className="magic-item-row" key={index}>
            <TextField name={MAGIC_ITEMS.field(index)} placeholder={`Lien ${index + 1}`} />
            {magicItems.removable && (
              <RemoveRowButton
                label={`Supprimer le lien ${index + 1}`}
                confirm={!magicItems.isRowEmpty(index)}
                onClick={() => magicItems.removeRow(index)}
              />
            )}
          </div>
        ))}
        <AddRowButton label="Ajouter un lien magique" onClick={magicItems.addRow} />
      </div>
    </Panel>
  );
}
