import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TimePickerDialog.css';

const HOUR_ACCENT = '#F4C046';

function parseTime(value) {
  if (!value || typeof value !== 'string') return { hour24: 9, minute: 0 };
  const [h, m] = value.split(':').map((n) => parseInt(n, 10));
  const hour = Number.isNaN(h) ? 9 : Math.min(Math.max(h, 0), 23);
  const minute = Number.isNaN(m) ? 0 : m;
  return { hour24: hour, minute };
}

function toTimeString(hour24, minute) {
  const h = Math.min(Math.max(hour24, 0), 23);
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function TimePickerDialog({ value, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour24, setHour24] = useState(parsed.hour24);
  const [minute, setMinute] = useState(parsed.minute);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const clockRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHour24(parsed.hour24);
    setMinute(parsed.minute);
  }, [parsed.hour24, parsed.minute]);

  const displayHour = String(hour24).padStart(2, '0');
  const displayMinute = String(minute).padStart(2, '0');

  const handleOk = () => {
    onConfirm(toTimeString(hour24, minute));
  };

  const cx = 120;
  const cy = 120;
  const radius = 100;
  const outerRadius = radius;
  const innerRadius = radius - 26;

  // Hour layout: two-ring 24h clock (outer: 1–12, inner: 13–23 + 0)
  const hourPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 12; i += 1) {
      const angleDeg = i * 30 - 90; // 0 => 12 o'clock
      const angle = (angleDeg * Math.PI) / 180;

      // Outer hour: 00 at top, then 01–11 clockwise
      const outerHour = i === 0 ? 0 : i;
      positions.push({
        hour: outerHour,
        ring: 'outer',
        x: cx + outerRadius * Math.cos(angle),
        y: cy + outerRadius * Math.sin(angle),
      });

      // Inner hour: 12–23 mirroring outer angles (00 moved to outer ring)
      const innerHour = (outerHour + 12) % 24;
      positions.push({
        hour: innerHour,
        ring: 'inner',
        x: cx + innerRadius * Math.cos(angle),
        y: cy + innerRadius * Math.sin(angle),
      });
    }
    return positions;
  }, []);

  // Minute layout: single outer ring, 12 positions (00,05,...55)
  const minutePositions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angleDeg = i * 30 - 90;
      const angle = (angleDeg * Math.PI) / 180;
      const minuteValue = (i * 5) % 60;
      return {
        index: i,
        minute: minuteValue,
        x: cx + outerRadius * Math.cos(angle),
        y: cy + outerRadius * Math.sin(angle),
      };
    });
  }, []);

  const getPolarFromEvent = (e) => {
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
    const distance = Math.sqrt(x * x + y * y);
    return { angle, distance };
  };

  const applyFromPolar = (polar) => {
    if (!polar) return;
    const { angle, distance } = polar;
    if (mode === 'hour') {
      const index = Math.round(angle / 30) % 12; // 0–11 sectors
      // Match hourPositions mapping: outer 00,01..11; inner 12..23
      const outerHour = index === 0 ? 0 : index;
      const innerHour = (outerHour + 12) % 24;
      // Decide ring by distance (closer to inner radius => inner ring)
      const useInner = distance < (outerRadius - (outerRadius - innerRadius) / 2);
      const nextHour = useInner ? innerHour : outerHour;
      setHour24(nextHour);
    } else {
      const m = Math.round((angle / 360) * 60) % 60;
      setMinute(m);
    }
  };

  const handleClockPointer = (e) => {
    const polar = getPolarFromEvent(e);
    applyFromPolar(polar);
  };

  const handleClockClick = (e) => {
    e.preventDefault();
    handleClockPointer(e);
    // Auto-switch to minute view after selecting an hour (matching mobile app behavior)
    if (mode === 'hour') {
      setTimeout(() => setMode('minute'), 200);
    }
  };

  const handleClockTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      handleClockPointer({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
      // Auto-switch to minute view after touch-selecting an hour
      if (mode === 'hour') {
        setTimeout(() => setMode('minute'), 200);
      }
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
      const polar = getPolarFromEvent(e);
      applyFromPolar(polar);
    };
    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      // Auto-switch to minute view after dragging hour handle (matching mobile app behavior)
      if (mode === 'hour') {
        setTimeout(() => setMode('minute'), 200);
      }
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
  const hourHandDeg = ((hour24 % 12) / 12) * 360; // shares angles with outer ring
  // Unified hand length so needle looks the same for inner & outer circle
  const handLength = innerRadius - 18;
  const minuteHandDeg = (minute / 60) * 360;

  // In minute mode, which of the 12 minute positions (0–11) to highlight: 0=00,1=05,…,11=55
  const minuteIndex = Math.round(minute / 5) % 12;

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
        </div>

        <div
          ref={clockRef}
          className={`time-picker-dialog-clock ${isDragging ? 'time-picker-dialog-clock--dragging' : ''}`}
          onClick={handleClockClick}
          onPointerDown={handlePointerDown}
          onTouchEnd={handleClockTouchEnd}
        >
          <svg viewBox="0 0 240 240" className="time-picker-dialog-clock-svg">
            {mode === 'hour'
              ? hourPositions.map(({ hour, ring, x, y }) => {
                  const isHighlighted = hour === hour24;
                  return (
                    <g key={`${ring}-${hour}`}>
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
                        {String(hour).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })
              : minutePositions.map(({ index, minute: m, x, y }) => {
                  const isHighlighted = index === minuteIndex;
                  return (
                    <g key={`minute-${index}`}>
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
                        {String(m).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })}
            {/* Single hand for current mode – longer, smooth transition; draggable */}
            <g transform={`translate(${cx}, ${cy})`}>
              {mode === 'hour' && (
                <g
                  className="time-picker-dialog-hand time-picker-dialog-hand--hour"
                  style={{ transform: `rotate(${hourHandDeg}deg)` }}
                >
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={-handLength}
                    stroke={HOUR_ACCENT}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={0}
                    cy={-handLength}
                    r={6}
                    fill={HOUR_ACCENT}
                  />
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
