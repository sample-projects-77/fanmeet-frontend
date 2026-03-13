/**
 * Frontend date/time and timezone utilities.
 * Rule: API/DB use UTC; display and calculations use the user's local timezone (from their machine).
 */

/**
 * Get the current user's timezone offset in minutes (same sign as ISO: local - UTC).
 * E.g. Berlin (UTC+1) => 60; New York (UTC-5) => -300.
 * @returns {number}
 */
export function getUserTimezoneOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

/**
 * Get a timezone string in "UTC±HH:MM" form for API query params (e.g. "UTC+01:00").
 * Uses the current machine's timezone.
 * @returns {string}
 */
export function getUserTimezoneForAPI() {
  const offset = getUserTimezoneOffsetMinutes();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

/**
 * Parse "UTC+01:00" / "UTC-05:30" to offset in minutes (local - UTC).
 * @param {string} tz
 * @returns {number|null}
 */
export function parseTimezoneOffset(tz) {
  if (!tz || typeof tz !== 'string') return null;
  const m = tz.trim().match(/^UTC([+-])(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === '+' ? 1 : -1;
  const hours = parseInt(m[2], 10);
  const mins = parseInt(m[3], 10);
  return sign * (hours * 60 + mins);
}

/**
 * Given a date string (YYYY-MM-DD), time string (HH:mm), and creator timezone (e.g. "UTC+01:00"),
 * return a Date instance for that moment in UTC (so that in the creator's TZ it is that date/time).
 * Used to interpret offer slot from API (stored as creator's local) and then display in user's local.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeStr - HH:mm
 * @param {string} creatorTimezone - e.g. "UTC+01:00"
 * @returns {Date}
 */
export function parseOfferSlotToUTC(dateStr, timeStr, creatorTimezone) {
  if (!dateStr || !timeStr) return new Date(NaN);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  const offsetMinutes = parseTimezoneOffset(creatorTimezone);
  if (offsetMinutes === null) {
    return new Date(Date.UTC(y, mo - 1, d, h || 0, min || 0, 0));
  }
  const localAsUTC = Date.UTC(y, mo - 1, d, h || 0, min || 0, 0);
  return new Date(localAsUTC - offsetMinutes * 60 * 1000);
}

/**
 * Format a UTC Date for display in the user's local timezone (day only).
 * @param {Date|string} utcDate - Date instance or ISO string from API
 * @param {string} [locale] - BCP 47 locale (e.g. 'de', 'en-US') for language-specific day/month names; omit for browser default
 * @returns {string} e.g. "Thursday, Mar 8" or "Donnerstag, 8. März"
 */
export function formatUTCDateToLocalDay(utcDate, locale) {
  if (!utcDate) return '—';
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale || undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Format a UTC Date for display in the user's local timezone (date only, short).
 * @param {Date|string} utcDate
 * @returns {string}
 */
export function formatUTCDateToLocalDate(utcDate) {
  if (!utcDate) return '—';
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a UTC Date for display in the user's local timezone (time only, HH:mm).
 * @param {Date|string} utcDate
 * @returns {string}
 */
export function formatUTCDateToLocalTime(utcDate) {
  if (!utcDate) return '—';
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Format a UTC Date for full date-time in user's local timezone.
 * @param {Date|string} utcDate
 * @returns {string}
 */
export function formatUTCDateToLocalDateTime(utcDate) {
  if (!utcDate) return '—';
  const d = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert local date + start time + duration to UTC for updateScheduledOffer.
 * Use this when the backend stores/returns times in UTC so the slot displays correctly after save.
 * @param {Date} localDate - User's selected date (local calendar date)
 * @param {string} startTimeStr - HH:mm in local time
 * @param {number} durationMinutes
 * @returns {{ dateIsoUtc: string, startTimeUtc: string, endTimeUtc: string }}
 */
export function localSlotToUtcPayload(localDate, startTimeStr, durationMinutes) {
  const pad = (n) => String(n).padStart(2, '0');
  if (!localDate || !(localDate instanceof Date) || Number.isNaN(localDate.getTime()) || !startTimeStr) {
    return { dateIsoUtc: '', startTimeUtc: '00:00', endTimeUtc: '00:00' };
  }
  const [h, m] = startTimeStr.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return { dateIsoUtc: '', startTimeUtc: '00:00', endTimeUtc: '00:00' };
  }
  const localStart = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    h || 0,
    m || 0,
    0
  );
  const utcY = localStart.getUTCFullYear();
  const utcMo = localStart.getUTCMonth();
  const utcD = localStart.getUTCDate();
  const utcStartH = localStart.getUTCHours();
  const utcStartM = localStart.getUTCMinutes();
  const startTotalMin = utcStartH * 60 + utcStartM;
  const endTotalMin = startTotalMin + Number(durationMinutes);
  const endH = Math.floor(endTotalMin / 60) % 24;
  const endM = endTotalMin % 60;
  const dateIsoUtc = `${utcY}-${pad(utcMo + 1)}-${pad(utcD)}T00:00:00.000Z`;
  const startTimeUtc = `${pad(utcStartH)}:${pad(utcStartM)}`;
  const endTimeUtc = `${pad(endH)}:${pad(endM)}`;
  return { dateIsoUtc, startTimeUtc, endTimeUtc };
}

/**
 * Build the date ISO string to send to createScheduledOffer.
 * User picks a local date (Date) and we send midnight on that date in the user's timezone
 * so the backend can infer timezone and store UTC correctly.
 * No day-shift: just YYYY-MM-DD at 00:00:00 with current machine offset.
 * @param {Date} localDate - User's selected date (local calendar date)
 * @returns {string} e.g. "2026-03-08T00:00:00+01:00"
 */
export function localDateToOfferDateIso(localDate) {
  if (!localDate || !(localDate instanceof Date) || Number.isNaN(localDate.getTime()))
    return '';
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, '0');
  const d = String(localDate.getDate()).padStart(2, '0');
  const offsetMin = -localDate.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00${sign}${oh}:${om}`;
}

/**
 * Format HH:mm (24h) to "9:00 AM" / "9:30 PM" for display.
 * @param {string} hhmm - e.g. "09:00", "21:30"
 * @returns {string}
 */
export function formatTimeToAMPM(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '--:--';
  const parts = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return hhmm;
  const hour = parseInt(parts[1], 10) % 24;
  const minute = parseInt(parts[2], 10) % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Compute end time as HH:mm from start time (HH:mm) and duration in minutes.
 * @param {string} startHHmm - e.g. "09:00"
 * @param {number} durationMinutes
 * @returns {string} e.g. "09:30"
 */
export function getEndTimeFromStartAndDuration(startHHmm, durationMinutes) {
  if (!startHHmm || typeof startHHmm !== 'string') return '';
  const [h, m] = startHHmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const startTotal = h * 60 + m;
  const endTotal = startTotal + Number(durationMinutes);
  const endH = Math.floor(endTotal / 60) % 24;
  const endM = endTotal % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Build startTime ISO for createBooking from an offer.
 * API returns date + startTime in UTC; we parse as UTC and return the same instant as ISO.
 * @param {{ date?: string, startTime?: string }} offer
 * @returns {string} ISO 8601 UTC e.g. "2026-03-08T13:00:00.000Z"
 */
export function offerSlotStartToUTCISO(offer) {
  let dateStr = (offer.date || '').toString();
  if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
  if (dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];
  dateStr = dateStr.substring(0, 10) || (offer.title || '').match(/Meeting on (\d{4}-\d{2}-\d{2}) at/)?.[1] || '';
  const timeStr = (offer.startTime || '00:00').trim();
  const utcDate = parseOfferSlotToUTC(dateStr, timeStr, 'UTC');
  return utcDate.toISOString();
}
