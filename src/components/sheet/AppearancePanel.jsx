import Panel from './Panel.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';
import AvatarEditor from './AvatarEditor.jsx';

export default function AppearancePanel() {
  return (
    <Panel as="div" className="panel appearance-panel" id="apparence" title="Apparence">
      <AvatarEditor />
      <TextAreaField name="apparence" className="ef tall" />
    </Panel>
  );
}
