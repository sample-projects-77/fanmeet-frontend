import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

/** Format date string (e.g. "2026-12-25" or ISO) to "Thursday, Dec 25" */
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

/** Format time range from startTime and endTime (e.g. "14:30", "15:00") */
function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '—';
  if (!startTime || !endTime) return startTime || endTime || '—';
  return `${startTime} - ${endTime}`;
}

function CreatorOffers() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState(null);
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
      const u = JSON.parse(userJson);
      setUser(u);
      if (u.role !== 'creator' && u.role !== 'CREATOR') {
        navigate('/creator/dashboard', { replace: true });
        return;
      }
    } catch {
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate]);

  const fetchOffers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const creatorId = user.id?.toString?.().replace(/^creator_/, '') || user.id;
      const res = await offerAPI.getCreatorScheduledOffers(creatorId, { page: 1, itemsPerPage: 100 });
      if (res.StatusCode === 200 && res.data) {
        setOffers(res.data.offers || []);
        setPagination(res.data.pagination || null);
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
  }, [user?.id]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="creator-offers-page">
      <CreatorNav active="creator" user={user} onLogout={handleLogout} />
      <main className="creator-offers-main">
        <div className="creator-offers-container">
          <header className="creator-offers-header">
            <Link to="/creator/dashboard" className="creator-offers-back" aria-label="Back">
              ←
            </Link>
            <h1 className="creator-offers-title">Set Your Availability</h1>
          </header>

          <div className="creator-offers-divider" aria-hidden />

          {error ? (
            <ErrorWidget errorText={error} onRetry={fetchOffers} />
          ) : loading ? (
            <LoadingSpinner />
          ) : offers.length === 0 ? (
            <EmptyWidget text="You have no time slots yet." />
          ) : (
            <div className="creator-offers-table-wrap">
              <table className="creator-offers-table">
                <thead>
                  <tr>
                    <th className="creator-offers-th-day">Day</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th className="creator-offers-th-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td>{formatDay(offer.date)}</td>
                      <td>{formatTimeRange(offer.startTime, offer.endTime)}</td>
                      <td>{(offer.duration ?? offer.durationMinutes) != null ? `${offer.duration ?? offer.durationMinutes} Min.` : '—'}</td>
                      <td className="creator-offers-price">
                        {formatPrice(offer.priceCents, offer.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="creator-offers-add-slot-wrap">
            <button
              type="button"
              className="creator-offers-add-slot-button"
              onClick={() => navigate('/creator/offers/add-time-slot')}
            >
              Add Time Slot
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreatorOffers;
