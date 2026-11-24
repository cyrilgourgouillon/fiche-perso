import Modal from '../common/Modal';
import { useSheet } from '../../context/SheetContext';
import { useArmedAction } from '../../hooks/useArmedAction';
import { diffText } from '../../services/textDiff';

interface SheetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Vide';
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  const text = typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

function HistoryEntry({
  entry, rollback,
}) {
  const { armed, trigger, disarm } = useArmedAction(() => rollback(entry.id));

  return (
    <li className="history-entry">
      <div className="history-entry-heading">
        <span className="history-entry-title">{entry.label}</span>
        <time dateTime={new Date(entry.timestamp).toISOString()}>
          {new Date(entry.timestamp).toLocaleString('fr-FR')}
        </time>
      </div>
      <ul className="history-changes">
        {entry.changes.map(({
          field, before, after, beforePresent, afterPresent,
        }) => (
          <li key={field}>
            <strong>{field.replaceAll('_', ' ')}</strong>
            {typeof before === 'string' && typeof after === 'string' ? (
              <code className="history-text-diff">
                {diffText(before, after).map((segment, index) => (
                  <span className={`history-diff-${segment.type}`} key={`${segment.type}-${index}`}>
                    {segment.text}
                  </span>
                ))}
              </code>
            ) : (
              <>
                <span className={beforePresent ? 'history-value-removed' : 'history-value-empty'}>
                  {formatValue(before)}
                </span>
                <span aria-hidden="true">&rarr;</span>
                <span className={afterPresent ? 'history-value-added' : 'history-value-empty'}>
                  {formatValue(after)}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`history-rollback${armed ? ' armed' : ''}`}
        aria-label={armed
          ? `Confirmer le rollback à la version « ${entry.label} »`
          : `Rollback à la version « ${entry.label} »`}
        title={armed ? 'Confirmer le rollback' : 'Rollback à cette version'}
        onClick={trigger}
        onBlur={disarm}
        onMouseLeave={disarm}
      >
        {armed ? 'Confirmer ?' : 'Rollback à cette version'}
      </button>
    </li>
  );
}

export default function SheetHistoryModal({ isOpen, onClose }: SheetHistoryModalProps) {
  const { actionHistory, rollback } = useSheet();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historique des actions"
      eyebrow="Chroniques"
      closeLabel="Fermer l’historique"
      className="app-modal--history"
    >
      <p className="history-description">
        Les 10 derni&egrave;res actions sont gard&eacute;es en m&eacute;moire jusqu&rsquo;&agrave; la fermeture ou au rechargement de l&rsquo;application. Le rollback restaure la fiche &agrave; cette version et retire les actions plus r&eacute;centes.
      </p>
      {actionHistory.length ? (
        <ol className="history-list">
          {actionHistory.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} rollback={rollback} />
          ))}
        </ol>
      ) : (
        <p className="history-empty">Aucune modification dans l&rsquo;historique.</p>
      )}
    </Modal>
  );
}
