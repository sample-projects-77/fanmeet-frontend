import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { DatePickerDialog } from '../components/DatePickerDialog';
import { TimePickerDialog } from '../components/TimePickerDialog';
import {
  formatTimeToAMPM,
  getEndTimeFromStartAndDuration,
  parseOfferSlotToUTC,
  formatUTCDateToLocalTime,
  localSlotToUtcPayload,
} from '../utils/dateTimeUtils';
import { clearCached } from '../utils/routeDataCache';
import './CreatorAddTimeSlot.css';

/**
 * API returns date + startTime in UTC. Parse as UTC then convert to local for the edit form.
 * Matches list display so the form shows what the list shows.
 */
function offerToLocalDateAndTime(offer) {
  if (!offer?.date || !offer?.startTime) return { localDate: null, startTime: '' };
  const dateStr = (offer.date || '').toString().split('T')[0].split(' ')[0].substring(0, 10);
  const utcDate = parseOfferSlotToUTC(dateStr, (offer.startTime || '').trim(), 'UTC');
  if (Number.isNaN(utcDate.getTime())) {
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return { localDate: null, startTime: (offer.startTime || '').trim() };
    return { localDate: new Date(y, m - 1, d), startTime: (offer.startTime || '').trim() };
  }
  const localDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
  const startTime = formatUTCDateToLocalTime(utcDate);
  return { localDate, startTime };
}

function CreatorEditTimeSlot() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { offerId } = useParams();
  const location = useLocation();
  const offer = location.state?.offer;

  const [user, setUser] = useState(null);
  const dateLocale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      navigate('/login', { replace: true });
      return;
    }
    try {
      const u = JSON.parse(userJson);
      if (u.role !== 'creator' && u.role !== 'CREATOR') {
        navigate('/creator/dashboard', { replace: true });
        return;
      }
      setUser(u);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Redirect if no offer in state (e.g. direct URL). Pre-fill form in local time (same as list display).
  useEffect(() => {
    if (!user) return;
    if (!offerId || !offer) {
      navigate('/creator/offers', { replace: true });
      return;
    }
    const { localDate, startTime: localStartTime } = offerToLocalDateAndTime(offer);
    setDate(localDate || null);
    setStartTime(localStartTime);
    setDuration(Number(offer.duration ?? offer.durationMinutes ?? 30));
    const cents = offer.priceCents;
    setPrice(cents != null ? (cents / 100).toFixed(2).replace('.', ',') : '');
  }, [user, offerId, offer, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!date || !startTime || !duration || !price) {
      setError(t('availability.fillAllFields'));
      return;
    }

    const parsedPrice = parseFloat(String(price).replace(',', '.').trim());
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError(t('availability.validPrice'));
      return;
    }

    const priceCents = Math.round(parsedPrice * 100);

    const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
    if (
      Number.isNaN(startH) ||
      Number.isNaN(startM) ||
      startH < 0 ||
      startH > 23 ||
      startM < 0 ||
      startM > 59
    ) {
      setError(t('availability.validStartTime'));
      return;
    }

    // Send slot in UTC so the backend stores the correct instant (avoids date/time shifting after save)
    const { dateIsoUtc, startTimeUtc, endTimeUtc } = localSlotToUtcPayload(date, startTime, duration);
    if (!dateIsoUtc) {
      setError(t('availability.validDate'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await offerAPI.updateScheduledOffer(offerId, {
        dateIso: dateIsoUtc,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        duration: Number(duration),
        priceCents,
      });
      if (res.StatusCode === 200 && res.data) {
        clearCached('creatorOffers');
        navigate('/creator/offers', { replace: true });
      } else {
        setError(res.error || t('availability.failedToUpdate'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t('common.errorGeneric')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteCancel = () => setShowDeleteConfirm(false);

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    setError('');
    try {
      const res = await offerAPI.deleteOffer(offerId);
      if (res.StatusCode === 200) {
        clearCached('creatorOffers');
        navigate('/creator/offers', { replace: true });
      } else {
        setError(res.error || t('availability.failedToDelete'));
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t('availability.failedToDelete')
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="creator-add-slot-page">
        <CreatorNav active="creator" onLogout={handleLogout} />
        <main className="creator-add-slot-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <div className="creator-add-slot-page">
      <CreatorNav active="creator" user={user} onLogout={handleLogout} />
      <main className="creator-add-slot-main">
        <div className="creator-add-slot-container">
          <header className="creator-add-slot-header creator-add-slot-header--edit">
            <Link to="/creator/offers" className="creator-add-slot-back" aria-label={t('common.back')}>
              ←
            </Link>
            <h1 className="creator-add-slot-title">{t('availability.editTimeSlot')}</h1>
            <button
              type="button"
              className="creator-add-slot-delete"
              onClick={handleDeleteClick}
              disabled={deleting}
              aria-label={t('availability.deleteTimeSlot')}
              title={t('availability.deleteTimeSlot')}
            >
              <DeleteOutlineIcon className="creator-add-slot-delete-icon" fontSize="medium" aria-hidden />
            </button>
          </header>

          <DeleteAccountDialog
            open={showDeleteConfirm}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            deleting={deleting}
            title={t('availability.deleteTimeSlotTitle')}
            message={t('availability.deleteTimeSlotMessage')}
            cancelLabel={t('common.cancel')}
            confirmLabel={t('availability.deleteTimeSlot')}
            deletingLabel={t('availability.deletingTimeSlot')}
          />

          <p className="creator-add-slot-subtitle">
            {t('availability.editSlotSubtitle')}
          </p>

          <form className="creator-add-slot-form" onSubmit={handleSubmit}>
            {error && (
              <div className="creator-add-slot-error">
                {error}
              </div>
            )}

            <div className="creator-add-slot-field">
              <label htmlFor="date">{t('offers.date')}</label>
              <div
                className="creator-add-slot-input-wrap creator-add-slot-trigger creator-add-slot-date-wrap"
                onClick={() => setShowDatePicker(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowDatePicker(true)}
                id="date"
                aria-label={t('availability.selectDate')}
              >
                <span className={date ? '' : 'creator-add-slot-placeholder'}>
                  {date
                    ? date.toLocaleDateString(dateLocale, { month: '2-digit', day: '2-digit', year: 'numeric' })
                    : (dateLocale === 'de-DE' ? 'TT/MM/JJJJ' : 'mm/dd/yyyy')}
                </span>
                <span className="creator-add-slot-date-icon" aria-hidden>
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </span>
              </div>
              {showDatePicker && (
                <DatePickerDialog
                  value={date}
                  onConfirm={(d) => {
                    setDate(d);
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />
              )}
            </div>

            <div className="creator-add-slot-field">
              <label htmlFor="startTime">{t('availability.startTime')}</label>
              <div
                className="creator-add-slot-input-wrap creator-add-slot-trigger creator-add-slot-time-wrap"
                onClick={() => setShowTimePicker(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowTimePicker(true)}
                id="startTime"
                aria-label={t('availability.selectStartTime')}
              >
                <span className={startTime ? '' : 'creator-add-slot-placeholder'}>
                  {formatTimeToAMPM(startTime)}
                </span>
                <span className="creator-add-slot-time-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </span>
              </div>
              {showTimePicker && (
                <TimePickerDialog
                  value={startTime}
                  onConfirm={(timeStr) => {
                    setStartTime(timeStr);
                    setShowTimePicker(false);
                  }}
                  onCancel={() => setShowTimePicker(false)}
                />
              )}
            </div>

            <div className="creator-add-slot-field">
              <label>{t('offers.duration')}</label>
              <div className="creator-add-slot-duration-row">
                {[15, 30, 60, 90].map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={
                      'creator-add-slot-duration-pill' +
                      (Number(duration) === min ? ' creator-add-slot-duration-pill--active' : '')
                    }
                    onClick={() => setDuration(min)}
                  >
                    {min} {t('common.min')}
                  </button>
                ))}
              </div>
              {startTime && (
                <div className="creator-add-slot-time-banner" aria-live="polite">
                  <span className="creator-add-slot-time-banner-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                  </span>
                  <span className="creator-add-slot-time-banner-text">
                    {formatTimeToAMPM(startTime)} → {formatTimeToAMPM(getEndTimeFromStartAndDuration(startTime, duration))} ({duration} {t('common.min')})
                  </span>
                </div>
              )}
            </div>

            <div className="creator-add-slot-field creator-add-slot-field--price">
              <label htmlFor="price">{t('availability.priceEur')} <span className="required">*</span></label>
              <div className="creator-add-slot-input-wrap creator-add-slot-price-wrap">
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder={t('availability.placeholderPrice')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="creator-add-slot-price-input"
                />
                <span className="creator-add-slot-price-suffix" aria-hidden> EUR</span>
              </div>
            </div>

            <div className="creator-add-slot-submit-wrap">
              <button
                type="submit"
                className="creator-add-slot-submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? <ButtonLoadingSpinner /> : t('availability.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreatorEditTimeSlot;
