import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Footer from '../components/Footer';
import './Welcome.css';

function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="welcome-page">
      <div className="welcome-language-wrapper">
        <LanguageSwitcher />
      </div>

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

      <div className="welcome-footer">
        <Footer />
      </div>
    </div>
  );
}

export default Welcome;
