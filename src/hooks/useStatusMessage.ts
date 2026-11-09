import {
  useCallback, useEffect, useRef, useState,
} from 'react';

const RESET_DELAY_MS = 2500;

export type StatusTone = 'info' | 'success' | 'error' | 'warning';
type Status = { message: string; tone: StatusTone };
export type NotifyStatus = (message: string, tone?: StatusTone) => void;

/** Transient toolbar message: empty until something is notified, cleared again after a short delay. */
export function useStatusMessage(resetDelayMs = RESET_DELAY_MS) {
  const [status, setStatus] = useState<Status>({ message: '', tone: 'info' });
  const timer = useRef(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const notify = useCallback<NotifyStatus>(
    (message, tone = 'info') => {
      setStatus({ message, tone });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus({ message: '', tone }), resetDelayMs);
    },
    [resetDelayMs],
  );

  return [status, notify] as const;
}
