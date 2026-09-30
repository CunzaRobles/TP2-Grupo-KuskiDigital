// Filtros del catálogo ⇄ URL. La URL es la fuente de verdad: se puede compartir, recargar y
// volver atrás. Formato: ?categoria=cafe,textiles&comunidad=1,3&certificacion=2
// &precio_min=10&precio_max=80&q=alpaca&orden=precio_asc&page=2 (mismo formato que la API).

export const ORDENES = [
  'destacados',
  'precio_asc',
  'precio_desc',
  'nombre',
  'recientes',
  'valoracion',
];
export const ORDEN_POR_DEFECTO = 'destacados';
export const POR_PAGINA = 12;

const SLUG = /^[a-z0-9-]+$/;

// Acepta ?x=a,b y ?x=a&x=b; sin vacíos ni duplicados.
const leerLista = (params, clave) => [
  ...new Set(
    params
      .getAll(clave)
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean),
  ),
];

const leerIds = (params, clave) =>
  leerLista(params, clave)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

const leerPrecio = (params, clave) => {
  const texto = params.get(clave);
  if (texto === null || texto.trim() === '') return undefined;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** URLSearchParams → filtros saneados (lo inválido se ignora en vez de romper la página). */
export function leerFiltros(params) {
  const orden = params.get('orden');
  const page = Number(params.get('page'));
  let precioMin = leerPrecio(params, 'precio_min');
  let precioMax = leerPrecio(params, 'precio_max');
  if (precioMin !== undefined && precioMax !== undefined && precioMin > precioMax) {
    [precioMin, precioMax] = [precioMax, precioMin];
  }

  return {
    categorias: leerLista(params, 'categoria').filter((s) => SLUG.test(s)),
    comunidades: leerIds(params, 'comunidad'),
    certificaciones: leerIds(params, 'certificacion'),
    precioMin,
    precioMax,
    q: params.get('q')?.trim().slice(0, 100) || undefined,
    orden: ORDENES.includes(orden) ? orden : ORDEN_POR_DEFECTO,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Filtros → URLSearchParams, omitiendo los valores por defecto para que la URL quede limpia. */
export function aSearchParams(filtros) {
  const params = new URLSearchParams();
  const lista = (clave, valores) => {
    if (valores?.length) params.set(clave, valores.join(','));
  };
  lista('categoria', filtros.categorias);
  lista('comunidad', filtros.comunidades);
  lista('certificacion', filtros.certificaciones);
  if (filtros.precioMin !== undefined) params.set('precio_min', String(filtros.precioMin));
  if (filtros.precioMax !== undefined) params.set('precio_max', String(filtros.precioMax));
  if (filtros.q) params.set('q', filtros.q);
  if (filtros.orden && filtros.orden !== ORDEN_POR_DEFECTO) params.set('orden', filtros.orden);
  if (filtros.page > 1) params.set('page', String(filtros.page));
  return params;
}

/**
 * Aplica un cambio a los filtros. Cualquier cambio que no sea de página vuelve a la página 1
 * (la página 3 de otro filtro puede no existir).
 */
export const cambiarFiltros = (filtros, cambios) => ({
  ...filtros,
  page: 1,
  ...cambios,
});

// Agrega o quita un valor de una lista (casillas de verificación).
export const alternar = (lista, valor) =>
  lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

export const FILTROS_VACIOS = {
  categorias: [],
  comunidades: [],
  certificaciones: [],
  precioMin: undefined,
  precioMax: undefined,
  q: undefined,
};

// Número de filtros activos (el orden y la página no cuentan).
export const contarFiltros = (f) =>
  f.categorias.length +
  f.comunidades.length +
  f.certificaciones.length +
  (f.precioMin !== undefined || f.precioMax !== undefined ? 1 : 0) +
  (f.q ? 1 : 0);

/** Parámetros de GET /productos para estos filtros en la moneda elegida. */
export const aQueryApi = (filtros, moneda) => ({
  categoria: filtros.categorias.join(','),
  comunidad: filtros.comunidades.join(','),
  certificacion: filtros.certificaciones.join(','),
  precio_min: filtros.precioMin,
  precio_max: filtros.precioMax,
  q: filtros.q,
  orden: filtros.orden,
  page: filtros.page,
  limit: POR_PAGINA,
  moneda,
});

// "Comercio Justo" → "comercio-justo" (clave de traducción de la certificación).
export const claveCertificacion = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
