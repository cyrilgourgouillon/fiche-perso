import { DiceContext } from './DiceContext';
import { useDiceTray } from '../hooks/useDiceTray';

export default function DiceProvider({ children }) {
  return <DiceContext.Provider value={useDiceTray()}>{children}</DiceContext.Provider>;
}
