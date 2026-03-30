import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.fanTerms.s1Title', bodyKey: 'legal.fanTerms.s1Body' },
  { titleKey: 'legal.fanTerms.s2Title', bodyKey: 'legal.fanTerms.s2Body' },
  { titleKey: 'legal.fanTerms.s3Title', bodyKey: 'legal.fanTerms.s3Body' },
  { titleKey: 'legal.fanTerms.s4Title', bodyKey: 'legal.fanTerms.s4Body' },
  { titleKey: 'legal.fanTerms.s5Title', bodyKey: 'legal.fanTerms.s5Body' },
  { titleKey: 'legal.fanTerms.s6Title', bodyKey: 'legal.fanTerms.s6Body' },
  { titleKey: 'legal.fanTerms.s7Title', bodyKey: 'legal.fanTerms.s7Body' },
  { titleKey: 'legal.fanTerms.s8Title', bodyKey: 'legal.fanTerms.s8Body' },
  { titleKey: 'legal.fanTerms.s9Title', bodyKey: 'legal.fanTerms.s9Body' },
  { titleKey: 'legal.fanTerms.s10Title', bodyKey: 'legal.fanTerms.s10Body' },
  { titleKey: 'legal.fanTerms.s11Title', bodyKey: 'legal.fanTerms.s11Body' },
  { titleKey: 'legal.fanTerms.s12Title', bodyKey: 'legal.fanTerms.s12Body' },
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
          <p className="legal-intro" style={{ fontWeight: 700, marginBottom: 4 }}>{t('legal.fanTerms.subtitle')}</p>
          <p className="legal-intro" style={{ marginBottom: 16 }}>{t('legal.fanTerms.date')}</p>
          <p className="legal-intro" style={{ whiteSpace: 'pre-line' }}>{t('legal.fanTerms.intro')}</p>
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

export default FanTerms;
