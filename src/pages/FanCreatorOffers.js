import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { offerAPI, bookingAPI } from '../services/api';
import FanNav from '../components/FanNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import {
  parseOfferSlotToUTC,
  formatUTCDateToLocalDay,
  formatUTCDateToLocalTime,
  offerSlotStartToUTCISO,
} from '../utils/dateTimeUtils';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

/** Format offer date for display in user's local timezone. */
function formatOfferDay(offer) {
  if (!offer?.date || !offer?.startTime) return '—';
  const tz = (offer.creatorTimezone || offer.timezone || 'UTC').toString().trim();
  const utcDate = parseOfferSlotToUTC(offer.date, offer.startTime, tz);
  if (Number.isNaN(utcDate.getTime())) return (offer.date || '').toString();
  return formatUTCDateToLocalDay(utcDate);
}

/** Format offer time range in user's local timezone. */
function formatOfferTimeRange(offer) {
  if (!offer?.startTime && !offer?.endTime) return '—';
  const tz = (offer.creatorTimezone || offer.timezone || 'UTC').toString().trim();
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const startUtc = parseOfferSlotToUTC(dateStr, offer.startTime || '00:00', tz);
  const endUtc = parseOfferSlotToUTC(dateStr, offer.endTime || '00:00', tz);
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()))
    return [offer.startTime, offer.endTime].filter(Boolean).join(' - ') || '—';
  return `${formatUTCDateToLocalTime(startUtc)} - ${formatUTCDateToLocalTime(endUtc)}`;
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
    const startTimeISO = offerSlotStartToUTCISO(offer);
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
                      <td>{formatOfferDay(offer)}</td>
                      <td>{formatOfferTimeRange(offer)}</td>
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
