import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './AllSessions.css';

function formatSessionDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function FanAllSessions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

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
        setError(res.error || 'Failed to load sessions');
        setUpcoming([]);
        setCompleted([]);
        return;
      }
      const allBookings = res.data.bookings || [];
      const now = new Date();
      const upcomingList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        const start = new Date(b.startTime);
        return ['paid', 'confirmed', 'in_progress'].includes(status) && start > now;
      });
      const completedList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return status === 'completed';
      });
      setUpcoming(upcomingList);
      setCompleted(completedList);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load sessions');
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const list = activeTab === 'upcoming' ? upcoming : completed;
  const emptyMessage =
    activeTab === 'upcoming' ? 'No upcoming sessions found.' : 'No completed sessions found.';

  return (
    <div className="all-sessions-page">
      <FanNav active="home" user={user} onLogout={handleLogout} />
      <main className="all-sessions-main">
        <header className="all-sessions-header">
          <Link to="/fan/home" className="all-sessions-back" aria-label="Back">
            ←
          </Link>
          <h1 className="all-sessions-title">All Sessions</h1>
        </header>

        <div className="all-sessions-tabs">
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'upcoming' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'completed' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
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
              {list.map((session) => (
                <li key={session.id}>
                  <Link
                    to={`/fan/bookings/${session.id}`}
                    className="all-sessions-card"
                  >
                    <span className="all-sessions-card-name">{session.creatorName}</span>
                    <span className="all-sessions-card-meta">
                      {formatSessionDate(session.startTime)} · {session.durationMinutes} min
                    </span>
                    <span className={`all-sessions-card-status all-sessions-card-status--${session.status}`}>
                      {session.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export function CreatorAllSessions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

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
        setError(res.error || 'Failed to load sessions');
        setUpcoming([]);
        setCompleted([]);
        return;
      }
      const allBookings = res.data.bookings || [];
      const now = new Date();
      const upcomingList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        const start = new Date(b.startTime);
        return ['paid', 'confirmed', 'in_progress'].includes(status) && start > now;
      });
      const completedList = allBookings.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return status === 'completed';
      });
      setUpcoming(upcomingList);
      setCompleted(completedList);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load sessions');
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const list = activeTab === 'upcoming' ? upcoming : completed;
  const emptyMessage =
    activeTab === 'upcoming' ? 'No upcoming sessions found.' : 'No completed sessions found.';

  return (
    <div className="all-sessions-page">
      <CreatorNav active="home" user={user} onLogout={handleLogout} />
      <main className="all-sessions-main">
        <header className="all-sessions-header">
          <Link to="/creator/dashboard" className="all-sessions-back" aria-label="Back">
            ←
          </Link>
          <h1 className="all-sessions-title">All Sessions</h1>
        </header>

        <div className="all-sessions-tabs">
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'upcoming' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`all-sessions-tab ${activeTab === 'completed' ? 'all-sessions-tab--active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
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
              {list.map((session) => (
                <li key={session.id}>
                  <Link
                    to={`/creator/bookings/${session.id}`}
                    className="all-sessions-card"
                  >
                    <span className="all-sessions-card-name">{session.fanName}</span>
                    <span className="all-sessions-card-meta">
                      {formatSessionDate(session.startTime)} · {session.durationMinutes} min
                    </span>
                    <span className={`all-sessions-card-status all-sessions-card-status--${session.status}`}>
                      {session.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
