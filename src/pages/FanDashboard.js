import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI, bookingAPI } from '../services/api';
import { getCached, setCached, clearAllCached } from '../utils/routeDataCache';
import { getSessionCountsFromBookings } from '../utils/sessionCounts';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './FanDashboard.css';

const CACHE_KEY = 'fanDashboard';

function FanDashboard({ embedded, user: userProp, onLogout: onLogoutProp }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userState, setUserState] = useState(null);
  const user = embedded ? userProp : userState;
  const handleLogout = embedded ? onLogoutProp : () => {
    clearAllCached();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };
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
      setUserState(JSON.parse(userJson));
    } catch {
      navigate('/login', { replace: true });
      return;
    }

    const cached = getCached(CACHE_KEY);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await dashboardAPI.getFanDashboard();
        if (res.StatusCode === 200 && res.data) {
          let dashboardData = res.data;
          try {
            const bookRes = await bookingAPI.getFanBookings({ page: 1, itemsPerPage: 100 });
            if (bookRes.StatusCode === 200 && bookRes.data?.bookings) {
              const counts = getSessionCountsFromBookings(bookRes.data.bookings);
              dashboardData = { ...dashboardData, totalSessions: counts.totalSessions, upcomingSessions: counts.upcomingSessions };
            }
          } catch (_) { /* keep API counts if bookings fetch fails */ }
          setCached(CACHE_KEY, dashboardData);
          setData(dashboardData);
        } else {
          setError(res.error || t('dashboard.failedToLoad'));
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
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
      const res = await dashboardAPI.getFanDashboard();
      if (res.StatusCode === 200 && res.data) {
        let dashboardData = res.data;
        try {
          const bookRes = await bookingAPI.getFanBookings({ page: 1, itemsPerPage: 100 });
          if (bookRes.StatusCode === 200 && bookRes.data?.bookings) {
            const counts = getSessionCountsFromBookings(bookRes.data.bookings);
            dashboardData = { ...dashboardData, totalSessions: counts.totalSessions, upcomingSessions: counts.upcomingSessions };
          }
        } catch (_) { /* keep API counts if bookings fetch fails */ }
        setCached(CACHE_KEY, dashboardData);
        setData(dashboardData);
      } else {
        setError(res.error || t('dashboard.failedToLoad'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading && !data && !error) {
    const main = <main className="fan-dashboard-main"><LoadingSpinner /></main>;
    if (embedded) return <div className="fan-dashboard">{main}</div>;
    return (
      <div className="fan-dashboard">
        <FanNav active="fan" user={user} onLogout={handleLogout} />
        {main}
      </div>
    );
  }

  if (error && !data) {
    const main = <main className="fan-dashboard-main"><ErrorWidget errorText={error} onRetry={refetch} /></main>;
    if (embedded) return <div className="fan-dashboard">{main}</div>;
    return (
      <div className="fan-dashboard">
        <FanNav active="fan" user={user} onLogout={handleLogout} />
        {main}
      </div>
    );
  }

  const stats = {
    sessions: data?.totalSessions ?? 0,
    rating: data?.rating ?? 0,
    totalSpent: data?.totalSpent ?? 0,
    upcoming: data?.upcomingSessions ?? 0,
  };

  const main = (
      <main className="fan-dashboard-main">
        <div className="fan-dashboard-container">
          {error && (
            <div className="fan-dashboard-error">{error}</div>
          )}
          <section className="fan-hero-card">
            <div className="fan-hero-glow" aria-hidden />
            <div className="fan-hero-icon">
              <SparklesIcon />
            </div>
            <div className="fan-hero-text">
              <h1 className="fan-hero-title">{t('dashboard.fanTitle')}</h1>
              <p className="fan-hero-welcome">
                {t('home.welcomeBack', { name: user?.userName ?? t('home.fan') })}
              </p>
            </div>
          </section>

          <section className="fan-overview">
            <h2 className="fan-overview-title">
              <span className="fan-overview-accent" aria-hidden />
              {t('dashboard.fanOverview')}
            </h2>
            <div className="fan-stats-grid">
              <StatCard
                icon={<CalendarIcon />}
                value={stats.sessions}
                label={t('dashboard.sessions')}
                variant="blue"
                to="/fan/bookings"
                linkAria={t('dashboard.viewAllSessions')}
              />
              <StatCard
                icon={<StarIcon />}
                value={stats.rating.toFixed(1)}
                label={t('dashboard.rating')}
                variant="gold"
                to="/fan/reviews"
                linkAria={t('dashboard.viewReviews')}
              />
            </div>
          </section>

          <section className="fan-actions">
            <Link to="/fan/search" className="fan-action-card">
              <span className="fan-action-icon"><PeopleIcon /></span>
              <span className="fan-action-label">{t('dashboard.browseCreators')}</span>
              <span className="fan-action-arrow" aria-hidden>
                <ArrowIcon />
              </span>
            </Link>
          </section>
        </div>
      </main>
    );
  return (
    <div className="fan-dashboard">
      {embedded ? null : <FanNav active="fan" user={user} onLogout={handleLogout} />}
      {main}
    </div>
  );
}

function StatCard({ icon, value, label, variant, to, linkAria }) {
  const className = `fan-stat-card fan-stat-card--${variant}`;
  if (to) {
    return (
      <Link to={to} className={className} aria-label={linkAria ? `${label}: ${value}. ${linkAria}` : `${label}: ${value}`}>
        <span className="fan-stat-icon" aria-hidden>{icon}</span>
        <span className="fan-stat-value">{value}</span>
        <span className="fan-stat-label">{label}</span>
      </Link>
    );
  }
  return (
    <div className={className}>
      <span className="fan-stat-icon" aria-hidden>{icon}</span>
      <span className="fan-stat-value">{value}</span>
      <span className="fan-stat-label">{label}</span>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill="currentColor" />
      <path d="M5 17l1 3 3-1-1-3-3 1z" fill="currentColor" opacity="0.8" />
      <path d="M19 5l1 3 3-1-1-3-3 1z" fill="currentColor" opacity="0.8" />
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

function EuroIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6h-8a4 4 0 1 0 0 8h4" />
      <path d="M6 6h8a4 4 0 1 1 0 8h-4" />
    </svg>
  );
}

function UpcomingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

/* Forward arrow – from arrow_forward_ios.svg */
function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
    </svg>
  );
}

export default FanDashboard;
