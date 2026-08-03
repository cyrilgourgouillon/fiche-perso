import { THEMES } from '../data/themes.js';

export default function Toolbar({ status, theme, onThemeChange, onLoad, onSave }) {
  return (
    <div id="toolbar">
      <h1>⚔ Fiche de Personnage</h1>
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
      <button id="btn-load" onClick={onLoad}>
        📂 Charger
      </button>
      <button id="btn-save" onClick={onSave}>
        💾 Sauvegarder
      </button>
    </div>
  );
}
