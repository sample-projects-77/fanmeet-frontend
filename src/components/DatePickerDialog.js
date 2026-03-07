import React, { useState, useMemo } from 'react';
import './DatePickerDialog.css';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatSelectedDisplay(d) {
  if (!d) return '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
}

export function DatePickerDialog({ value, onConfirm, onCancel }) {
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState(value ? new Date(value) : new Date());

  const displayDate = selected || (value ? new Date(value) : new Date());

  const calendar = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
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

  const handleOk = () => {
    onConfirm(selected || displayDate);
  };

  return (
    <div className="date-picker-dialog-overlay" onClick={onCancel}>
      <div className="date-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="date-picker-dialog-label">Select date</p>
        <div className="date-picker-dialog-selected">
          {displayDate ? formatSelectedDisplay(displayDate) : 'Select a date'}
          <span className="date-picker-dialog-edit-icon" aria-hidden>✎</span>
        </div>

        <div className="date-picker-dialog-header">
          <span className="date-picker-dialog-month-year">
            {MONTHS[viewMonth]} {viewYear}
            <span className="date-picker-dialog-dropdown">▼</span>
          </span>
          <div className="date-picker-dialog-nav">
            <button type="button" className="date-picker-dialog-chevron" onClick={prevMonth} aria-label="Previous month">‹</button>
            <button type="button" className="date-picker-dialog-chevron" onClick={nextMonth} aria-label="Next month">›</button>
          </div>
        </div>

        <div className="date-picker-dialog-days-row">
          {DAYS.map((d, i) => (
            <span key={i} className="date-picker-dialog-day-name">{d}</span>
          ))}
        </div>

        <div className="date-picker-dialog-grid">
          {calendar.map((cell, i) => (
            <button
              key={i}
              type="button"
              className={`date-picker-dialog-cell ${cell ? 'date-picker-dialog-cell--day' : ''} ${cell && isSameDay(cell, selected) ? 'date-picker-dialog-cell--selected' : ''}`}
              onClick={() => cell && setSelected(cell)}
              disabled={!cell}
            >
              {cell ? cell.getDate() : ''}
            </button>
          ))}
        </div>

        <div className="date-picker-dialog-actions">
          <button type="button" className="date-picker-dialog-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="date-picker-dialog-ok" onClick={handleOk}>OK</button>
        </div>
      </div>
    </div>
  );
}
