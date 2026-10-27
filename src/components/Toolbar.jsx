import { useArmedAction } from '../hooks/useArmedAction.js';

function LinkFileButton({ status, fileName, link, reconnect, unlink }) {
  const { armed, trigger, disarm } = useArmedAction(unlink);

  if (status === 'none') {
    return (
      <button id="btn-link" type="button" onClick={link} title="Lire et écrire la fiche directement dans un fichier JSON">
        <span aria-hidden="true">🔗</span> Lier un fichier
      </button>
    );
  }
  if (status === 'reconnect') {
    return (
      <button id="btn-link" type="button" onClick={reconnect} title={`Redonner l’accès à ${fileName}`}>
        <span aria-hidden="true">🔗</span> Reconnecter
      </button>
    );
  }
  return (
    <button
      id="btn-link"
      type="button"
      onClick={trigger}
      onBlur={disarm}
      onMouseLeave={disarm}
      title={armed ? `Confirmer : délier ${fileName}` : `Fiche liée à ${fileName} — cliquer pour délier`}
    >
      <span aria-hidden="true">🔗</span> {armed ? 'Confirmer ?' : 'Délier'}
    </button>
  );
}

export default function Toolbar({
  status,
  onLoad,
  onSave,
  onOpenSettings,
  onToggleCombatSummary,
  combatSummaryOpen,
  linkedFile,
}) {
  return (
    <header id="toolbar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">✦</span>
        <h1>
          <span>Chroniques</span>
          Fiche de personnage
        </h1>
      </div>
      <span id="save-status" className={status ? 'show' : undefined} role="status">
        {status}
      </span>
      <button id="btn-settings" type="button" onClick={onOpenSettings}>
        <span aria-hidden="true">⚙</span> Paramètres
      </button>
      <button id="btn-combat" type="button" onClick={onToggleCombatSummary}>
        <span aria-hidden="true">{combatSummaryOpen ? '↩' : '⚔'}</span>
        {combatSummaryOpen ? 'Fiche' : 'Résumé'}
      </button>
      {linkedFile.available && <LinkFileButton {...linkedFile} />}
      <button id="btn-load" type="button" onClick={onLoad}>
        <span aria-hidden="true">↥</span> Charger
      </button>
      <button id="btn-save" type="button" onClick={onSave}>
        <span aria-hidden="true">↓</span> Sauvegarder
      </button>
    </header>
  );
}
