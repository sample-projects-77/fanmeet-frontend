import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.privacy.controllerTitle', bodyKey: 'legal.privacy.controller' },
  { titleKey: 'legal.privacy.dataCollectedTitle', bodyKey: 'legal.privacy.dataCollected' },
  { titleKey: 'legal.privacy.paymentTitle', bodyKey: 'legal.privacy.payment' },
  { titleKey: 'legal.privacy.videoTitle', bodyKey: 'legal.privacy.video' },
  { titleKey: 'legal.privacy.legalBasesTitle', bodyKey: 'legal.privacy.legalBases' },
  { titleKey: 'legal.privacy.hostingTitle', bodyKey: 'legal.privacy.hosting' },
  { titleKey: 'legal.privacy.retentionTitle', bodyKey: 'legal.privacy.retention' },
  { titleKey: 'legal.privacy.rightsTitle', bodyKey: 'legal.privacy.rights' },
  { titleKey: 'legal.privacy.securityTitle', bodyKey: 'legal.privacy.security' },
  { titleKey: 'legal.privacy.cookiesTitle', bodyKey: 'legal.privacy.cookies' },
  { titleKey: 'legal.privacy.changesTitle', bodyKey: 'legal.privacy.changes' },
  { titleKey: 'legal.privacy.contactTitle', bodyKey: 'legal.privacy.contact' },
];

function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <div className="legal-topbar">
          <Link to="/terms" className="legal-back">← {t('legal.backToTerms')}</Link>
          <LanguageSwitcher />
        </div>

        <div className="legal-header">
          <h1 className="legal-title">{t('legal.privacy.title')}</h1>
          <p className="legal-intro">{t('legal.privacy.intro')}</p>
        </div>

        {SECTIONS.map(({ titleKey, bodyKey }) => (
          <div className="legal-section" key={titleKey}>
            <h2 className="legal-section-title">{t(titleKey)}</h2>
            <p className="legal-section-body">{t(bodyKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrivacyPolicy;
