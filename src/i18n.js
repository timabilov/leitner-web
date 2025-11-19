import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files
import translationEN from './locales/en/translations.json';
import translationAZ from './locales/az/translations.json';

// The translations
const resources = {
  en: {
    translation: translationEN,
  },
  az: {
    translation: translationAZ,
  },
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English if the detected language is not available
    lng: 'en',         // Default language
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Optional: configuration for the language detector
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
    },
  });

export default i18n;