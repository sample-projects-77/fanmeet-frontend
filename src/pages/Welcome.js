import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import GppGood from '@mui/icons-material/GppGood';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Footer from '../components/Footer';
import './Welcome.css';

/** Purple → sky-blue gradient for landing icons (matches SVG defs id below). */
const GRADIENT_ICON_SX = { fill: 'url(#welcome-icon-gradient)' };

const SAFE_ICONS = [GppGoodOutlined, VerifiedUserOutlined, CancelOutlined, LockOutlined];
const STEP_ICONS = [PersonAddAlt1Outlined, SearchOutlined, CalendarMonthOutlined, VideocamOutlined];

function Welcome() {
  const { t } = useTranslation();

  const safeKeys = [
    { title: 'welcome.safe1Title', body: 'welcome.safe1Body', accent: 'blue' },
    { title: 'welcome.safe2Title', body: 'welcome.safe2Body', accent: 'purple' },
    { title: 'welcome.safe3Title', body: 'welcome.safe3Body', accent: 'blue' },
    { title: 'welcome.safe4Title', body: 'welcome.safe4Body', accent: 'purple' },
  ];

  const stepKeys = [
    { title: 'welcome.step1Title', body: 'welcome.step1Body' },
    { title: 'welcome.step2Title', body: 'welcome.step2Body' },
    { title: 'welcome.step3Title', body: 'welcome.step3Body' },
    { title: 'welcome.step4Title', body: 'welcome.step4Body' },
  ];

  return (
    <div className="welcome-page">
      {/* Shared gradient for MUI SVG icons */}
      <svg className="welcome-gradient-defs" width={0} height={0} aria-hidden focusable="false">
        <defs>
          <linearGradient id="welcome-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="welcome-language-wrapper">
        <LanguageSwitcher />
      </div>

      <div className="welcome-inner">
        <header className="welcome-hero">
          <div className="welcome-app-icon">
            <img src={`${process.env.PUBLIC_URL || ''}/logo.png`} alt="" className="welcome-app-icon-img" />
          </div>
          <h1 className="welcome-title">{t('welcome.title')}</h1>
          <p className="welcome-hero-line1">
            <Trans
              i18nKey="welcome.heroLine1"
              components={{
                coaching: <span className="welcome-hero-accent welcome-hero-accent--blue" />,
                advice: <span className="welcome-hero-accent welcome-hero-accent--purple" />,
              }}
            />
          </p>
          <p className="welcome-hero-line2">{t('welcome.heroLine2')}</p>

          <div className="welcome-moderation" role="note">
            <GppGood className="welcome-moderation-icon" aria-hidden />
            <span>{t('welcome.moderationBanner')}</span>
          </div>

          <div className="welcome-actions">
            <Link to="/signup/fan" className="welcome-btn welcome-btn--primary">
              <PersonOutline className="welcome-btn-icon" aria-hidden />
              {t('welcome.signUpFan')}
            </Link>
            <Link to="/signup/creator" className="welcome-btn welcome-btn--secondary">
              <PersonOutline className="welcome-btn-icon" aria-hidden />
              {t('welcome.signUpCreator')}
            </Link>
          </div>
          <p className="welcome-login">
            {t('welcome.alreadyHaveAccount')}{' '}
            <Link to="/login" className="welcome-login-link">{t('welcome.logIn')}</Link>
          </p>
        </header>

        <section className="welcome-safe" aria-labelledby="welcome-safe-heading">
          <h2 id="welcome-safe-heading" className="welcome-section-title">
            {t('welcome.safeTitle')}
          </h2>
          <div className="welcome-safe-grid">
            {safeKeys.map((item, i) => {
              const Icon = SAFE_ICONS[i];
              return (
                <div key={item.title} className="welcome-safe-card">
                  <div className="welcome-safe-icon-wrap" aria-hidden>
                    <Icon className="welcome-safe-icon" sx={GRADIENT_ICON_SX} />
                  </div>
                  <h3
                    className={
                      item.accent === 'purple'
                        ? 'welcome-safe-card-title welcome-safe-card-title--purple'
                        : 'welcome-safe-card-title welcome-safe-card-title--blue'
                    }
                  >
                    {t(item.title)}
                  </h3>
                  <p className="welcome-safe-card-body">{t(item.body)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="welcome-how" aria-labelledby="welcome-how-heading">
          <h2 id="welcome-how-heading" className="welcome-section-title">
            {t('welcome.howTitle')}
          </h2>
          <div className="welcome-steps">
            {stepKeys.map((item, i) => {
              const Icon = STEP_ICONS[i];
              const isLast = i === stepKeys.length - 1;
              return (
                <React.Fragment key={item.title}>
                  <div className="welcome-step">
                    <div className="welcome-step-visual">
                      <div className="welcome-step-icon-stack">
                        <span className="welcome-step-num">{i + 1}</span>
                        <div className="welcome-step-icon-ring">
                          <Icon className="welcome-step-icon" sx={GRADIENT_ICON_SX} />
                        </div>
                      </div>
                    </div>
                    <h3 className="welcome-step-title">{t(item.title)}</h3>
                    <p className="welcome-step-body">{t(item.body)}</p>
                  </div>
                  {!isLast && <div className="welcome-step-connector" aria-hidden />}
                </React.Fragment>
              );
            })}
          </div>
        </section>

        <footer className="welcome-footer-wrap">
          <Footer />
        </footer>
      </div>
    </div>
  );
}

export default Welcome;
