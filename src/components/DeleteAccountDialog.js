import React from 'react';
import './DeleteAccountDialog.css';

/**
 * Delete Account confirmation dialog – matches Flutter showDeleteAccountDialog.
 * darkBlueShade3 background, 16px radius, title (h3), content (b2), Cancel + Delete Account (red) actions.
 */
export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  deleting = false,
  title = 'Delete Account',
  message = 'Are you sure you want to delete your account? This action cannot be undone.',
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete Account',
}) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="delete-account-dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-dialog-title"
    >
      <div
        className="delete-account-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-dialog-title" className="delete-account-dialog-title">
          {title}
        </h2>
        <p className="delete-account-dialog-content">{message}</p>
        <div className="delete-account-dialog-actions">
          <button
            type="button"
            className="delete-account-dialog-btn delete-account-dialog-btn--cancel"
            onClick={onClose}
            disabled={deleting}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="delete-account-dialog-btn delete-account-dialog-btn--confirm"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
