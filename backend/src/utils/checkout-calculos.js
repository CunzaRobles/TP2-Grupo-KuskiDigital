import { redondear } from './money.js';

export const TASA_IGV = 0.18;
export const PAIS_IGV = 'PE';

// El IGV solo se cobra en envíos dentro de Perú.
export const aplicaIgv = (paisCodigo) => paisCodigo === PAIS_IGV;

// IGV (18 %) sobre la base imponible en soles; 0 si el destino no es Perú.
export const calcularIGV = (baseImponiblePen, paisCodigo) =>
  aplicaIgv(paisCodigo) ? redondear(baseImponiblePen * TASA_IGV) : 0;

// Montos de una opción de envío: el IGV grava productos + envío.
export const calcularTotales = (subtotalPen, envioPen, paisCodigo) => {
  const igvPen = calcularIGV(subtotalPen + envioPen, paisCodigo);
  return { subtotalPen, envioPen, igvPen, totalPen: redondear(subtotalPen + envioPen + igvPen) };
};
