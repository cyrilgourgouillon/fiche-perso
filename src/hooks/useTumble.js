import { useEffect, useState } from 'react';
import { TUMBLE_DELAYS_MS, randomTotalLike } from '../services/dice.js';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The suspense of a die bouncing on the table: the total flickers through
 * plausible values, slowing down, before it settles on the real one.
 *
 * Returns `{ face, settled }` — show `face` until `settled`, then the true total.
 */
export function useTumble(roll) {
  const skip = prefersReducedMotion();
  const [face, setFace] = useState(() => (skip ? roll.total : randomTotalLike(roll)));
  const [settled, setSettled] = useState(skip);

  useEffect(() => {
    if (skip) return undefined;

    let step = 0;
    let timer;
    const tick = () => {
      if (step >= TUMBLE_DELAYS_MS.length) {
        setSettled(true);
        return;
      }
      timer = window.setTimeout(() => {
        setFace(randomTotalLike(roll));
        step += 1;
        tick();
      }, TUMBLE_DELAYS_MS[step]);
    };
    tick();

    return () => window.clearTimeout(timer);
  }, [roll, skip]);

  return { face, settled };
}
