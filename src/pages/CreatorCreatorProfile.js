import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import './FanCreatorProfile.css';

function CreatorCreatorProfile() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (!creatorId) return;
    const fetchCreator = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await profileAPI.getCreatorById(creatorId);
        if (res.StatusCode === 200 && res.data) {
          setCreator(res.data);
        } else {
          setError(res.error || 'Creator not found');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [creatorId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const hasCoverPhoto =
    creator?.coverPhoto &&
    creator.coverPhoto.length > 0 &&
    !creator.coverPhoto.includes('example.com');

  return (
    <div className="fan-creator-details-page">
      <CreatorNav active="search" userName={user.userName} onLogout={handleLogout} />
      <main className="fan-creator-details-main">
        {loading && !creator ? (
          <div className="fan-creator-details-loading">Loading creator…</div>
        ) : error ? (
          <div className="fan-creator-details-error">
            {error}
            <Link to="/creator/search" className="fan-creator-details-back-link">← Back to Search</Link>
          </div>
        ) : creator ? (
          <div className="fan-creator-details-container">
            <header className="fan-creator-details-header">
              <Link to="/creator/search" className="fan-creator-details-back" aria-label="Back">←</Link>
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
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt="" className="fan-creator-details-avatar-img" />
                ) : (
                  <div className="fan-creator-details-avatar-placeholder">
                    <PersonIcon />
                  </div>
                )}
              </div>
              <div className="fan-creator-details-meta">
                <h1 className="fan-creator-details-name">{creator.displayName || 'Creator'}</h1>
                <p className="fan-creator-details-category">{creator.category || ''}</p>
              </div>
            </header>

            <section className="fan-creator-details-about">
              <h2 className="fan-creator-details-about-title">About</h2>
              <p className="fan-creator-details-about-text">{creator.bio || 'No description yet.'}</p>
            </section>

            <div className="fan-creator-details-rating">
              <StarIcon />
              <span className="fan-creator-details-rating-value">
                {(creator.ratingAverage ?? 0).toFixed(1)}
              </span>
              <span className="fan-creator-details-rating-count">
                ({creator.ratingCount ?? 0})
              </span>
            </div>

            <nav className="fan-creator-details-actions">
              <Link to="/creator/chats" className="fan-creator-details-action-btn">
                <span className="fan-creator-details-action-icon-wrap">
                  <MessageIcon />
                </span>
                <span className="fan-creator-details-action-label">Message</span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </Link>
              <Link to={`/creator/creators/${creatorId}/offers`} className="fan-creator-details-action-btn">
                <span className="fan-creator-details-action-icon-wrap">
                  <OffersIcon />
                </span>
                <span className="fan-creator-details-action-label">See offers</span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </Link>
              <Link to={`/creator/creators/${creatorId}/reviews`} className="fan-creator-details-action-btn">
                <span className="fan-creator-details-action-icon-wrap">
                  <StarIcon />
                </span>
                <span className="fan-creator-details-action-label">See reviews</span>
                <span className="fan-creator-details-action-arrow-wrap">
                  <ArrowIcon />
                </span>
              </Link>
            </nav>
          </div>
        ) : null}
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

export default CreatorCreatorProfile;
