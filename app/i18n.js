import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
import enUS from '../locales/en-US/translation.json';

const resources = {
  'en-US': {
    translation: enUS
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en-US', // Default language
    fallbackLng: 'en-US',
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;