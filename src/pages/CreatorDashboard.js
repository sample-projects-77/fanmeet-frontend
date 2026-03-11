import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI, bookingAPI } from '../services/api';
import { getCached, setCached, clearAllCached } from '../utils/routeDataCache';
import { getSessionCountsFromBookings } from '../utils/sessionCounts';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorDashboard.css';

const CACHE_KEY = 'creatorDashboard';

function CreatorDashboard({ embedded, user: userProp, onLogout: onLogoutProp }) {
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
        const res = await dashboardAPI.getCreatorDashboard();
        if (res.StatusCode === 200 && res.data) {
          let dashboardData = res.data;
          try {
            const bookRes = await bookingAPI.getCreatorBookings({ page: 1, itemsPerPage: 100 });
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
      const res = await dashboardAPI.getCreatorDashboard();
      if (res.StatusCode === 200 && res.data) {
        let dashboardData = res.data;
        try {
          const bookRes = await bookingAPI.getCreatorBookings({ page: 1, itemsPerPage: 100 });
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
    const main = <main className="creator-dashboard-main"><LoadingSpinner /></main>;
    if (embedded) return <div className="creator-dashboard">{main}</div>;
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" user={user} onLogout={handleLogout} />
        {main}
      </div>
    );
  }

  if (error && !data) {
    const main = <main className="creator-dashboard-main"><ErrorWidget errorText={error} onRetry={refetch} /></main>;
    if (embedded) return <div className="creator-dashboard">{main}</div>;
    return (
      <div className="creator-dashboard">
        <CreatorNav active="creator" user={user} onLogout={handleLogout} />
        {main}
      </div>
    );
  }

  const earnings = data?.totalEarnings ?? 0;
  const sessions = data?.totalSessions ?? 0;
  const rating = data?.rating ?? 0;

  const main = (
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
    );
  return (
    <div className="creator-dashboard">
      {embedded ? null : <CreatorNav active="creator" user={user} onLogout={handleLogout} />}
      {main}
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

/* My Offers icon – from group_icon.svg */
function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.758 5.71276C12.4102 5.36496 11.967 5.12811 11.4846 5.03216C11.0022 4.9362 10.5022 4.98545 10.0478 5.17368C9.59334 5.36191 9.20494 5.68066 8.93168 6.08963C8.65842 6.4986 8.51256 6.97942 8.51256 7.47128C8.51256 7.96314 8.65842 8.44396 8.93168 8.85292C9.20494 9.26189 9.59334 9.58064 10.0478 9.76887C10.5022 9.9571 11.0022 10.0064 11.4846 9.9104C11.967 9.81444 12.4102 9.57759 12.758 9.2298C13.2243 8.7634 13.4863 8.13085 13.4863 7.47128C13.4863 6.81171 13.2243 6.17916 12.758 5.71276ZM18.9192 6.62185C18.6646 6.36726 18.3402 6.19387 17.9871 6.12363C17.6339 6.05339 17.2679 6.08944 16.9352 6.22723C16.6026 6.36501 16.3183 6.59834 16.1183 6.89772C15.9182 7.19709 15.8114 7.54906 15.8114 7.90911C15.8114 8.26916 15.9182 8.62113 16.1183 8.9205C16.3183 9.21987 16.6026 9.4532 16.9352 9.59099C17.2679 9.72878 17.6339 9.76483 17.9871 9.69459C18.3402 9.62434 18.6646 9.45096 18.9192 9.19637C19.2605 8.85495 19.4523 8.39192 19.4523 7.90911C19.4523 7.4263 19.2605 6.96326 18.9192 6.62185ZM17.0715 15.4006C17.8271 15.4748 18.5898 15.3981 19.3155 15.1749C20.0411 14.9518 20.7151 14.5866 21.2984 14.1006L21.2979 14.1C21.5576 13.8717 21.5265 13.9394 21.5265 13.587C21.525 12.8851 21.2455 12.2124 20.7492 11.7161C20.2528 11.2198 19.5801 10.9403 18.8782 10.9388H16.3854C16.1153 10.9384 15.8468 10.9797 15.5893 11.0613C15.5549 11.0721 15.5239 11.0917 15.4996 11.1183C15.4752 11.1448 15.4582 11.1773 15.4504 11.2125C15.4425 11.2477 15.4441 11.2843 15.4549 11.3187C15.4657 11.353 15.4854 11.384 15.5119 11.4084C15.9454 11.8063 16.2916 12.2899 16.5288 12.8285C16.7659 13.367 16.8887 13.949 16.8895 14.5374V15.138H16.8885C16.8885 15.2033 16.8721 15.2528 16.9318 15.3259C16.9486 15.3473 16.9697 15.3649 16.9937 15.3778C17.0177 15.3906 17.044 15.3984 17.0711 15.4006H17.0715ZM5.65471 6.62189C5.40012 6.36731 5.07575 6.19393 4.72263 6.12369C4.3695 6.05345 4.00348 6.08951 3.67084 6.22729C3.33821 6.36507 3.0539 6.5984 2.85387 6.89776C2.65384 7.19713 2.54708 7.54909 2.54708 7.90913C2.54708 8.26917 2.65384 8.62113 2.85387 8.9205C3.0539 9.21986 3.33821 9.45319 3.67084 9.59097C4.00348 9.72875 4.3695 9.76481 4.72263 9.69457C5.07575 9.62433 5.40012 9.45095 5.65471 9.19637C5.99608 8.85495 6.18785 8.39193 6.18785 7.90913C6.18785 7.42633 5.99608 6.96331 5.65471 6.62189ZM6.14206 15.2942L5.86706 15.0536C5.84576 15.0346 5.82879 15.0112 5.8173 14.9851C5.80582 14.9589 5.80009 14.9306 5.8005 14.9021V14.5373C5.80349 13.5915 6.18052 12.6853 6.84926 12.0166C7.51801 11.3479 8.42417 10.9708 9.36992 10.9678H12.6294C12.8639 10.9677 13.0979 10.9909 13.3279 11.0369L13.3282 11.0356C14.1364 11.2001 14.8632 11.6382 15.3861 12.2761C15.909 12.9139 16.196 13.7125 16.1988 14.5373V14.8987C16.1992 14.9279 16.1933 14.9568 16.1813 14.9834C16.1693 15.01 16.1516 15.0337 16.1294 15.0527L15.8617 15.2895L15.8623 15.2901L15.8256 15.3205C13.1241 17.5414 9.23757 17.6365 6.43833 15.5288L6.14185 15.294L6.14206 15.2942ZM6.40933 11.0609C6.31837 11.0317 6.22586 11.0076 6.13222 10.9888L6.13196 10.9901C5.96134 10.9559 5.78776 10.9387 5.61376 10.9388H3.12089C2.41924 10.9411 1.74698 11.2208 1.25085 11.717C0.754707 12.2131 0.474967 12.8854 0.472679 13.587V13.8089C0.472246 13.8378 0.478118 13.8665 0.489888 13.8929C0.501657 13.9193 0.519041 13.9428 0.540827 13.9618C1.13214 14.4927 1.8274 14.8947 2.58243 15.1425C3.33747 15.3902 4.13578 15.4782 4.92665 15.4009C4.95369 15.3983 4.97996 15.3905 5.00393 15.3777C5.02789 15.3649 5.04908 15.3475 5.06624 15.3264C5.08341 15.3054 5.09622 15.2811 5.10392 15.2551C5.11162 15.229 5.11407 15.2017 5.11111 15.1747L5.10918 14.5374C5.10954 13.9489 5.23207 13.3669 5.46902 12.8282C5.70597 12.2895 6.05218 11.8058 6.48573 11.4078C6.51225 11.3835 6.53191 11.3526 6.54274 11.3183C6.55357 11.284 6.55517 11.2474 6.5474 11.2123C6.53963 11.1771 6.52276 11.1446 6.49847 11.1181C6.47418 11.0915 6.44334 11.0718 6.40903 11.0609H6.40933Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Edit Profile icon – from edit_icon.svg */
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1.5 12H2.56875L9.9 4.66875L8.83125 3.6L1.5 10.9313V12ZM0 13.5V10.3125L9.9 0.43125C10.05 0.29375 10.2156 0.1875 10.3969 0.1125C10.5781 0.0375 10.7688 0 10.9688 0C11.1688 0 11.3625 0.0375 11.55 0.1125C11.7375 0.1875 11.9 0.3 12.0375 0.45L13.0688 1.5C13.2188 1.6375 13.3281 1.8 13.3969 1.9875C13.4656 2.175 13.5 2.3625 13.5 2.55C13.5 2.75 13.4656 2.94063 13.3969 3.12188C13.3281 3.30313 13.2188 3.46875 13.0688 3.61875L3.1875 13.5H0ZM9.35625 4.14375L8.83125 3.6L9.9 4.66875L9.35625 4.14375Z"
        fill="currentColor"
      />
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
