import { Op } from 'sequelize';
import {
  Envio,
  MovimientoInventario,
  Pago,
  Pedido,
  PedidoEstado,
  PedidoItem,
  Producto,
  ProductoImagen,
  Usuario,
  sequelize,
} from '../models/index.js';
import { escaparLike } from '../utils/sql.js';

const plano = (fila) => fila.get({ plain: true });

export const create = async (datos, tx) => plano(await Pedido.create(datos, { transaction: tx }));

export const update = async (id, cambios, tx) => {
  await Pedido.update(cambios, { where: { id }, transaction: tx });
};

export const createItems = async (items, tx) => {
  await PedidoItem.bulkCreate(items, { transaction: tx });
};

export const createEstado = async (datos, tx) => {
  await PedidoEstado.create(datos, { transaction: tx });
};

export const createPago = async (datos, tx) => plano(await Pago.create(datos, { transaction: tx }));

export const createEnvio = async (datos, tx) =>
  plano(await Envio.create(datos, { transaction: tx }));

// Kardex: movimiento de inventario (salida por venta, entrada, ajuste).
export const createMovimientoInventario = async (datos, tx) => {
  await MovimientoInventario.create(datos, { transaction: tx });
};

const ATRIBUTOS_RESUMEN = [
  'id',
  'codigo',
  'estado',
  'moneda',
  'tipoCambio',
  'subtotalPen',
  'costoEnvioPen',
  'igvPen',
  'totalPen',
  'totalMoneda',
  'envioPaisCodigo',
  'creadoEn',
];

export const findByUsuario = async (usuarioId, { limit, offset }) => {
  const { rows, count } = await Pedido.findAndCountAll({
    where: { usuarioId },
    attributes: ATRIBUTOS_RESUMEN,
    include: [
      {
        model: PedidoItem,
        as: 'items',
        attributes: ['pedidoId', 'productoId', 'nombreProducto', 'cantidad'],
        separate: true,
        order: [['id', 'ASC']],
      },
      {
        model: Envio,
        as: 'envio',
        attributes: ['transportista', 'metodo', 'codigoSeguimiento', 'fechaEstimada'],
      },
    ],
    order: [
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
    distinct: true,
  });
  return { rows: rows.map(plano), count };
};

// Detalle completo del pedido para la confirmación y el tracking.
export const findByCodigo = async (codigo, tx) => {
  const fila = await Pedido.findOne({
    where: { codigo },
    include: [
      {
        model: PedidoItem,
        as: 'items',
        separate: true,
        order: [['id', 'ASC']],
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'slug'],
            include: [
              {
                model: ProductoImagen,
                as: 'imagenes',
                attributes: ['url', 'textoAlt'],
                where: { esPrincipal: true },
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: PedidoEstado,
        as: 'historialEstados',
        attributes: ['pedidoId', 'estado', 'comentario', 'creadoEn'],
        separate: true,
        order: [
          ['creadoEn', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      { model: Pago, as: 'pago' },
      { model: Envio, as: 'envio' },
    ],
    transaction: tx,
  });
  return fila ? plano(fila) : null;
};

// ─────────────────────────── Panel admin ───────────────────────────

// Filtros de la tabla de ventas / pedidos. `desde` y `hasta` son fechas (YYYY-MM-DD) en la
// hora de Lima; `hasta` incluye el día completo.
const whereAdmin = ({ desde, hasta, paises, estados, metodosPago, q }) => {
  const where = {};
  const y = [];
  const fechaLima = sequelize.literal(`("Pedido"."creado_en" AT TIME ZONE 'America/Lima')::date`);
  if (desde) y.push(sequelize.where(fechaLima, Op.gte, desde));
  if (hasta) y.push(sequelize.where(fechaLima, Op.lte, hasta));
  if (paises?.length) where.envioPaisCodigo = paises;
  if (estados?.length) where.estado = estados;
  if (metodosPago?.length) where['$pago.metodo$'] = metodosPago;
  if (q) {
    const patron = `%${escaparLike(q)}%`;
    y.push({
      [Op.or]: [
        { codigo: { [Op.iLike]: patron } },
        { envioDestinatario: { [Op.iLike]: patron } },
        { '$usuario.correo$': { [Op.iLike]: patron } },
      ],
    });
  }
  if (y.length) where[Op.and] = y;
  return where;
};

const includesAdmin = [
  { model: Pago, as: 'pago', attributes: ['metodo', 'estado', 'numeroOperacion'] },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'correo'] },
  { model: Envio, as: 'envio', attributes: ['transportista', 'metodo', 'codigoSeguimiento'] },
];

// Ventas / pedidos con filtros y paginación (más recientes primero).
export const findAdmin = async (filtros, { limit, offset }) => {
  const { rows, count } = await Pedido.findAndCountAll({
    where: whereAdmin(filtros),
    attributes: [...ATRIBUTOS_RESUMEN, 'envioDestinatario', 'envioCiudad'],
    include: [
      ...includesAdmin,
      {
        model: PedidoItem,
        as: 'items',
        attributes: ['pedidoId', 'cantidad'],
        separate: true,
      },
    ],
    order: [
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
    distinct: true,
    col: 'id',
    subQuery: false,
  });
  return { rows: rows.map(plano), count };
};

// Totales de los pedidos filtrados. Los ingresos solo suman ventas (sin pendientes ni cancelados).
export const resumenAdmin = async (filtros) => {
  const [fila] = await Pedido.findAll({
    where: whereAdmin(filtros),
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('Pedido.id')), 'pedidos'],
      [
        sequelize.literal(
          `COALESCE(SUM("Pedido"."total_pen") FILTER (WHERE "Pedido"."estado" NOT IN ('pendiente', 'cancelado')), 0)`,
        ),
        'ingresosPen',
      ],
      [
        sequelize.literal(
          `COUNT(*) FILTER (WHERE "Pedido"."estado" NOT IN ('pendiente', 'cancelado'))`,
        ),
        'ventas',
      ],
    ],
    include: includesAdmin.map((i) => ({ ...i, attributes: [] })),
    raw: true,
  });
  return fila;
};

// Pedido bloqueado (FOR UPDATE) para cambiar su estado, con sus ítems y su pago.
export const findParaCambioEstado = async (codigo, tx) => {
  const fila = await Pedido.findOne({
    where: { codigo },
    attributes: ['id', 'codigo', 'estado', 'usuarioId'],
    lock: true,
    transaction: tx,
  });
  if (!fila) return null;
  const [items, pago] = await Promise.all([
    PedidoItem.findAll({
      where: { pedidoId: fila.id },
      attributes: ['productoId', 'nombreProducto', 'cantidad'],
      order: [['id', 'ASC']],
      transaction: tx,
    }),
    Pago.findOne({ where: { pedidoId: fila.id }, attributes: ['id', 'estado'], transaction: tx }),
  ]);
  return { ...plano(fila), items: items.map(plano), pago: pago ? plano(pago) : null };
};

export const updatePago = async (pedidoId, cambios, tx) => {
  await Pago.update(cambios, { where: { pedidoId }, transaction: tx });
};

export const updateEnvio = async (pedidoId, cambios, tx) => {
  await Envio.update(cambios, { where: { pedidoId }, transaction: tx });
};
