import Checkbox from '../fields/Checkbox.jsx';
import Panel from './Panel.jsx';
import { useSheet } from '../../context/SheetContext.js';
import { spellSlotField, spellSlotRows } from '../../services/spellSlots.js';
import { range } from '../../utils/range.js';

export default function SpellSlotsPanel() {
  const { data } = useSheet();
  return (
    <Panel id="emplacements_sorts" title="Emplacements de sorts">
      <p className="spell-slots-help">
        D&amp;D 5e — lanceur de sorts complet. Cochez un emplacement lorsqu’il est dépensé ; ils se récupèrent après un
        repos long.
      </p>
      <div className="spell-slots">
        {spellSlotRows(data).map(({ spellLevel, total, spent }) => (
          <div className="slot-row" key={spellLevel}>
            <div className="slot-label">
              Niveau {spellLevel}{' '}
              <span>
                Dépensés : {spent}/{total}
              </span>
            </div>
            <div className="slot-boxes">
              {total ? (
                range(total).map((slotIndex) => (
                  <Checkbox
                    key={slotIndex}
                    name={spellSlotField(spellLevel, slotIndex)}
                    aria-label={`Emplacement de sort niveau ${spellLevel}`}
                  />
                ))
              ) : (
                <span className="slot-none">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
