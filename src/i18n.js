import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

const LOCALE_STORAGE_KEY = 'locale';
const SUPPORTED = ['en', 'de'];

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.language && SUPPORTED.includes(user.language)) return user.language;
    }
  } catch (_) {}
  return 'de';
}

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, de: { translation: de } },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

/** Call when user changes language (e.g. in profile). Syncs i18n and optionally localStorage. */
export function setAppLanguage(lng, persistLocale = true) {
  if (SUPPORTED.includes(lng)) {
    i18n.changeLanguage(lng);
    if (persistLocale) localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  }
}

export { LOCALE_STORAGE_KEY, SUPPORTED };
export default i18n;
