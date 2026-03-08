import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import FanNav from '../components/FanNav';
import { SettingsIcon, KeyIcon, OutlinedUserIcon, OutgoingIcon, DeleteAccountIcon, BlockedIcon } from '../components/ProfileIcons';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import './FanProfile.css';

function FanProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
        alert(res.error || t('deleteAccount.couldNotDelete'));
      }
    } catch (err) {
      setDeleteDialogOpen(false);
      alert(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fan-profile-page">
      <FanNav active="profile" user={user} onLogout={handleLogout} />
      <main className="fan-profile-main">
        <div className="fan-profile-container">
          <h1 className="fan-profile-title">{t('profile.title')}</h1>

          <section className="fan-profile-card">
            <div className="fan-profile-header">
              <div className="fan-profile-avatar-wrap">
                <img
                  src={user.avatarUrl || DEFAULT_AVATAR_URL}
                  alt=""
                  className="fan-profile-avatar-img"
                />
              </div>
              <div className="fan-profile-info">
                <span className="fan-profile-username">{user.userName || t('home.fan')}</span>
                <span className="fan-profile-email">{user.email || ''}</span>
              </div>
            </div>
            <Link to="/fan/profile/edit" className="fan-profile-edit-btn">
              <OutlinedUserIcon />
              {t('profile.editProfile')}
            </Link>
          </section>

          <section className="fan-profile-settings">
            <Link to="/fan/profile/change-password" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--blue">
                <KeyIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.changePassword')}</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/fan/profile/language" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--yellow">
                <SettingsIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.changeLanguage')}</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/fan/profile/blocked" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--red">
                <BlockedIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.blockedUsers')}</span>
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
              <span className="fan-profile-setting-label">{t('profile.logout')}</span>
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
              <span className="fan-profile-setting-label">{t('profile.deleteAccount')}</span>
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
        title={t('deleteAccount.title')}
        message={t('deleteAccount.message')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('profile.deleteAccount')}
        deletingLabel={t('deleteAccount.deleting')}
      />
    </div>
  );
}

export default FanProfile;
