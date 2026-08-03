import { DiceContext } from './DiceContext.js';
import { useDiceTray } from '../hooks/useDiceTray.js';

export default function DiceProvider({ children }) {
  return <DiceContext.Provider value={useDiceTray()}>{children}</DiceContext.Provider>;
}
