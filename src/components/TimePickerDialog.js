import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [isPm, setIsPm] = useState(parsed.isPm);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const clockRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setIsPm(parsed.isPm);
  }, [parsed.hour12, parsed.minute, parsed.isPm]);

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

  const getAngleFromEvent = (e) => {
    if (!clockRef.current) return null;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    if (clientX == null || clientY == null) return null;
    const x = clientX - centerX;
    const y = clientY - centerY;
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const applyAngleToValue = (angle) => {
    if (angle == null) return;
    if (mode === 'hour') {
      const h = Math.round((angle / 360) * 12) % 12;
      setHour12(h === 0 ? 12 : h);
    } else {
      const m = Math.round((angle / 360) * 60) % 60;
      setMinute(m);
    }
  };

  const handleClockPointer = (e) => {
    const angle = getAngleFromEvent(e);
    applyAngleToValue(angle);
  };

  const handleClockClick = (e) => {
    e.preventDefault();
    handleClockPointer(e);
  };

  const handleClockTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      handleClockPointer({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    handleClockPointer(e);
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const angle = getAngleFromEvent(e);
      applyAngleToValue(angle);
    };
    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [mode]);

  useEffect(() => {
    const handleTouchMove = (e) => {
      if (isDraggingRef.current && e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove);
  }, []);

    /* Clock hand angles: 0 = 12 o'clock, clockwise in degrees; SVG y increases down so we use -angle for rotate */
  const hourHandDeg = ((hour12 === 12 ? 0 : hour12) / 12) * 360;
  const minuteHandDeg = (minute / 60) * 360;

  /* In minute mode, which clock number (1–12) to highlight: 12=0 min, 1=5, 2=10, … 11=55 */
  const minuteHighlight = (Math.round(minute / 5) % 12) || 12;
  const highlightedNumber = mode === 'hour' ? hour12 : minuteHighlight;

  return (
    <div className="time-picker-dialog-overlay" onClick={onCancel}>
      <div className="time-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`time-picker-dialog-display time-picker-dialog-display--mode-${mode}`}>
          <button
            type="button"
            className="time-picker-dialog-hour"
            onClick={() => setMode('hour')}
            aria-pressed={mode === 'hour'}
            aria-label={t('timePicker.hour')}
          >
            {displayHour}
          </button>
          <span className="time-picker-dialog-colon"> : </span>
          <button
            type="button"
            className="time-picker-dialog-minute"
            onClick={() => setMode('minute')}
            aria-pressed={mode === 'minute'}
            aria-label={t('timePicker.minute')}
          >
            {displayMinute}
          </button>
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
          className={`time-picker-dialog-clock ${isDragging ? 'time-picker-dialog-clock--dragging' : ''}`}
          onClick={handleClockClick}
          onPointerDown={handlePointerDown}
          onTouchEnd={handleClockTouchEnd}
        >
          <svg viewBox="0 0 240 240" className="time-picker-dialog-clock-svg">
            {hourPositions.map(({ hour, x, y }) => {
              const isHighlighted = hour === highlightedNumber;
              return (
                <g key={hour}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHighlighted ? 18 : 12}
                    fill={isHighlighted ? HOUR_ACCENT : 'transparent'}
                    className="time-picker-dialog-hour-dot"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isHighlighted ? 'var(--black)' : 'var(--white)'}
                    fontSize={isHighlighted ? 14 : 13}
                    fontWeight={isHighlighted ? 700 : 500}
                  >
                    {hour}
                  </text>
                </g>
              );
            })}
            {/* Single hand for current mode – longer, smooth transition; draggable */}
            <g transform={`translate(${cx}, ${cy})`}>
              {mode === 'hour' && (
                <g className="time-picker-dialog-hand time-picker-dialog-hand--hour" style={{ transform: `rotate(${hourHandDeg}deg)` }}>
                  <line x1={0} y1={0} x2={0} y2={-62} stroke={HOUR_ACCENT} strokeWidth="3" strokeLinecap="round" />
                  <circle cx={0} cy={-62} r={6} fill={HOUR_ACCENT} />
                </g>
              )}
              {mode === 'minute' && (
                <g className="time-picker-dialog-hand time-picker-dialog-hand--minute" style={{ transform: `rotate(${minuteHandDeg}deg)` }}>
                  <line x1={0} y1={0} x2={0} y2={-88} stroke={HOUR_ACCENT} strokeWidth="2" strokeLinecap="round" />
                  <circle cx={0} cy={-88} r={5} fill={HOUR_ACCENT} />
                </g>
              )}
            </g>
            <circle cx={cx} cy={cy} r={6} fill={HOUR_ACCENT} className="time-picker-dialog-clock-center" />
          </svg>
        </div>

        <div className="time-picker-dialog-actions">
          <button type="button" className="time-picker-dialog-cancel" onClick={onCancel}>
            {t('timePicker.cancel')}
          </button>
          <button type="button" className="time-picker-dialog-ok" onClick={handleOk}>
            {t('timePicker.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
