import { KEYBOARD_SHORTCUTS } from '../../data/keyboardShortcuts.js';
import Modal from '../Modal.jsx';

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
      <Modal
        id="keyboard-shortcuts-dialog"
        open={open}
        onClose={onClose}
        eyebrow="Guide rapide"
        title="Raccourcis clavier"
        closeLabel="Fermer les raccourcis"
        className="app-modal--shortcuts"
      >
            <ul className="keyboard-shortcut-list">
              {KEYBOARD_SHORTCUTS.map(({ key, action }) => (
                <li key={key}>
                  <span>{action}</span>
                  <kbd>{key}</kbd>
                </li>
              ))}
            </ul>
            <p className="shortcuts-note">Les raccourcis lettre, / et ? sont inactifs pendant la saisie. Ctrl / ⌘ + K et Ctrl / ⌘ + &gt; restent actifs.</p>
      </Modal>
    </>
  );
}
