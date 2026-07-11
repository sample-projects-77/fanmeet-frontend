import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerAPI, bookingAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyWidget from '../components/EmptyWidget';
import ErrorWidget from '../components/ErrorWidget';
import {
  parseOfferSlotToUTC,
  formatUTCDateToLocalTime,
  offerSlotStartToUTCISO,
} from '../utils/dateTimeUtils';
import { getFriendlyPaymentError } from '../utils/paymentErrors';

function formatPrice(priceCents, currency = 'EUR') {
  if (priceCents == null) return '—';
  const euros = priceCents / 100;
  const value = euros.toFixed(2).replace('.', ',');
  const code = currency === 'EUR' ? 'EUR' : currency;
  return `${value} ${code}`;
}

/** API returns date + startTime/endTime in UTC. Parse as UTC then display in user's local timezone. */
const OFFER_TIMES_ARE_UTC = 'UTC';

function formatOfferDay(offer, locale) {
  if (!offer?.date || !offer?.startTime) return '—';
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const utcDate = parseOfferSlotToUTC(dateStr, offer.startTime, OFFER_TIMES_ARE_UTC);
  if (Number.isNaN(utcDate.getTime())) return (offer.date || '').toString();
  return utcDate.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatOfferDuration(offer, t) {
  const minutes = offer.duration ?? offer.durationMinutes;
  if (minutes == null) return null;
  return `(${minutes} ${t('offers.minAbbr')})`;
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

/**
 * Shared offers list for a creator. Used by both fan and creator (viewing another creator).
 * @param {{ backTo: string, backState?: object, canBook?: boolean }} props - backTo: URL for the back link; optional backState for nav tab
 */
function CreatorOffersContent({ backTo, backState, canBook = true }) {
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
      const ok =
        (res.StatusCode === 200 || res.statusCode === 200) && res.data;
      if (ok) {
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
      const createOk =
        createRes.StatusCode === 200 || createRes.statusCode === 200;
      if (!createOk || !createRes.data?.id) {
        setError(getFriendlyPaymentError(createRes.error, t) || t('offers.failedToCreateBooking'));
        return;
      }
      if (createRes.data.status === 'HOLD') {
        setError(t('offers.slotTemporarilyReserved'));
        return;
      }
      navigate(`/fan/bookings/${createRes.data.id}/pay`, {
        replace: true,
        state: { creatorId: rawCreatorId },
      });
    } catch (err) {
      setError(getFriendlyPaymentError(err.response?.data?.error || err.message, t));
    } finally {
      setBookingInProgress(null);
    }
  };

  const bookableOffers = (offers || []).filter(
    (offer) => offer.status === 'available'
  );

  return (
    <main className="creator-offers-main">
      <div className="creator-offers-container">
        <header className="creator-offers-header">
          <Link
            to={backTo}
            {...(backState == null ? {} : { state: backState })}
            className="creator-offers-back"
            aria-label={t('common.back')}
          >
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
            <table className="creator-offers-table creator-offers-table--bookable">
              <thead>
                <tr>
                  <th className="creator-offers-th-day">{t('availability.day')}</th>
                  <th className="creator-offers-th-time">{t('offers.time')}</th>
                  <th className="creator-offers-th-price">{t('offers.price')}</th>
                  <th className="creator-offers-th-action">{t('offers.bookNow')}</th>
                </tr>
              </thead>
              <tbody>
                {bookableOffers.map((offer) => {
                  const durationLabel = formatOfferDuration(offer, t);
                  return (
                    <tr key={offer.id}>
                      <td className="creator-offers-td-day">{formatOfferDay(offer, locale)}</td>
                      <td className="creator-offers-td-time">
                        <span className="creator-offers-time-range">{formatOfferTimeRange(offer)}</span>
                        {durationLabel && (
                          <span className="creator-offers-time-duration">{durationLabel}</span>
                        )}
                      </td>
                      <td className="creator-offers-price">
                        {formatPrice(offer.priceCents, offer.currency)}
                      </td>
                      <td className="creator-offers-td-action">
                        {canBook && offer.status === 'available' && (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default CreatorOffersContent;
