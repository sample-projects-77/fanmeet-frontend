import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import { GiveReviewDialog } from '../components/GiveReviewDialog';
import './AllSessions.css';

const JOIN_ENABLE_MINUTES = 5;

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const StopwatchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4" y1="12" x2="2" y2="12" />
    <line x1="22" y1="12" x2="20" y2="12" />
  </svg>
);
const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);

/**
 * Format date for display in the user's local timezone.
 * API returns startTime as UTC ISO; we show it in the viewer's machine timezone.
 */
function formatCardDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/**
 * Format time range in the user's local timezone.
 * startIso is UTC from API; we display in the viewer's machine timezone.
 */
function formatTimeRange(startIso, durationMinutes) {
  if (!startIso) return '—';
  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return '—';
    const end = new Date(start.getTime() + (durationMinutes || 0) * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startStr} - ${endStr}`;
  } catch {
    return '—';
  }
}

/**
 * Join is allowed from (start - 5 min) until end time. Countdown is to start until then; after end, "Session ended".
 * Returns { text, canJoin }; text is translated when t is provided.
 */
function getJoinCountdown(startIso, durationMinutes, t) {
  if (!startIso) return { text: '—', canJoin: false };
  const start = new Date(startIso);
  const durationMs = (durationMinutes || 0) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const now = new Date();
  if (now.getTime() > end.getTime()) {
    return { text: t ? t('sessions.sessionEnded') : 'Session ended', canJoin: false };
  }
  const msToStart = start.getTime() - now.getTime();
  if (msToStart <= 0) return { text: t ? t('sessions.joinNow') : 'Join now', canJoin: true };
  const totalMinutes = Math.floor(msToStart / (60 * 1000));
  const canJoin = totalMinutes <= JOIN_ENABLE_MINUTES;
  if (totalMinutes < 1) return { text: t ? t('sessions.joinNow') : 'Join now', canJoin: true };
  if (totalMinutes < 60) return { text: t ? t('sessions.joinInMin', { count: totalMinutes }) : `Join in ${totalMinutes} min`, canJoin };
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) {
    const text = t ? t('sessions.joinInHours', { hours, mins: mins > 0 ? mins + 'm' : '' }).trim() : `Join in ${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim();
    return { text, canJoin };
  }
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return { text: t ? t('sessions.joinInDays', { days, hours: h }) : `Join in ${days}d ${h}h`, canJoin };
}

export function FanAllSessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewDialogBookingId, setReviewDialogBookingId] = useState(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingAPI.getFanBookings({ page: 1, itemsPerPage: 100 });
      if (res.StatusCode !== 200 || !res.data) {
        setError(res.error || t('sessions.failedToLoad'));
        setUpcoming([]);
        setCompleted([]);
        return;
      }
      const allBookings = res.data.bookings || [];
      const now = new Date();
      const upcomingList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        if (status !== 'paid') return false;
        const start = new Date(b.startTime);
        const end = new Date(start.getTime() + (b.durationMinutes || 0) * 60 * 1000);
        return end > now;
      });
      const completedList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return status === 'completed';
      });
      setUpcoming(upcomingList);
      setCompleted(completedList);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('sessions.failedToLoad'));
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleJoin = (session) => {
    const countdown = getJoinCountdown(session.startTime, session.durationMinutes, t);
    if (countdown.canJoin) navigate(`/fan/bookings/${session.id}/call`);
  };

  if (!user) return null;

  const list = activeTab === 'upcoming' ? upcoming : completed;
  const emptyMessage =
    activeTab === 'upcoming' ? t('sessions.noUpcoming') : t('sessions.noCompleted');

  return (
    <div className="all-sessions-page">
      <FanNav active="home" user={user} onLogout={handleLogout} />
      <main className="all-sessions-main">
        <header className="all-sessions-header">
          <Link to="/fan/home" className="all-sessions-back" aria-label={t('common.back')}>
            ←
          </Link>
          <h1 className="all-sessions-title">{t('sessions.allSessions')}</h1>
        </header>

        <div className="all-sessions-tabs">
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'upcoming' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            {t('sessions.upcoming')}
          </button>
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'completed' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            {t('sessions.completed')}
          </button>
        </div>

        <div className="all-sessions-content">
          {error && (
            <ErrorWidget
              errorText={error}
              onRetry={fetchBookings}
            />
          )}
          {!error && loading && <LoadingSpinner />}
          {!error && !loading && list.length === 0 && (
            <div className="all-sessions-empty-state">
              <EmptyWidget text={emptyMessage} />
            </div>
          )}
          {!error && !loading && list.length > 0 && (
            <ul className="all-sessions-list" aria-label="Sessions">
              {list.map((session) => {
                const countdown = activeTab === 'upcoming' ? getJoinCountdown(session.startTime, session.durationMinutes) : null;
                return (
                  <li key={session.id}>
                    <div className="all-sessions-card">
                      <div className="all-sessions-card-inner">
                        <div className="all-sessions-card-top">
                          <span className="all-sessions-card-name">{session.creatorName}</span>
                          <span className={`all-sessions-card-status all-sessions-card-status--${activeTab === 'upcoming' ? 'paid' : (session.status || 'completed')}`}>
                            {activeTab === 'upcoming' ? t('sessions.paid') : (session.status || 'completed').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><CalendarIcon /></span>
                          <span className="all-sessions-card-meta">{formatCardDate(session.startTime)}</span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><ClockIcon /></span>
                          <span className="all-sessions-card-meta">{formatTimeRange(session.startTime, session.durationMinutes)}</span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><StopwatchIcon /></span>
                          <span className="all-sessions-card-meta">{session.durationMinutes || 0} Min</span>
                        </div>
                        {activeTab === 'upcoming' && countdown && (
                          <button
                            type="button"
                            className={`all-sessions-join-btn ${countdown.canJoin ? 'all-sessions-join-btn--enabled' : ''}`}
                            disabled={!countdown.canJoin}
                            onClick={() => handleJoin(session)}
                          >
                            <span className="all-sessions-join-icon"><VideoIcon /></span>
                            <span>{countdown.text}</span>
                          </button>
                        )}
                        {activeTab === 'completed' && (
                          session.reviewed ? (
                            <button
                              type="button"
                              className="all-sessions-reviewed-btn"
                              disabled
                              aria-disabled="true"
                            >
                              {t('sessions.reviewed')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="all-sessions-give-review-btn"
                              onClick={() => setReviewDialogBookingId(session.id)}
                            >
                              {t('sessions.giveReview')}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      {reviewDialogBookingId && (
        <GiveReviewDialog
          bookingId={reviewDialogBookingId}
          onClose={() => setReviewDialogBookingId(null)}
          onSuccess={() => fetchBookings()}
        />
      )}
    </div>
  );
}

export function CreatorAllSessions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewDialogBookingId, setReviewDialogBookingId] = useState(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingAPI.getCreatorBookings({ page: 1, itemsPerPage: 100 });
      if (res.StatusCode !== 200 || !res.data) {
        setError(res.error || t('sessions.failedToLoad'));
        setUpcoming([]);
        setCompleted([]);
        return;
      }
      const allBookings = res.data.bookings || [];
      const now = new Date();
      const upcomingList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        if (status !== 'paid') return false;
        const start = new Date(b.startTime);
        const end = new Date(start.getTime() + (b.durationMinutes || 0) * 60 * 1000);
        return end > now;
      });
      const completedList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return status === 'completed';
      });
      setUpcoming(upcomingList);
      setCompleted(completedList);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('sessions.failedToLoad'));
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleJoin = (session) => {
    const countdown = getJoinCountdown(session.startTime, session.durationMinutes, t);
    if (countdown.canJoin) navigate(`/creator/bookings/${session.id}/call`);
  };

  if (!user) return null;

  const list = activeTab === 'upcoming' ? upcoming : completed;
  const emptyMessage =
    activeTab === 'upcoming' ? t('sessions.noUpcoming') : t('sessions.noCompleted');

  return (
    <div className="all-sessions-page">
      <CreatorNav active="home" user={user} onLogout={handleLogout} />
      <main className="all-sessions-main">
        <header className="all-sessions-header">
          <Link to="/creator/dashboard" className="all-sessions-back" aria-label={t('common.back')}>
            ←
          </Link>
          <h1 className="all-sessions-title">{t('sessions.allSessions')}</h1>
        </header>

        <div className="all-sessions-tabs">
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'upcoming' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            {t('sessions.upcoming')}
          </button>
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'completed' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            {t('sessions.completed')}
          </button>
        </div>

        <div className="all-sessions-content">
          {error && (
            <ErrorWidget
              errorText={error}
              onRetry={fetchBookings}
            />
          )}
          {!error && loading && <LoadingSpinner />}
          {!error && !loading && list.length === 0 && (
            <div className="all-sessions-empty-state">
              <EmptyWidget text={emptyMessage} />
            </div>
          )}
          {!error && !loading && list.length > 0 && (
            <ul className="all-sessions-list" aria-label={t('sessions.ariaSessions')}>
              {list.map((session) => {
                const countdown = activeTab === 'upcoming' ? getJoinCountdown(session.startTime, session.durationMinutes, t) : null;
                return (
                  <li key={session.id}>
                    <div className="all-sessions-card">
                      <div className="all-sessions-card-inner">
                        <div className="all-sessions-card-top">
                          <span className="all-sessions-card-name">{session.fanName}</span>
                          <span className={`all-sessions-card-status all-sessions-card-status--${activeTab === 'upcoming' ? 'paid' : (session.status || 'completed')}`}>
                            {activeTab === 'upcoming' ? t('sessions.paid') : (session.status || 'completed').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><CalendarIcon /></span>
                          <span className="all-sessions-card-meta">{formatCardDate(session.startTime)}</span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><ClockIcon /></span>
                          <span className="all-sessions-card-meta">{formatTimeRange(session.startTime, session.durationMinutes)}</span>
                        </div>
                        <div className="all-sessions-card-row">
                          <span className="all-sessions-card-icon"><StopwatchIcon /></span>
                          <span className="all-sessions-card-meta">{session.durationMinutes || 0} Min</span>
                        </div>
                        {activeTab === 'upcoming' && countdown && (
                          <button
                            type="button"
                            className={`all-sessions-join-btn ${countdown.canJoin ? 'all-sessions-join-btn--enabled' : ''}`}
                            disabled={!countdown.canJoin}
                            onClick={() => handleJoin(session)}
                          >
                            <span className="all-sessions-join-icon"><VideoIcon /></span>
                            <span>{countdown.text}</span>
                          </button>
                        )}
                        {activeTab === 'completed' && (
                          session.reviewed ? (
                            <button
                              type="button"
                              className="all-sessions-reviewed-btn"
                              disabled
                              aria-disabled="true"
                            >
                              {t('sessions.reviewed')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="all-sessions-give-review-btn"
                              onClick={() => setReviewDialogBookingId(session.id)}
                            >
                              {t('sessions.giveReview')}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      {reviewDialogBookingId && (
        <GiveReviewDialog
          bookingId={reviewDialogBookingId}
          onClose={() => setReviewDialogBookingId(null)}
          onSuccess={() => fetchBookings()}
        />
      )}
    </div>
  );
}
