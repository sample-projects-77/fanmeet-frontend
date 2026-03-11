/**
 * Session counts from a list of bookings.
 * Matches the logic used in AllSessions (upcoming = paid and end > now; completed = status === 'completed').
 * Use this so dashboard session numbers align with what users see in the Sessions tabs.
 */
export function getSessionCountsFromBookings(bookings) {
  if (!Array.isArray(bookings)) return { totalSessions: 0, upcomingSessions: 0 };
  const now = new Date();
  const upcoming = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    if (status !== 'paid') return false;
    const start = new Date(b.startTime);
    const end = new Date(start.getTime() + (b.durationMinutes || 0) * 60 * 1000);
    return end > now;
  });
  const completed = bookings.filter((b) => (b.status || '').toLowerCase() === 'completed');
  return {
    totalSessions: upcoming.length + completed.length,
    upcomingSessions: upcoming.length,
  };
}
