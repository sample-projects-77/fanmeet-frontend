import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import './FanPlaceholder.css';
import './FanProfileEdit.css';

function BackLink() {
  return (
    <header className="fan-placeholder-nav">
      <Link to="/fan/profile">← Profile</Link>
    </header>
  );
}

export function FanProfileChangePassword() {
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
      setError('Please fill in both fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await authAPI.changePassword(oldPassword, newPassword);
      if (res.StatusCode === 200) {
        setSuccess(res.data?.message || 'Password updated successfully.');
        setOldPassword('');
        setNewPassword('');
      } else {
        setError(res.error || 'Could not change password.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fan-profile-edit-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label="Back">
          ←
        </Link>
        <h1 className="fan-profile-edit-title">Change Password</h1>
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
            <label htmlFor="oldPassword">Current password <span className="required">*</span></label>
            <input
              type="password"
              id="oldPassword"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="fan-profile-edit-field">
            <label htmlFor="newPassword">New password <span className="required">*</span></label>
            <input
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <button
            type="submit"
            className="fan-profile-edit-submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? <ButtonLoadingSpinner /> : 'Save Password'}
          </button>
        </form>
      </main>
    </div>
  );
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
];

export function FanProfileLanguage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locale, setLocale] = useState('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef(null);

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
      if (u.language && (u.language === 'en' || u.language === 'de')) {
        setLocale(u.language);
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

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
        setSuccess('Language updated successfully.');
        const updatedUser = { ...(user || {}), language: res.data.language || locale };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setError(res.error || 'Could not update language.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fan-profile-edit-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label="Back">
          ←
        </Link>
        <h1 className="fan-profile-edit-title">Change Language</h1>
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
            <label htmlFor="language-trigger">Language</label>
            <div className="fan-profile-edit-language-dropdown">
              <button
                id="language-trigger"
                type="button"
                className="fan-profile-edit-language-trigger"
                onClick={() => setLanguageDropdownOpen((open) => !open)}
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
              >
                <span>{LANGUAGE_OPTIONS.find((o) => o.value === locale)?.label ?? 'English'}</span>
                <span className="fan-profile-edit-language-chevron" aria-hidden>▼</span>
              </button>
              {languageDropdownOpen && (
                <ul
                  className="fan-profile-edit-language-options"
                  role="listbox"
                  aria-label="Language options"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <li key={opt.value} role="option" aria-selected={locale === opt.value}>
                      <button
                        type="button"
                        className={`fan-profile-edit-language-option ${locale === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setLocale(opt.value);
                          setLanguageDropdownOpen(false);
                        }}
                      >
                        {opt.label}
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
            {saving ? <ButtonLoadingSpinner /> : 'Save Language'}
          </button>
        </form>
      </main>
    </div>
  );
}

export function FanProfileBlocked() {
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
          setError(res.error || 'Failed to load blocked users.');
          setBlocked([]);
        }
      } catch (err) {
        if (!append) {
          setError(
            err.response?.data?.error ||
              err.message ||
              'Something went wrong.'
          );
          setBlocked([]);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) return;
    fetchBlocked(1, false);
  }, [user, fetchBlocked]);

  const handleUnblock = async (blockedUser) => {
    if (!window.confirm(`Unblock ${blockedUser.displayName || blockedUser.userName || 'this user'}?`)) {
      return;
    }
    try {
      const res = await userAPI.unblockUser(blockedUser.userId);
      if (res.StatusCode === 200) {
        setBlocked((prev) => prev.filter((b) => b.userId !== blockedUser.userId));
      } else {
        alert(res.error || 'Could not unblock user.');
      }
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.message ||
          'Something went wrong.'
      );
    }
  };

  if (!user) return null;

  return (
    <div className="fan-search-page">
      <header className="fan-profile-edit-header">
        <Link to="/fan/profile" className="fan-profile-edit-back" aria-label="Back">
          ←
        </Link>
        <h1 className="fan-profile-edit-title">Blocked Users</h1>
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
            <EmptyWidget text="You have not blocked any users." />
          ) : (
            <div className="fan-search-grid">
              {blocked.map((b) => (
                <div key={b.id} className="fan-creator-card">
                  <div className="fan-creator-avatar-wrap">
                    <img
                      src={b.avatarUrl || DEFAULT_AVATAR_URL}
                      alt=""
                      className="fan-creator-avatar-img"
                    />
                  </div>
                  <div className="fan-creator-info">
                    <span className="fan-creator-name">
                      {b.displayName || b.userName || 'User'}
                    </span>
                    <span className="fan-creator-category">
                      {b.reason || 'Blocked user'}
                    </span>
                  </div>
                  <div className="fan-creator-meta">
                    <button
                      type="button"
                      className="fan-search-load-more"
                      onClick={() => handleUnblock(b)}
                    >
                      Unblock
                    </button>
                  </div>
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
                Load more
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
