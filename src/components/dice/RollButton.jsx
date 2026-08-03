import DieIcon from './DieIcon.jsx';
import { ROLL_MODES } from '../../data/diceTypes.js';
import { useDice } from '../../context/DiceContext.js';

const modeName = (mode) => ROLL_MODES.find((entry) => entry.value === mode)?.label.toLowerCase();

/**
 * The visible "roll this" affordance next to a computed bonus. The bonus itself
 * stays plain text — this button is what you click. Its colour tells you which
 * mode the d20 will be thrown in.
 */
export default function RollButton({ label, bonus }) {
  const { roll, mode } = useDice();
  const title = `Lancer ${label} (${modeName(mode)})`;

  return (
    <button
      type="button"
      className="roll-button"
      data-mode={mode}
      title={title}
      aria-label={title}
      onClick={() => roll(label, bonus)}
    >
      <DieIcon />
    </button>
  );
}
