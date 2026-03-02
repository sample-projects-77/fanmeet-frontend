import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorDashboard.css';

function CreatorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
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

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardAPI.getCreatorDashboard();
        if (res.StatusCode === 200 && res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  const refetch = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getCreatorDashboard();
      if (res.StatusCode === 200 && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: 'Fan Session',
        text: `Connect with me on Fan Session – ${user?.userName || 'Creator'}`,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin).then(() => {
        alert('Profile link copied to clipboard.');
      }).catch(() => {});
    }
  };

  if (loading && !data && !error) {
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" userName={user?.userName} onLogout={handleLogout} />
        <main className="creator-dashboard-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" userName={user?.userName} onLogout={handleLogout} />
        <main className="creator-dashboard-main">
          <ErrorWidget errorText={error} onRetry={refetch} />
        </main>
      </div>
    );
  }

  const earnings = data?.totalEarnings ?? 0;
  const sessions = data?.totalSessions ?? 0;
  const rating = data?.rating ?? 0;
  const category = user?.category || 'Music & Performing Arts';

  return (
    <div className="creator-dashboard">
      <CreatorNav active="creator" userName={user?.userName} onLogout={handleLogout} />
      <main className="creator-dashboard-main">
        <div className="creator-dashboard-container">
          <header className="creator-dashboard-welcome">
            <div className="creator-dashboard-welcome-badge" aria-hidden>
              ✨
            </div>
            <div className="creator-dashboard-welcome-text">
              <h1 className="creator-dashboard-welcome-title">Creator Dashboard</h1>
              <p className="creator-dashboard-welcome-subtitle">
                Welcome back, {user?.userName ?? 'Creator'}
              </p>
            </div>
          </header>

          {error && (
            <div className="creator-dashboard-error">{error}</div>
          )}

          <section className="creator-overview">
            <h2 className="creator-overview-title">Creator Overview</h2>
            <div className="creator-metrics">
            <div className="creator-metric-card creator-metric-card--earnings">
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--earnings" aria-hidden>
                <CoinIcon />
              </div>
              <span className="creator-metric-value">€{Number(earnings).toFixed(0).replace('.', ',')}</span>
              <span className="creator-metric-label">Earnings</span>
            </div>
            <div className="creator-metric-card creator-metric-card--sessions">
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--sessions" aria-hidden>
                <CalendarIcon />
              </div>
              <span className="creator-metric-value">{sessions}</span>
              <span className="creator-metric-label">Sessions</span>
            </div>
            <div className="creator-metric-card creator-metric-card--rating">
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--rating" aria-hidden>
                <StarIcon />
              </div>
              <span className="creator-metric-value">{rating.toFixed(1).replace('.', ',')}</span>
              <span className="creator-metric-label">Rating</span>
            </div>
            </div>
          </section>

          <section className="creator-actions">
            <Link to="/creator/bookings" className="creator-action-card creator-action-card--sessions">
              <span className="creator-action-icon-wrap creator-action-icon-wrap--sessions">
                <CalendarIcon />
              </span>
              <span className="creator-action-label">All Sessions</span>
              <span className="creator-action-arrow-wrap" aria-hidden>
                <ArrowIcon />
              </span>
            </Link>
            <Link to="/creator/offers" className="creator-action-card creator-action-card--offers">
              <span className="creator-action-icon-wrap creator-action-icon-wrap--offers">
                <PeopleIcon />
              </span>
              <span className="creator-action-label">My Offers</span>
              <span className="creator-action-arrow-wrap" aria-hidden>
                <ArrowIcon />
              </span>
            </Link>
            <button type="button" className="creator-action-card creator-action-card--share" onClick={handleShare}>
              <span className="creator-action-icon-wrap creator-action-icon-wrap--share">
                <ShareIcon />
              </span>
              <div className="creator-action-text">
                <span className="creator-action-label">Share My Profile</span>
                <span className="creator-action-subtitle">Invite fans to connect with you</span>
              </div>
              <span className="creator-action-arrow-wrap creator-action-arrow-wrap--share" aria-hidden>
                <ArrowIcon />
              </span>
            </button>
          </section>

          <section className="creator-category">
            <span className="creator-category-label">Category</span>
            <span className="creator-category-pill">{category || '—'}</span>
          </section>
        </div>
      </main>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9a3 3 0 1 0 6 0M9 15a3 3 0 1 0 6 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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

export default CreatorDashboard;
