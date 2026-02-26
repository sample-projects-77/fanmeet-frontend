import React from 'react';
import './SharedWidgets.css';

export default function LoadingSpinner() {
  return (
    <div className="shared-loading-wrap" role="status" aria-label="Loading">
      <div className="shared-loading-spinner" />
    </div>
  );
}
