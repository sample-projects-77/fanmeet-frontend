import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerAPI, bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import {
  parseOfferSlotToUTC,
  formatUTCDateToLocalDay,
  formatUTCDateToLocalTime,
  offerSlotStartToUTCISO,
} from '../utils/dateTimeUtils';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const value = (priceCents / 100).toFixed(2).replace('.', ',');
  return `${value} ${currency}`;
}

/** API returns date + startTime/endTime in UTC. Parse as UTC then display in user's local timezone. */
const OFFER_TIMES_ARE_UTC = 'UTC';

function formatOfferDay(offer, locale) {
  if (!offer?.date || !offer?.startTime) return '—';
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const utcDate = parseOfferSlotToUTC(dateStr, offer.startTime, OFFER_TIMES_ARE_UTC);
  if (Number.isNaN(utcDate.getTime())) return (offer.date || '').toString();
  return formatUTCDateToLocalDay(utcDate, locale);
}

function formatOfferTimeRange(offer) {
  if (!offer?.startTime && !offer?.endTime) return '—';
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const startUtc = parseOfferSlotToUTC(dateStr, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
  const endUtc = parseOfferSlotToUTC(dateStr, offer.endTime || '00:00', OFFER_TIMES_ARE_UTC);
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime()))
    return [offer.startTime, offer.endTime].filter(Boolean).join(' - ') || '—';
  return `${formatUTCDateToLocalTime(startUtc)} - ${formatUTCDateToLocalTime(endUtc)}`;
}

function isOfferInFuture(offer) {
  if (!offer?.date || !offer?.startTime) return true;
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const startUtc = parseOfferSlotToUTC(dateStr, offer.startTime || '00:00', OFFER_TIMES_ARE_UTC);
  const time = startUtc.getTime();
  if (Number.isNaN(time)) return true;
  return time >= Date.now();
}

/**
 * Shared offers list for a creator. Used by both fan and creator (viewing another creator).
 * @param {{ backTo: string }} props - backTo: URL for the back link
 */
function CreatorOffersContent({ backTo }) {
  const { t, i18n } = useTranslation();
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(null);

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
        setError(res.error || t('offers.failedToLoad'));
        setOffers([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [creatorId, t]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

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
        setError(createRes.error || t('offers.failedToCreateBooking'));
        return;
      }
      navigate(`/fan/bookings/${createRes.data.id}/pay`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('common.errorGeneric'));
    } finally {
      setBookingInProgress(null);
    }
  };

  const bookableOffers = (offers || []).filter(
    (offer) => offer.status === 'available' && isOfferInFuture(offer)
  );

  return (
    <main className="creator-offers-main">
      <div className="creator-offers-container">
        <header className="creator-offers-header">
          <Link to={backTo} className="creator-offers-back" aria-label={t('common.back')}>
            ←
          </Link>
          <h1 className="creator-offers-title">{t('offers.title')}</h1>
        </header>

        <div className="creator-offers-divider" aria-hidden />

        {error ? (
          <ErrorWidget errorText={error} onRetry={fetchOffers} />
        ) : loading ? (
          <LoadingSpinner />
        ) : bookableOffers.length === 0 ? (
          <EmptyWidget text={t('offers.noOffers')} />
        ) : (
          <div className="creator-offers-table-wrap">
            <table className="creator-offers-table">
              <thead>
                <tr>
                  <th className="creator-offers-th-day">{t('availability.day')}</th>
                  <th>{t('offers.time')}</th>
                  <th>{t('offers.duration')}</th>
                  <th className="creator-offers-th-price">{t('offers.price')}</th>
                  <th className="creator-offers-th-action" aria-label={t('common.action')} />
                </tr>
              </thead>
              <tbody>
                {bookableOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td>{formatOfferDay(offer, locale)}</td>
                    <td>{formatOfferTimeRange(offer)}</td>
                    <td>{(offer.duration ?? offer.durationMinutes) != null ? `${offer.duration ?? offer.durationMinutes} ${t('availability.minAbbr')}` : '—'}</td>
                    <td className="creator-offers-price">
                      {formatPrice(offer.priceCents, offer.currency)}
                    </td>
                    <td className="creator-offers-td-action">
                      {offer.status === 'available' && (
                        <span
                          className="creator-offers-book-btn"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleBookNow(offer)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBookNow(offer)}
                          aria-busy={bookingInProgress === offer.id}
                        >
                          {bookingInProgress === offer.id ? t('offers.booking') : t('offers.bookNow')}
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
  );
}

export default CreatorOffersContent;
