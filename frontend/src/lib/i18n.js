import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import es from '@/locales/es.json';
import { IDIOMAS } from './format';

export const CLAVE_IDIOMA = 'kuski.idioma';

// El español (idioma por defecto y de respaldo) va en el bundle; inglés y alemán se descargan
// solo si el visitante los usa. changeLanguage() espera a tenerlos antes de cambiar la interfaz.
const CARGADORES = {
  en: () => import('@/locales/en.json'),
  de: () => import('@/locales/de.json'),
};
const idiomasDiferidos = {
  type: 'backend',
  read(idioma, _namespace, callback) {
    const cargar = CARGADORES[idioma];
    if (!cargar) return callback(null, {});
    cargar().then(
      (modulo) => callback(null, modulo.default),
      (error) => callback(error, null),
    );
  },
};

i18n
  .use(idiomasDiferidos)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es } },
    partialBundledLanguages: true,
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
