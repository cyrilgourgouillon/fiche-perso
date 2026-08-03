import RollDice from './RollDice.jsx';
import { criticalOf } from '../../services/dice.js';

/** One line of the tray: what was rolled, which dice fell, and the total. */
export default function RollResult({ roll, compact = false }) {
  return (
    <div className={compact ? 'roll roll-compact' : 'roll'} data-critique={criticalOf(roll) || undefined}>
      <span className="roll-label">{roll.label}</span>
      <RollDice roll={roll} />
      <span className="roll-total">{roll.total}</span>
    </div>
  );
}
