import { useMemo } from 'react';
import { SheetContext } from './SheetContext.js';

export default function SheetProvider({ data, update, apply, children }) {
  const value = useMemo(() => ({ data, update, apply }), [data, update, apply]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}
