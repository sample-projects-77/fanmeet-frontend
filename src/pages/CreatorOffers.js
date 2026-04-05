import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  filterActiveOffers,
} from '../utils/dateTimeUtils';
import './CreatorOffers.css';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const euros = priceCents / 100;
  const value = Number.isInteger(euros)
    ? euros.toString()
    : euros.toFixed(2).replace('.', ',');
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${value}${symbol}`;
}

/** API returns date + startTime/endTime in UTC. We parse as UTC then display in user's local timezone. */
const OFFER_TIMES_ARE_UTC = 'UTC';
const ITEMS_PER_PAGE = 20;

function sortOffers(list) {
  return list.slice().sort((a, b) => {
    const normalizeSortKey = (offer) => {
      if (offer?.createdAt) {
        const created = new Date(offer.createdAt).getTime();
        if (!Number.isNaN(created)) return created;
      }
      if (!offer?.date || !offer?.startTime) return 0;
      const raw = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
      const utc = parseOfferSlotToUTC(raw, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
      const time = utc.getTime();
      return Number.isNaN(time) ? 0 : time;
    };
    return normalizeSortKey(b) - normalizeSortKey(a);
  });
}

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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(1);
  const sentinelRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const fetchOffers = useCallback(async (page = 1, isBackgroundRefresh = false) => {
    if (!user?.id) return;
    if (page === 1 && !isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    }
    if (page > 1) {
      setLoadingMore(true);
    }
    try {
      const creatorId = user.id?.toString?.().replace(/^creator_/, '') || user.id;
      const res = await offerAPI.getCreatorScheduledOffers(creatorId, {
        page,
        itemsPerPage: ITEMS_PER_PAGE,
        status: 'available',
      });
      if (res.StatusCode === 200 && res.data) {
        const newOffers = sortOffers(res.data.offers || []);
        const pag = res.data.pagination || null;
        const totalPages = pag?.totalPages || pag?.pages || 1;

        if (page === 1) {
          setCached(CACHE_KEY, { offers: newOffers, pagination: pag });
          setOffers(newOffers);
        } else {
          setOffers((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const unique = newOffers.filter((o) => !existingIds.has(o.id));
            const merged = [...prev, ...unique];
            setCached(CACHE_KEY, { offers: merged, pagination: pag });
            return merged;
          });
        }

        setHasMore(page < totalPages && newOffers.length > 0);
        currentPageRef.current = page;
      } else {
        if (page === 1 && !isBackgroundRefresh) {
          setError(res.error || t('offers.failedToLoad'));
          setOffers([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      if (page === 1 && !isBackgroundRefresh) {
        setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
        setOffers([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = getCached(CACHE_KEY);
    if (cached?.offers) {
      setOffers(sortOffers(cached.offers));
      setLoading(false);
      // Still check for more pages by fetching page 1 in background
      fetchOffers(1, true);
      return;
    }
    fetchOffers(1, false);
  }, [user?.id, fetchOffers]);

  // Infinite scroll: observe sentinel element near the bottom of the list
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchOffers(currentPageRef.current + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchOffers]);

  const handleLogout = () => {
    clearAllCached();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const activeOffers = filterActiveOffers(offers);

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
            <ErrorWidget errorText={error} onRetry={() => fetchOffers(1)} />
          ) : loading ? (
            <LoadingSpinner />
          ) : activeOffers.length === 0 ? (
            <EmptyWidget text={t('availability.noSlots')} />
          ) : (
            <>
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
                    {activeOffers.map((offer) => (
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
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="creator-offers-sentinel" aria-hidden />
              {loadingMore && (
                <div className="creator-offers-loading-more">
                  <LoadingSpinner />
                </div>
              )}
              <div className="creator-offers-bottom-spacer" aria-hidden />
            </>
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
