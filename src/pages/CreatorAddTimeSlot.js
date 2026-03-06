import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { offerAPI } from '../services/api';
import CreatorNav from '../components/CreatorNav';
import LoadingSpinner, { ButtonLoadingSpinner } from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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

    // Build ISO date with local timezone offset, similar to backend docs
    const localDate = date;
    const tzOffsetMinutes = localDate.getTimezoneOffset();
    const offsetSign = tzOffsetMinutes <= 0 ? '+' : '-';
    const absMinutes = Math.abs(tzOffsetMinutes);
    const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const offsetMins = String(absMinutes % 60).padStart(2, '0');
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateIso = `${year}-${month}-${day}T00:00:00${offsetSign}${offsetHours}:${offsetMins}`;

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
              <div className="creator-add-slot-input-wrap creator-add-slot-datepicker-wrap">
                <DatePicker
                  id="date"
                  selected={date}
                  onChange={(d) => setDate(d)}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="mm/dd/yyyy"
                  required
                  calendarClassName="creator-add-slot-datepicker"
                  popperClassName="creator-add-slot-datepicker-popper"
                  wrapperClassName="creator-add-slot-datepicker-wrapper"
                />
              </div>
            </div>

            <div className="creator-add-slot-field">
              <label htmlFor="startTime">Start Time</label>
              <div className="creator-add-slot-input-wrap">
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
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

