import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files for each language
import arLng from './locales/ar-SA/translation.json';
import azLng from './locales/az-AZ/translation.json';
import csLng from './locales/cs-CZ/translation.json';
import daLng from './locales/da-DK/translation.json';
import deLng from './locales/de-DE/translation.json';
import enLng from './locales/en-US/translation.json';
import esLng from './locales/es-ES/translation.json';
import fiLng from './locales/fi-FI/translation.json';
import frLng from './locales/fr-FR/translation.json';
import phLng from './locales/ph-PH/translation.json';
import hiLng from './locales/hi-IN/translation.json';
import itLng from './locales/it-IT/translation.json';
import idLng from './locales/id-ID/translation.json';
import jaLng from './locales/ja-JP/translation.json';
import koLng from './locales/ko-KR/translation.json';
import nlLng from './locales/nl-NL/translation.json';
import noLng from './locales/no-NO/translation.json';
import plLng from './locales/pl-PL/translation.json';
import ptLng from './locales/pt-BR/translation.json';
import roLng from './locales/ro-RO/translation.json';
import ruLng from './locales/ru-RU/translation.json';
import svLng from './locales/sv-SE/translation.json';
import trLng from './locales/tr-TR/translation.json';
import ukLng from './locales/uk-UA/translation.json';
import zhLng from './locales/zh-CN/translation.json';

// Optional: If you still want to use Backend or LanguageDetector, uncomment them
// import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // .use(Backend) // Uncomment if you want to load translations via HTTP
  // .use(LanguageDetector) // Uncomment if you want to detect user language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en', // Default language if the detected language is not available
    debug: false,       // Set to false in production
    resources: {
      en: {
        translation: enLng
      },
      ar: {
        translation: arLng
      },
      az: {
        translation: azLng
      },
      cs: {
        translation: csLng
      },
      da: {
        translation: daLng
      },
      de: {
        translation: deLng
      },
      es: {
        translation: esLng
      },
      fi: {
        translation: fiLng
      },
      ph: {
        translation: phLng
      },

      fr: {
        translation: frLng
      },
      hi: {
        translation: hiLng
      },
      it: {
        translation: itLng
      },
      id: {
        translation: idLng
      },
      ja: {
        translation: jaLng
      },
      ko: {
        translation: koLng
      },
      nl: {
        translation: nlLng
      },
      no: {
        translation: noLng
      },
      pl: {
        translation: plLng
      },
      pt: {
        translation: ptLng
      },
      ro: {
        translation: roLng
      },
      ru: {
        translation: ruLng
      },
      sv: {
        translation: svLng
      },
      tr: {
        translation: trLng
      },
      uk: {
        translation: ukLng
      },
      zh: {
        translation: zhLng
      }
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    // React specific options
    // react: {
    //   useSuspense: false, // Set to true if you want to use Suspense for translations
    // }
  });

export default i18n;