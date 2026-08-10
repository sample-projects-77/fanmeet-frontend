/**
 * Theme preference storage + DOM application.
 *
 * Mirrors utils/authStorage.js: a thin, dependency-free module that owns the
 * single localStorage key and the one place the theme is written to the DOM.
 * ThemeContext is the only consumer that mutates it; everything else reads
 * through useTheme().
 *
 * Resolution order (see resolveInitialTheme):
 *   1. localStorage 'theme'   – the user's most recent explicit choice
 *   2. user.theme_mode        – the value the backend returned at login/signup
 *   3. DEFAULT_THEME ('light')
 */

export const THEME_STORAGE_KEY = 'theme';
export const THEMES = ['light', 'dark'];
export const DEFAULT_THEME = 'light';

/** Browser-chrome colour per theme. Dark keeps the exact pre-existing value. */
const META_THEME_COLOR = {
  dark: '#000000',
  light: '#F6F7F9',
};

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : null;
}

export function getStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch (_) {
    return null;
  }
}

export function setStoredTheme(mode) {
  const next = normalizeTheme(mode);
  if (!next) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (_) {}
}

/** Theme persisted on the authenticated user record, if one is cached. */
export function getUserTheme() {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    return normalizeTheme(JSON.parse(userJson)?.theme_mode);
  } catch (_) {
    return null;
  }
}

export function resolveInitialTheme() {
  return getStoredTheme() || getUserTheme() || DEFAULT_THEME;
}

/**
 * Write the theme to the DOM. Dark Mode deliberately removes the attribute so
 * the untouched `:root` block in theme.css applies verbatim.
 */
export function applyThemeAttribute(mode) {
  const next = normalizeTheme(mode) || DEFAULT_THEME;
  const root = document.documentElement;
  if (next === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_THEME_COLOR[next]);
  return next;
}

/**
 * Persist the theme onto the cached user blob so a reload resolves correctly
 * even before the profile round-trips. Keeps localStorage['user'] the single
 * cached representation of the user, as the rest of the app expects.
 */
export function setUserTheme(mode) {
  const next = normalizeTheme(mode);
  if (!next) return;
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    const user = JSON.parse(userJson);
    localStorage.setItem('user', JSON.stringify({ ...user, theme_mode: next }));
  } catch (_) {}
}
