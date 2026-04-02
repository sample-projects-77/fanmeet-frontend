import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, profileAPI, connectAPI } from '../services/api';
import { getCached, setCached } from '../utils/routeDataCache';
import { DEFAULT_AVATAR_URL } from '../constants';
import CreatorNav from '../components/CreatorNav';
import { SettingsIcon, KeyIcon, OutlinedUserIcon, OutgoingIcon, DeleteAccountIcon, BlockedIcon, PayoutIcon, PrivacyIcon } from '../components/ProfileIcons';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import './FanProfile.css';

function CreatorProfile({ embedded, user: userProp, onLogout: onLogoutProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userState, setUserState] = useState(null);
  const user = embedded ? userProp : userState;
  const handleLogout = embedded ? onLogoutProp : () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
  const [profile, setProfile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      setUserState(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = getCached('creatorMyProfile');
    if (cached) {
      setProfile(cached);
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (res.StatusCode === 200 && res.data) {
          setCached('creatorMyProfile', res.data);
          setProfile(res.data);
        }
      } catch {
        // ignore
      }
    };
    fetchProfile();
  }, [user?.id]);

  const fetchConnectStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await connectAPI.getConnectStatus();
      if (res.StatusCode === 200 && res.data) setConnectStatus(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchConnectStatus();
  }, [user?.id]);

  const handleSetupPayout = async () => {
    setPayoutLoading(true);
    try {
      const returnUrl = window.location.origin + '/creator/profile';
      const refreshUrl = window.location.origin + '/creator/profile';
      const res = await connectAPI.getOnboardingLink({ returnUrl, refreshUrl });
      if (res.StatusCode === 200 && res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      alert(res.error || t('profile.payoutSetupError') || 'Could not open payout setup.');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Could not open payout setup.');
    } finally {
      setPayoutLoading(false);
    }
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

  const displayName = profile?.displayName || profile?.userName || user.userName || t('home.creator');
  const avatarUrl = profile?.avatarUrl || user.avatarUrl;

  return (
    <div className="fan-profile-page">
      {!embedded && <CreatorNav active="profile" user={user} onLogout={handleLogout} />}
      <main className="fan-profile-main">
        <div className="fan-profile-container">
          <h1 className="fan-profile-title">{t('profile.title')}</h1>

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
              {t('profile.editProfile')}
            </Link>
          </section>

          <section className="fan-profile-settings">
            <Link to="/creator/profile/change-password" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--blue">
                <KeyIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.changePassword')}</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/creator/profile/language" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--yellow">
                <SettingsIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.changeLanguage')}</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <Link to="/creator/profile/blocked" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--red">
                <BlockedIcon />
              </span>
              <span className="fan-profile-setting-label">{t('profile.blockedUsers')}</span>
              <span className="fan-profile-setting-arrow">›</span>
            </Link>
            <button
              type="button"
              className="fan-profile-setting-row fan-profile-setting-row--button"
              onClick={handleSetupPayout}
              disabled={payoutLoading}
            >
              <span className="fan-profile-setting-icon fan-profile-setting-icon--green">
                <PayoutIcon />
              </span>
              <span className="fan-profile-setting-label">
                {connectStatus?.canReceivePayments
                  ? (t('profile.payoutsConnected') || 'Payouts connected')
                  : payoutLoading
                    ? (t('profile.payoutSetupLoading') || 'Loading...')
                    : (t('profile.setupPayout') || 'Setup payout')}
              </span>
              <span className="fan-profile-setting-arrow">›</span>
            </button>
            <Link to="/imprint" className="fan-profile-setting-row">
              <span className="fan-profile-setting-icon fan-profile-setting-icon--purple">
                <PrivacyIcon />
              </span>
              <span className="fan-profile-setting-label">{t('legal.legalNotice')}</span>
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

export default CreatorProfile;
