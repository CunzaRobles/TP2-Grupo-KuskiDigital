import { exchangeRateProvider } from '../adapters/exchange/index.js';
import { convertirDesdePen } from '../utils/money.js';

// Tasa de la moneda pedida: { moneda, simbolo, valorEnPen }.
export const obtenerTasa = (moneda) => exchangeRateProvider.obtenerTasa(moneda);

// Precio expresado en la moneda de la tasa: { moneda, simbolo, monto }.
export const precioEn = (montoPen, tasa) => ({
  moneda: tasa.moneda,
  simbolo: tasa.simbolo,
  monto: convertirDesdePen(montoPen, tasa.valorEnPen),
});
