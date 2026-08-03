import { useCallback, useMemo, useState } from 'react';
import { rollCheck, rollDice as rollPlainDice, rollExpression as rollTyped } from '../services/dice.js';

const LOG_LENGTH = 10;

/**
 * The dice tray: the roll mode and a short history.
 *
 * Rolls are deliberately not part of the sheet — they are not character data,
 * so they are neither saved nor exported, and a reload starts a fresh table.
 */
export function useDiceTray() {
  const [mode, setMode] = useState('normal');
  const [log, setLog] = useState([]);

  const record = useCallback((roll) => {
    if (!roll) return null;
    // the id lets the flash animation replay even for an identical result
    setLog((current) => [{ ...roll, id: (current[0]?.id ?? 0) + 1 }, ...current].slice(0, LOG_LENGTH));
    return roll;
  }, []);

  const roll = useCallback(
    (label, bonus) => record(rollCheck({ label, bonus, mode })),
    [mode, record],
  );

  const rollDice = useCallback((sides, count) => record(rollPlainDice(sides, count)), [record]);

  const rollExpression = useCallback((input) => record(rollTyped(input)), [record]);

  const clear = useCallback(() => setLog([]), []);

  return useMemo(
    () => ({ log, lastRoll: log[0] || null, mode, setMode, roll, rollDice, rollExpression, clear }),
    [log, mode, roll, rollDice, rollExpression, clear],
  );
}
