import React from 'react';
import './SharedWidgets.css';

export default function LoadingSpinner({ inline }) {
  return (
    <div
      className={`shared-loading-wrap${inline ? ' shared-loading-wrap--inline' : ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className="shared-loading-spinner" />
    </div>
  );
}

/** Inline spinner for buttons; use when loading to replace button label. */
export function ButtonLoadingSpinner() {
  return (
    <span className="shared-button-loading-wrap" role="status" aria-label="Loading">
      <span className="shared-loading-spinner-inline" />
    </span>
  );
}
