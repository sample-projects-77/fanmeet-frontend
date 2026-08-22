import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import MicOutlined from '@mui/icons-material/MicOutlined';
import CallEnd from '@mui/icons-material/CallEnd';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import WorkOutline from '@mui/icons-material/WorkOutline';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import SpaOutlined from '@mui/icons-material/SpaOutlined';
import MusicNoteOutlined from '@mui/icons-material/MusicNoteOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import TheaterComedyOutlined from '@mui/icons-material/TheaterComedyOutlined';
import RocketLaunchOutlined from '@mui/icons-material/RocketLaunchOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import StarRounded from '@mui/icons-material/StarRounded';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import EuroOutlined from '@mui/icons-material/EuroOutlined';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggleButton from '../components/ThemeToggleButton';
import Footer from '../components/Footer';
import './Welcome.css';

/** Purple → sky-blue gradient for landing icons (matches SVG defs id below). */
const GRADIENT_ICON_SX = { fill: 'url(#welcome-icon-gradient)' };

const SAFE_ICONS = [GppGoodOutlined, VerifiedUserOutlined, CancelOutlined, LockOutlined];
const STEP_ICONS = [PersonAddAlt1Outlined, LocalOfferOutlined, CalendarMonthOutlined, VideocamOutlined];
const USE_CASES = [
  { labelKey: 'category.Fitness & Personal Training', Icon: FitnessCenterOutlined },
  { labelKey: 'category.Business & Consulting', Icon: WorkOutline },
  { labelKey: 'category.Education & Tutoring', Icon: SchoolOutlined },
  { labelKey: 'category.Health & Wellness', Icon: SpaOutlined },
  { labelKey: 'category.Music & Performing Arts', Icon: MusicNoteOutlined },
  { labelKey: 'category.Art & Design', Icon: PaletteOutlined },
  { labelKey: 'category.Entertainment & Influencing', Icon: TheaterComedyOutlined },
];

const PRICE_MIN = 10;
const PRICE_MAX = 2000;
const PRICE_STEP = 5;
const WEEK_MIN = 1;
const WEEK_MAX = 40;
const WEEKS_PER_MONTH = 4;

function formatEuro(amount, language) {
  return new Intl.NumberFormat(language?.startsWith('de') ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const DEFAULT_EXPLAINER_VIDEO_URL =
  'https://s3-fanmeet-bucket.s3.us-east-1.amazonaws.com/FAN+SESSION+V1.mp4';

function parseExplainerMedia(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (yt) return { type: 'youtube', id: yt[1] };

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: 'vimeo', id: vimeo[1] };

  return { type: 'file', src: trimmed };
}

function VideoCallMock({ t }) {
  return (
    <div className="welcome-mock" aria-hidden="true">
      <div className="welcome-mock-screen">
        <div className="welcome-mock-person">
          <img
            src="/images/welcome-mock-person.jpg"
            alt=""
            className="welcome-mock-avatar"
            draggable="false"
          />
        </div>
        <div className="welcome-mock-earnings">
          <Trans
            i18nKey="welcome.heroMockEarnings"
            components={{ amount: <strong className="welcome-mock-earnings-amount" /> }}
          />
        </div>
        <div className="welcome-mock-controls">
          <span className="welcome-mock-btn"><VideocamOutlined fontSize="small" /></span>
          <span className="welcome-mock-btn"><MicOutlined fontSize="small" /></span>
          <span className="welcome-mock-btn welcome-mock-btn--end"><CallEnd fontSize="small" /></span>
        </div>
      </div>
    </div>
  );
}

function ExplainerVideo({ t, steps }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const media = useMemo(
    () => parseExplainerMedia(
      process.env.REACT_APP_EXPLAINER_VIDEO_URL || DEFAULT_EXPLAINER_VIDEO_URL,
    ),
    [],
  );
  const hasFileVideo = media?.type === 'file';

  const playExplainerVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  };

  return (
    <section className="welcome-video" aria-labelledby="welcome-video-heading">
      <div className="welcome-video-layout">
        <div id="welcome-explainer-video" className="welcome-video-frame">
          {media?.type === 'youtube' && (
            <iframe
              className="welcome-video-embed"
              src={`https://www.youtube-nocookie.com/embed/${media.id}?rel=0`}
              title={t('welcome.videoTitle')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {media?.type === 'vimeo' && (
            <iframe
              className="welcome-video-embed"
              src={`https://player.vimeo.com/video/${media.id}`}
              title={t('welcome.videoTitle')}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
          {hasFileVideo && (
            <>
              <video
                ref={videoRef}
                className="welcome-video-embed"
                controls
                playsInline
                preload="metadata"
                title={t('welcome.videoTitle')}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={media.src} type="video/mp4" />
              </video>
              {!isPlaying && (
                <button
                  type="button"
                  className="welcome-video-center-play"
                  onClick={playExplainerVideo}
                  aria-label={t('welcome.videoWatch')}
                >
                  <PlayArrowRounded />
                </button>
              )}
            </>
          )}
          {!media && (
            <div className="welcome-video-placeholder">
              <div className="welcome-video-placeholder-steps" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className="welcome-video-placeholder-step">{n}</span>
                ))}
              </div>
              <div className="welcome-video-play" aria-hidden="true">
                <PlayArrowRounded />
              </div>
              <p className="welcome-video-soon">{t('welcome.videoSoon')}</p>
            </div>
          )}
        </div>
        <div className="welcome-video-copy">
          <h2 id="welcome-video-heading" className="welcome-section-title welcome-section-title--left">
            {t('welcome.videoTitle')}
          </h2>
          <p className="welcome-section-lead welcome-section-lead--left">{t('welcome.videoBody')}</p>
          {hasFileVideo && (
            <button
              type="button"
              className="welcome-video-watch"
              onClick={playExplainerVideo}
            >
              <PlayArrowRounded aria-hidden />
              {t('welcome.videoWatch')}
            </button>
          )}
        </div>
        <div className="welcome-how welcome-how--beside" aria-label={t('welcome.howTitle')}>
          <div className="welcome-steps">
            {steps.map((item, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div key={item.title} className="welcome-step">
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function EarningsCalculator({ t, language }) {
  const [price, setPrice] = useState(30);
  const [perWeek, setPerWeek] = useState(5);
  const perMonth = perWeek * WEEKS_PER_MONTH;
  const gross = price * perMonth;
  const pricePct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const weekPct = ((perWeek - WEEK_MIN) / (WEEK_MAX - WEEK_MIN)) * 100;

  return (
    <div className="welcome-calc">
      <h2 className="welcome-calc-title">{t('welcome.calcTitle')}</h2>

      <label className="welcome-calc-label" htmlFor="welcome-calc-price">
        <span>{t('welcome.calcPrice')}</span>
        <strong>{formatEuro(price, language)}</strong>
      </label>
      <input
        id="welcome-calc-price"
        className="welcome-calc-slider"
        type="range"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        style={{ '--pct': `${pricePct}%` }}
      />

      <label className="welcome-calc-label" htmlFor="welcome-calc-week">
        <span>{t('welcome.calcPerWeek')}</span>
        <strong>{perWeek}</strong>
      </label>
      <input
        id="welcome-calc-week"
        className="welcome-calc-slider"
        type="range"
        min={WEEK_MIN}
        max={WEEK_MAX}
        step={1}
        value={perWeek}
        onChange={(e) => setPerWeek(Number(e.target.value))}
        style={{ '--pct': `${weekPct}%` }}
      />

      <div className="welcome-calc-month">
        <span>{t('welcome.calcPerMonthLabel')}</span>
        <strong>{t('welcome.calcPerMonthValue', { sessions: perMonth })}</strong>
      </div>

      <div className="welcome-calc-result">
        <span className="welcome-calc-result-label">{t('welcome.calcIncome')}</span>
        <span className="welcome-calc-result-value">{formatEuro(gross, language)}</span>
        <span className="welcome-calc-result-note">{t('welcome.calcGross')}</span>
      </div>

      <p className="welcome-calc-disclaimer">{t('welcome.calcDisclaimer')}</p>
    </div>
  );
}

function CtaBlock({ t, variant = 'default' }) {
  const primaryClass =
    variant === 'onAccent'
      ? 'welcome-btn welcome-btn--on-accent'
      : 'welcome-btn welcome-btn--primary';
  const secondaryClass =
    variant === 'onAccent'
      ? 'welcome-btn welcome-btn--on-accent-secondary'
      : 'welcome-btn welcome-btn--secondary';

  return (
    <>
      <div className="welcome-actions">
        <Link to="/signup/creator" className={primaryClass}>
          <span className="welcome-btn-copy">
            <span className="welcome-btn-title">
              <PersonOutline className="welcome-btn-icon" aria-hidden />
              {t('welcome.signUpCreator')}
            </span>
            <span className="welcome-btn-hint">{t('welcome.signUpCreatorHint')}</span>
          </span>
        </Link>
        <Link to="/signup/fan" className={secondaryClass}>
          <span className="welcome-btn-copy">
            <span className="welcome-btn-title">
              <PersonOutline className="welcome-btn-icon" aria-hidden />
              {t('welcome.signUpFan')}
            </span>
            <span className="welcome-btn-hint">{t('welcome.signUpFanHint')}</span>
          </span>
        </Link>
      </div>
      <p className="welcome-login">
        {t('welcome.alreadyHaveAccount')}{' '}
        <Link to="/login" className="welcome-login-link">{t('welcome.logIn')}</Link>
      </p>
    </>
  );
}

function Welcome() {
  const { t, i18n } = useTranslation();

  const featureItems = [
    {
      line1: 'welcome.featurePriceLine1',
      line2: 'welcome.featurePriceLine2',
      Icon: LocalOfferOutlined,
    },
    {
      line1: 'welcome.featureScheduleLine1',
      line2: 'welcome.featureScheduleLine2',
      Icon: CalendarMonthOutlined,
    },
    {
      line1: 'welcome.featureFreeLine1',
      line2: 'welcome.featureFreeLine2',
      Icon: RocketLaunchOutlined,
    },
  ];

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

  const supportKeys = ['welcome.support1', 'welcome.support2', 'welcome.support3'];
  const badgeKeys = [
    { key: 'welcome.badgePay', Icon: LockOutlined },
    { key: 'welcome.badgeNoSub', Icon: CancelOutlined },
    { key: 'welcome.badgePrivacy', Icon: VerifiedUserOutlined },
  ];

  return (
    <div className="welcome-page">
      <svg className="welcome-gradient-defs" width={0} height={0} aria-hidden focusable="false">
        <defs>
          <linearGradient id="welcome-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      <header className="welcome-topbar">
        <div className="welcome-brand">
          <img
            src={`${process.env.PUBLIC_URL || ''}/logo.png`}
            alt=""
            className="welcome-brand-logo"
          />
          <span className="welcome-brand-name">{t('welcome.title')}</span>
        </div>
        <div className="welcome-topbar-actions">
          <ThemeToggleButton />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="welcome-inner">
        <section className="welcome-hero">
          <div className="welcome-hero-copy">
            <p className="welcome-eyebrow">{t('welcome.eyebrow')}</p>
            <h1 className="welcome-headline">
              <Trans
                i18nKey="welcome.headline"
                components={{
                  money: <span className="welcome-headline-accent" />,
                  followers: <span className="welcome-headline-accent" />,
                }}
              />
            </h1>
            <p className="welcome-hero-line1">
              <Trans
                i18nKey="welcome.heroLine1"
                components={{
                  calls: <span className="welcome-hero-accent welcome-hero-accent--purple" />,
                }}
              />
            </p>
            <p className="welcome-hero-line2">{t('welcome.heroLine2')}</p>
          </div>

          <ul className="welcome-features" aria-label={t('welcome.trustAria')}>
            {featureItems.map(({ line1, line2, Icon }) => (
              <li key={line1} className="welcome-feature">
                <span className="welcome-feature-icon" aria-hidden>
                  <Icon className="welcome-feature-icon-svg" sx={GRADIENT_ICON_SX} />
                </span>
                <span className="welcome-feature-text">
                  <span className="welcome-feature-line1">{t(line1)}</span>
                  <span className="welcome-feature-line2">{t(line2)}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="welcome-hero-cta">
            <CtaBlock t={t} />
          </div>

          <VideoCallMock t={t} />
        </section>

        <ExplainerVideo t={t} steps={stepKeys} />

        <section className="welcome-stats" aria-label={t('welcome.trustAria')}>
          <div className="welcome-stats-rating">
            <div className="welcome-stats-avatars" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`welcome-stats-avatar welcome-stats-avatar--${i}`} />
              ))}
            </div>
            <div className="welcome-stats-rating-copy">
              <span className="welcome-stats-stars" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarRounded key={i} fontSize="inherit" />
                ))}
              </span>
              <p className="welcome-stats-rating-text">
                <strong>{t('welcome.statsScore')}</strong>
                {' '}
                <span>{t('welcome.statsRatingLabel')}</span>
              </p>
            </div>
          </div>

          <div className="welcome-stats-metrics">
            <div className="welcome-stats-metric">
              <PeopleAltOutlined className="welcome-stats-metric-icon" aria-hidden />
              <div className="welcome-stats-metric-copy">
                <strong>{t('welcome.statsCreatorsValue')}</strong>
                <span>{t('welcome.statsCreatorsLabel')}</span>
              </div>
            </div>
            <div className="welcome-stats-metric">
              <EventAvailableOutlined className="welcome-stats-metric-icon" aria-hidden />
              <div className="welcome-stats-metric-copy">
                <strong>{t('welcome.statsSessionsValue')}</strong>
                <span>{t('welcome.statsSessionsLabel')}</span>
              </div>
            </div>
            <div className="welcome-stats-metric">
              <EuroOutlined className="welcome-stats-metric-icon" aria-hidden />
              <div className="welcome-stats-metric-copy">
                <strong>{t('welcome.statsPayoutsValue')}</strong>
                <span>{t('welcome.statsPayoutsLabel')}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="welcome-reassure">
          <div className="welcome-reassure-col">
            <h2 className="welcome-reassure-title">{t('welcome.safeTitle')}</h2>
            <ul className="welcome-reassure-list">
              {safeKeys.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <CheckCircleOutline className="welcome-reassure-check" aria-hidden />
                  <span>
                    <strong>{t(item.title)}</strong>
                    {' — '}
                    {t(item.body)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="welcome-reassure-col">
            <h2 className="welcome-reassure-title">{t('welcome.supportTitle')}</h2>
            <ul className="welcome-reassure-list">
              {supportKeys.map((key) => (
                <li key={key}>
                  <CheckCircleOutline className="welcome-reassure-check" aria-hidden />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="welcome-split" aria-labelledby="welcome-use-heading">
          <div className="welcome-usecases">
            <h2 id="welcome-use-heading" className="welcome-section-title welcome-section-title--left">
              {t('welcome.useCasesTitle')}
            </h2>
            <p className="welcome-section-lead welcome-section-lead--left">
              {t('welcome.useCasesBody')}
            </p>
            <ul className="welcome-usecase-list">
              {USE_CASES.map(({ labelKey, Icon }) => (
                <li key={labelKey} className="welcome-usecase">
                  <Icon className="welcome-usecase-icon" sx={GRADIENT_ICON_SX} aria-hidden />
                  <span>{t(labelKey)}</span>
                </li>
              ))}
            </ul>
          </div>
          <EarningsCalculator t={t} language={i18n.language} />
        </section>

        <section className="welcome-safe" aria-labelledby="welcome-safe-heading">
          <h2 id="welcome-safe-heading" className="welcome-section-title">
            {t('welcome.safeTitle')}
          </h2>
          <p className="welcome-section-lead">{t('welcome.safeIntro')}</p>
          <p className="welcome-safe-ban">{t('welcome.safeBan')}</p>
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

        <section className="welcome-final-cta" aria-labelledby="welcome-final-heading">
          <div className="welcome-final-copy">
            <h2 id="welcome-final-heading" className="welcome-final-title">
              {t('welcome.ctaTitle')}
            </h2>
            <p className="welcome-final-body">{t('welcome.ctaBody')}</p>
          </div>
          <div className="welcome-final-actions">
            <CtaBlock t={t} variant="onAccent" />
          </div>
        </section>

        <div className="welcome-trust-badges" aria-label={t('welcome.trustAria')}>
          {badgeKeys.map(({ key, Icon }) => (
            <div key={key} className="welcome-trust-badge">
              <Icon className="welcome-trust-badge-icon" aria-hidden />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>

        <footer className="welcome-footer-wrap">
          <Footer />
        </footer>
      </div>
    </div>
  );
}

export default Welcome;
