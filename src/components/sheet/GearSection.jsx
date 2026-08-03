import EquipmentPanel from './EquipmentPanel.jsx';
import MoneyPanel from './MoneyPanel.jsx';
import Panel from './Panel.jsx';
import TextAreaField from '../fields/TextAreaField.jsx';

/** Appearance and coins share the left column so equipment gets a full one. */
export default function GearSection() {
  return (
    <section className="two-col">
      <div className="gear-column">
        <Panel as="div" className="panel appearance-panel" id="apparence" title="Apparence">
          <TextAreaField name="apparence" className="ef tall" />
        </Panel>
        <MoneyPanel />
      </div>
      <EquipmentPanel />
    </section>
  );
}
