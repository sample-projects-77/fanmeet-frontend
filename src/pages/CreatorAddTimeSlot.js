import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import { DatePickerDialog } from '../components/DatePickerDialog';
import { TimePickerDialog } from '../components/TimePickerDialog';
import { localDateToOfferDateIso } from '../utils/dateTimeUtils';
import './CreatorAddTimeSlot.css';

function CreatorAddTimeSlot() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!date || !startTime || !duration || !price) {
      setError('Please fill in all required fields.');
      return;
    }

    const parsedPrice = parseFloat(
      String(price).replace(',', '.').trim()
    );
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price greater than 0.');
      return;
    }

    // Convert to cents
    const priceCents = Math.round(parsedPrice * 100);

    // Send date as local midnight with user's timezone offset so backend stores UTC correctly.
    const dateIso = localDateToOfferDateIso(date);
    if (!dateIso) {
      setError('Please select a valid date.');
      return;
    }

    // Compute end time from start time and duration in minutes
    const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
    if (
      Number.isNaN(startH) ||
      Number.isNaN(startM) ||
      startH < 0 ||
      startH > 23 ||
      startM < 0 ||
      startM > 59
    ) {
      setError('Please enter a valid start time.');
      return;
    }
    const startTotal = startH * 60 + startM;
    const endTotal = startTotal + Number(duration);
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    setSubmitting(true);
    try {
      const res = await offerAPI.createScheduledOffer({
        dateIso,
        startTime,
        endTime,
        duration: Number(duration),
        priceCents,
      });
      if (res.StatusCode === 200 && res.data) {
        navigate('/creator/offers', { replace: true });
      } else {
        setError(res.error || 'Failed to add time slot.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Something went wrong.'
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
            <Link to="/creator/offers" className="creator-add-slot-back" aria-label="Back">
              ←
            </Link>
            <h1 className="creator-add-slot-title">Add Time Slot</h1>
          </header>

          <p className="creator-add-slot-subtitle">
            Plan a fan session by setting the day, time, duration, and price.
          </p>

          <form className="creator-add-slot-form" onSubmit={handleSubmit}>
            {error && (
              <div className="creator-add-slot-error">
                {error}
              </div>
            )}

            <div className="creator-add-slot-field">
              <label htmlFor="date">Date</label>
              <div
                className="creator-add-slot-input-wrap creator-add-slot-trigger"
                onClick={() => setShowDatePicker(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowDatePicker(true)}
                id="date"
                aria-label="Select date"
              >
                <span className={date ? '' : 'creator-add-slot-placeholder'}>
                  {date
                    ? date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                    : 'mm/dd/yyyy'}
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
              <label htmlFor="startTime">Start Time</label>
              <div
                className="creator-add-slot-input-wrap creator-add-slot-trigger creator-add-slot-time-wrap"
                onClick={() => setShowTimePicker(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setShowTimePicker(true)}
                id="startTime"
                aria-label="Select start time"
              >
                <span className={startTime ? '' : 'creator-add-slot-placeholder'}>
                  {startTime || '--:--'}
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
                  onConfirm={(t) => {
                    setStartTime(t);
                    setShowTimePicker(false);
                  }}
                  onCancel={() => setShowTimePicker(false)}
                />
              )}
            </div>

            <div className="creator-add-slot-field">
              <label>Duration</label>
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
                    {min} Min
                  </button>
                ))}
              </div>
            </div>

            <div className="creator-add-slot-field">
              <label htmlFor="price">Price (EUR) <span className="required">*</span></label>
              <div className="creator-add-slot-input-wrap">
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 45.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="creator-add-slot-submit-wrap">
              <button
                type="submit"
                className="creator-add-slot-submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? <ButtonLoadingSpinner /> : 'Add Time Slot'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreatorAddTimeSlot;

