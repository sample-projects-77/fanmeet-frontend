import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '../components/ThemeIcons';
import './FanProfileEdit.css';
import './AppearanceSettings.css';

/**
 * Appearance (theme) settings.
 *
 * One component serves both roles – the only difference is where "back" goes –
 * so the Fan and Creator screens cannot drift apart.
 *
 * Selecting a theme applies it synchronously and returns immediately; the API
 * write happens in the background inside ThemeContext. There is deliberately no
 * "Save" button and no saving spinner: unlike the Language screen, the result
 * is visible the instant it is tapped.
 */
function AppearanceSettings({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    setAuthorised(true);
  }, [navigate]);

  const options = [
    {
      value: 'light',
      Icon: SunIcon,
      title: t('appearance.light'),
      desc: t('appearance.lightDescription'),
    },
    {
      value: 'dark',
      Icon: MoonIcon,
      title: t('appearance.dark'),
      desc: t('appearance.darkDescription'),
    },
  ];

  if (!authorised) return null;

  return (
    <div className="fan-profile-edit-page">
      <header className="fan-profile-edit-header">
        <Link to={`${basePath}/profile`} className="fan-profile-edit-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="fan-profile-edit-title">{t('appearance.title')}</h1>
      </header>

      <main className="fan-profile-edit-main">
        <div className="fan-profile-edit-form">
          <div className="fan-profile-edit-field">
            <label id="appearance-label">{t('appearance.label')}</label>
            <div className="appearance-options" role="radiogroup" aria-labelledby="appearance-label">
              {options.map(({ value, Icon, title, desc }) => {
                const selected = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`appearance-option ${selected ? 'selected' : ''}`}
                    onClick={() => setTheme(value)}
                  >
                    <span className="appearance-option-icon">
                      <Icon size={20} />
                    </span>
                    <span className="appearance-option-text">
                      <span className="appearance-option-title">{title}</span>
                      <span className="appearance-option-desc">{desc}</span>
                    </span>
                    {selected && (
                      <span className="appearance-option-check" aria-hidden>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function FanProfileAppearance() {
  return <AppearanceSettings basePath="/fan" />;
}

export function CreatorProfileAppearance() {
  return <AppearanceSettings basePath="/creator" />;
}

export default AppearanceSettings;
