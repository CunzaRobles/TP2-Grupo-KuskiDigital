import { Op, QueryTypes } from 'sequelize';
import {
  Categoria,
  Certificacion,
  Comunidad,
  Producto,
  ProductoCertificacion,
  ProductoImagen,
  Resena,
  Usuario,
  sequelize,
} from '../models/index.js';
import { escaparLike } from '../utils/sql.js';

const plano = (fila) => fila.get({ plain: true });

// Promedio y número de reseñas calculados en la misma consulta (subconsultas correlacionadas).
const PROMEDIO_RESENAS = sequelize.literal(
  '(SELECT ROUND(AVG(r.calificacion), 1) FROM resenas r WHERE r.producto_id = "Producto"."id")',
);
const TOTAL_RESENAS = sequelize.literal(
  '(SELECT COUNT(*)::int FROM resenas r WHERE r.producto_id = "Producto"."id")',
);

const ATRIBUTOS_TARJETA = [
  'id',
  'sku',
  'nombre',
  'slug',
  'descripcion',
  'precioBasePen',
  'stock',
  'pesoG',
  'destacado',
  [PROMEDIO_RESENAS, 'calificacionPromedio'],
  [TOTAL_RESENAS, 'totalResenas'],
];

const includesTarjeta = ({ categoriaSlugs } = {}) => [
  {
    model: Categoria,
    as: 'categoria',
    attributes: ['id', 'nombre', 'slug'],
    ...(categoriaSlugs?.length && { where: { slug: categoriaSlugs }, required: true }),
  },
  {
    model: Comunidad,
    as: 'comunidad',
    attributes: ['id', 'nombre', 'provincia', 'region', 'altitudMsnm'],
  },
  {
    model: ProductoImagen,
    as: 'imagenes',
    attributes: ['url', 'textoAlt', 'orden', 'esPrincipal', 'productoId'],
    separate: true,
    order: [['orden', 'ASC']],
  },
  {
    model: Certificacion,
    as: 'certificaciones',
    attributes: ['id', 'nombre'],
    through: { attributes: [] },
  },
];

const ORDENES = {
  destacados: [
    ['destacado', 'DESC'],
    ['id', 'ASC'],
  ],
  precio_asc: [
    ['precioBasePen', 'ASC'],
    ['id', 'ASC'],
  ],
  precio_desc: [
    ['precioBasePen', 'DESC'],
    ['id', 'ASC'],
  ],
  nombre: [
    ['nombre', 'ASC'],
    ['id', 'ASC'],
  ],
  recientes: [
    ['creadoEn', 'DESC'],
    ['id', 'DESC'],
  ],
  valoracion: [
    [sequelize.literal('"calificacionPromedio"'), 'DESC NULLS LAST'],
    ['id', 'ASC'],
  ],
};

/**
 * Catálogo filtrado y paginado. Los filtros llegan ya validados por Zod
 * (los ids son enteros, por eso pueden ir en el literal de certificaciones).
 */
export const findCatalogo = async ({
  categorias,
  comunidades,
  certificaciones,
  precioMinPen,
  precioMaxPen,
  q,
  orden = 'destacados',
  limit,
  offset,
}) => {
  const where = { activo: true };
  const y = [];

  if (comunidades?.length) where.comunidadId = comunidades;
  if (precioMinPen !== undefined || precioMaxPen !== undefined) {
    where.precioBasePen = {
      ...(precioMinPen !== undefined && { [Op.gte]: precioMinPen }),
      ...(precioMaxPen !== undefined && { [Op.lte]: precioMaxPen }),
    };
  }
  if (certificaciones?.length) {
    const ids = certificaciones.map((id) => Number.parseInt(id, 10)).join(',');
    where.id = {
      [Op.in]: sequelize.literal(
        `(SELECT producto_id FROM producto_certificaciones WHERE certificacion_id IN (${ids}))`,
      ),
    };
  }
  if (q) {
    const patron = `%${escaparLike(q)}%`;
    y.push({
      [Op.or]: [{ nombre: { [Op.iLike]: patron } }, { descripcion: { [Op.iLike]: patron } }],
    });
  }
  if (y.length) where[Op.and] = y;

  const { rows, count } = await Producto.findAndCountAll({
    where,
    attributes: ATRIBUTOS_TARJETA,
    include: includesTarjeta({ categoriaSlugs: categorias }),
    order: ORDENES[orden] ?? ORDENES.destacados,
    limit,
    offset,
    distinct: true,
    col: 'id',
  });

  return { rows: rows.map(plano), count };
};

export const findDestacados = async ({ limit }) => {
  const filas = await Producto.findAll({
    where: { activo: true, destacado: true },
    attributes: ATRIBUTOS_TARJETA,
    include: includesTarjeta(),
    order: [['id', 'ASC']],
    limit,
  });
  return filas.map(plano);
};

// Ficha completa del producto (sin reseñas: van en findResenas y findResumenResenas).
export const findBySlug = async (slug) => {
  const fila = await Producto.findOne({
    where: { slug, activo: true },
    attributes: [...ATRIBUTOS_TARJETA, 'stockMinimo'],
    include: [
      { model: Categoria, as: 'categoria', attributes: ['id', 'nombre', 'slug'] },
      {
        model: Comunidad,
        as: 'comunidad',
        attributes: [
          'id',
          'nombre',
          'razonSocial',
          'provincia',
          'region',
          'altitudMsnm',
          'latitud',
          'longitud',
          'familiasBeneficiadas',
          'descripcion',
          'imagenUrl',
        ],
      },
      {
        model: ProductoImagen,
        as: 'imagenes',
        attributes: ['url', 'textoAlt', 'orden', 'esPrincipal', 'productoId'],
        separate: true,
        order: [['orden', 'ASC']],
      },
      {
        model: Certificacion,
        as: 'certificaciones',
        attributes: ['id', 'nombre', 'entidadEmisora'],
        through: { attributes: [] },
      },
    ],
  });
  return fila ? plano(fila) : null;
};

/**
 * Productos relacionados: primero los de la misma categoría (destacados antes) y, si no
 * alcanzan, se completa con destacados de otras categorías. Nunca incluye al propio producto.
 * Devuelve null si el slug no existe.
 */
export const findRelacionados = async (slug, { limit }) => {
  const base = await Producto.findOne({
    where: { slug, activo: true },
    attributes: ['id', 'categoriaId'],
  });
  if (!base) return null;

  // categoriaId es un entero leído de la base: seguro dentro del literal. Se ordena por el
  // alias porque, con limit e includes, Sequelize envuelve la consulta en una subconsulta.
  const mismaCategoria = sequelize.literal(
    `("Producto"."categoria_id" = ${Number.parseInt(base.categoriaId, 10)})`,
  );
  const filas = await Producto.findAll({
    where: { activo: true, id: { [Op.ne]: base.id } },
    attributes: [...ATRIBUTOS_TARJETA, [mismaCategoria, 'mismaCategoria']],
    include: includesTarjeta(),
    order: [
      [sequelize.literal('"mismaCategoria"'), 'DESC'],
      ['destacado', 'DESC'],
      ['id', 'ASC'],
    ],
    limit,
  });
  return filas.map(plano);
};

export const findResenas = async (productoId, { limit }) => {
  const filas = await Resena.findAll({
    where: { productoId },
    attributes: ['id', 'calificacion', 'comentario', 'creadoEn'],
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido', 'paisCodigo'] }],
    order: [
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
  });
  return filas.map(plano);
};

// Número de reseñas por calificación: [{ calificacion, total }]
export const findDistribucionResenas = (productoId) =>
  sequelize.query(
    `SELECT calificacion, COUNT(*)::int AS total
       FROM resenas WHERE producto_id = :productoId
      GROUP BY calificacion`,
    { replacements: { productoId }, type: QueryTypes.SELECT },
  );

// Productos que entran en una venta, bloqueados (SELECT ... FOR UPDATE) hasta el fin de la
// transacción para que dos compras simultáneas no vendan el mismo stock.
export const findParaVenta = async (ids, tx) => {
  const filas = await Producto.findAll({
    where: { id: ids },
    attributes: ['id', 'nombre', 'slug', 'precioBasePen', 'stock', 'pesoG', 'activo'],
    order: [['id', 'ASC']],
    lock: tx ? true : undefined,
    transaction: tx,
  });
  return filas.map(plano);
};

// Productos por id sin bloqueo (cotización y carrito).
export const findByIds = (ids) => findParaVenta(ids);

// Productos del carrito de invitado, con su imagen principal (sin bloqueo).
export const findParaCarrito = async (ids) => {
  const filas = await Producto.findAll({
    where: { id: ids },
    attributes: ['id', 'nombre', 'slug', 'precioBasePen', 'stock', 'pesoG', 'activo'],
    include: [
      {
        model: ProductoImagen,
        as: 'imagenes',
        attributes: ['url', 'textoAlt'],
        where: { esPrincipal: true },
        required: false,
      },
    ],
    order: [['id', 'ASC']],
  });
  return filas.map(plano);
};

// Descuenta stock de forma atómica. Devuelve el stock resultante o null si no alcanzaba.
export const descontarStock = async (id, cantidad, tx) => {
  const filas = await sequelize.query(
    `UPDATE productos SET stock = stock - :cantidad
      WHERE id = :id AND stock >= :cantidad
      RETURNING stock`,
    { replacements: { id, cantidad }, type: QueryTypes.SELECT, transaction: tx },
  );
  return filas.length ? filas[0].stock : null;
};

// Devuelve stock (cancelación de un pedido). Devuelve el stock resultante.
export const incrementarStock = async (id, cantidad, tx) => {
  const filas = await sequelize.query(
    `UPDATE productos SET stock = stock + :cantidad WHERE id = :id RETURNING stock`,
    { replacements: { id, cantidad }, type: QueryTypes.SELECT, transaction: tx },
  );
  return filas.length ? filas[0].stock : null;
};

// ─────────────────────────── Panel admin ───────────────────────────

const IMAGEN_PRINCIPAL = {
  model: ProductoImagen,
  as: 'imagenes',
  attributes: ['url', 'textoAlt'],
  where: { esPrincipal: true },
  required: false,
};

const ORDENES_ADMIN = {
  recientes: [
    ['creadoEn', 'DESC'],
    ['id', 'DESC'],
  ],
  nombre: [
    ['nombre', 'ASC'],
    ['id', 'ASC'],
  ],
  stock_asc: [
    ['stock', 'ASC'],
    ['nombre', 'ASC'],
  ],
  precio_desc: [
    ['precioBasePen', 'DESC'],
    ['id', 'ASC'],
  ],
};

/**
 * Productos del panel (incluye inactivos). Lo usan el catálogo admin y el inventario.
 * `stockBajo` filtra con el mismo criterio que la vista v_productos_stock_bajo.
 */
export const findAdmin = async (
  { q, categoriaId, comunidadId, activo, stockBajo, orden = 'recientes' },
  { limit, offset },
) => {
  const where = {};
  const y = [];
  if (categoriaId) where.categoriaId = categoriaId;
  if (comunidadId) where.comunidadId = comunidadId;
  if (activo !== undefined) where.activo = activo;
  if (stockBajo)
    y.push(sequelize.where(sequelize.col('stock'), Op.lte, sequelize.col('stock_minimo')));
  if (q) {
    const patron = `%${escaparLike(q)}%`;
    y.push({ [Op.or]: [{ nombre: { [Op.iLike]: patron } }, { sku: { [Op.iLike]: patron } }] });
  }
  if (y.length) where[Op.and] = y;

  const { rows, count } = await Producto.findAndCountAll({
    where,
    attributes: [
      'id',
      'sku',
      'nombre',
      'slug',
      'precioBasePen',
      'stock',
      'stockMinimo',
      'pesoG',
      'destacado',
      'activo',
      'creadoEn',
      'actualizadoEn',
    ],
    include: [
      { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
      { model: Comunidad, as: 'comunidad', attributes: ['id', 'nombre'] },
      IMAGEN_PRINCIPAL,
    ],
    order: ORDENES_ADMIN[orden] ?? ORDENES_ADMIN.recientes,
    limit,
    offset,
    distinct: true,
    col: 'id',
  });
  return { rows: rows.map(plano), count };
};

// Ficha completa para el formulario de edición (aunque esté inactivo).
export const findAdminById = async (id, tx) => {
  const fila = await Producto.findByPk(id, {
    include: [
      { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
      { model: Comunidad, as: 'comunidad', attributes: ['id', 'nombre'] },
      {
        model: ProductoImagen,
        as: 'imagenes',
        attributes: ['id', 'productoId', 'url', 'textoAlt', 'orden', 'esPrincipal'],
        separate: true,
        order: [
          ['orden', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      {
        model: Certificacion,
        as: 'certificaciones',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
      },
    ],
    transaction: tx,
  });
  return fila ? plano(fila) : null;
};

// ¿Hay otro producto con ese SKU o slug? → { sku: boolean, slug: boolean }
export const findConflictos = async ({ sku, slug }, excluirId) => {
  const filas = await Producto.findAll({
    where: {
      [Op.or]: [...(sku ? [{ sku }] : []), ...(slug ? [{ slug }] : [])],
      ...(excluirId && { id: { [Op.ne]: excluirId } }),
    },
    attributes: ['sku', 'slug'],
  });
  return {
    sku: Boolean(sku) && filas.some((f) => f.sku === sku),
    slug: Boolean(slug) && filas.some((f) => f.slug === slug),
  };
};

export const create = async (datos, tx) => plano(await Producto.create(datos, { transaction: tx }));

export const update = async (id, cambios, tx) => {
  await Producto.update(cambios, { where: { id }, transaction: tx });
};

// Reemplaza las certificaciones del producto.
export const setCertificaciones = async (productoId, certificacionIds, tx) => {
  await ProductoCertificacion.destroy({ where: { productoId }, transaction: tx });
  if (certificacionIds.length) {
    await ProductoCertificacion.bulkCreate(
      certificacionIds.map((certificacionId) => ({ productoId, certificacionId })),
      { transaction: tx },
    );
  }
};

// Producto bloqueado (FOR UPDATE) para un movimiento de inventario.
export const findParaMovimiento = async (id, tx) => {
  const fila = await Producto.findByPk(id, {
    attributes: ['id', 'sku', 'nombre', 'stock', 'stockMinimo'],
    lock: true,
    transaction: tx,
  });
  return fila ? plano(fila) : null;
};

export const setStock = async (id, stock, tx) => {
  await Producto.update({ stock }, { where: { id }, transaction: tx });
};

// --- Imágenes -----------------------------------------------------------

const ATRIBUTOS_IMAGEN = ['id', 'productoId', 'url', 'textoAlt', 'orden', 'esPrincipal'];

export const findImagenes = async (productoId, tx) => {
  const filas = await ProductoImagen.findAll({
    where: { productoId },
    attributes: ATRIBUTOS_IMAGEN,
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction: tx,
  });
  return filas.map(plano);
};

export const createImagen = async (datos, tx) =>
  plano(await ProductoImagen.create(datos, { transaction: tx }));

export const updateImagen = async (id, cambios, tx) => {
  await ProductoImagen.update(cambios, { where: { id }, transaction: tx });
};

export const deleteImagen = async (id, tx) => {
  await ProductoImagen.destroy({ where: { id }, transaction: tx });
};

// Antes de marcar otra como principal (índice único parcial uk_producto_imagen_principal).
export const desmarcarImagenPrincipal = async (productoId, tx) => {
  await ProductoImagen.update(
    { esPrincipal: false },
    { where: { productoId, esPrincipal: true }, transaction: tx },
  );
};
