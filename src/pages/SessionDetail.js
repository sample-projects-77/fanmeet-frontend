import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorWidget from '../components/ErrorWidget';
import './SessionDetail.css';

/** Format UTC ISO from API in the user's local timezone. */
function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: 'long',
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

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

function canJoinBooking(booking) {
  if (!booking) return false;
  const status = (booking.status || '').toLowerCase();
  if (status === 'completed' || status === 'no_show' || status === 'cancelled') return false;
  if (!['paid', 'confirmed', 'in_progress'].includes(status)) return false;
  const end = booking.endTime ? new Date(booking.endTime) : null;
  if (end && !Number.isNaN(end.getTime()) && end <= new Date()) return false;
  return true;
}

function sessionStatusLabel(t, booking) {
  const s = (booking.status || '').toLowerCase();
  if (s === 'no_show') return t('sessions.noShow');
  if (s === 'paid') return t('sessions.paid');
  if (s === 'confirmed') return t('sessions.confirmed');
  if (s === 'in_progress') return t('sessions.inProgress');
  if (s === 'completed') return t('sessions.completed');
  return (booking.status || '').replace(/_/g, ' ');
}

export function FanSessionDetail() {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
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
    if (!bookingId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bookingAPI.getBookingById(bookingId);
        if (cancelled) return;
        if (res.StatusCode === 200 && res.data) {
          setBooking(res.data);
        } else {
          setError(res.error || 'Booking not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to load session');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const canJoin = canJoinBooking(booking);

  const handleJoinMeeting = () => {
    navigate(`/fan/bookings/${booking.id}/call`);
  };

  if (!user) return null;

  return (
    <div className="session-detail-page">
      <FanNav active="fan" user={user} onLogout={handleLogout} />
      <main className="session-detail-main">
        <header className="session-detail-header">
          <Link to="/fan/bookings" className="session-detail-back" aria-label="Back to sessions">
            ←
          </Link>
          <h1 className="session-detail-title">Session</h1>
        </header>

        {loading && <LoadingSpinner />}
        {error && (
          <ErrorWidget
            errorText={error}
            onRetry={() => window.location.reload()}
          />
        )}
        {!loading && !error && booking && (
          <div className="session-detail-card">
            <div className="session-detail-row">
              <span className="session-detail-label">Creator</span>
              <span className="session-detail-value">{booking.creator?.name || booking.creator?.userName || '—'}</span>
            </div>
            {booking.offer && (
              <>
                <div className="session-detail-row">
                  <span className="session-detail-label">Offer</span>
                  <span className="session-detail-value">{booking.offer.title}</span>
                </div>
                <div className="session-detail-row">
                  <span className="session-detail-label">Duration</span>
                  <span className="session-detail-value">{booking.offer.durationMinutes} min</span>
                </div>
                <div className="session-detail-row session-detail-row--price">
                  <span className="session-detail-label">Price</span>
                  <span className="session-detail-price-pill" aria-hidden>
                    {formatPrice(booking.offer.priceCents, booking.offer.currency)} &gt;
                  </span>
                </div>
              </>
            )}
            <div className="session-detail-row">
              <span className="session-detail-label">Start</span>
              <span className="session-detail-value">{formatDateTime(booking.startTime)}</span>
            </div>
            <div className="session-detail-row">
              <span className="session-detail-label">End</span>
              <span className="session-detail-value">{formatDateTime(booking.endTime)}</span>
            </div>
            <div className="session-detail-row">
              <span className="session-detail-label">Status</span>
              <span className={`session-detail-status session-detail-status--${booking.status}`}>
                {sessionStatusLabel(t, booking)}
              </span>
            </div>
            {booking.status === 'no_show' && (
              <p className="session-detail-no-show-notice">{t('sessionDetail.noShowNoCharge')}</p>
            )}
            {canJoin && (
              <div className="session-detail-actions">
                <button type="button" className="btn-primary session-detail-join" onClick={handleJoinMeeting}>
                  {t('sessionDetail.joinMeeting')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export function CreatorSessionDetail() {
  const { t } = useTranslation();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
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
    if (!bookingId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bookingAPI.getBookingById(bookingId);
        if (cancelled) return;
        if (res.StatusCode === 200 && res.data) {
          setBooking(res.data);
        } else {
          setError(res.error || 'Booking not found');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to load session');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const canJoin = canJoinBooking(booking);

  const handleJoinMeeting = () => {
    navigate(`/creator/bookings/${booking.id}/call`);
  };

  if (!user) return null;

  return (
    <div className="session-detail-page">
      <CreatorNav active="creator" user={user} onLogout={handleLogout} />
      <main className="session-detail-main">
        <header className="session-detail-header">
          <Link to="/creator/bookings" className="session-detail-back" aria-label="Back to sessions">
            ←
          </Link>
          <h1 className="session-detail-title">Session</h1>
        </header>

        {loading && <LoadingSpinner />}
        {error && (
          <ErrorWidget
            errorText={error}
            onRetry={() => window.location.reload()}
          />
        )}
        {!loading && !error && booking && (
          <div className="session-detail-card">
            <div className="session-detail-row">
              <span className="session-detail-label">Fan</span>
              <span className="session-detail-value">{booking.fan?.name || booking.fan?.userName || '—'}</span>
            </div>
            {booking.offer && (
              <>
                <div className="session-detail-row">
                  <span className="session-detail-label">Offer</span>
                  <span className="session-detail-value">{booking.offer.title}</span>
                </div>
                <div className="session-detail-row">
                  <span className="session-detail-label">Duration</span>
                  <span className="session-detail-value">{booking.offer.durationMinutes} min</span>
                </div>
                <div className="session-detail-row session-detail-row--price">
                  <span className="session-detail-label">Price</span>
                  <span className="session-detail-price-pill" aria-hidden>
                    {formatPrice(booking.offer.priceCents, booking.offer.currency)} &gt;
                  </span>
                </div>
              </>
            )}
            <div className="session-detail-row">
              <span className="session-detail-label">Start</span>
              <span className="session-detail-value">{formatDateTime(booking.startTime)}</span>
            </div>
            <div className="session-detail-row">
              <span className="session-detail-label">End</span>
              <span className="session-detail-value">{formatDateTime(booking.endTime)}</span>
            </div>
            <div className="session-detail-row">
              <span className="session-detail-label">Status</span>
              <span className={`session-detail-status session-detail-status--${booking.status}`}>
                {sessionStatusLabel(t, booking)}
              </span>
            </div>
            {booking.status === 'no_show' && (
              <p className="session-detail-no-show-notice">{t('sessionDetail.noShowNoCharge')}</p>
            )}
            {canJoin && (
              <div className="session-detail-actions">
                <button type="button" className="btn-primary session-detail-join" onClick={handleJoinMeeting}>
                  {t('sessionDetail.joinMeeting')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
