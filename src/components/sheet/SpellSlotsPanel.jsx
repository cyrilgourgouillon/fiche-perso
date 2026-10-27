import Checkbox from '../fields/Checkbox.jsx';
import Panel from './Panel.jsx';
import { useSheet } from '../../context/SheetContext.js';
import { spellSlotField, spellSlotOverrideField, spellSlotRows, usesPactMagic } from '../../services/spellSlots.js';
import { range } from '../../utils/range.js';

export default function SpellSlotsPanel() {
  const { data, update } = useSheet();
  const pactMagic = usesPactMagic(data);
  return (
    <Panel id="emplacements_sorts" title="Emplacements de sorts">
      <p className="spell-slots-help">
        {pactMagic
          ? 'Magie de pacte : tous les emplacements sont du niveau du pacte et reviennent au repos court. '
          : 'Progression de lanceur complet par défaut. '}
        {!pactMagic && (
          <>Ajustez le nombre d’emplacements par niveau pour les autres classes ; laissez vide pour revenir à la valeur par défaut. </>
        )}
        Cochez un emplacement lorsqu’il est dépensé.
      </p>
      <div className="spell-slots">
        {spellSlotRows(data).map(({ spellLevel, total, defaultTotal, spent }) => (
          <div className="slot-row" key={spellLevel}>
            <div className="slot-label">
              <label htmlFor={pactMagic ? undefined : spellSlotOverrideField(spellLevel)}>Niveau {spellLevel}</label>
              <span>
                Dépensés : {spent}/{total}
              </span>
            </div>
            {!pactMagic && (
              <div className="slot-override">
                <label htmlFor={spellSlotOverrideField(spellLevel)}>Emplacements</label>
                <input
                  id={spellSlotOverrideField(spellLevel)}
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  inputMode="numeric"
                  placeholder={String(defaultTotal)}
                  value={data[spellSlotOverrideField(spellLevel)] ?? ''}
                  onChange={(event) => update(spellSlotOverrideField(spellLevel), event.target.value)}
                  aria-label={`Nombre d’emplacements de sorts de niveau ${spellLevel}`}
                />
                {data[spellSlotOverrideField(spellLevel)] !== undefined && data[spellSlotOverrideField(spellLevel)] !== '' && (
                  <button type="button" onClick={() => update(spellSlotOverrideField(spellLevel), '')}>
                    Défaut
                  </button>
                )}
              </div>
            )}
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
