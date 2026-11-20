import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  danger = false
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className={`confirm-dialog-icon ${danger ? 'danger' : ''}`}>
          {danger ? '!' : '↗'}
        </div>
        <div>
          <h2 id="confirm-title">{title}</h2>
          <p id="confirm-message">{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
