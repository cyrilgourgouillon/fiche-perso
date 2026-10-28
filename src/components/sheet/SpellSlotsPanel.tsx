import Checkbox from '../fields/Checkbox';
import Panel from './Panel';
import { useSheet } from '../../context/SheetContext';
import {
  PACT_MAGIC_FIELD, spellSlotField, spellSlotOverrideField, spellSlotRows, usesPactMagic,
} from '../../services/spellSlots';
import { range } from '../../utils/range';

export default function SpellSlotsPanel() {
  const { data, update } = useSheet();
  const pactMagic = usesPactMagic(data);
  return (
    <Panel id="emplacements_sorts" title="Emplacements de sorts">
      <label className="spell-slots-pact">
        <Checkbox name={PACT_MAGIC_FIELD} />
        Utiliser la magie de pacte
      </label>
      <p className="spell-slots-help">
        {pactMagic
          ? 'Magie de pacte : tous les emplacements sont du niveau du pacte et reviennent au repos court. '
          : 'Progression de lanceur complet par défaut. '}
        Ajustez le nombre d’emplacements par niveau si nécessaire ; laissez vide pour revenir à la valeur par défaut.
        {' '}
        Cochez un emplacement lorsqu’il est dépensé.
      </p>
      <div className="spell-slots">
        {spellSlotRows(data).map(({
          spellLevel, total, defaultTotal, spent,
        }) => (
          <div className="slot-row" key={spellLevel}>
            <div className="slot-label">
              <label htmlFor={spellSlotOverrideField(spellLevel)}>
                Niveau
                {spellLevel}
              </label>
              <span>
                Dépensés :
                {' '}
                {spent}
                /
                {total}
              </span>
            </div>
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
