import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI } from '../services/api';
import { getCached, setCached } from '../utils/routeDataCache';
import { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import ImageSourcePickerModal from '../components/ImageSourcePickerModal';
import ImageCropperModal from '../components/ImageCropperModal';
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

  // Image picker + cropper state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'avatar' | 'cover'
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [coverRemoved, setCoverRemoved] = useState(false);

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
    const applyProfile = (data) => {
      if (!data) return;
      setProfile(data);
      setCoverPreview(data.coverPhoto || null);
      setHourlyRateEur(
        data.hourlyRateCents != null && data.hourlyRateCents !== ''
          ? String(Number(data.hourlyRateCents) / 100)
          : ''
      );
    };
    const cached = getCached('creatorMyProfile');
    if (cached) applyProfile(cached);
    let cancelled = false;
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (cancelled || res.StatusCode !== 200 || !res.data) return;
        setCached('creatorMyProfile', res.data);
        applyProfile(res.data);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [isCreator]);

  // Clean up blob URLs
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

  useEffect(() => {
    return () => {
      if (rawImageSrc && rawImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageSrc);
      }
    };
  }, [rawImageSrc]);

  // ── Open source picker ──
  const openPickerFor = useCallback((target) => {
    setPickerTarget(target);
    setPickerOpen(true);
  }, []);

  // ── File selected → open cropper ──
  const handleFileSelected = useCallback((file) => {
    setPickerOpen(false);
    // Revoke previous raw image
    if (rawImageSrc && rawImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(rawImageSrc);
    }
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCropperOpen(true);
  }, [rawImageSrc]);

  // ── Avatar: crop done → upload immediately ──
  const handleAvatarCropDone = useCallback(async (croppedFile) => {
    setCropperOpen(false);
    // Update preview
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(croppedFile);
    });
    setAvatarFile(croppedFile);

    // Immediately upload avatar
    setAvatarUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('userName', userName.trim() || user?.userName || '');
      formData.append('avatarUrl', croppedFile);
      const updateProfile = isCreator ? profileAPI.updateCreatorProfile : profileAPI.updateFanProfile;
      const res = await updateProfile(formData);
      if (res.StatusCode === 200 && res.data) {
        const d = res.data;
        const updated = {
          ...user,
          userName: d.userName !== undefined && d.userName !== null ? d.userName : user.userName,
          avatarUrl: d.avatarUrl ?? user.avatarUrl,
        };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        // Update preview to server URL
        if (d.avatarUrl) {
          setAvatarPreview(d.avatarUrl);
          setAvatarFile(null); // Already uploaded
        }
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
      setAvatarUploading(false);
    }
  }, [userName, user, isCreator, t]);

  // ── Cover: crop done → store locally (upload on form save) ──
  const handleCoverCropDone = useCallback((croppedFile) => {
    setCropperOpen(false);
    setCoverPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(croppedFile);
    });
    setCoverFile(croppedFile);
  }, []);

  // ── Crop done dispatcher ──
  const handleCropDone = useCallback((croppedFile) => {
    if (pickerTarget === 'avatar') {
      handleAvatarCropDone(croppedFile);
    } else {
      handleCoverCropDone(croppedFile);
    }
    // Clean up raw image
    if (rawImageSrc && rawImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setRawImageSrc(null);
  }, [pickerTarget, handleAvatarCropDone, handleCoverCropDone, rawImageSrc]);

  const handleCropperClose = useCallback(() => {
    setCropperOpen(false);
    if (rawImageSrc && rawImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(rawImageSrc);
    }
    setRawImageSrc(null);
  }, [rawImageSrc]);

  // ── Remove avatar ──
  const handleRemoveAvatar = useCallback(async () => {
    // Immediately clear avatar locally
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarRemoving(true);
    setError('');
    try {
      const res = await profileAPI.deleteAvatar();
      if (res.StatusCode === 200) {
        const updated = { ...user, avatarUrl: null };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } else {
        // Restore preview on failure
        setAvatarPreview(user?.avatarUrl || null);
        setError(res.error || t('profileEdit.failedToSave'));
      }
    } catch (err) {
      // Restore preview on failure
      setAvatarPreview(user?.avatarUrl || null);
      setError(
        err.response?.data?.error ||
          err.message ||
          t('common.errorGeneric')
      );
    } finally {
      setAvatarRemoving(false);
    }
  }, [user, t]);

  // ── Remove cover photo (local only — sent as removeCoverPhoto flag on save) ──
  const handleRemoveCover = useCallback(() => {
    setCoverPreview(null);
    setCoverFile(null);
    setCoverRemoved(true);
  }, []);

  // ── Form submit (cover uploads here) ──
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
      // Avatar: only include if not yet uploaded (edge case)
      if (avatarFile) formData.append('avatarUrl', avatarFile);
      if (isCreator) {
        // Cover photo: upload new file, or signal removal
        if (coverFile) formData.append('coverPhoto', coverFile);
        else if (coverRemoved) formData.append('coverPhoto', '');
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
        if (isCreator) {
          const nextProfile = { ...profile, ...d };
          setCached('creatorMyProfile', nextProfile);
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
            <>
              <div
                className="fan-profile-edit-cover-wrap"
                onClick={() => openPickerFor('cover')}
                onKeyDown={(e) => e.key === 'Enter' && openPickerFor('cover')}
                role="button"
                tabIndex={0}
                aria-label={t('profileEdit.uploadCoverPhoto')}
              >
                <div className="fan-profile-edit-cover-inner">
                  {coverPreview ? (
                    <img src={coverPreview} alt="" className="fan-profile-edit-cover-img" />
                  ) : (
                    <span className="fan-profile-edit-cover-placeholder">{t('profileEdit.uploadCoverPhoto')}</span>
                  )}
                </div>
              </div>
              {coverPreview && (
                <button
                  type="button"
                  className="fan-profile-edit-remove-picture fan-profile-edit-remove-cover"
                  onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                >
                  <TrashIcon />
                  {t('profileEdit.removeCoverPhoto')}
                </button>
              )}
            </>
          )}

          <div className="fan-profile-edit-avatar-wrap">
            <div className="fan-profile-edit-avatar-box">
              {(avatarPreview || user?.avatarUrl) ? (
                <img
                  src={avatarPreview || user.avatarUrl}
                  alt=""
                  className="fan-profile-edit-avatar-img"
                />
              ) : null}
              {avatarUploading && (
                <div className="fan-profile-edit-avatar-uploading">
                  <ButtonLoadingSpinner />
                </div>
              )}
            </div>
            <button
              type="button"
              className="fan-profile-edit-camera-btn"
              aria-label={t('profileEdit.changePhoto')}
              onClick={() => openPickerFor('avatar')}
            >
              <CameraIcon />
            </button>
          </div>

          {(avatarPreview || user?.avatarUrl) && (
            <button
              type="button"
              className="fan-profile-edit-remove-picture"
              onClick={handleRemoveAvatar}
              disabled={avatarRemoving || avatarUploading}
            >
              <TrashIcon />
              {avatarRemoving ? <ButtonLoadingSpinner /> : t('profileEdit.removePicture')}
            </button>
          )}

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

      {/* Image source picker (Camera / Gallery) */}
      <ImageSourcePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onFile={handleFileSelected}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      />

      {/* Image cropper */}
      <ImageCropperModal
        open={cropperOpen}
        imageSrc={rawImageSrc}
        initialAspect={pickerTarget === 'avatar' ? 'square' : 'free'}
        onCropDone={handleCropDone}
        onClose={handleCropperClose}
        fileName={pickerTarget === 'avatar' ? 'avatar.jpg' : 'cover.jpg'}
      />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
