import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, profileAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import { SettingsIcon, KeyIcon, OutlinedUserIcon, OutgoingIcon, DeleteAccountIcon, BlockedIcon } from '../components/ProfileIcons';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import './FanProfile.css';

function CreatorProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const handleDeleteAccountClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleting(true);
    try {
      const res = await authAPI.deleteAccount();
      if (res.StatusCode === 200) {
        setDeleteDialogOpen(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
      } else {
        setDeleteDialogOpen(false);
        alert(res.error || 'Could not delete account.');
      }
    } catch (err) {
      setDeleteDialogOpen(false);
      alert(err.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const displayName = profile?.displayName || profile?.userName || user.userName || 'Creator';
  const avatarUrl = profile?.avatarUrl || user.avatarUrl;

  return (
    <div className="fan-profile-page">
      <CreatorNav active="profile" user={user} onLogout={handleLogout} />
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
              <OutlinedUserIcon />
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
                <OutgoingIcon />
              </span>
              <span className="fan-profile-setting-label">Logout</span>
              <span className="fan-profile-setting-arrow">›</span>
            </button>
            <button
              type="button"
              className="fan-profile-setting-row fan-profile-setting-row--button fan-profile-setting-row--danger"
              onClick={handleDeleteAccountClick}
              disabled={deleting}
            >
              <span className="fan-profile-setting-icon fan-profile-setting-icon--red">
                <DeleteAccountIcon />
              </span>
              <span className="fan-profile-setting-label">Delete Account</span>
              <span className="fan-profile-setting-arrow">›</span>
            </button>
          </section>
        </div>
      </main>
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
        deleting={deleting}
      />
    </div>
  );
}

export default CreatorProfile;
