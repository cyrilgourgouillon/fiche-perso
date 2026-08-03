import FoldButton from '../fields/FoldButton.jsx';
import LabeledField from '../fields/LabeledField.jsx';
import SelectField from '../fields/SelectField.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';
import { QUESTS } from '../../data/sheetLists.js';
import { QUEST_STATUSES } from '../../data/questStatuses.js';
import { useSheetField, useSheetFlag } from '../../context/SheetContext.js';

/**
 * One quest. Finished quests are folded rather than deleted — the title, the
 * status and every note stay in the sheet, just out of the way.
 */
export default function QuestCard({ index }) {
  const field = (name) => QUESTS.field(index, name);
  const [status] = useSheetField(field('statut'));
  const [folded, setFolded] = useSheetFlag(field('replie'));

  return (
    <article
      className={folded ? 'quest-card folded' : 'quest-card'}
      data-statut={status || undefined}
    >
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
            className="ef short"
            placeholder="Ce que le PNJ demande…"
          />
          <div className="meta-label">🖊️ Notes</div>
          <TextAreaField
            name={field('notes')}
            className="ef short"
            placeholder="Indices, PNJ rencontrés, pistes…"
          />
        </>
      )}
    </article>
  );
}
