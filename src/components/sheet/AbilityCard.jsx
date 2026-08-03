import Checkbox from '../fields/Checkbox.jsx';
import RollButton from '../dice/RollButton.jsx';
import TextField from '../fields/TextField.jsx';
import { abilityModifier, formatModifier, savingThrowBonus } from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';

export default function AbilityCard({ ability }) {
  const { data } = useSheet();
  const modifier = abilityModifier(data[ability.key]);
  const save = savingThrowBonus(data, ability.key);

  return (
    <div className="stat-card">
      <div className="stat-name">
        <span>{ability.label}</span>
        <RollButton label={ability.label} bonus={modifier} />
      </div>
      <div className="stat-mod">{formatModifier(modifier)}</div>
      <TextField name={ability.key} className="ef center stat-val" />
      <div className="saves-list">
        <div className="save-item">
          <Checkbox name={`save_${ability.key}`} />
          <span className="save-val">{formatModifier(save)}</span>
          Sauvegarde
          <RollButton label={`${ability.label} · Sauvegarde`} bonus={save} />
        </div>
      </div>
    </div>
  );
}
