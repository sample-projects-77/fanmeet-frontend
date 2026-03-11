import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LOCALE_STORAGE_KEY, setAppLanguage, SUPPORTED } from '../i18n';
import './Welcome.css';

function Welcome() {
  const { t, i18n } = useTranslation();
  const [languagePopupOpen, setLanguagePopupOpen] = useState(false);
  const [locale, setLocale] = useState(() => i18n.language || 'de');
  const popupRef = useRef(null);
  const triggerRef = useRef(null);

  const languageLabels = { en: t('language.english'), de: t('language.german') };

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) {
      setLocale(stored);
    } else {
      setLocale(i18n.language || 'de');
    }
  }, [i18n.language]);

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
    setAppLanguage(value, true);
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
        aria-label={t('language.select')}
      >
        <span className="welcome-language-trigger-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
        <span className="welcome-language-trigger-label">{languageLabels[locale] ?? languageLabels.de}</span>
        <span className="welcome-language-trigger-chevron" aria-hidden>▼</span>
      </button>

      {languagePopupOpen && (
        <div
          ref={popupRef}
          className="welcome-language-popup"
          role="listbox"
          aria-label={t('language.options')}
        >
          {SUPPORTED.map((value) => (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={locale === value}
              className={`welcome-language-option ${locale === value ? 'selected' : ''}`}
              onClick={() => handleSelectLanguage(value)}
            >
              {languageLabels[value]}
            </button>
          ))}
        </div>
      )}

      <div className="welcome-content">
        <div className="app-icon">
          <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="FanMeet" className="app-icon-logo" />
        </div>
        <h1 className="welcome-title">{t('welcome.title')}</h1>
        <p className="welcome-tagline">{t('welcome.tagline')}</p>
        <div className="welcome-actions">
          <Link to="/signup/fan" className="btn btn-primary">
            {t('welcome.signUpFan')}
          </Link>
          <Link to="/signup/creator" className="btn btn-secondary">
            {t('welcome.signUpCreator')}
          </Link>
        </div>
        <p className="welcome-login">
          {t('welcome.alreadyHaveAccount')} <Link to="/login" className="welcome-login-link">{t('welcome.logIn')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Welcome;
