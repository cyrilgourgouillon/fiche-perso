import TextAreaField from '../fields/TextAreaField.jsx';
import AvatarEditor from './AvatarEditor.jsx';
import Modal from '../Modal.jsx';

export default function AppearancePanel({ open, onToggle }) {

  return (
    <div className="appearance-widget">
        <button
          type="button"
          className="sheet-tools-launcher appearance-launcher"
          aria-expanded={open}
          aria-controls="appearance-panel-dialog"
          onClick={onToggle}
        >
          <svg className="appearance-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2 14.6 9.4 22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" /></svg>
          <span>Apparence</span>
        </button>
      <Modal
        id="appearance-panel-dialog"
        open={open}
        onClose={onToggle}
        presentation="popup"
        eyebrow="Personnage"
        title="Apparence"
        closeLabel="Fermer l’apparence"
        className="app-modal-popup--appearance"
      >
        <section className="appearance-panel-content" id="appearance-panel-content">
            <AvatarEditor />
            <TextAreaField name="apparence" className="ef tall" placeholder="Décrivez l’apparence de votre personnage…" />
        </section>
      </Modal>
    </div>
  );
}
