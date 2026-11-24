import { useMemo } from 'react';
import { SheetContext } from './SheetContext';

export default function SheetProvider({
  data, update, apply, actionHistory, rollback, children,
}) {
  const value = useMemo(() => ({
    data, update, apply, actionHistory, rollback,
  }), [data, update, apply, actionHistory, rollback]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}
