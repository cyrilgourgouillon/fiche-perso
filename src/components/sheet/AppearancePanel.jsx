import TextAreaField from '../fields/TextAreaField.jsx';
import AvatarEditor from './AvatarEditor.jsx';

export default function AppearancePanel({ open, onToggle }) {

  return (
    <div className="appearance-widget">
        <button
          type="button"
          className="sheet-tools-launcher appearance-launcher"
          aria-expanded={open}
          aria-controls="appearance-panel-content"
          onClick={onToggle}
        >
          <svg className="appearance-launcher-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2 14.6 9.4 22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" /></svg>
          <span>Apparence</span>
        </button>
      {open && (
        <section className="panel appearance-panel" aria-labelledby="appearance-panel-toggle">
          <h2 className="section-heading">
            <button
              type="button"
              id="appearance-panel-toggle"
              className="section-title"
              aria-expanded="true"
              aria-controls="appearance-panel-content"
              onClick={onToggle}
            >
              Apparence
              <span className="fold-caret" aria-hidden="true" />
            </button>
          </h2>
          <div id="appearance-panel-content" className="appearance-panel-content">
            <AvatarEditor />
            <TextAreaField name="apparence" className="ef tall" placeholder="Décrivez l’apparence de votre personnage…" />
          </div>
        </section>
      )}
    </div>
  );
}
