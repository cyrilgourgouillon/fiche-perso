import { createContext, useContext } from 'react';

export const DiceContext = createContext(null);

/** `{ log, lastRoll, mode, setMode, roll, rollDice, rollExpression, clear }` */
export const useDice = () => {
  const dice = useContext(DiceContext);
  if (!dice) throw new Error('useDice must be used within a DiceProvider');
  return dice;
};
