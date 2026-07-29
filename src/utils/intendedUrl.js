const INTENDED_URL_KEY = 'intendedUrl';

const AUTH_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-code',
  '/reset-password',
];

/**
 * Only allow same-app relative paths (pathname + optional search).
 */
export function isSafeIntendedPath(path) {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.startsWith('//')) return false;
  if (/^[a-z]+:/i.test(trimmed)) return false;

  const pathname = trimmed.split('?')[0].split('#')[0];
  if (AUTH_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return true;
}

/**
 * Save the URL the user tried to open before being sent to login.
 * @param {string} path - e.g. "/fan/creators/creator_123" or location.pathname + location.search
 */
export function saveIntendedUrl(path) {
  if (!isSafeIntendedPath(path)) return;
  try {
    localStorage.setItem(INTENDED_URL_KEY, path.trim());
  } catch {
    // ignore quota / private mode
  }
}

export function peekIntendedUrl() {
  try {
    return localStorage.getItem(INTENDED_URL_KEY);
  } catch {
    return null;
  }
}

export function clearIntendedUrl() {
  try {
    localStorage.removeItem(INTENDED_URL_KEY);
  } catch {
    // ignore
  }
}

/**
 * Remap /fan/... ↔ /creator/... so deep links work for either role shell.
 */
export function adaptIntendedPathForRole(intendedPath, role) {
  if (!isSafeIntendedPath(intendedPath)) return null;

  const normalizedRole = String(role || '').toLowerCase();
  let path = intendedPath.trim();
  let search = '';
  const qIdx = path.indexOf('?');
  if (qIdx >= 0) {
    search = path.slice(qIdx);
    path = path.slice(0, qIdx);
  }

  if (normalizedRole === 'creator' && path.startsWith('/fan/')) {
    path = `/creator/${path.slice('/fan/'.length)}`;
  } else if (normalizedRole === 'fan' && path.startsWith('/creator/')) {
    path = `/fan/${path.slice('/creator/'.length)}`;
  }

  // After remap, block creator-only management pages for fans
  if (normalizedRole === 'fan') {
    const fanBlocked = [
      '/fan/offers',
      '/fan/profile/edit-bio',
      '/fan/profile/payout-guide',
      '/fan/profile/referrals',
    ];
    if (fanBlocked.some((p) => path === p || path.startsWith(`${p}/`))) {
      return '/fan/home';
    }
  }

  return `${path}${search}`;
}

/**
 * Read + clear intended URL, adapted for the authenticated role.
 * @returns {string|null}
 */
export function consumeIntendedUrl(role) {
  const raw = peekIntendedUrl();
  clearIntendedUrl();
  if (!raw) return null;
  return adaptIntendedPathForRole(raw, role);
}

/**
 * Navigate to login after saving the current location as the intended URL.
 */
export function redirectToLogin(navigate, location) {
  if (location?.pathname) {
    const next = `${location.pathname}${location.search || ''}`;
    saveIntendedUrl(next);
  }
  navigate('/login', { replace: true });
}
