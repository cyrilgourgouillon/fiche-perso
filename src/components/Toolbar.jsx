export default function Toolbar({ status, onLoad, onSave, onOpenSettings, onToggleCombatSummary, combatSummaryOpen }) {
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
      <button id="btn-load" type="button" onClick={onLoad}>
        <span aria-hidden="true">↥</span> Charger
      </button>
      <button id="btn-save" type="button" onClick={onSave}>
        <span aria-hidden="true">↓</span> Sauvegarder
      </button>
    </header>
  );
}
