import React from 'react';
import { useTranslation } from 'react-i18next';
import './SharedWidgets.css';

/**
 * Flutter TNSErrorWidget – circle with error icon (red), message, optional Retry button.
 */
export default function ErrorWidget({ errorText, onRetry }) {
  const { t } = useTranslation();
  const displayError = errorText ?? t('common.couldNotFetch');
  return (
    <div className="shared-error-wrap">
      <div className="shared-error-icon-wrap" aria-hidden>
        <ErrorIcon />
      </div>
      <p className="shared-error-text">{displayError}</p>
      {onRetry && (
        <button
          type="button"
          className="shared-error-retry-btn btn-secondary"
          onClick={onRetry}
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
