import Checkbox from '../fields/Checkbox.jsx';

const DEATH_SAVE_BOXES = 3;

const DEATH_SAVE_GROUPS = [
  { label: 'Succès', name: 'mort_succes', tone: 'success', hint: '3 pour stabiliser' },
  { label: 'Échecs', name: 'mort_echecs', tone: 'failure', hint: '3 pour mourir' },
];

export default function DeathSaves() {
  return (
    <div className="death-row" role="group" aria-label="Jets de sauvegarde contre la mort">
      {DEATH_SAVE_GROUPS.map(({ label, name, tone, hint }) => (
        <div className={`death-group ${tone}`} key={name}>
          <div className="death-group-heading">
            <div className={`death-label ${tone}`}>{label}</div>
            <span className="death-hint">{hint}</span>
          </div>
          <div className="death-boxes" role="group" aria-label={label}>
            {Array.from({ length: DEATH_SAVE_BOXES }, (_, index) => (
              <label className="death-mark" key={index}>
                <Checkbox name={`${name}_${index + 1}`} aria-label={`${label} ${index + 1}`} />
                <span>{index + 1}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
