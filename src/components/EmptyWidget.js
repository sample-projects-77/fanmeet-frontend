import React from 'react';
import './SharedWidgets.css';

/**
 * Flutter EmptyWidget – circle "i" icon, text (tertiaryColor), optional primary button.
 */
export default function EmptyWidget({ text, buttonText, onButtonClick, icon }) {
  return (
    <div className="shared-empty-wrap">
      <div className="shared-empty-icon" aria-hidden>
        {icon != null ? (
          typeof icon === 'string' && icon.toLowerCase().endsWith('.svg') ? (
            <img src={icon} alt="" width={64} height={64} />
          ) : (
            <img src={icon} alt="" width={64} height={64} />
          )
        ) : (
          <span className="shared-empty-icon-letter">i</span>
        )}
      </div>
      <p className="shared-empty-text">{text}</p>
      {buttonText && buttonText.trim() !== '' && (
        <button
          type="button"
          className="shared-empty-btn btn-primary"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
