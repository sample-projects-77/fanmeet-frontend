import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { referralAPI } from '../services/api';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './CreatorReferrals.css';

function formatDate(value, locale) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(value);
  }
}

function CreatorReferrals() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState({ sent: 0, signedUp: 0 });
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

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

  const loadReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await referralAPI.getMyReferrals();
      if (res.StatusCode === 200 && res.data) {
        setReferralLink(res.data.referralLink || '');
        setStats(res.data.stats || { sent: 0, signedUp: 0 });
        setInvites(Array.isArray(res.data.invites) ? res.data.invites : []);
      } else {
        setError(res.error || t('referral.loadError'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t('referral.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await referralAPI.getMyReferrals();
        if (cancelled) return;
        if (res.StatusCode === 200 && res.data) {
          setReferralLink(res.data.referralLink || '');
          setStats(res.data.stats || { sent: 0, signedUp: 0 });
          setInvites(Array.isArray(res.data.invites) ? res.data.invites : []);
        } else {
          setError(res.error || t('referral.loadError'));
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.error ||
            err.message ||
            t('referral.loadError')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, t]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFormError(t('referral.copyFailed'));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError(t('referral.emailRequired'));
      return;
    }
    setSending(true);
    setFormError('');
    setFormMessage('');
    try {
      const res = await referralAPI.sendInvite(trimmed);
      if (res.StatusCode === 200 && !res.error) {
        setFormMessage(t('referral.sendSuccess'));
        setEmail('');
        await loadReferrals();
      } else {
        setFormError(res.error || t('referral.sendFailed'));
      }
    } catch (err) {
      setFormError(
        err.response?.data?.error ||
          err.message ||
          t('referral.sendFailed')
      );
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="referral-page">
      <header className="referral-header">
        <Link to="/creator/profile" className="referral-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="referral-header-title">{t('referral.title')}</h1>
      </header>

      <main className="referral-main">
        <section className="referral-intro">
          <p className="referral-lead">{t('referral.lead')}</p>
          <p className="referral-body">{t('referral.howItWorks')}</p>
          <ol className="referral-steps">
            <li>{t('referral.step1')}</li>
            <li>{t('referral.step2')}</li>
            <li>{t('referral.step3')}</li>
          </ol>
          <p className="referral-note">{t('referral.earningsNote')}</p>
        </section>

        {loading ? (
          <div className="referral-loading">
            <ButtonLoadingSpinner />
          </div>
        ) : error ? (
          <div className="referral-banner referral-banner--error" role="alert">
            {error}
            <button type="button" className="referral-retry" onClick={loadReferrals}>
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        ) : (
          <>
            <section className="referral-link-card">
              <h2 className="referral-section-title">{t('referral.yourLink')}</h2>
              <div className="referral-link-row">
                <input
                  type="text"
                  className="referral-link-input"
                  value={referralLink}
                  readOnly
                  aria-label={t('referral.yourLink')}
                />
                <button type="button" className="referral-copy-btn" onClick={handleCopy}>
                  {copied ? t('referral.copied') : t('referral.copy')}
                </button>
              </div>
              <div className="referral-stats">
                <div className="referral-stat">
                  <span className="referral-stat-value">{stats.sent}</span>
                  <span className="referral-stat-label">{t('referral.statSent')}</span>
                </div>
                <div className="referral-stat">
                  <span className="referral-stat-value">{stats.signedUp}</span>
                  <span className="referral-stat-label">{t('referral.statSignedUp')}</span>
                </div>
              </div>
            </section>

            <section className="referral-invite-card">
              <h2 className="referral-section-title">{t('referral.sendTitle')}</h2>
              <p className="referral-invite-hint">{t('referral.sendHint')}</p>
              <form className="referral-invite-form" onSubmit={handleSend}>
                <label htmlFor="referral-email" className="referral-label">
                  {t('referral.emailLabel')}
                </label>
                <input
                  id="referral-email"
                  type="email"
                  className="referral-email-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError('');
                    setFormMessage('');
                  }}
                  placeholder={t('referral.emailPlaceholder')}
                  autoComplete="email"
                  disabled={sending}
                  required
                />
                {formError && (
                  <p className="referral-form-msg referral-form-msg--error" role="alert">
                    {formError}
                  </p>
                )}
                {formMessage && (
                  <p className="referral-form-msg referral-form-msg--ok">{formMessage}</p>
                )}
                <button type="submit" className="referral-send-btn" disabled={sending}>
                  {sending ? <ButtonLoadingSpinner /> : t('referral.sendButton')}
                </button>
              </form>
            </section>

            <section className="referral-history-card">
              <h2 className="referral-section-title">{t('referral.historyTitle')}</h2>
              {invites.length === 0 ? (
                <p className="referral-empty">{t('referral.historyEmpty')}</p>
              ) : (
                <ul className="referral-invite-list">
                  {invites.map((invite) => (
                    <li key={invite.id} className="referral-invite-item">
                      <div className="referral-invite-main">
                        <span className="referral-invite-email">{invite.email}</span>
                        <span
                          className={`referral-status referral-status--${invite.status === 'signed_up' ? 'joined' : 'sent'}`}
                        >
                          {invite.status === 'signed_up'
                            ? t('referral.statusSignedUp')
                            : t('referral.statusSent')}
                        </span>
                      </div>
                      <div className="referral-invite-meta">
                        <span>
                          {t('referral.sentAt')}: {formatDate(invite.emailSentAt, i18n.language)}
                        </span>
                        {invite.signedUpAt && (
                          <span>
                            {t('referral.joinedAt')}: {formatDate(invite.signedUpAt, i18n.language)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default CreatorReferrals;
