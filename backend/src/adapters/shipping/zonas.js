// Zona de envío (tarifas_envio.zona) según el país de destino (ISO 3166-1 alfa-2).
// prettier-ignore
const LATAM = new Set([
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PR', 'PY',
  'SV', 'UY', 'VE',
]);
const NORTEAMERICA = new Set(['US', 'CA']);
// prettier-ignore
const EUROPA = new Set([
  'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR',
  'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE',
  'SI', 'SK', 'SM',
]);

export const zonaDePais = (paisCodigo) => {
  const pais = String(paisCodigo).toUpperCase();
  if (pais === 'PE') return 'nacional';
  if (LATAM.has(pais)) return 'latam';
  if (NORTEAMERICA.has(pais)) return 'norteamerica';
  if (EUROPA.has(pais)) return 'europa';
  return 'resto_mundo';
};
