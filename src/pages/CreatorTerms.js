import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.creatorTerms.s1Title', bodyKey: 'legal.creatorTerms.s1Body' },
  { titleKey: 'legal.creatorTerms.s2Title', bodyKey: 'legal.creatorTerms.s2Body' },
  { titleKey: 'legal.creatorTerms.s3Title', bodyKey: 'legal.creatorTerms.s3Body' },
  { titleKey: 'legal.creatorTerms.s4Title', bodyKey: 'legal.creatorTerms.s4Body' },
  { titleKey: 'legal.creatorTerms.s5Title', bodyKey: 'legal.creatorTerms.s5Body' },
  { titleKey: 'legal.creatorTerms.s6Title', bodyKey: 'legal.creatorTerms.s6Body' },
  { titleKey: 'legal.creatorTerms.s7Title', bodyKey: 'legal.creatorTerms.s7Body' },
  { titleKey: 'legal.creatorTerms.s8Title', bodyKey: 'legal.creatorTerms.s8Body' },
  { titleKey: 'legal.creatorTerms.s9Title', bodyKey: 'legal.creatorTerms.s9Body' },
  { titleKey: 'legal.creatorTerms.s10Title', bodyKey: 'legal.creatorTerms.s10Body' },
  { titleKey: 'legal.creatorTerms.s11Title', bodyKey: 'legal.creatorTerms.s11Body' },
  { titleKey: 'legal.creatorTerms.s12Title', bodyKey: 'legal.creatorTerms.s12Body' },
  { titleKey: 'legal.creatorTerms.s13Title', bodyKey: 'legal.creatorTerms.s13Body' },
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
          <p className="legal-intro" style={{ fontWeight: 700, marginBottom: 4 }}>{t('legal.creatorTerms.subtitle')}</p>
          <p className="legal-intro" style={{ marginBottom: 16 }}>{t('legal.creatorTerms.date')}</p>
          <p className="legal-intro" style={{ whiteSpace: 'pre-line' }}>{t('legal.creatorTerms.intro')}</p>
        </div>

        {SECTIONS.map(({ titleKey, bodyKey }) => (
          <div className="legal-section" key={titleKey}>
            <h2 className="legal-section-title">{t(titleKey)}</h2>
            <p className="legal-section-body" style={{ whiteSpace: 'pre-line' }}>{t(bodyKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CreatorTerms;
