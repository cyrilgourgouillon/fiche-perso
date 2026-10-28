import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  open,
  onClose,
  title,
  eyebrow,
  closeLabel = 'Fermer la fenêtre',
  headerActions,
  initialFocus,
  presentation = 'modal',
  className = '',
  id,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (presentation !== 'modal') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      if (initialFocus) dialog.querySelector(initialFocus)?.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open, presentation]);

  const content = (
    <div className="app-modal-content">
      <header className="app-modal-heading">
        <div>
          {eyebrow && <p className="app-modal-eyebrow">{eyebrow}</p>}
          <h2 id={titleId}>{title}</h2>
        </div>
        <div className="app-modal-actions">
          {headerActions}
          <button type="button" className="app-modal-close" aria-label={closeLabel} onClick={onClose}>&times;</button>
        </div>
      </header>
      {children}
    </div>
  );

  if (presentation === 'popup') {
    if (!open) return null;
    return (
      <section
        id={id}
        className={`app-modal-popup ${className}`.trim()}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
      >
        {content}
      </section>
    );
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      id={id}
      className={`app-modal ${className}`.trim()}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      {content}
    </dialog>,
    document.body,
  );
}