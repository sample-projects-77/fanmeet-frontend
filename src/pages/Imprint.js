import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LegalPage.css';
import './Imprint.css';

function Imprint() {
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
          <h1 className="legal-title">{t('legal.imprint.title')}</h1>
        </div>

        <div className="imprint-table">
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.provider')}</span>
            <span className="imprint-value">Fan Session</span>
          </div>
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.owner')}</span>
            <span className="imprint-value">George Jerjes</span>
          </div>
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.address')}</span>
            <span className="imprint-value">
              {t('legal.imprint.careOfLine')}<br />
              Europaring 90<br />
              53757 Sankt Augustin<br />
              Germany
            </span>
          </div>
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.email')}</span>
            <a className="imprint-value imprint-link" href="mailto:Kontakt@fan-session.com">Kontakt@fan-session.com</a>
          </div>
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.website')}</span>
            <span className="imprint-value">fan-session.com</span>
          </div>
          <div className="imprint-row">
            <span className="imprint-label">{t('legal.imprint.vatId')}</span>
            <span className="imprint-value">DE313513325</span>
          </div>
        </div>

        <div className="imprint-responsible">
          <span className="imprint-responsible-label">{t('legal.imprint.responsible')}</span>
          <span className="imprint-responsible-value">George Jerjes<br />{t('legal.imprint.addressAsAbove')}</span>
        </div>

        <hr className="legal-divider" />

        <div className="legal-section">
          <h2 className="legal-section-title">{t('legal.imprint.legalNoticeTitle')}</h2>
          <p className="legal-section-body" style={{ whiteSpace: 'pre-line' }}>{t('legal.imprint.legalNoticeBody')}</p>
        </div>
      </div>
    </div>
  );
}

export default Imprint;
