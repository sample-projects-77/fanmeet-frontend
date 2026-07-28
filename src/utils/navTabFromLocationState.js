const CREATOR_NAV_KEYS = new Set(['home', 'search', 'creator', 'chats', 'profile']);
const FAN_NAV_KEYS = new Set(['home', 'search', 'fan', 'chats', 'profile']);

/**
 * Which main tab should stay highlighted when viewing a nested route (e.g. another creator's profile).
 * Set via <Link state={{ navTab: 'home' }} /> from Home / Search lists.
 */
export function navTabFromLocationState(location, variant = 'creator', fallback = 'home') {
  const raw = location?.state?.navTab;
  if (typeof raw !== 'string') return fallback;
  const allowed = variant === 'fan' ? FAN_NAV_KEYS : CREATOR_NAV_KEYS;
  return allowed.has(raw) ? raw : fallback;
}
