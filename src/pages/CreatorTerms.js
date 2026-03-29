import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.creatorTerms.eligibilityTitle', bodyKey: 'legal.creatorTerms.eligibility' },
  { titleKey: 'legal.creatorTerms.profileTitle', bodyKey: 'legal.creatorTerms.profile' },
  { titleKey: 'legal.creatorTerms.payoutTitle', bodyKey: 'legal.creatorTerms.payout' },
  { titleKey: 'legal.creatorTerms.responsibilitiesTitle', bodyKey: 'legal.creatorTerms.responsibilities' },
  { titleKey: 'legal.creatorTerms.offPlatformTitle', bodyKey: 'legal.creatorTerms.offPlatform' },
  { titleKey: 'legal.creatorTerms.cancellationsTitle', bodyKey: 'legal.creatorTerms.cancellations' },
  { titleKey: 'legal.creatorTerms.platformRightsTitle', bodyKey: 'legal.creatorTerms.platformRights' },
  { titleKey: 'legal.creatorTerms.liabilityTitle', bodyKey: 'legal.creatorTerms.liability' },
];

function CreatorTerms() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <div className="legal-topbar">
          <Link to="/terms" className="legal-back">← {t('legal.backToTerms')}</Link>
          <LanguageSwitcher />
        </div>

        <div className="legal-header">
          <h1 className="legal-title">{t('legal.creatorTerms.title')}</h1>
          <p className="legal-intro">{t('legal.creatorTerms.intro')}</p>
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

export default CreatorTerms;
