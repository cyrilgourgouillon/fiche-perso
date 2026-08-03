import RollDice from './RollDice.jsx';
import { criticalOf } from '../../services/dice.js';
import { useDice } from '../../context/DiceContext.js';
import { useTumble } from '../../hooks/useTumble.js';

const CRITICAL_LABELS = {
  reussite: '✦ Critique ✦',
  echec: '☠ Échec critique',
};

/**
 * The latest roll, thrown up in the middle of the screen and faded away. Rolls
 * usually start from a bonus far from the tray, so the result comes to the player.
 */
export default function DiceFlash() {
  const { lastRoll } = useDice();
  if (!lastRoll) return null;

  // remounting on the roll id is what replays the whole show for an equal result
  return <Toast key={lastRoll.id} roll={lastRoll} />;
}

function Toast({ roll }) {
  const { face, settled } = useTumble(roll);
  const critical = criticalOf(roll);
  const state = (settled && critical) || undefined;

  return (
    <>
      {/* dims the sheet so the result carries the screen */}
      <div className="dice-backdrop" data-critique={state} aria-hidden="true" />
      <div
        className={settled ? 'dice-flash' : 'dice-flash tumbling'}
        data-critique={state}
        role="status"
        aria-live="polite"
      >
        <div className="dice-flash-label">{roll.label}</div>
        <div className="dice-flash-total">{settled ? roll.total : face}</div>
        <RollDice roll={roll} />
        {/* rendered from the start, so settling does not resize the card */}
        {critical && <div className="dice-flash-tag">{CRITICAL_LABELS[critical]}</div>}
      </div>
    </>
  );
}
