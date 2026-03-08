import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { offerAPI, bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

function formatDay(dateStr) {
  if (!dateStr) return '—';
  try {
    const iso = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return dateStr;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${dayName}, ${monthShort} ${day}`;
  } catch {
    return dateStr;
  }
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '—';
  if (!startTime || !endTime) return startTime || endTime || '—';
  return `${startTime} - ${endTime}`;
}

/**
 * Build startTime ISO string for createBooking. The backend expects ISO 8601 and checks
 * that the time is in the future. We must include the creator's timezone offset so the
 * instant is unambiguous (e.g. "2026-03-08T04:57:00+05:00"). Use the offer's title date
 * when available ("Meeting on YYYY-MM-DD at HH:MM") so the booking is created for the
 * same calendar date as the offer.
 */
function buildStartTimeISO(offer) {
  let datePart = '';
  const title = (offer.title || '').toString();
  const titleMatch = title.match(/Meeting on (\d{4}-\d{2}-\d{2}) at/);
  if (titleMatch) {
    datePart = titleMatch[1];
  }
  if (!datePart) {
    const dateRaw = (offer.date || '').toString();
    datePart = dateRaw.includes('T') ? dateRaw.split('T')[0] : dateRaw.split(' ')[0];
    datePart = (datePart || '').substring(0, 10);
  }
  const timeStr = (offer.startTime || '00:00').trim();
  const timePart = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const tz = (offer.creatorTimezone || offer.timezone || '').toString().trim();
  const offset = parseTimezoneOffset(tz);
  if (offset !== null) {
    const sign = offset >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const m = String(Math.abs(offset) % 60).padStart(2, '0');
    return `${datePart}T${timePart}${sign}${h}:${m}`;
  }
  return `${datePart}T${timePart}`;
}

function parseTimezoneOffset(tz) {
  if (!tz) return null;
  const m = tz.trim().match(/^UTC([+-])(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === '+' ? 1 : -1;
  const hours = parseInt(m[2], 10);
  const mins = parseInt(m[3], 10);
  return sign * (hours * 60 + mins);
}

function FanCreatorOffers() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);

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

  const fetchOffers = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    setError(null);
    try {
      const id = creatorId.toString().replace(/^creator_/, '');
      const res = await offerAPI.getCreatorScheduledOffers(id, { page: 1, itemsPerPage: 100 });
      if (res.StatusCode === 200 && res.data) {
        setOffers(res.data.offers || []);
      } else {
        setError(res.error || 'Failed to load offers');
        setOffers([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleBookNow = async (offer) => {
    const rawCreatorId = creatorId.toString().replace(/^creator_/, '');
    const rawOfferId = (offer.id || '').replace(/^offer_/, '');
    const startTimeISO = buildStartTimeISO(offer);
    setBookingInProgress(offer.id);
    setError(null);
    try {
      const createRes = await bookingAPI.createBooking({
        creatorId: rawCreatorId,
        offerId: rawOfferId,
        startTime: startTimeISO,
      });
      if (createRes.StatusCode !== 200 || !createRes.data?.id) {
        setError(createRes.error || 'Failed to create booking');
        return;
      }
      navigate(`/fan/bookings/${createRes.data.id}/pay`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setBookingInProgress(null);
    }
  };

  if (!user) return null;

  const bookableOffers = (offers || []).filter((offer) => offer.status === 'available');

  return (
    <div className="creator-offers-page">
      <FanNav active="search" user={user} onLogout={handleLogout} />
      <main className="creator-offers-main">
        <div className="creator-offers-container">
          <header className="creator-offers-header">
            <Link to={`/fan/creators/${creatorId}`} className="creator-offers-back" aria-label="Back to creator">
              ←
            </Link>
            <h1 className="creator-offers-title">Offers</h1>
          </header>

          <div className="creator-offers-divider" aria-hidden />

          {error ? (
            <ErrorWidget errorText={error} onRetry={fetchOffers} />
          ) : loading ? (
            <LoadingSpinner />
          ) : bookableOffers.length === 0 ? (
            <EmptyWidget text="No offers available." />
          ) : (
            <div className="creator-offers-table-wrap">
              <table className="creator-offers-table">
                <thead>
                  <tr>
                    <th className="creator-offers-th-day">Day</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th className="creator-offers-th-price">Price</th>
                    <th className="creator-offers-th-action" aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {bookableOffers.map((offer) => (
                    <tr key={offer.id}>
                      <td>{formatDay(offer.date)}</td>
                      <td>{formatTimeRange(offer.startTime, offer.endTime)}</td>
                      <td>{(offer.duration ?? offer.durationMinutes) != null ? `${offer.duration ?? offer.durationMinutes} Min.` : '—'}</td>
                      <td className="creator-offers-price">
                        {formatPrice(offer.priceCents, offer.currency)}
                      </td>
                      <td>
                        {offer.status === 'available' && (
                          <span
                            className="creator-offers-book-btn"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleBookNow(offer)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBookNow(offer)}
                            aria-busy={bookingInProgress === offer.id}
                          >
                            {bookingInProgress === offer.id ? 'Booking…' : 'Book now'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FanCreatorOffers;
