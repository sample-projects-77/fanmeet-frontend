import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorDashboard.css';

function CreatorDashboard() {
  const { t } = useTranslation();
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
      const res = await dashboardAPI.getCreatorDashboard();
      if (res.StatusCode === 200 && res.data) {
        setData(res.data);
      } else {
        setError(res.error || t('dashboard.failedToLoad'));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (loading && !data && !error) {
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" user={user} onLogout={handleLogout} />
        <main className="creator-dashboard-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" user={user} onLogout={handleLogout} />
        <main className="creator-dashboard-main">
          <ErrorWidget errorText={error} onRetry={refetch} />
        </main>
      </div>
    );
  }

  const earnings = data?.totalEarnings ?? 0;
  const sessions = data?.totalSessions ?? 0;
  const rating = data?.rating ?? 0;

  return (
    <div className="creator-dashboard">
      <CreatorNav active="creator" user={user} onLogout={handleLogout} />
      <main className="creator-dashboard-main">
        <div className="creator-dashboard-container">
          <header className="creator-dashboard-welcome">
            <div className="creator-dashboard-welcome-badge" aria-hidden>
              ✨
            </div>
            <div className="creator-dashboard-welcome-text">
              <h1 className="creator-dashboard-welcome-title">{t('dashboard.creatorTitle')}</h1>
              <p className="creator-dashboard-welcome-subtitle">
                {t('home.welcomeBack', { name: user?.userName ?? t('home.creator') })}
              </p>
            </div>
          </header>

          {error && (
            <div className="creator-dashboard-error">{error}</div>
          )}

          <section className="creator-overview">
            <h2 className="creator-overview-title">{t('dashboard.creatorOverview')}</h2>
            <div className="creator-metrics">
            <div className="creator-metric-card creator-metric-card--earnings">
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--earnings" aria-hidden>
                <CoinIcon />
              </div>
              <span className="creator-metric-value">€{Number(earnings).toFixed(0).replace('.', ',')}</span>
              <span className="creator-metric-label">{t('dashboard.earnings')}</span>
            </div>
            <Link to="/creator/bookings" className="creator-metric-card creator-metric-card--sessions" aria-label={t('dashboard.viewAllSessions')}>
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--sessions" aria-hidden>
                <CalendarIcon />
              </div>
              <span className="creator-metric-value">{sessions}</span>
              <span className="creator-metric-label">{t('dashboard.sessions')}</span>
            </Link>
            <Link to="/creator/reviews" className="creator-metric-card creator-metric-card--rating" aria-label={`${t('dashboard.rating')}: ${rating.toFixed(1)}. ${t('dashboard.viewReviews')}`}>
              <div className="creator-metric-icon-wrap creator-metric-icon-wrap--rating" aria-hidden>
                <StarIcon />
              </div>
              <span className="creator-metric-value">{rating.toFixed(1)}</span>
              <span className="creator-metric-label">{t('dashboard.rating')}</span>
            </Link>
            </div>
          </section>

          <section className="creator-actions">
            <Link to="/creator/offers" className="creator-action-card creator-action-card--offers">
              <span className="creator-action-icon-wrap creator-action-icon-wrap--offers">
                <PeopleIcon />
              </span>
              <span className="creator-action-label">{t('dashboard.myOffers')}</span>
              <span className="creator-action-arrow-wrap" aria-hidden>
                <ArrowIcon />
              </span>
            </Link>
            <Link to="/creator/profile/edit-bio" className="creator-action-card creator-action-card--edit">
              <span className="creator-action-icon-wrap creator-action-icon-wrap--edit">
                <EditIcon />
              </span>
              <span className="creator-action-label">{t('profile.editProfile')}</span>
              <span className="creator-action-arrow-wrap" aria-hidden>
                <ArrowIcon />
              </span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 88 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M47.9033 -5H62.0968C88.55 -5 110 16.2783 110 42.5198C110 68.7614 88.55 90.0397 62.0968 90.0397H47.9033V-5Z" fill="#FFB000"/>
      <path d="M47.9031 90.0397C74.3592 90.0397 95.8061 68.7643 95.8061 42.5198C95.8061 16.2754 74.3592 -5 47.9031 -5C21.4469 -5 0 16.2754 0 42.5198C0 68.7643 21.4469 90.0397 47.9031 90.0397Z" fill="#FFC500"/>
      <path d="M47.9032 81.2397C69.4601 81.2397 86.9354 63.9042 86.9354 42.5198C86.9354 21.1354 69.4601 3.79997 47.9032 3.79997C26.3464 3.79997 8.87109 21.1354 8.87109 42.5198C8.87109 63.9042 26.3464 81.2397 47.9032 81.2397Z" fill="#FFE47F"/>
      <path d="M12.4195 46.0398C12.4195 24.6559 29.8952 7.31996 51.4516 7.31996C61.3338 7.31996 70.3467 10.9631 77.2128 16.9647C70.0628 8.90396 59.5774 3.79997 47.9032 3.79997C26.3468 3.79997 8.87109 21.1359 8.87109 42.5198C8.87109 54.1006 14.0162 64.5022 22.142 71.595C16.092 64.7838 12.4195 55.843 12.4195 46.0398Z" fill="#FFB000"/>
      <path d="M51.6287 60.1198C46.1464 60.1198 41.3561 56.5822 38.8013 51.3198H48.79C50.2625 51.3198 51.4512 50.1406 51.4512 48.6798C51.4512 47.219 50.2625 46.0398 48.79 46.0398H37.0981C36.9029 44.8958 36.7964 43.7166 36.7964 42.5198C36.7964 41.3231 36.9029 40.1439 37.0981 38.9999H48.79C50.2625 38.9999 51.4512 37.8207 51.4512 36.3599C51.4512 34.8991 50.2625 33.7199 48.79 33.7199H38.8013C41.3738 28.4575 46.1464 24.9199 51.6287 24.9199C54.5383 24.9199 57.2528 25.9055 59.5415 27.6303L65.6447 20.1855C61.7238 17.6159 57.0577 16.1199 52.0722 16.1199C40.9835 16.1199 31.5981 23.4767 28.0852 33.7199H23.9513C22.4787 33.7199 21.29 34.8991 21.29 36.3599C21.29 37.8207 22.4787 38.9999 23.9513 38.9999H26.861C26.7191 40.1615 26.6126 41.3231 26.6126 42.5198C26.6126 43.7166 26.7191 44.8782 26.861 46.0398H23.9513C22.4787 46.0398 21.29 47.219 21.29 48.6798C21.29 50.1406 22.4787 51.3198 23.9513 51.3198H28.0852C31.5803 61.563 40.9835 68.9198 52.0722 68.9198C57.0577 68.9198 61.7238 67.4238 65.6447 64.8542L59.5415 57.4094C57.2528 59.1342 54.5383 60.1198 51.6287 60.1198Z" fill="#FFC500"/>
      <path d="M41.9776 51.3198H38.8018C40.3808 54.5582 42.8114 57.1454 45.7211 58.659C47.6017 59.5566 49.6775 60.0494 51.8598 60.1022C52.5162 60.0846 53.1727 60.0494 53.7936 59.9262C48.7372 59.1694 44.4259 55.9134 41.9776 51.3198Z" fill="#FFB000"/>
      <path d="M38.8018 33.7199H41.9776C44.4259 29.1263 48.7372 25.8703 53.7936 25.1135C53.1549 25.0079 52.5162 24.9551 51.8598 24.9375C49.6775 24.9903 47.6195 25.5007 45.7211 26.3807C42.8114 27.8943 40.3808 30.4815 38.8018 33.7199Z" fill="#FFB000"/>
      <path d="M39.778 42.5198C39.778 41.3054 39.9022 40.1438 40.1151 38.9998H37.099C36.9038 40.1438 36.7974 41.323 36.7974 42.5198C36.7974 43.7166 36.9038 44.8958 37.099 46.0398H40.1151C39.9022 44.8958 39.778 43.7342 39.778 42.5198Z" fill="#FFB000"/>
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
