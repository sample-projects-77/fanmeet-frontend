import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

function LegalHub() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <div className="legal-topbar-right">
          <LanguageSwitcher />
        </div>
        <div className="legal-header">
          <h1 className="legal-title">{t('legal.hub.title')}</h1>
          <p className="legal-intro">{t('legal.hub.intro')}</p>
        </div>

        <div className="legal-cards">
          <Link to="/terms/fans" className="legal-card">
            <h2 className="legal-card-title">{t('legal.hub.fanTermsTitle')}</h2>
            <p className="legal-card-desc">{t('legal.hub.fanTermsDesc')}</p>
            <div className="legal-card-arrow">→</div>
          </Link>

          <Link to="/terms/creators" className="legal-card">
            <h2 className="legal-card-title">{t('legal.hub.creatorTermsTitle')}</h2>
            <p className="legal-card-desc">{t('legal.hub.creatorTermsDesc')}</p>
            <div className="legal-card-arrow">→</div>
          </Link>

          <Link to="/privacy" className="legal-card">
            <h2 className="legal-card-title">{t('legal.hub.privacyTitle')}</h2>
            <p className="legal-card-desc">{t('legal.hub.privacyDesc')}</p>
            <div className="legal-card-arrow">→</div>
          </Link>
        </div>

        <p className="legal-hub-note">{t('legal.hub.note')}</p>
      </div>
    </div>
  );
}

export default LegalHub;
