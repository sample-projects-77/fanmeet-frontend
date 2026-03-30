import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';

const SECTIONS = [
  { titleKey: 'legal.privacy.s1Title', bodyKey: 'legal.privacy.s1Body' },
  { titleKey: 'legal.privacy.s2Title', bodyKey: 'legal.privacy.s2Body' },
  { titleKey: 'legal.privacy.s3Title', bodyKey: 'legal.privacy.s3Body' },
  { titleKey: 'legal.privacy.s4Title', bodyKey: 'legal.privacy.s4Body' },
  { titleKey: 'legal.privacy.s5Title', bodyKey: 'legal.privacy.s5Body' },
  { titleKey: 'legal.privacy.s6Title', bodyKey: 'legal.privacy.s6Body' },
  { titleKey: 'legal.privacy.s7Title', bodyKey: 'legal.privacy.s7Body' },
  { titleKey: 'legal.privacy.s8Title', bodyKey: 'legal.privacy.s8Body' },
  { titleKey: 'legal.privacy.s9Title', bodyKey: 'legal.privacy.s9Body' },
  { titleKey: 'legal.privacy.s10Title', bodyKey: 'legal.privacy.s10Body' },
  { titleKey: 'legal.privacy.s11Title', bodyKey: 'legal.privacy.s11Body' },
  { titleKey: 'legal.privacy.s12Title', bodyKey: 'legal.privacy.s12Body' },
];

function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <div className="legal-topbar">
          <button type="button" className="legal-back" onClick={() => navigate(-1)}>← {t('common.back')}</button>
          <LanguageSwitcher />
        </div>

        <div className="legal-header">
          <h1 className="legal-title">{t('legal.privacy.title')}</h1>
          <p className="legal-intro" style={{ fontWeight: 700, marginBottom: 4 }}>{t('legal.privacy.subtitle')}</p>
          <p className="legal-intro" style={{ marginBottom: 16 }}>{t('legal.privacy.date')}</p>
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

export default PrivacyPolicy;
