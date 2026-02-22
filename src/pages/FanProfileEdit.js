import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import './FanProfileEdit.css';

function FanProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarFile(file);
  };

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userName.trim()) {
      setError('Username is required.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('userName', userName.trim());
      if (avatarFile) formData.append('avatarUrl', avatarFile);

      const res = await profileAPI.updateFanProfile(formData);
      if (res.StatusCode === 200 && res.data) {
        const updated = {
          ...user,
          userName: res.data.userName,
          email: res.data.email,
          avatarUrl: res.data.avatarUrl ?? user.avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(updated));
        navigate('/fan/profile', { replace: true });
      } else {
        setError(res.error || 'Failed to save.');
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
        <h1 className="fan-profile-edit-title">Edit Profile</h1>
      </header>

      <main className="fan-profile-edit-main">
        <form onSubmit={handleSubmit} className="fan-profile-edit-form">
          <div className="fan-profile-edit-avatar-wrap">
            <div className="fan-profile-edit-avatar-box">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="fan-profile-edit-avatar-img"
                />
              ) : (
                <div className="fan-profile-edit-avatar-placeholder">
                  <PersonIcon />
                </div>
              )}
            </div>
            <label className="fan-profile-edit-camera-btn" aria-label="Change photo">
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
            <label htmlFor="userName">Username <span className="required">*</span></label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="fan-profile-edit-field">
            <label htmlFor="email">Email</label>
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

          <button
            type="submit"
            className="fan-profile-edit-submit"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
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
