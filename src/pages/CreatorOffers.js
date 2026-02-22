import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
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

  useEffect(() => {
    if (!user?.id) return;
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        // GET /api/creators/me/offers returns your offer types (title, duration, price) from the DB
        const res = await offerAPI.getMyOffers(1, 100);
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
    };
    fetchOffers();
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="creator-offers-page">
      <CreatorNav active="creator" userName={user.userName} onLogout={handleLogout} />
      <main className="creator-offers-main">
        <div className="creator-offers-container">
          <header className="creator-offers-header">
            <Link to="/creator/dashboard" className="creator-offers-back" aria-label="Back">
              ←
            </Link>
            <h1 className="creator-offers-title">Offers</h1>
          </header>

          <div className="creator-offers-divider" aria-hidden />

          {error && (
            <div className="creator-offers-error">{error}</div>
          )}

          {loading ? (
            <div className="creator-offers-loading">Loading offers…</div>
          ) : offers.length === 0 ? (
            <div className="creator-offers-empty">You have no offers yet.</div>
          ) : (
            <div className="creator-offers-table-wrap">
              <table className="creator-offers-table">
                <thead>
                  <tr>
                    <th>Offer</th>
                    <th>Duration</th>
                    <th className="creator-offers-th-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td>{offer.title || '—'}</td>
                      <td>{offer.durationMinutes != null ? `${offer.durationMinutes} Min.` : '—'}</td>
                      <td className="creator-offers-price">
                        {formatPrice(offer.priceCents, offer.currency)}
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

export default CreatorOffers;
