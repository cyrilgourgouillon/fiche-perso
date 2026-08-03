import Panel from './Panel.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';

export default function NotesPanel() {
  return (
    <Panel id="notes" title="Notes" className="panel notes-panel">
      <TextAreaField name="notes" className="ef notes-textarea" placeholder="Ajoutez vos notes ici..." />
    </Panel>
  );
}
