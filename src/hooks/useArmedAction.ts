import { useCallback, useEffect, useRef, useState } from 'react';

const DISARM_AFTER_MS = 4000;

/**
 * Turns a destructive action into two clicks: the first arms it, the second runs it.
 *
 * The button disarms itself after a few seconds so an armed control never sits there
 * waiting for a stray tap — on a touch screen neither `blur` nor `mouseleave` fires,
 * so a timer is the only thing that can undo the arming.
 *
 * With `enabled: false` the action runs on the first click, for cases where there is
 * nothing to lose (removing an empty row).
 */
export function useArmedAction(action, { enabled = true, timeout = DISARM_AFTER_MS } = {}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(null);

  const disarm = useCallback(() => {
    clearTimeout(timer.current);
    setArmed(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const trigger = useCallback(() => {
    if (!enabled || armed) {
      disarm();
      action();
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), timeout);
    setArmed(true);
  }, [action, armed, disarm, enabled, timeout]);

  return { armed, trigger, disarm };
}
