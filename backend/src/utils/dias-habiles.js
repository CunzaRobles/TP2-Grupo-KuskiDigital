// Días hábiles para el plazo del Libro de Reclamaciones (15 días hábiles improrrogables,
// D.S. 101-2022-PCM). Se excluyen sábados y domingos; los feriados nacionales no se descuentan,
// así que el plazo calculado nunca es más largo que el legal.
// Las fechas son strings AAAA-MM-DD (días de calendario en Lima, sin hora).

const DIA_MS = 24 * 60 * 60 * 1000;

const aFecha = (iso) => new Date(`${iso}T00:00:00Z`);
const aIso = (fecha) => fecha.toISOString().slice(0, 10);
const esHabil = (fecha) => fecha.getUTCDay() !== 0 && fecha.getUTCDay() !== 6;

/** Fecha de hoy en Lima (AAAA-MM-DD). */
export const hoyEnLima = (ahora = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(ahora);

/** Año en curso en Lima. */
export const anioEnLima = (ahora = new Date()) => Number(hoyEnLima(ahora).slice(0, 4));

/**
 * Suma `dias` hábiles a `desde` (que no cuenta): presentado un lunes, el día hábil 1 es el
 * martes. sumarDiasHabiles('2026-11-23', 15) → '2026-12-14'.
 */
export const sumarDiasHabiles = (desde, dias) => {
  const fecha = aFecha(desde);
  let restantes = dias;
  while (restantes > 0) {
    fecha.setTime(fecha.getTime() + DIA_MS);
    if (esHabil(fecha)) restantes -= 1;
  }
  return aIso(fecha);
};

/**
 * Días hábiles desde `desde` (sin contarlo) hasta `hasta` (incluido). Negativo si `hasta` ya
 * pasó: diasHabilesEntre('2026-12-15', '2026-12-14') → -1.
 */
export const diasHabilesEntre = (desde, hasta) => {
  if (desde === hasta) return 0;
  const signo = hasta > desde ? 1 : -1;
  const [inicio, fin] = signo > 0 ? [desde, hasta] : [hasta, desde];
  const fecha = aFecha(inicio);
  const limite = aFecha(fin).getTime();
  let dias = 0;
  while (fecha.getTime() < limite) {
    fecha.setTime(fecha.getTime() + DIA_MS);
    if (esHabil(fecha)) dias += 1;
  }
  return signo * dias;
};
