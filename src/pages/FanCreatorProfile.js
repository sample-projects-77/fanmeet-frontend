import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { profileAPI, chatAPI, userAPI } from '../services/api';
import { DEFAULT_AVATAR_URL } from '../constants';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { clearCached } from '../utils/routeDataCache';
import './FanCreatorProfile.css';

const COVER_HEIGHT = 180;
const AVATAR_SIZE = 100;
const AVATAR_OVERLAP = 40;

function FanCreatorProfile() {
  const { t } = useTranslation();
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const menuRef = React.useRef(null);

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

  const fetchCreator = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await profileAPI.getCreatorById(creatorId);
      if (res.StatusCode === 200 && res.data) {
        setCreator(res.data);
      } else {
        setError(res.error || t('creatorProfile.creatorNotFound'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [creatorId, t]);

  useEffect(() => {
    fetchCreator();
  }, [fetchCreator]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleMessageClick = useCallback(async () => {
    if (!creator) return;
    const otherUserId = creator._id || creator.id || creatorId;
    if (!otherUserId) return;
    setStartingChat(true);
    try {
      const res = await chatAPI.createOrGetIndividualChannel(otherUserId);
      if (res.StatusCode === 200 && res.data?.channel?.id) {
        navigate(`/fan/chats/${res.data.channel.id}`);
      } else {
        setError(res.error || t('creatorProfile.couldNotStartChat'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('creatorProfile.couldNotStartChat'));
    } finally {
      setStartingChat(false);
    }
  }, [creator, creatorId, navigate, t]);

  const handleBlockCreatorConfirm = useCallback(async () => {
    if (!creator) return;
    const userIdToBlock = creator._id ? `creator_${creator._id}` : creatorId;
    if (!userIdToBlock) return;
    setBlocking(true);
    setError(null);
    try {
      const res = await userAPI.blockUser(userIdToBlock);
      if (res.StatusCode === 201) {
        setBlockDialogOpen(false);
        clearCached('searchDefault');
        navigate('/fan/search', { replace: true });
      } else {
        setError(res.error || t('creatorProfile.couldNotBlock'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('creatorProfile.couldNotBlock'));
    } finally {
      setBlocking(false);
    }
  }, [creator, creatorId, navigate, t]);

  const handleBlockCreatorClick = useCallback(() => {
    setMenuOpen(false);
    setBlockDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  if (!user) return null;

  const hasCoverPhoto =
    creator?.coverPhoto &&
    creator.coverPhoto.length > 0 &&
    !creator.coverPhoto.includes('example.com');

  return (
    <div className="fan-creator-details-page">
      <FanNav active="search" user={user} onLogout={handleLogout} />
      <main className="fan-creator-details-main">
        {loading && !creator ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="fan-creator-details-error-wrap">
            <ErrorWidget errorText={error} onRetry={fetchCreator} />
            <Link to="/fan/search" className="fan-creator-details-back-link">{t('creatorProfile.backToSearch')}</Link>
          </div>
        ) : creator ? (
          <div className="fan-creator-details-container">
            <header className="fan-creator-details-header">
              <div className="fan-creator-details-top-bar">
                <Link to="/fan/search" className="fan-creator-details-back" aria-label={t('common.back')}>←</Link>
                <div className="fan-creator-details-menu-wrap" ref={menuRef}>
                  <button
                    type="button"
                    className="fan-creator-details-dots-btn"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                    aria-label={t('creatorProfile.moreOptions')}
                    aria-expanded={menuOpen}
                  >
                    <ThreeDotsIcon />
                  </button>
                  {menuOpen && (
                    <div className="fan-creator-details-dropdown">
                      <button
                        type="button"
                        className="fan-creator-details-dropdown-item fan-creator-details-dropdown-item--block"
                        onClick={handleBlockCreatorClick}
                      >
                        <BlockIcon />
                        <span>{t('creatorProfile.blockCreator')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="fan-creator-details-cover-wrap">
                {hasCoverPhoto ? (
                  <div
                    className="fan-creator-details-cover fan-creator-details-cover--photo"
                    style={{ backgroundImage: `url(${creator.coverPhoto})` }}
                    aria-hidden
                  />
                ) : (
                  <div className="fan-creator-details-cover fan-creator-details-cover--placeholder" aria-hidden />
                )}
              </div>
              <div className="fan-creator-details-avatar-wrap">
                <img src={creator.avatarUrl || DEFAULT_AVATAR_URL} alt="" className="fan-creator-details-avatar-img" />
              </div>
              <div className="fan-creator-details-meta">
                <h1 className="fan-creator-details-name">{creator.displayName || t('home.creator')}</h1>
                <p className="fan-creator-details-category">{creator.category || ''}</p>
                <p className="fan-creator-details-bio-line">{creator.bio?.trim() || t('creatorProfile.noDescription')}</p>
              </div>
            </header>

            {/* CreatorDetailsRating */}
            <div className="fan-creator-details-rating">
              <StarIcon />
              <span className="fan-creator-details-rating-value">
                {(creator.ratingAverage ?? 0).toFixed(1)}
              </span>
              <span className="fan-creator-details-rating-count">
                ({creator.ratingCount ?? 0})
              </span>
            </div>

            {/* Message, See offers, See reviews – DashboardActionButton style */}
            <nav className="fan-creator-details-actions">
              <button
                type="button"
                className="fan-creator-details-action-btn fan-creator-details-action-btn--message"
                onClick={handleMessageClick}
                disabled={startingChat}
              >
                <span className="fan-creator-details-action-icon-wrap">
                  <MessageIcon />
                </span>
                <span className="fan-creator-details-action-label">
                  {startingChat ? t('creatorProfile.starting') : t('creatorProfile.message')}
                </span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </button>
              <Link to={`/fan/creators/${creatorId}/offers`} className="fan-creator-details-action-btn">
                <span className="fan-creator-details-action-icon-wrap">
                  <OffersIcon />
                </span>
                <span className="fan-creator-details-action-label">{t('creatorProfile.seeOffers')}</span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </Link>
              <Link to={`/fan/creators/${creatorId}/reviews`} className="fan-creator-details-action-btn">
                <span className="fan-creator-details-action-icon-wrap">
                  <StarIcon />
                </span>
                <span className="fan-creator-details-action-label">{t('creatorProfile.seeReviews')}</span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </Link>
            </nav>
          </div>
        ) : null}
      </main>

      <DeleteAccountDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onConfirm={handleBlockCreatorConfirm}
        deleting={blocking}
        title={t('creatorProfile.blockDialogTitle')}
        message={creator ? t('creatorProfile.blockConfirm', { name: creator.displayName || creator.userName || t('creatorProfile.thisCreator') }) : ''}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('creatorProfile.blockCreator')}
        deletingLabel={t('creatorProfile.blocking')}
      />
    </div>
  );
}

function ThreeDotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden>
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
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

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function OffersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default FanCreatorProfile;
