import { formatModifier } from '../../services/characterMath';

/**
 * The dice that fell, with the one advantage discarded struck through, then the bonus.
 * With two equal dice one of them is still the discarded one.
 */
export default function RollDice({ roll }) {
  const keptIndex = roll.dice.length > roll.kept.length ? roll.dice.indexOf(roll.kept[0]) : -1;

  return (
    <span className="roll-detail">
      {roll.dice.map((die, index) => (
        <span key={index} className={keptIndex >= 0 && index !== keptIndex ? 'roll-die dropped' : 'roll-die'}>
          {die}
        </span>
      ))}
      {roll.modifier !== 0 && <span className="roll-modifier">{formatModifier(roll.modifier)}</span>}
    </span>
  );
}
