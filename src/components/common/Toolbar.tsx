import FileActionsPanel from '../sheet/FileActionsPanel';

export default function Toolbar({
  onOpenSettings,
  onToggleCombatSummary,
  combatSummaryOpen,
  fileActions,
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
      {fileActions && <FileActionsPanel {...fileActions} />}
      <button id="btn-settings" type="button" onClick={onOpenSettings}>
        <span aria-hidden="true">⚙</span>
        {' '}
        Paramètres
      </button>
      <button id="btn-combat" type="button" onClick={onToggleCombatSummary}>
        <span aria-hidden="true">{combatSummaryOpen ? '↩' : '⚔'}</span>
        {combatSummaryOpen ? 'Fiche' : 'Résumé'}
      </button>
    </header>
  );
}
