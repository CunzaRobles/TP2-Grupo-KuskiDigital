// Utilidades del concepto "Del valle a la puna": la altitud de origen de cada comunidad.

// Regla del recorrido: de 1,000 msnm (valle) a 4,000 msnm, donde empieza la puna.
export const REGLA = { min: 1000, max: 4000 };
export const MARCAS_REGLA = [1000, 1500, 2000, 2500, 3000, 3500, 4000];

// Regiones naturales de Pulgar Vidal (vertiente oriental), por altitud mínima.
export const ZONAS = [
  { id: 'yunga', desde: 500 },
  { id: 'quechua', desde: 2300 },
  { id: 'suni', desde: 3500 },
  { id: 'puna', desde: 4000 },
];

export const zonaDe = (altitud) => ZONAS.findLast((z) => altitud >= z.desde)?.id ?? ZONAS[0].id;

// Posición de una altitud en la regla, de 0 (1,000 msnm) a 1 (4,000 msnm).
export const posicionEnRegla = (altitud) =>
  Math.min(1, Math.max(0, (altitud - REGLA.min) / (REGLA.max - REGLA.min)));

// "Comunidad Cafetalera de Quillabamba" → "Quillabamba"
export const nombreCorto = (nombre = '') => {
  const i = nombre.lastIndexOf(' de ');
  return i === -1 ? nombre : nombre.slice(i + 4);
};

// Comunidades con altitud conocida, del valle a la cumbre.
export const ordenarPorAltitud = (comunidades = []) =>
  comunidades
    .filter((c) => c.altitudMsnm != null)
    .toSorted((a, b) => a.altitudMsnm - b.altitudMsnm);

// Altitud media del rango de una categoría (null si no tiene productos activos).
export const altitudMedia = ({ altitudMin, altitudMax }) =>
  altitudMin == null || altitudMax == null ? null : (altitudMin + altitudMax) / 2;
