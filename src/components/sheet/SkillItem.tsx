import Checkbox from '../fields/Checkbox';
import RollButton from '../dice/RollButton';
import TextField from '../fields/TextField';
import { formatModifier, skillBonus } from '../../services/characterMath';
import { useSheet } from '../../context/SheetContext';

const ABILITY_ABBREVIATION_LENGTH = 3;

export default function SkillItem({ skill }) {
  const { data } = useSheet();
  const bonus = skillBonus(data, skill);

  return (
    <div className="skill-item" data-skill={skill.key}>
      <Checkbox name={skill.key} />
      <span className="skill-bonus">{formatModifier(bonus)}</span>
      <span className="skill-name">{skill.label}</span>
      <TextField name={`${skill.key}_particularite`} className="skill-note" type="number" min="1" step="1" />
      <span className="skill-stat" data-ability={skill.ability}>{skill.ability.slice(0, ABILITY_ABBREVIATION_LENGTH).toUpperCase()}</span>
      <RollButton label={skill.label} bonus={bonus} />
    </div>
  );
}
