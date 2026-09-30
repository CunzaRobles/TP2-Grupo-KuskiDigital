import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import { IDIOMAS } from './format';

export const CLAVE_IDIOMA = 'kuski.idioma';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en }, de: { translation: de } },
    supportedLngs: IDIOMAS,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: CLAVE_IDIOMA,
      caches: ['localStorage'],
    },
  });

// <html lang> sigue al idioma activo (lectores de pantalla, separación silábica)
const sincronizarHtml = (idioma) => {
  if (typeof document !== 'undefined' && idioma) document.documentElement.lang = idioma.slice(0, 2);
};
sincronizarHtml(i18n.resolvedLanguage);
i18n.on('languageChanged', sincronizarHtml);

export default i18n;
