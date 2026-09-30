import * as productoRepository from '../repositories/producto.repository.js';
import { AppError } from '../utils/app-error.js';
import { aNumero, convertirAPen } from '../utils/money.js';
import { obtenerTasa, precioEn } from './precio.service.js';

const RESENAS_EN_FICHA = 20;

const toImagenes = (imagenes = []) =>
  imagenes.map(({ url, textoAlt, orden, esPrincipal }) => ({ url, textoAlt, orden, esPrincipal }));

// PostgreSQL devuelve NUMERIC como string; la API expone números.
const toProductoDTO = (p, tasa) => {
  const precioBasePen = Number(p.precioBasePen);
  return {
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    slug: p.slug,
    descripcion: p.descripcion,
    precioBasePen,
    precio: precioEn(precioBasePen, tasa),
    stock: p.stock,
    disponible: p.stock > 0,
    pesoG: p.pesoG,
    destacado: p.destacado,
    calificacionPromedio: aNumero(p.calificacionPromedio),
    totalResenas: Number(p.totalResenas ?? 0),
    categoria: p.categoria ?? null,
    comunidad: p.comunidad ?? null,
    imagenes: toImagenes(p.imagenes),
    certificaciones: (p.certificaciones ?? []).map(({ id, nombre }) => ({ id, nombre })),
  };
};

// "María Quispe" → "María Q." (las reseñas no exponen el apellido completo).
const autorResena = (usuario) =>
  usuario ? `${usuario.nombre} ${usuario.apellido?.charAt(0) ?? ''}.`.trim() : 'Cliente Kuski';

export const listarProductos = async ({
  page,
  limit,
  moneda,
  precioMin,
  precioMax,
  ...filtros
}) => {
  const tasa = await obtenerTasa(moneda);
  // El rango de precio llega en la moneda elegida; el catálogo guarda los precios en PEN.
  const { rows, count } = await productoRepository.findCatalogo({
    ...filtros,
    precioMinPen: precioMin === undefined ? undefined : convertirAPen(precioMin, tasa.valorEnPen),
    precioMaxPen: precioMax === undefined ? undefined : convertirAPen(precioMax, tasa.valorEnPen),
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows.map((p) => toProductoDTO(p, tasa)),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const listarDestacados = async ({ moneda, limit }) => {
  const tasa = await obtenerTasa(moneda);
  const filas = await productoRepository.findDestacados({ limit });
  return filas.map((p) => toProductoDTO(p, tasa));
};

export const listarRelacionados = async (slug, { moneda, limit }) => {
  const filas = await productoRepository.findRelacionados(slug, { limit });
  if (!filas) throw new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe');
  const tasa = await obtenerTasa(moneda);
  return filas.map((p) => toProductoDTO(p, tasa));
};

export const obtenerPorSlug = async (slug, { moneda }) => {
  const producto = await productoRepository.findBySlug(slug);
  if (!producto) throw new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe');

  const [tasa, resenas, distribucion] = await Promise.all([
    obtenerTasa(moneda),
    productoRepository.findResenas(producto.id, { limit: RESENAS_EN_FICHA }),
    productoRepository.findDistribucionResenas(producto.id),
  ]);

  const { comunidad } = producto;
  return {
    ...toProductoDTO(producto, tasa),
    stockMinimo: producto.stockMinimo,
    comunidad: comunidad && {
      ...comunidad,
      latitud: aNumero(comunidad.latitud),
      longitud: aNumero(comunidad.longitud),
    },
    certificaciones: producto.certificaciones.map(({ id, nombre, entidadEmisora }) => ({
      id,
      nombre,
      entidadEmisora,
    })),
    resenas: {
      promedio: aNumero(producto.calificacionPromedio),
      total: Number(producto.totalResenas ?? 0),
      distribucion: Object.fromEntries(
        [5, 4, 3, 2, 1].map((c) => [c, distribucion.find((d) => d.calificacion === c)?.total ?? 0]),
      ),
      items: resenas.map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        autor: autorResena(r.usuario),
        paisCodigo: r.usuario?.paisCodigo ?? null,
        creadoEn: r.creadoEn,
      })),
    },
  };
};
