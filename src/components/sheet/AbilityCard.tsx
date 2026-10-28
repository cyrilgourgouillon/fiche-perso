import Checkbox from '../fields/Checkbox';
import RollButton from '../dice/RollButton';
import TextField from '../fields/TextField';
import { abilityModifier, formatModifier, savingThrowBonus } from '../../services/characterMath';
import { useSheet } from '../../context/SheetContext';

export default function AbilityCard({ ability }) {
  const { data } = useSheet();
  const modifier = abilityModifier(data[ability.key]);
  const save = savingThrowBonus(data, ability.key);

  return (
    <div className="stat-card" data-ability={ability.key}>
      <div className="stat-name">
        <span>{ability.label}</span>
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
