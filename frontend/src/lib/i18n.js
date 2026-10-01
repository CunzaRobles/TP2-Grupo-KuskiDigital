import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import es from '@/locales/es.json';
import { IDIOMAS } from './format';

export const CLAVE_IDIOMA = 'kuski.idioma';

// El español (idioma por defecto y de respaldo) va en el bundle; inglés y alemán se descargan
// solo cuando se eligen o detectan. changeLanguage espera la descarga antes de cambiar.
const traducciones = {
  en: () => import('@/locales/en.json'),
  de: () => import('@/locales/de.json'),
};

const cargaDiferida = {
  type: 'backend',
  init() {},
  read(idioma, _espacio, listo) {
    const cargar = traducciones[idioma];
    if (!cargar) return listo(null, {});
    cargar().then(
      (modulo) => listo(null, modulo.default),
      (error) => listo(error, null),
    );
  },
};

// Promesa de la inicialización: main.jsx la espera antes del primer render, así un visitante
// en inglés o alemán no ve la tienda en español por un instante.
export const i18nListo = i18n
  .use(cargaDiferida)
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
