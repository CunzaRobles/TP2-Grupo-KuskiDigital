// Código correlativo de las hojas de reclamación: LR-<año>-<número de 6 dígitos>.
// La numeración vuelve a empezar en 000001 cada año.

const PATRON = /^LR-(\d{4})-(\d{6})$/;

export const formatearCodigoReclamacion = (anio, numero) =>
  `LR-${anio}-${String(numero).padStart(6, '0')}`;

/**
 * Siguiente código del año a partir del último registrado (o null si es la primera del año).
 * siguienteCodigoReclamacion(2026, 'LR-2026-000041') → 'LR-2026-000042'.
 */
export const siguienteCodigoReclamacion = (anio, ultimoCodigo) => {
  const coincidencia = ultimoCodigo ? PATRON.exec(ultimoCodigo) : null;
  const mismoAnio = coincidencia && Number(coincidencia[1]) === anio;
  return formatearCodigoReclamacion(anio, mismoAnio ? Number(coincidencia[2]) + 1 : 1);
};
