import FoldButton from '../fields/FoldButton';
import LabeledField from '../fields/LabeledField';
import RemoveRowButton from '../fields/RemoveRowButton';
import SelectField from '../fields/SelectField';
import TextAreaField from '../fields/TextAreaField';
import { QUESTS } from '../../data/sheetLists';
import { QUEST_STATUSES } from '../../data/questStatuses';
import { useSheetField, useSheetFlag } from '../../context/SheetContext';

/**
 * One quest. Finished quests are folded rather than deleted — the title, the
 * status and every note stay in the sheet, just out of the way.
 */
export default function QuestCard({
  index, removable, isRowEmpty, removeRow,
}) {
  const field = (name) => QUESTS.field(index, name);
  const [status] = useSheetField(field('statut'));
  const [folded, setFolded] = useSheetFlag(field('replie'));

  return (
    <article
      className={folded ? 'quest-card folded' : 'quest-card'}
      data-statut={status || undefined}
    >
      {removable && (
        <RemoveRowButton
          label={`Supprimer la quête ${index + 1}`}
          confirm={!isRowEmpty(index)}
          onClick={() => removeRow(index)}
        />
      )}
      <div className="quest-head">
        <LabeledField label="📜 Titre" name={field('titre')} placeholder={`Quête ${index + 1}`} />
        <div>
          <div className="meta-label">⚑ Statut</div>
          <SelectField name={field('statut')} options={QUEST_STATUSES} />
        </div>
        <FoldButton
          folded={folded}
          onToggle={() => setFolded(!folded)}
          label={folded ? `Développer la quête ${index + 1}` : `Replier la quête ${index + 1}`}
        />
      </div>

      {!folded && (
        <>
          <div className="quest-meta">
            <LabeledField label="🧝 Donneur (PNJ)" name={field('pnj')} placeholder="—" />
            <LabeledField label="📍 Lieu" name={field('lieu')} placeholder="—" />
            <LabeledField label="💰 Récompense" name={field('recompense')} placeholder="—" />
          </div>
          <div className="meta-label">📖 Description</div>
          <TextAreaField
            name={field('description')}
            className="ef"
            placeholder="Ce que le PNJ demande…"
          />
          <div className="meta-label">🖊️ Notes</div>
          <TextAreaField
            name={field('notes')}
            className="ef"
            placeholder="Indices, PNJ rencontrés, pistes…"
          />
        </>
      )}
    </article>
  );
}
