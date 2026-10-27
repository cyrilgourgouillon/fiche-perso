import Modal from '../Modal.jsx';
import { useArmedAction } from '../../hooks/useArmedAction.js';

function LinkFileButton({ status, fileName, link, reconnect, unlink }) {
  const { armed, trigger, disarm } = useArmedAction(unlink);

  if (status === 'none') {
    return (
      <button type="button" className="sheet-button file-action-button" onClick={link} title="Lire et écrire la fiche directement dans un fichier JSON">
        <span aria-hidden="true">🔗</span> Lier un fichier
      </button>
    );
  }
  if (status === 'reconnect') {
    return (
      <button type="button" className="sheet-button file-action-button" onClick={reconnect} title={`Redonner l’accès à ${fileName}`}>
        <span aria-hidden="true">🔗</span> Reconnecter
      </button>
    );
  }
  return (
    <button
      type="button"
      className="sheet-button file-action-button"
      onClick={trigger}
      onBlur={disarm}
      onMouseLeave={disarm}
      title={armed ? `Confirmer : délier ${fileName}` : `Fiche liée à ${fileName} — cliquer pour délier`}
    >
      <span aria-hidden="true">🔗</span> {armed ? 'Confirmer ?' : 'Délier'}
    </button>
  );
}

export default function FileActionsPanel({ open, onToggle, onLoad, onSave, linkedFile }) {
  return (
    <div className="file-actions-widget">
      <button
        type="button"
        className="sheet-tools-launcher file-actions-launcher"
        aria-expanded={open}
        aria-controls="file-actions-dialog"
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 3.75h8l4 4v12.5H6z" />
          <path d="M14 3.75v4h4M9 13h6M9 16.5h6" />
        </svg>
        <span>Fichier</span>
      </button>
      <Modal
        id="file-actions-dialog"
        open={open}
        onClose={onToggle}
        title="Fichier"
        eyebrow="Chroniques"
        closeLabel="Fermer le menu Fichier"
        className="app-modal--file"
      >
        <section className="file-actions-panel" aria-label="Actions sur le fichier">
          <div id="file-actions-content" className="file-actions-content">
              {linkedFile.available && (
                <section className="file-actions-group" aria-labelledby="file-link-heading">
                  <div className="file-actions-group-copy">
                    <h3 id="file-link-heading" className="file-actions-group-title">Liaison automatique</h3>
                    <p className="file-actions-group-description">
                      Enregistre automatiquement les modifications de la fiche et recharge celles faites dans le fichier.
                    </p>
                  </div>
                  <div className="file-actions-buttons file-actions-link-buttons">
                    <LinkFileButton {...linkedFile} />
                  </div>
                </section>
              )}
              <section className="file-actions-group" aria-labelledby="file-transfer-heading">
                <div className="file-actions-group-copy">
                  <h3 id="file-transfer-heading" className="file-actions-group-title">Import et export</h3>
                  <p className="file-actions-group-description">
                    Charger remplace la fiche avec un fichier JSON ; sauvegarder en télécharge une copie.
                  </p>
                </div>
                <div className="file-actions-buttons">
                  <button type="button" className="sheet-button file-action-button" onClick={onLoad}>
                    <span aria-hidden="true">↥</span> Charger
                  </button>
                  <button type="button" className="sheet-button file-action-button file-action-save" onClick={onSave}>
                    <span aria-hidden="true">↓</span> Sauvegarder
                  </button>
                </div>
              </section>
          </div>
        </section>
      </Modal>
    </div>
  );
}