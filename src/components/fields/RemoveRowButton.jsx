import { useArmedAction } from '../../hooks/useArmedAction.js';

/**
 * Removes one line from a list.
 *
 * With `confirm` (a row that holds data) it takes two clicks: the first arms the
 * button, the second deletes. Leaving the button disarms it again, so a filled
 * quest is never lost to a stray tap.
 */
export default function RemoveRowButton({ label, onClick, confirm = false }) {
  const { armed, trigger, disarm } = useArmedAction(onClick, { enabled: confirm });
  const title = armed ? `Confirmer : ${label.toLowerCase()}` : label;

  return (
    <button
      type="button"
      className={armed ? 'remove-row armed' : 'remove-row'}
      title={title}
      aria-label={title}
      onClick={trigger}
      onBlur={disarm}
      onMouseLeave={disarm}
    >
      ×
    </button>
  );
}
