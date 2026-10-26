import { KEYBOARD_SHORTCUTS } from '../../data/keyboardShortcuts.js';
import { createPortal } from 'react-dom';

export default function ShortcutsHelp({ open, onToggle, onClose }) {
  return (
    <>
      <div className="shortcuts-widget">
        <button
          type="button"
          className="sheet-tools-launcher shortcuts-launcher"
          aria-expanded={open}
          aria-controls="keyboard-shortcuts-dialog"
          aria-label="Afficher les raccourcis clavier"
          onClick={onToggle}
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
      {open && createPortal(
        <div className="shortcuts-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <section
            id="keyboard-shortcuts-dialog"
            className="shortcuts-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <header className="shortcuts-heading">
              <div>
                <p>Guide rapide</p>
                <h2 id="shortcuts-title">Raccourcis clavier</h2>
              </div>
              <button type="button" className="shortcuts-close" aria-label="Fermer les raccourcis" onClick={onClose}>×</button>
            </header>
            <ul className="keyboard-shortcut-list">
              {KEYBOARD_SHORTCUTS.map(({ key, action }) => (
                <li key={key}>
                  <span>{action}</span>
                  <kbd>{key}</kbd>
                </li>
              ))}
            </ul>
            <p className="shortcuts-note">Les raccourcis lettre, / et ? sont inactifs pendant la saisie. Ctrl / ⌘ + K et Ctrl / ⌘ + &gt; restent actifs.</p>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
