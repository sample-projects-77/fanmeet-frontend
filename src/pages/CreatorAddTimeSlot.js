import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { DatePickerDialog } from '../components/DatePickerDialog';
import { TimePickerDialog } from '../components/TimePickerDialog';
import { localSlotToUtcPayload, formatTimeToAMPM, getEndTimeFromStartAndDuration } from '../utils/dateTimeUtils';
import { clearCached } from '../utils/routeDataCache';
import { toast } from 'react-toastify';
import './CreatorAddTimeSlot.css';

function CreatorAddTimeSlot() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const dateLocale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isEndTimeManual, setIsEndTimeManual] = useState(false);
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const computeDurationFromTimes = (start, end) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map((v) => parseInt(v, 10));
    const [eh, em] = end.split(':').map((v) => parseInt(v, 10));
    if (
      Number.isNaN(sh) ||
      Number.isNaN(sm) ||
      Number.isNaN(eh) ||
      Number.isNaN(em)
    ) {
      return null;
    }
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = endMinutes - startMinutes;
    if (diff <= 0) {
      return null;
    }
    return diff;
  };

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

    const parsedPrice = parseFloat(
      String(price).replace(',', '.').trim()
    );
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError(t('availability.validPrice'));
      return;
    }

    // Convert to cents
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

    // Backend stores UTC: send slot in UTC so date/time display correctly on the list
    const { dateIsoUtc, startTimeUtc, endTimeUtc } = localSlotToUtcPayload(
      date,
      startTime,
      duration
    );
    if (!dateIsoUtc) {
      setError(t('availability.validDate'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await offerAPI.createScheduledOffer({
        dateIso: dateIsoUtc,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        duration: Number(duration),
        priceCents,
      });
      if (res.StatusCode === 200 && res.data) {
        clearCached('creatorOffers');
        toast.success(t('availability.slotAdded'));
        navigate('/creator/offers', { replace: true });
      } else {
        setError(res.error || t('availability.failedToAdd'));
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

  return (
    <div className="creator-add-slot-page">
      <CreatorNav active="creator" user={user} onLogout={handleLogout} />
      <main className="creator-add-slot-main">
        <div className="creator-add-slot-container">
          <header className="creator-add-slot-header">
            <Link to="/creator/offers" className="creator-add-slot-back" aria-label={t('common.back')}>
              ←
            </Link>
            <h1 className="creator-add-slot-title">{t('availability.addTimeSlot')}</h1>
          </header>

          <p className="creator-add-slot-subtitle">
            {t('availability.addSlotSubtitle')}
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
                    if (!isEndTimeManual && duration) {
                      const autoEnd = getEndTimeFromStartAndDuration(timeStr, duration);
                      setEndTime(autoEnd);
                    }
                    setShowTimePicker(false);
                  }}
                  onCancel={() => setShowTimePicker(false)}
                />
              )}
            </div>

            <div className="creator-add-slot-field">
              <label htmlFor="endTime">{t('availability.endTime')}</label>
              <div
                className="creator-add-slot-input-wrap creator-add-slot-trigger creator-add-slot-time-wrap"
                onClick={() => {
                  setError('');
                  setShowEndTimePicker(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setError('');
                    setShowEndTimePicker(true);
                  }
                }}
                id="endTime"
                aria-label={t('availability.selectEndTime')}
              >
                <span className={endTime ? '' : 'creator-add-slot-placeholder'}>
                  {formatTimeToAMPM(endTime)}
                </span>
                <span className="creator-add-slot-time-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </span>
              </div>
              {showEndTimePicker && (
                <TimePickerDialog
                  value={endTime}
                  onConfirm={(timeStr) => {
                    if (startTime) {
                      const diff = computeDurationFromTimes(startTime, timeStr);
                      if (diff != null) {
                        setEndTime(timeStr);
                        setIsEndTimeManual(true);
                        setDuration(diff);
                      } else {
                        setError(t('availability.invalidEndTime'));
                      }
                    } else {
                      setEndTime(timeStr);
                      setIsEndTimeManual(true);
                    }
                    setShowEndTimePicker(false);
                  }}
                  onCancel={() => setShowEndTimePicker(false)}
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
                    onClick={() => {
                      setIsEndTimeManual(false);
                      setDuration(min);
                      if (startTime) {
                        const autoEnd = getEndTimeFromStartAndDuration(startTime, min);
                        setEndTime(autoEnd);
                      }
                    }}
                    disabled={isEndTimeManual}
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
                    {formatTimeToAMPM(startTime)} →{' '}
                    {formatTimeToAMPM(
                      endTime || getEndTimeFromStartAndDuration(startTime, duration)
                    )}{' '}
                    ({duration} {t('common.min')})
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
                {submitting ? <ButtonLoadingSpinner /> : t('availability.addTimeSlot')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreatorAddTimeSlot;

