import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './DatePickerDialog.css';

/** Day-name keys in Monday-first order (ISO week) */
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const SHORT_MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

export function DatePickerDialog({ value, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState(value ? new Date(value) : new Date());

  const displayDate = selected || (value ? new Date(value) : new Date());

  /** Translated day-name headers (Monday-first) */
  const dayHeaders = useMemo(
    () => DAY_KEYS.map((k) => t(`datePicker.${k}`)),
    [t],
  );

  /** Translated month names */
  const monthName = t(`datePicker.${MONTH_KEYS[viewMonth]}`);

  /** Format the selected-date display line, e.g. "Mo, Mär 16" */
  const formatSelectedDisplay = (d) => {
    if (!d) return '';
    // getDay(): 0=Sun … 6=Sat  →  DAY_KEYS is Mon-first so index = (getDay()+6)%7
    const dayLabel = t(`datePicker.${DAY_KEYS[(d.getDay() + 6) % 7]}`);
    const monthLabel = t(`datePicker.${SHORT_MONTH_KEYS[d.getMonth()]}`);
    return `${dayLabel}, ${monthLabel} ${d.getDate()}`;
  };

  const calendar = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    // Convert Sunday-based getDay() to Monday-based: (day + 6) % 7
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const startOfDay = (d) => {
    if (!d) return null;
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const isPastDate = (cell) => cell && startOfDay(cell).getTime() < todayStart.getTime();

  const handleOk = () => {
    onConfirm(selected || displayDate);
  };

  return (
    <div className="date-picker-dialog-overlay" onClick={onCancel}>
      <div className="date-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="date-picker-dialog-label">{t('datePicker.selectDate')}</p>
        <div className="date-picker-dialog-selected">
          {displayDate ? formatSelectedDisplay(displayDate) : t('datePicker.selectADate')}
          <span className="date-picker-dialog-edit-icon" aria-hidden>✎</span>
        </div>

        <div className="date-picker-dialog-header">
          <span className="date-picker-dialog-month-year">
            {monthName} {viewYear}
            <span className="date-picker-dialog-dropdown">▼</span>
          </span>
          <div className="date-picker-dialog-nav">
            <button type="button" className="date-picker-dialog-chevron" onClick={prevMonth} aria-label="Previous month">‹</button>
            <button type="button" className="date-picker-dialog-chevron" onClick={nextMonth} aria-label="Next month">›</button>
          </div>
        </div>

        <div className="date-picker-dialog-days-row">
          {dayHeaders.map((label, i) => (
            <span key={i} className="date-picker-dialog-day-name">{label}</span>
          ))}
        </div>

        <div className="date-picker-dialog-grid">
          {calendar.map((cell, i) => {
            const past = cell && isPastDate(cell);
            return (
              <button
                key={i}
                type="button"
                className={`date-picker-dialog-cell ${cell ? 'date-picker-dialog-cell--day' : ''} ${cell && isSameDay(cell, selected) ? 'date-picker-dialog-cell--selected' : ''} ${past ? 'date-picker-dialog-cell--disabled' : ''}`}
                onClick={() => cell && !past && setSelected(cell)}
                disabled={!cell || past}
              >
                {cell ? cell.getDate() : ''}
              </button>
            );
          })}
        </div>

        <div className="date-picker-dialog-actions">
          <button type="button" className="date-picker-dialog-cancel" onClick={onCancel}>{t('datePicker.cancel')}</button>
          <button type="button" className="date-picker-dialog-ok" onClick={handleOk}>{t('datePicker.ok')}</button>
        </div>
      </div>
    </div>
  );
}
