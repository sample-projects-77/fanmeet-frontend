import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
];

const LOCALE_STORAGE_KEY = 'locale';

function Welcome() {
  const [languagePopupOpen, setLanguagePopupOpen] = useState(false);
  const [locale, setLocale] = useState('en');
  const popupRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && LANGUAGE_OPTIONS.some((o) => o.value === stored)) {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    if (!languagePopupOpen) return;
    function handleClickOutside(e) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setLanguagePopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [languagePopupOpen]);

  function handleSelectLanguage(value) {
    setLocale(value);
    localStorage.setItem(LOCALE_STORAGE_KEY, value);
    setLanguagePopupOpen(false);
  }

  return (
    <div className="welcome-page">
      <button
        ref={triggerRef}
        type="button"
        className="welcome-language-trigger"
        onClick={() => setLanguagePopupOpen((open) => !open)}
        aria-expanded={languagePopupOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="welcome-language-trigger-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
        <span className="welcome-language-trigger-label">{LANGUAGE_OPTIONS.find((o) => o.value === locale)?.label ?? 'English'}</span>
        <span className="welcome-language-trigger-chevron" aria-hidden>▼</span>
      </button>

      {languagePopupOpen && (
        <div
          ref={popupRef}
          className="welcome-language-popup"
          role="listbox"
          aria-label="Language options"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={locale === opt.value}
              className={`welcome-language-option ${locale === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelectLanguage(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="welcome-content">
        {/* FanMeet logo */}
        <div className="app-icon">
          <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="FanMeet" className="app-icon-logo" />
        </div>
        <h1 className="welcome-title">Fan Session</h1>
        <p className="welcome-tagline">Where fans and creators connect through memorable sessions.</p>
        <div className="welcome-actions">
          <Link to="/signup/fan" className="btn btn-primary">
            Sign up as Fan
          </Link>
          <Link to="/signup/creator" className="btn btn-secondary">
            Sign up as Creator
          </Link>
        </div>
        <p className="welcome-login">
          Already have an account? <Link to="/login" className="welcome-login-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Welcome;
