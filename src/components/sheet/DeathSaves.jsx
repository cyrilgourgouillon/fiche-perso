import Checkbox from '../fields/Checkbox.jsx';

const DEATH_SAVE_BOXES = 3;

const DEATH_SAVE_GROUPS = [
  { label: 'Succès', name: 'mort_succes', tone: 'success' },
  { label: 'Échecs', name: 'mort_echecs', tone: 'failure' },
];

export default function DeathSaves() {
  return (
    <div className="death-row">
      {DEATH_SAVE_GROUPS.map(({ label, name, tone }) => (
        <div className="death-group" key={name}>
          <div className={`death-label ${tone}`}>{label}</div>
          <div className="death-boxes">
            {Array.from({ length: DEATH_SAVE_BOXES }, (_, index) => (
              <Checkbox key={index} name={`${name}_${index + 1}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
