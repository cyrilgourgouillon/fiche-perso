import Checkbox from '../fields/Checkbox.jsx';
import RollButton from '../dice/RollButton.jsx';
import TextField from '../fields/TextField.jsx';
import { formatModifier, skillBonus } from '../../services/characterMath.js';
import { useSheet } from '../../context/SheetContext.js';

const ABILITY_ABBREVIATION_LENGTH = 3;

export default function SkillItem({ skill }) {
  const { data } = useSheet();
  const bonus = skillBonus(data, skill);

  return (
    <div className="skill-item">
      <Checkbox name={skill.key} />
      <span className="skill-bonus">{formatModifier(bonus)}</span>
      <span className="skill-name">{skill.label}</span>
      <TextField name={`${skill.key}_particularite`} className="skill-note" type="number" min="1" step="1" />
      <span className="skill-stat">({skill.ability.slice(0, ABILITY_ABBREVIATION_LENGTH)})</span>
      <RollButton label={skill.label} bonus={bonus} />
    </div>
  );
}
