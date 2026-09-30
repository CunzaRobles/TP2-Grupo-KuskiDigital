// Redondeo monetario a 2 decimales (evita errores de coma flotante como 1.005 → 1.00).
export const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Convierte un monto en soles a otra moneda. valorEnPen = cuántos soles vale 1 unidad.
export const convertirDesdePen = (montoPen, valorEnPen) => redondear(montoPen / valorEnPen);

// Convierte un monto en otra moneda a soles.
export const convertirAPen = (monto, valorEnPen) => redondear(monto * valorEnPen);

// NUMERIC de PostgreSQL llega como string: la API expone números (o null).
export const aNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));
