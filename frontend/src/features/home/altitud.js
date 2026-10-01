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

// Pisos de color del recorrido de categorías, por altitud: valle (Musgo), ladera (Ichu) y
// altura (Puna). La puna real empieza a 4,000 m: "altura" no afirma que se llegue a ella.
export const PISOS = [
  { id: 'valle', desde: -Infinity },
  { id: 'ladera', desde: 2000 },
  { id: 'altura', desde: 3000 },
];

export const pisoDe = (altitud) => PISOS.findLast((p) => altitud >= p.desde).id;

// Altitud a la que aparece una categoría en el recorrido: la de su comunidad principal (la que
// aporta más productos) o, si no viene, el inicio de su rango.
export const altitudDeCategoria = ({ comunidadPrincipal, altitudMin }) =>
  comunidadPrincipal?.altitudMsnm ?? altitudMin ?? null;

// Categorías del valle a la cumbre según su altitud; las que no tienen productos, al final.
export const ordenarCategorias = (categorias = []) =>
  categorias.toSorted(
    (a, b) => (altitudDeCategoria(a) ?? Infinity) - (altitudDeCategoria(b) ?? Infinity),
  );

// Marcas de una regla vertical como fondo CSS: `intervalos` líneas de 1 px de abajo arriba.
export const marcasRegla = (intervalos) =>
  `repeating-linear-gradient(to top, currentColor 0 1px, transparent 1px calc(100% / ${intervalos}))`;
