import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.fanTerms.eligibilityTitle', bodyKey: 'legal.fanTerms.eligibility' },
  { titleKey: 'legal.fanTerms.bookingTitle', bodyKey: 'legal.fanTerms.booking' },
  { titleKey: 'legal.fanTerms.platformTitle', bodyKey: 'legal.fanTerms.platform' },
  { titleKey: 'legal.fanTerms.responsibilitiesTitle', bodyKey: 'legal.fanTerms.responsibilities' },
  { titleKey: 'legal.fanTerms.cancellationsTitle', bodyKey: 'legal.fanTerms.cancellations' },
  { titleKey: 'legal.fanTerms.prohibitedTitle', bodyKey: 'legal.fanTerms.prohibited' },
  { titleKey: 'legal.fanTerms.terminationTitle', bodyKey: 'legal.fanTerms.termination' },
  { titleKey: 'legal.fanTerms.withdrawalTitle', bodyKey: 'legal.fanTerms.withdrawal' },
];

function FanTerms() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <div className="legal-topbar">
          <Link to="/terms" className="legal-back">← {t('legal.backToTerms')}</Link>
          <LanguageSwitcher />
        </div>

        <div className="legal-header">
          <h1 className="legal-title">{t('legal.fanTerms.title')}</h1>
          <p className="legal-intro">{t('legal.fanTerms.intro')}</p>
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

export default FanTerms;
