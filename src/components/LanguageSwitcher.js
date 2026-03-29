import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_STORAGE_KEY, setAppLanguage, SUPPORTED } from '../i18n';
import './LanguageSwitcher.css';

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
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
    if (!open) return;
    function handleClickOutside(e) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(value) {
    setLocale(value);
    setAppLanguage(value, true);
    setOpen(false);
  }

  return (
    <div className="lang-switcher">
      <button
        ref={triggerRef}
        type="button"
        className="lang-switcher-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language.select')}
      >
        <span className="lang-switcher-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
        <span className="lang-switcher-label">{languageLabels[locale] ?? languageLabels.de}</span>
        <span className="lang-switcher-chevron" aria-hidden>▼</span>
      </button>

      {open && (
        <div
          ref={popupRef}
          className="lang-switcher-popup"
          role="listbox"
          aria-label={t('language.options')}
        >
          {SUPPORTED.map((value) => (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={locale === value}
              className={`lang-switcher-option ${locale === value ? 'selected' : ''}`}
              onClick={() => handleSelect(value)}
            >
              {languageLabels[value]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
