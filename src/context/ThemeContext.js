import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';
import { userAPI } from '../services/api';
import { hasAuthSession } from '../utils/authStorage';
import {
  DEFAULT_THEME,
  applyThemeAttribute,
  normalizeTheme,
  resolveInitialTheme,
  setStoredTheme,
  setUserTheme,
} from '../utils/themeStorage';

/**
 * Single source of truth for the active theme.
 *
 * There is exactly one piece of theme state in the app – `theme`, which is
 * 'light' or 'dark'. No screen keeps its own isDark/darkMode boolean, and no
 * component branches on the theme to pick a colour: components consume the
 * CSS custom properties in styles/theme.css, which this provider swaps by
 * toggling `data-theme` on <html>.
 */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // The inline boot script in public/index.html has already stamped the
  // attribute, so this initial value matches what is already on screen and the
  // first paint never flashes the wrong theme.
  const [theme, setThemeState] = useState(resolveInitialTheme);

  useLayoutEffect(() => {
    applyThemeAttribute(theme);
  }, [theme]);

  /**
   * User-initiated change. The UI updates synchronously; persistence happens
   * afterwards and is never awaited, so the switch is instant.
   *
   * If the API call fails we keep the new theme: it is already stored locally
   * and remains usable. Failing to persist a preference is not worth
   * interrupting the user for, so this follows the app's convention of
   * swallowing non-blocking preference errors (cf. setAppLanguage).
   */
  const setTheme = useCallback((mode) => {
    const next = normalizeTheme(mode);
    if (!next) return;

    applyThemeAttribute(next);
    setThemeState(next);
    setStoredTheme(next);
    setUserTheme(next);

    if (hasAuthSession()) {
      userAPI.updateTheme(next).catch(() => {
        /* offline or endpoint unavailable – local preference still applies */
      });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  /**
   * Adopt the theme the backend returned for the authenticated user. Called
   * right after login/signup, where the server value is authoritative. Does not
   * call the API back – that would fight the value we were just given.
   */
  const applyAuthenticatedTheme = useCallback((mode) => {
    const next = normalizeTheme(mode) || DEFAULT_THEME;
    applyThemeAttribute(next);
    setThemeState(next);
    setStoredTheme(next);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === 'dark', setTheme, toggleTheme, applyAuthenticatedTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export default ThemeContext;
