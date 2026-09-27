import { THEMES } from '../data/themes.js';

export default function Toolbar({ status, theme, onThemeChange, onLoad, onSave, onToggleCombatSummary, combatSummaryOpen }) {
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
      <label className="theme-picker">
        <span>Thème</span>
        <select value={theme} onChange={(event) => onThemeChange(event.target.value)}>
          {THEMES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
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
