import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import './FanProfileEdit.css';

function FanProfileEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreator = location.pathname.startsWith('/creator');
  const profilePath = isCreator ? '/creator/profile' : '/fan/profile';

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userName, setUserName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [hourlyRateEur, setHourlyRateEur] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      setUserName(u.userName || '');
      setAvatarPreview(u.avatarUrl || null);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!isCreator) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (cancelled || res.StatusCode !== 200 || !res.data) return;
        setProfile(res.data);
        setCoverPreview(res.data.coverPhoto || null);
        setHourlyRateEur(
          res.data.hourlyRateCents != null && res.data.hourlyRateCents !== ''
            ? String(res.data.hourlyRateCents / 100)
            : ''
        );
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [isCreator]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarFile(file);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCoverFile(file);
  };

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userName.trim()) {
      setError(t('profileEdit.usernameRequired'));
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('userName', userName.trim());
      if (avatarFile) formData.append('avatarUrl', avatarFile);
      if (isCreator) {
        if (coverFile) formData.append('coverPhoto', coverFile);
        const cents =
          hourlyRateEur.trim() === ''
            ? ''
            : Math.round(parseFloat(hourlyRateEur.replace(',', '.')) * 100);
        if (cents !== '' && !Number.isNaN(cents) && cents >= 0) {
          formData.append('hourlyRateCents', String(cents));
        }
      }

      const updateProfile = isCreator ? profileAPI.updateCreatorProfile : profileAPI.updateFanProfile;
      const res = await updateProfile(formData);
      if (res.StatusCode === 200 && res.data) {
        const d = res.data;
        const updated = {
          ...user,
          userName: d.userName !== undefined && d.userName !== null ? d.userName : user.userName,
          email: d.email !== undefined && d.email !== null ? d.email : user.email,
          avatarUrl: d.avatarUrl ?? user.avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(updated));
        if (isCreator && res.data.coverPhoto != null) {
          setCoverPreview(res.data.coverPhoto);
          setProfile((p) => (p ? { ...p, coverPhoto: res.data.coverPhoto } : null));
        }
        navigate(profilePath, { replace: true });
      } else {
        setError(res.error || t('profileEdit.failedToSave'));
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
        <Link to={profilePath} className="fan-profile-edit-back" aria-label={t('common.back')}>
          ←
        </Link>
        <h1 className="fan-profile-edit-title">{t('profileEdit.title')}</h1>
      </header>

      <main className="fan-profile-edit-main">
        <form onSubmit={handleSubmit} className="fan-profile-edit-form">
          {isCreator && (
            <label className="fan-profile-edit-cover-wrap">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleCoverChange}
                className="fan-profile-edit-cover-input"
              />
              <div className="fan-profile-edit-cover-inner">
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="fan-profile-edit-cover-img" />
                ) : (
                  <span className="fan-profile-edit-cover-placeholder">{t('profileEdit.uploadCoverPhoto')}</span>
                )}
              </div>
            </label>
          )}

          <div className="fan-profile-edit-avatar-wrap">
            <div className="fan-profile-edit-avatar-box">
              <img
                src={avatarPreview || user?.avatarUrl || DEFAULT_AVATAR_URL}
                alt=""
                className="fan-profile-edit-avatar-img"
              />
            </div>
            <label className="fan-profile-edit-camera-btn" aria-label={t('profileEdit.changePhoto')}>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="fan-profile-edit-camera-input"
              />
              <CameraIcon />
            </label>
          </div>

          {error && (
            <div className="fan-profile-edit-error">{error}</div>
          )}

          <div className="fan-profile-edit-field">
            <label htmlFor="userName">{t('auth.username')} <span className="required">*</span></label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder={t('auth.usernamePlaceholder')}
              autoComplete="username"
            />
          </div>

          <div className="fan-profile-edit-field">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              value={user.email || ''}
              readOnly
              disabled
              className="fan-profile-edit-input-readonly"
              aria-label="Email (read-only)"
            />
          </div>

          {isCreator && (
            <div className="fan-profile-edit-field">
              <label htmlFor="hourlyRate">{t('profileEdit.hourlyRateEur')}</label>
              <input
                type="text"
                id="hourlyRate"
                value={hourlyRateEur}
                onChange={(e) => setHourlyRateEur(e.target.value)}
                placeholder={t('profileEdit.hourlyRatePlaceholder')}
                disabled={saving}
                inputMode="decimal"
              />
            </div>
          )}

          <button
            type="submit"
            className="fan-profile-edit-submit"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? <ButtonLoadingSpinner /> : (isCreator ? t('profileEdit.saveChanges') : t('profileEdit.saveProfile'))}
          </button>
        </form>
      </main>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default FanProfileEdit;
