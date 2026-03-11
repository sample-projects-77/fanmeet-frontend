import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, userAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import { setAppLanguage, SUPPORTED } from '../i18n';
import './FanPlaceholder.css';
import './FanProfileEdit.css';

function BackLink() {
  const { t } = useTranslation();
  return (
    <header className="fan-placeholder-nav">
      <Link to="/fan/profile">← {t('nav.profile')}</Link>
    </header>
  );
}

export function FanProfileChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword) {
      setError(t('profileChangePassword.fillBoth'));
      return;
    }

    setSaving(true);
    try {
      const res = await authAPI.changePassword(oldPassword, newPassword);
      if (res.StatusCode === 200) {
        setSuccess(res.data?.message || t('profileChangePassword.success'));
        setOldPassword('');
        setNewPassword('');
      } else {
        setError(res.error || t('profileChangePassword.couldNotChange'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t('common.errorGeneric')
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fan-profile-edit-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="fan-profile-edit-title">{t('profileChangePassword.title')}</h1>
      </header>

      <main className="fan-profile-edit-main">
        <form onSubmit={handleSubmit} className="fan-profile-edit-form">
          {error && (
            <div className="fan-profile-edit-error">{error}</div>
          )}
          {success && !error && (
            <div className="fan-profile-edit-success">{success}</div>
          )}

          <div className="fan-profile-edit-field">
            <label htmlFor="oldPassword">{t('profileChangePassword.currentPassword')} <span className="required">*</span></label>
            <input
              type="password"
              id="oldPassword"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={t('profileChangePassword.enterCurrent')}
              required
            />
          </div>

          <div className="fan-profile-edit-field">
            <label htmlFor="newPassword">{t('profileChangePassword.newPassword')} <span className="required">*</span></label>
            <input
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('profileChangePassword.enterNew')}
              required
            />
          </div>

          <button
            type="submit"
            className="fan-profile-edit-submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? <ButtonLoadingSpinner /> : t('profileChangePassword.savePassword')}
          </button>
        </form>
      </main>
    </div>
  );
}

export function FanProfileLanguage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locale, setLocale] = useState(() => i18n.language || 'de');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef(null);

  const languageLabels = { en: t('language.english'), de: t('language.german') };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      const u = JSON.parse(userJson);
      setUser(u);
      if (u.language && SUPPORTED.includes(u.language)) {
        setLocale(u.language);
      } else {
        setLocale(i18n.language || 'de');
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate, i18n.language]);

  useEffect(() => {
    if (!languageDropdownOpen) return;
    function handleClickOutside(e) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) {
        setLanguageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [languageDropdownOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);
    try {
      const res = await userAPI.updateLanguage(locale);
      if (res.StatusCode === 200 && res.data) {
        setSuccess(t('language.updated'));
        const updatedUser = { ...(user || {}), language: res.data.language || locale };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setAppLanguage(locale, true);
      } else {
        setError(res.error || t('language.updateFailed'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t('common.errorGeneric')
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fan-profile-edit-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="fan-profile-edit-title">{t('profile.changeLanguage')}</h1>
      </header>

      <main className="fan-profile-edit-main">
        <form onSubmit={handleSubmit} className="fan-profile-edit-form">
          {error && (
            <div className="fan-profile-edit-error">{error}</div>
          )}
          {success && !error && (
            <div className="fan-profile-edit-success">{success}</div>
          )}

          <div className="fan-profile-edit-field" ref={languageDropdownRef}>
            <label htmlFor="language-trigger">{t('language.label')}</label>
            <div className="fan-profile-edit-language-dropdown">
              <button
                id="language-trigger"
                type="button"
                className="fan-profile-edit-language-trigger"
                onClick={() => setLanguageDropdownOpen((open) => !open)}
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('language.select')}
              >
                <span>{languageLabels[locale] ?? languageLabels.de}</span>
                <span className="fan-profile-edit-language-chevron" aria-hidden>▼</span>
              </button>
              {languageDropdownOpen && (
                <ul
                  className="fan-profile-edit-language-options"
                  role="listbox"
                  aria-label={t('language.options')}
                >
                  {SUPPORTED.map((value) => (
                    <li key={value} role="option" aria-selected={locale === value}>
                      <button
                        type="button"
                        className={`fan-profile-edit-language-option ${locale === value ? 'selected' : ''}`}
                        onClick={() => {
                          setLocale(value);
                          setLanguageDropdownOpen(false);
                        }}
                      >
                        {languageLabels[value]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="fan-profile-edit-submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? <ButtonLoadingSpinner /> : t('language.save')}
          </button>
        </form>
      </main>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UnblockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function FanProfileBlocked() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const fetchBlocked = React.useCallback(
    async (page = 1, append = false) => {
      setLoading(true);
      if (!append) setError('');
      try {
        const res = await userAPI.listBlockedUsers(page, 20);
        if (res.StatusCode === 200 && res.data) {
          const list = res.data.blockedUsers || [];
          setBlocked((prev) => (append ? [...prev, ...list] : list));
          setPagination(res.data.pagination || null);
        } else if (!append) {
          setError(res.error || t('profileBlocked.failedToLoad'));
          setBlocked([]);
        }
      } catch (err) {
        if (!append) {
          setError(
            err.response?.data?.error ||
              err.message ||
              t('common.errorGeneric')
          );
          setBlocked([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!user) return;
    fetchBlocked(1, false);
  }, [user, fetchBlocked]);

  const handleUnblock = async (blockedUser) => {
    try {
      const res = await userAPI.unblockUser(blockedUser.userId);
      if (res.StatusCode === 200) {
        fetchBlocked(1, false);
      }
    } catch (_) {}
  };

  const formatBlockedDate = (dateVal) => {
    if (!dateVal) return '';
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="fan-search-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="fan-profile-edit-title">{t('profileBlocked.title')}</h1>
      </header>

      <main className="fan-search-main">
        <div className="fan-search-container">
          {error && (
            <div className="fan-search-error">{error}</div>
          )}
          {loading && blocked.length === 0 ? (
            <div className="fan-search-loading">
              <LoadingSpinner />
            </div>
          ) : blocked.length === 0 ? (
            <EmptyWidget text={t('profileBlocked.empty')} />
          ) : (
            <div className="profile-blocked-list">
              {blocked.map((b) => (
                <div key={b.id} className="profile-blocked-card">
                  <div className="profile-blocked-card-top">
                    <div className="profile-blocked-card-avatar">
                      <img
                        src={b.avatarUrl || DEFAULT_AVATAR_URL}
                        alt=""
                        className="profile-blocked-card-avatar-img"
                      />
                    </div>
                    <div className="profile-blocked-card-body">
                      <span className="profile-blocked-card-name">
                        {b.displayName || b.userName || t('profileBlocked.thisUser')}
                      </span>
                      <span className="profile-blocked-card-date">
                        <CalendarIcon />
                        {formatBlockedDate(b.blockedAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="profile-blocked-card-unblock"
                    onClick={() => handleUnblock(b)}
                  >
                    <UnblockIcon />
                    <span>{t('profileBlocked.unblock')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {pagination?.hasNextPage && !loading && blocked.length > 0 && (
            <div className="fan-search-more">
              <button
                type="button"
                className="fan-search-load-more"
                onClick={() => fetchBlocked(pagination.currentPage + 1, true)}
              >
                {t('common.loadMore')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
