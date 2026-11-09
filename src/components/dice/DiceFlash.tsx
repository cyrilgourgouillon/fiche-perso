import { useState } from 'react';
import RollDice from './RollDice';
import { criticalOf } from '../../services/dice';
import { useDice } from '../../context/DiceContext';
import { useTumble } from '../../hooks/useTumble';

const CRITICAL_LABELS = {
  reussite: '✦ Critique ✦',
  echec: '☠ Échec critique',
};

/** Read by screen readers, invisible on screen. */
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * The latest roll, thrown up in the middle of the screen and faded away. Rolls
 * usually start from a bonus far from the tray, so the result comes to the player.
 */
export default function DiceFlash({ reduceMotion = false }) {
  const { lastRoll } = useDice();
  if (!lastRoll) return null;

  // remounting on the roll id is what replays the whole show for an equal result
  return <Toast key={lastRoll.id} roll={lastRoll} reduceMotion={reduceMotion} />;
}

function Toast({ roll, reduceMotion }) {
  const { face, settled } = useTumble(roll, reduceMotion);
  const [visible, setVisible] = useState(true);
  const critical = criticalOf(roll);
  const state = (settled && critical) || undefined;

  if (!visible) return null;

  return (
    <>
      {/* dims the sheet so the result carries the screen */}
      <div className="dice-backdrop" data-critique={state} aria-hidden="true" />
      <div
        className={settled ? 'dice-flash' : 'dice-flash tumbling'}
        data-critique={state}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setVisible(false);
        }}
      >
        {/* the flickering faces are decoration: assistive tech only hears the settled result below */}
        <div aria-hidden="true" style={{ display: 'contents' }}>
          <div className="dice-flash-label">{roll.label}</div>
          <div className="dice-flash-total">{settled ? roll.total : face}</div>
          <RollDice roll={roll} />
          {/* rendered from the start, so settling does not resize the card */}
          {critical && <div className="dice-flash-tag">{CRITICAL_LABELS[critical]}</div>}
        </div>
        <p role="status" style={VISUALLY_HIDDEN}>
          {settled ? `${roll.label} : ${roll.total}${critical ? `, ${CRITICAL_LABELS[critical]}` : ''}` : ''}
        </p>
      </div>
    </>
  );
}
