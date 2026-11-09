import { useEffect, useState } from 'react';
import { normalized } from '../../../services/search';
import type { NotifyStatus } from '../../../hooks/useStatusMessage';

type Apply = (transform: (current: Record<string, unknown>) => Record<string, unknown>) => void;

/** Scroll to (and optionally focus) an element once the sheet has re-rendered. */
type ScrollTarget = {
  selector: string;
  focusTarget?: boolean;
};

/**
 * Add a row to a section through its own "add" button, optionally fill its
 * title (and quantity), then focus it. Runs over several frames: click, wait
 * for the row to render, fill, wait again, focus.
 */
export type AddRowTarget = {
  selector: string;
  action: 'add';
  stage: 'add' | 'fill' | 'focus';
  buttonLabel: string;
  fieldPrefix: string;
  fieldSuffix?: string;
  fieldPattern?: RegExp;
  prefillValue?: string;
  prefillQuantity?: number;
  fieldName?: string;
};

export type PendingTarget = ScrollTarget | AddRowTarget;

const isAddRow = (target: PendingTarget): target is AddRowTarget => 'action' in target && target.action === 'add';

function scrollToField(field: HTMLElement) {
  const top = field.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  field.focus({ preventScroll: true });
}

/** The newest field of the row family an add target writes to. */
function lastRowField(target: AddRowTarget) {
  return [...document.querySelectorAll<HTMLElement>(`[data-field^="${target.fieldPrefix}"]`)]
    .filter((item) => {
      const name = item.getAttribute('data-field');
      return target.fieldPattern
        ? target.fieldPattern.test(name)
        : (!target.fieldSuffix || name.endsWith(target.fieldSuffix));
    })
    .at(-1);
}

/**
 * Sheet elements the search panel acts on after it closes. The work waits for
 * the next animation frame, so sections unfolded by the same action exist.
 */
export function usePendingTarget(apply: Apply, notify: NotifyStatus) {
  const [pendingTarget, setPendingTarget] = useState<PendingTarget | null>(null);

  useEffect(() => {
    if (!pendingTarget) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(pendingTarget.selector);
      if (!isAddRow(pendingTarget)) {
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (pendingTarget.focusTarget) target?.focus({ preventScroll: true });
        setPendingTarget(null);
        return;
      }

      if (pendingTarget.stage === 'add') {
        const wanted = normalized(pendingTarget.buttonLabel);
        const addButton = [...(target?.querySelectorAll<HTMLButtonElement>('.add-row') || [])]
          .find((button) => normalized(button.textContent).includes(wanted));
        if (!addButton) {
          notify(`⚠ ${pendingTarget.buttonLabel} : bouton introuvable dans la fiche`, 'warning');
          setPendingTarget(null);
          return;
        }
        addButton.click();
        if (pendingTarget.fieldPrefix === 'inventaire' && !pendingTarget.prefillValue) {
          notify('✓ Nouvelle ligne d’inventaire créée', 'success');
        }
        setPendingTarget({ ...pendingTarget, stage: pendingTarget.prefillValue ? 'fill' : 'focus' });
        return;
      }

      const field = lastRowField(pendingTarget);
      if (field && pendingTarget.stage === 'fill') {
        const fieldName = field.getAttribute('data-field');
        const { prefillValue, prefillQuantity } = pendingTarget;
        apply((current) => ({
          ...current,
          [fieldName]: prefillValue,
          ...(prefillQuantity ? { [fieldName.replace(/_nom$/u, '_quantite')]: String(prefillQuantity) } : {}),
        }));
        if (pendingTarget.fieldPrefix === 'inventaire') {
          notify(`✓ Ajout réussi à l’inventaire : ${prefillQuantity || 1} × ${prefillValue}`, 'success');
        }
        setPendingTarget({ ...pendingTarget, stage: 'focus', fieldName });
        return;
      }

      if (pendingTarget.stage === 'fill') {
        notify(`⚠ Ligne ajoutée, mais « ${pendingTarget.prefillValue} » n’a pas pu être saisi`, 'warning');
      }
      const focusField = pendingTarget.fieldName
        ? document.querySelector<HTMLElement>(`[data-field="${pendingTarget.fieldName}"]`)
        : field;
      if (focusField) scrollToField(focusField);
      setPendingTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [apply, notify, pendingTarget]);

  return setPendingTarget;
}
