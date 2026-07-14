import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import useCreatorPayoutStatus from '../hooks/useCreatorPayoutStatus';
import './CreatorPayoutGuide.css';

const MOLLIE_DASHBOARD_URL = 'https://my.mollie.com/dashboard';

const STEPS = [
  { n: 1 },
  { n: 2 },
  { n: 3, list: 5, listIntro: true, extra: true },
  { n: 4, list: 3, listIntro: true, footer: true },
  { n: 5, ensureList: 3 },
  { n: 6 },
  { n: 7, list: 4, listIntro: true, extra: true },
  { n: 8, extra: true, extra2: true },
  { n: 9, extra: true },
  { n: 10, numberedList: 6, extra: true },
];

const CHANGE_KEYS = [1, 2, 3, 4];
const DECISION_KEYS = [1, 2, 3, 4];
const NOTICE_KEYS = [1, 2, 3, 4];

function GuideList({ prefix, count }) {
  const { t } = useTranslation();
  return (
    <ul className="payout-guide-list">
      {Array.from({ length: count }, (_, i) => (
        <li key={i + 1}>{t(`${prefix}${i + 1}`)}</li>
      ))}
    </ul>
  );
}

function CreatorPayoutGuide() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(userJson);
      const role = String(parsed?.role || '').toLowerCase();
      if (role !== 'creator') {
        navigate('/fan/profile', { replace: true });
        return;
      }
      setUser(parsed);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const {
    connectStatus,
    loading: statusLoading,
    payoutLoading,
    setupPayout,
    canReceivePayments,
  } = useCreatorPayoutStatus(!!user?.id);

  const handleConnect = () => {
    setupPayout({
      error: t('profile.payoutSetupError'),
    });
  };

  const statusVariant = canReceivePayments
    ? 'connected'
    : connectStatus?.onboarded
      ? 'pending'
      : 'not-started';

  const statusLabel = canReceivePayments
    ? t('payoutGuide.statusConnected')
    : connectStatus?.onboarded
      ? t('payoutGuide.statusPending')
      : t('payoutGuide.statusNotStarted');

  if (!user) return null;

  return (
    <div className="payout-guide-page">
      <header className="payout-guide-header">
        <Link to="/creator/profile" className="payout-guide-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="payout-guide-header-title">{t('payoutGuide.title')}</h1>
      </header>

      <main className="payout-guide-main">
        <p className="payout-guide-intro">{t('payoutGuide.intro1')}</p>
        <p className="payout-guide-intro">{t('payoutGuide.intro2')}</p>
        <p className="payout-guide-intro payout-guide-intro--emphasis">{t('payoutGuide.intro3')}</p>

        <div className={`payout-guide-status payout-guide-status--${statusVariant}`}>
          <span className="payout-guide-status-dot" aria-hidden />
          <div className="payout-guide-status-text">
            <strong>{statusLabel}</strong>
            {!statusLoading && (
              <span>
                {canReceivePayments
                  ? t('payoutGuide.statusConnectedHint')
                  : connectStatus?.onboarded
                    ? t('payoutGuide.statusPendingHint')
                    : t('payoutGuide.statusNotStartedHint')}
              </span>
            )}
          </div>
        </div>

        <section className="payout-guide-section">
          <ol className="payout-guide-steps">
            {STEPS.map((step) => (
              <li key={step.n} className="payout-guide-step">
                <div className="payout-guide-step-number">{step.n}</div>
                <div className="payout-guide-step-content">
                  <h3>{t(`payoutGuide.step${step.n}Title`)}</h3>
                  <p>{t(`payoutGuide.step${step.n}Body`)}</p>
                  {step.list && (
                    <>
                      {step.listIntro && (
                        <p className="payout-guide-step-list-intro">
                          {t(`payoutGuide.step${step.n}ListIntro`)}
                        </p>
                      )}
                      <GuideList prefix={`payoutGuide.step${step.n}Item`} count={step.list} />
                    </>
                  )}
                  {step.ensureList && (
                    <>
                      <p className="payout-guide-step-list-intro">
                        {t(`payoutGuide.step${step.n}EnsureIntro`)}
                      </p>
                      <GuideList prefix={`payoutGuide.step${step.n}Ensure`} count={step.ensureList} />
                    </>
                  )}
                  {step.numberedList && (
                    <>
                      {step.flowIntro && (
                        <p className="payout-guide-step-list-intro">
                          {t(`payoutGuide.step${step.n}FlowIntro`)}
                        </p>
                      )}
                      <ol className="payout-guide-numbered-list">
                        {Array.from({ length: step.numberedList }, (_, i) => (
                          <li key={i + 1}>{t(`payoutGuide.step${step.n}Flow${i + 1}`)}</li>
                        ))}
                      </ol>
                    </>
                  )}
                  {step.footer && (
                    <p className="payout-guide-step-footer">{t(`payoutGuide.step${step.n}Footer`)}</p>
                  )}
                  {step.extra && (
                    <p className="payout-guide-step-footer">{t(`payoutGuide.step${step.n}Extra`)}</p>
                  )}
                  {step.extra2 && (
                    <p className="payout-guide-step-footer">{t(`payoutGuide.step${step.n}Extra2`)}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.whenTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.whenBody1')}</p>
          <p className="payout-guide-card-body">{t('payoutGuide.whenBody2')}</p>
          <GuideList prefix="payoutGuide.whenItem" count={3} />
          <p className="payout-guide-note">{t('payoutGuide.whenNote')}</p>
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.newCreatorsTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.newCreatorsBody1')}</p>
          <p className="payout-guide-card-body">{t('payoutGuide.newCreatorsBody2')}</p>
          <p className="payout-guide-note">{t('payoutGuide.newCreatorsNote')}</p>
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.changesTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.changesBody')}</p>
          <p className="payout-guide-step-list-intro">{t('payoutGuide.changesIntro')}</p>
          <GuideList prefix="payoutGuide.changeItem" count={CHANGE_KEYS.length} />
          <p className="payout-guide-note">{t('payoutGuide.changesNote')}</p>
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.incompleteTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.incompleteBody1')}</p>
          <p className="payout-guide-card-body">{t('payoutGuide.incompleteBody2')}</p>
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.whoDecidesTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.whoDecidesBody')}</p>
          <p className="payout-guide-step-list-intro">{t('payoutGuide.whoDecidesIntro')}</p>
          <GuideList prefix="payoutGuide.whoItem" count={DECISION_KEYS.length} />
        </section>

        <section className="payout-guide-card">
          <h2 className="payout-guide-card-title">{t('payoutGuide.noticeTitle')}</h2>
          <p className="payout-guide-card-body">{t('payoutGuide.noticeIntro')}</p>
          <ul className="payout-guide-checklist">
            {NOTICE_KEYS.map((key) => (
              <li key={key}>
                <span className="payout-guide-check-icon" aria-hidden>✓</span>
                {t(`payoutGuide.noticeItem${key}`)}
              </li>
            ))}
          </ul>
          <p className="payout-guide-card-body" style={{ marginTop: 16 }}>
            {t('payoutGuide.noticeBody')}
          </p>
          <p className="payout-guide-note">{t('payoutGuide.noticeDisclaimer')}</p>
        </section>

        <div className="payout-guide-actions">
          {!canReceivePayments && !connectStatus?.devBypass && (
            <button
              type="button"
              className="payout-guide-cta"
              onClick={handleConnect}
              disabled={payoutLoading || statusLoading}
            >
              {payoutLoading ? <ButtonLoadingSpinner /> : t('payoutGuide.connectCta')}
            </button>
          )}
          <a
            href={MOLLIE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="payout-guide-secondary-cta"
          >
            {t('payoutGuide.openMollieDashboard')}
          </a>
          <Link to="/creator/profile" className="payout-guide-back-link">
            ← {t('payoutGuide.backToProfile')}
          </Link>
        </div>
      </main>
    </div>
  );
}

export default CreatorPayoutGuide;
