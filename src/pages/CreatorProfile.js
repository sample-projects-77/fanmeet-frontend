import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import './FanProfile.css';

function CreatorProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (res.StatusCode === 200 && res.data) {
          setProfile(res.data);
        }
      } catch {
        // ignore
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await authAPI.deleteAccount();
      if (res.StatusCode === 200) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
      } else {
        alert(res.error || 'Could not delete account.');
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (!user) return null;

  const displayName = profile?.displayName || profile?.userName || user.userName || 'Creator';
  const avatarUrl = profile?.avatarUrl || user.avatarUrl;

  return (
    <div className="fan-profile-page">
      <CreatorNav active="profile" userName={user.userName} onLogout={handleLogout} />
      <main className="fan-profile-main">
        <div className="fan-profile-container">
          <h1 className="fan-profile-title">Profile</h1>

          <section className="fan-profile-card">
            <div className="fan-profile-header">
              <div className="fan-profile-avatar-wrap">
                <img
                  src={avatarUrl || DEFAULT_AVATAR_URL}
                  alt=""
                  className="fan-profile-avatar-img"
                />
              </div>
              <div className="fan-profile-info">
                <span className="fan-profile-username">{displayName}</span>
                <span className="fan-profile-email">{user.email || ''}</span>
              </div>
            </div>
            <Link to="/creator/profile/edit" className="fan-profile-edit-btn">
              <SettingsIcon />
              Edit Profile
            </Link>
          </section>

          <section className="fan-profile-settings">
            <Link to="/creator/profile/change-password" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--blue">
                <KeyIcon />
              </span>
              <span className="fan-profile-setting-label">Change Password</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/creator/profile/language" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--yellow">
                <SettingsIcon />
              </span>
              <span className="fan-profile-setting-label">Change Language</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/creator/profile/blocked" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--red">
                <BlockedIcon />
              </span>
              <span className="fan-profile-setting-label">Blocked Users</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <button
              type="button"
              className="fan-profile-setting-row fan-profile-setting-row--button"
              onClick={handleLogout}
            >
              <span className="fan-profile-setting-icon fan-profile-setting-icon--blue-accent">
                <LogoutIcon />
              </span>
              <span className="fan-profile-setting-label">Logout</span>
              <span className="fan-profile-setting-arrow">›</span>
            </button>
            <button
              type="button"
              className="fan-profile-setting-row fan-profile-setting-row--button fan-profile-setting-row--danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              <span className="fan-profile-setting-icon fan-profile-setting-icon--red">
                <DeleteIcon />
              </span>
              <span className="fan-profile-setting-label">
                {deleteConfirm ? 'Click again to confirm' : 'Delete Account'}
              </span>
              <span className="fan-profile-setting-arrow">›</span>
            </button>
          </section>
        </div>
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function BlockedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="23" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

export default CreatorProfile;
