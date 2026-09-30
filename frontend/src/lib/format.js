// Formateo de moneda, números y fechas según el idioma de la interfaz.

export const IDIOMAS = ['es', 'en', 'de'];

const LOCALES = { es: 'es-PE', en: 'en-US', de: 'de-DE' };

export const localeDe = (idioma = 'es') => LOCALES[idioma?.slice(0, 2)] ?? LOCALES.es;

const cacheFormatos = new Map();
const formateador = (locale, opciones) => {
  const clave = `${locale}|${JSON.stringify(opciones)}`;
  if (!cacheFormatos.has(clave)) cacheFormatos.set(clave, new Intl.NumberFormat(locale, opciones));
  return cacheFormatos.get(clave);
};

// Los montos llegan ya convertidos por la API (el tipo de cambio vive en el backend).
export const formatMoney = (monto, moneda = 'PEN', idioma = 'es') => {
  const valor = Number(monto);
  if (monto === null || monto === undefined || !Number.isFinite(valor)) return '—';
  return formateador(localeDe(idioma), {
    style: 'currency',
    currency: moneda,
    currencyDisplay: moneda === 'PEN' ? 'symbol' : 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

export const formatNumber = (valor, idioma = 'es', opciones = {}) =>
  formateador(localeDe(idioma), opciones).format(Number(valor));

export const formatDate = (fecha, idioma = 'es', opciones = { dateStyle: 'medium' }) =>
  new Intl.DateTimeFormat(localeDe(idioma), opciones).format(new Date(fecha));
