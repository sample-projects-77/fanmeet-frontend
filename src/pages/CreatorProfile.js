import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import './CreatorProfile.css';

function CreatorProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await profileAPI.getMyProfile();
        if (res.StatusCode === 200 && res.data) {
          setProfile(res.data);
        } else {
          setError(res.error || 'Failed to load profile');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const displayName = profile?.displayName || profile?.userName || user.userName || 'Creator';
  const category = profile?.category || '';
  const bio = profile?.bio || '';
  const rating = profile?.ratingAverage ?? 0;
  const ratingCount = profile?.ratingCount ?? 0;
  const avatarUrl = profile?.avatarUrl || user.avatarUrl;
  const coverPhoto = profile?.coverPhoto;

  return (
    <div className="creator-profile-page">
      <CreatorNav active="profile" userName={user.userName} onLogout={handleLogout} />
      <main className="creator-profile-main">
        <div className="creator-profile-container">
          <header className="creator-profile-header">
            <Link to="/creator/dashboard" className="creator-profile-back" aria-label="Back">
              ←
            </Link>
            <div
              className="creator-profile-banner"
              style={coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : undefined}
              aria-hidden
            />
            <div className="creator-profile-avatar-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="creator-profile-avatar-img"
                />
              ) : (
                <div className="creator-profile-avatar-placeholder">
                  <PersonIcon />
                </div>
              )}
            </div>
            <h1 className="creator-profile-username">{displayName}</h1>
            {category && (
              <p className="creator-profile-category">{category}</p>
            )}
          </header>

          {error && (
            <div className="creator-profile-error">{error}</div>
          )}

          {loading && !profile ? (
            <div className="creator-profile-loading">Loading profile…</div>
          ) : (
            <>
              <section className="creator-profile-about">
                <h2 className="creator-profile-about-title">About</h2>
                <p className="creator-profile-about-text">
                  {bio || 'No description yet.'}
                </p>
              </section>

              <div className="creator-profile-rating">
                <StarIcon />
                <span>
                  {rating.toFixed(1)} ({ratingCount})
                </span>
              </div>

              <nav className="creator-profile-actions">
                <Link to="/creator/chats" className="creator-profile-action-btn">
                  <MessageIcon />
                  <span>Message</span>
                  <span className="creator-profile-action-arrow">›</span>
                </Link>
                <Link to="/creator/offers" className="creator-profile-action-btn">
                  <OffersIcon />
                  <span>See offers</span>
                  <span className="creator-profile-action-arrow">›</span>
                </Link>
                <Link to="/creator/reviews" className="creator-profile-action-btn">
                  <StarIcon />
                  <span>See reviews</span>
                  <span className="creator-profile-action-arrow">›</span>
                </Link>
              </nav>
            </>
          )}
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

export default CreatorProfile;
