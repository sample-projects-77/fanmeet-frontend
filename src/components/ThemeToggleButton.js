import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from './ThemeIcons';
import './ThemeToggleButton.css';

/**
 * Compact theme switch for the unauthenticated screens (Welcome, Login).
 *
 * The choice is written to localStorage immediately and is sent as
 * `theme_mode` when the visitor logs in or signs up, so a theme picked before
 * authenticating carries over to the account.
 */
export default function ThemeToggleButton({ className = '' }) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const nextIsDark = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={nextIsDark ? t('appearance.switchToDark') : t('appearance.switchToLight')}
      title={nextIsDark ? t('appearance.switchToDark') : t('appearance.switchToLight')}
    >
      {nextIsDark ? <MoonIcon size={20} /> : <SunIcon size={20} />}
    </button>
  );
}
