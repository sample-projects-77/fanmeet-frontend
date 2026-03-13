import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerAPI } from '../services/api';
import { getCached, setCached, clearAllCached } from '../utils/routeDataCache';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import {
  parseOfferSlotToUTC,
  formatUTCDateToLocalDay,
  formatUTCDateToLocalTime,
} from '../utils/dateTimeUtils';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

/** API returns date + startTime/endTime in UTC. We parse as UTC then display in user's local timezone. */
const OFFER_TIMES_ARE_UTC = 'UTC';

/** Format offer date for display in user's local timezone. */
function formatOfferDay(offer, locale) {
  if (!offer?.date || !offer?.startTime) return '—';
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const utcDate = parseOfferSlotToUTC(dateStr, offer.startTime, OFFER_TIMES_ARE_UTC);
  if (Number.isNaN(utcDate.getTime())) return (offer.date || '').toString();
  return formatUTCDateToLocalDay(utcDate, locale);
}

/** Format offer time range in user's local timezone. */
function formatOfferTimeRange(offer) {
  if (!offer?.startTime && !offer?.endTime) return '—';
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const startUtc = parseOfferSlotToUTC(dateStr, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
  const endUtc = parseOfferSlotToUTC(dateStr, offer.endTime || '00:00', OFFER_TIMES_ARE_UTC);
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()))
    return [offer.startTime, offer.endTime].filter(Boolean).join(' - ') || '—';
  return `${formatUTCDateToLocalTime(startUtc)} - ${formatUTCDateToLocalTime(endUtc)}`;
}

function CreatorOffers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
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

  const CACHE_KEY = 'creatorOffers';

  const fetchOffers = useCallback(async (isBackgroundRefresh = false) => {
    if (!user?.id) return;
    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    }
    try {
      const creatorId = user.id?.toString?.().replace(/^creator_/, '') || user.id;
      const res = await offerAPI.getCreatorScheduledOffers(creatorId, { page: 1, itemsPerPage: 100, status: 'available' });
      if (res.StatusCode === 200 && res.data) {
        const list = (res.data.offers || []).slice().sort((a, b) => {
          const normalizeDate = (offer) => {
            if (!offer?.date || !offer?.startTime) return 0;
            const raw = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
            const utc = parseOfferSlotToUTC(raw, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
            const time = utc.getTime();
            return Number.isNaN(time) ? 0 : time;
          };
          // Newest / most recently created slot first
          return normalizeDate(b) - normalizeDate(a);
        });
        const pag = res.data.pagination || null;
        setCached(CACHE_KEY, { offers: list, pagination: pag });
        setOffers(list);
        setPagination(pag);
      } else {
        if (!isBackgroundRefresh) {
          setError(res.error || t('offers.failedToLoad'));
          setOffers([]);
        }
      }
    } catch (err) {
      if (!isBackgroundRefresh) {
        setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
        setOffers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = getCached(CACHE_KEY);
    if (cached?.offers) {
      const sortedCached = cached.offers.slice().sort((a, b) => {
        const normalizeDate = (offer) => {
          if (!offer?.date || !offer?.startTime) return 0;
          const raw = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
          const utc = parseOfferSlotToUTC(raw, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
          const time = utc.getTime();
          return Number.isNaN(time) ? 0 : time;
        };
        // Newest / most recently created slot first
        return normalizeDate(b) - normalizeDate(a);
      });
      setOffers(sortedCached);
      setPagination(cached.pagination || null);
      setLoading(false);
      return;
    }
    fetchOffers(false);
  }, [user?.id, fetchOffers]);

  const handleLogout = () => {
    clearAllCached();
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
            <Link to="/creator/dashboard" className="creator-offers-back" aria-label={t('common.back')}>
              ←
            </Link>
            <h1 className="creator-offers-title">{t('availability.setTitle')}</h1>
          </header>

          <div className="creator-offers-divider" aria-hidden />

          {error ? (
            <ErrorWidget errorText={error} onRetry={fetchOffers} />
          ) : loading ? (
            <LoadingSpinner />
          ) : offers.length === 0 ? (
            <EmptyWidget text={t('availability.noSlots')} />
          ) : (
            <div className="creator-offers-table-wrap">
              <table className="creator-offers-table creator-offers-table--availability">
                <thead>
                  <tr>
                    <th className="creator-offers-th-day">{t('availability.day')}</th>
                    <th>{t('offers.time')}</th>
                    <th>{t('offers.duration')}</th>
                    <th className="creator-offers-th-price">{t('offers.price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr
                      key={offer.id}
                      className="creator-offers-row-clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/creator/offers/edit/${offer.id}`, { state: { offer } })}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/creator/offers/edit/${offer.id}`, { state: { offer } })}
                    >
                      <td>{formatOfferDay(offer, locale)}</td>
                      <td>{formatOfferTimeRange(offer)}</td>
                      <td>{(offer.duration ?? offer.durationMinutes) != null ? `${offer.duration ?? offer.durationMinutes} ${t('availability.minAbbr')}` : '—'}</td>
                      <td className="creator-offers-price">
                        <span className="creator-offers-price-pill">{formatPrice(offer.priceCents, offer.currency)} &gt;</span>
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
              {t('availability.addTimeSlot')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreatorOffers;
