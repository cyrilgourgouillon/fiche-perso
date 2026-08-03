import { formatModifier } from '../../services/characterMath.js';

/** The dice that fell, with the one advantage discarded struck through, then the bonus. */
export default function RollDice({ roll }) {
  const dropped = roll.dice.length > roll.kept.length;

  return (
    <span className="roll-detail">
      {roll.dice.map((die, index) => (
        <span key={index} className={dropped && die !== roll.kept[0] ? 'roll-die dropped' : 'roll-die'}>
          {die}
        </span>
      ))}
      {roll.modifier !== 0 && <span className="roll-modifier">{formatModifier(roll.modifier)}</span>}
    </span>
  );
}
