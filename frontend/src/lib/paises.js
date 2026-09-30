import { localeDe } from './format';

// Países de destino ofrecidos en registro y checkout (ISO 3166-1 alfa-2). Cubren las zonas
// de envío del backend (nacional, latam, norteamérica, europa y resto del mundo); los nombres
// salen de Intl.DisplayNames en el idioma de la interfaz.
// prettier-ignore
export const PAISES = [
  'PE',
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PA', 'PY', 'UY', 'VE',
  'US', 'CA',
  'DE', 'AT', 'BE', 'CH', 'DK', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'NL', 'NO', 'PL', 'PT', 'SE',
  'AU', 'CN', 'JP', 'KR', 'NZ', 'SG', 'AE', 'IL', 'ZA',
];

export const PAIS_IGV = 'PE';

const cache = new Map();
const nombres = (idioma) => {
  const locale = localeDe(idioma);
  if (!cache.has(locale)) cache.set(locale, new Intl.DisplayNames([locale], { type: 'region' }));
  return cache.get(locale);
};

export const nombrePais = (codigo, idioma) => {
  if (!codigo) return '';
  try {
    return nombres(idioma).of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
};

// Perú primero (la mayoría de pedidos) y el resto en orden alfabético del idioma actual.
export const paisesOrdenados = (idioma) => {
  const locale = localeDe(idioma);
  const [peru, ...resto] = PAISES;
  return [
    { codigo: peru, nombre: nombrePais(peru, idioma) },
    ...resto
      .map((codigo) => ({ codigo, nombre: nombrePais(codigo, idioma) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, locale)),
  ];
};

// 🇵🇪 a partir del código ISO (indicadores regionales Unicode).
export const banderaPais = (codigo) =>
  codigo?.length === 2
    ? String.fromCodePoint(...[...codigo.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : '';
