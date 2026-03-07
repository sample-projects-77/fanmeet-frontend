import React, { useState, useMemo, useRef, useEffect } from 'react';
import './TimePickerDialog.css';

const HOUR_ACCENT = '#FFC107';
const AM_PM_ACTIVE = '#20C997';

function parseTime(value) {
  if (!value || typeof value !== 'string') return { hour12: 9, minute: 0, isPm: false };
  const [h, m] = value.split(':').map((n) => parseInt(n, 10));
  const hour = Number.isNaN(h) ? 9 : h;
  const minute = Number.isNaN(m) ? 0 : m;
  const isPm = hour >= 12;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { hour12, minute, isPm };
}

function toTimeString(hour12, minute, isPm) {
  const h = isPm ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function TimePickerDialog({ value, onConfirm, onCancel }) {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [isPm, setIsPm] = useState(parsed.isPm);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const clockRef = useRef(null);

  const displayHour = hour12;
  const displayMinute = String(minute).padStart(2, '0');

  const handleOk = () => {
    onConfirm(toTimeString(hour12, minute, isPm));
  };

  const cx = 120;
  const cy = 120;
  const radius = 100;

  const hourPositions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i === 0 ? 12 : i;
      const angle = ((hour - 3) * 30 * Math.PI) / 180;
      return {
        hour,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, []);

  const minuteAngle = (minute / 60) * 360 - 90;
  const hourAngle = ((hour12 === 12 ? 0 : hour12) / 12) * 360 - 90;

  const getAngleFromEvent = (e) => {
    if (!clockRef.current) return null;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleClockClick = (e) => {
    const angle = getAngleFromEvent(e);
    if (angle == null) return;
    if (mode === 'hour') {
      const h = Math.round((angle / 360) * 12) % 12;
      setHour12(h === 0 ? 12 : h);
    } else {
      const m = Math.round((angle / 360) * 60) % 60;
      setMinute(m);
    }
  };

  const minuteHandX = cx + 65 * Math.cos((minuteAngle * Math.PI) / 180);
  const minuteHandY = cy + 65 * Math.sin((minuteAngle * Math.PI) / 180);
  const hourHandLen = 45;
  const hourHandX = cx + hourHandLen * Math.cos((hourAngle * Math.PI) / 180);
  const hourHandY = cy + hourHandLen * Math.sin((hourAngle * Math.PI) / 180);

  return (
    <div className="time-picker-dialog-overlay" onClick={onCancel}>
      <div className="time-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`time-picker-dialog-display time-picker-dialog-display--mode-${mode}`}>
          <span className="time-picker-dialog-hour">{displayHour}</span>
          <span className="time-picker-dialog-colon">:</span>
          <span className="time-picker-dialog-minute">{displayMinute}</span>
          <div className="time-picker-dialog-ampm">
            <button
              type="button"
              className={`time-picker-dialog-ampm-btn ${!isPm ? 'time-picker-dialog-ampm-btn--active' : ''}`}
              onClick={() => setIsPm(false)}
            >
              AM
            </button>
            <button
              type="button"
              className={`time-picker-dialog-ampm-btn ${isPm ? 'time-picker-dialog-ampm-btn--active' : ''}`}
              onClick={() => setIsPm(true)}
            >
              PM
            </button>
          </div>
        </div>

        <div
          ref={clockRef}
          className="time-picker-dialog-clock"
          onClick={handleClockClick}
        >
          <svg viewBox="0 0 240 240" className="time-picker-dialog-clock-svg">
            {hourPositions.map(({ hour, x, y }) => (
              <g key={hour}>
                <circle
                  cx={x}
                  cy={y}
                  r={hour === hour12 ? 18 : 12}
                  fill={hour === hour12 ? HOUR_ACCENT : 'transparent'}
                  className="time-picker-dialog-hour-dot"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={hour === hour12 ? 'var(--black)' : 'var(--white)'}
                  fontSize={hour === hour12 ? 14 : 13}
                  fontWeight={hour === hour12 ? 700 : 500}
                >
                  {hour}
                </text>
              </g>
            ))}
            <line
              x1={cx}
              y1={cy}
              x2={hourHandX}
              y2={hourHandY}
              stroke={HOUR_ACCENT}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1={cx}
              y1={cy}
              x2={minuteHandX}
              y2={minuteHandY}
              stroke={HOUR_ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={minuteHandX} cy={minuteHandY} r={4} fill={HOUR_ACCENT} />
            <circle cx={cx} cy={cy} r={6} fill={HOUR_ACCENT} />
          </svg>
        </div>

        <div className="time-picker-dialog-mode-row">
          <button
            type="button"
            className="time-picker-dialog-keyboard-icon"
            aria-label="Keyboard input"
            title="Keyboard input"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
              <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 5H8v-2h8v2zm0-3h-2v-2h2v2z" />
            </svg>
          </button>
          <div className="time-picker-dialog-mode-tabs">
            <button
              type="button"
              className={`time-picker-dialog-mode-tab ${mode === 'hour' ? 'time-picker-dialog-mode-tab--active' : ''}`}
              onClick={() => setMode('hour')}
            >
              Hour
            </button>
            <button
              type="button"
              className={`time-picker-dialog-mode-tab ${mode === 'minute' ? 'time-picker-dialog-mode-tab--active' : ''}`}
              onClick={() => setMode('minute')}
            >
              Minute
            </button>
          </div>
        </div>

        <div className="time-picker-dialog-actions">
          <button type="button" className="time-picker-dialog-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="time-picker-dialog-ok" onClick={handleOk}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
