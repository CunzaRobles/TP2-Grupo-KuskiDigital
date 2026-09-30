import { MovimientoInventario, Pedido, Usuario } from '../models/index.js';

const plano = (fila) => fila.get({ plain: true });

// Kardex: registra un movimiento (entrada, salida o ajuste) con el stock resultante.
export const createMovimiento = async (datos, tx) =>
  plano(await MovimientoInventario.create(datos, { transaction: tx }));

// Historial kardex de un producto (más recientes primero), con el admin y el pedido asociados.
export const findMovimientos = async (productoId, { limit, offset }) => {
  const { rows, count } = await MovimientoInventario.findAndCountAll({
    where: { productoId },
    attributes: ['id', 'tipo', 'cantidad', 'stockResultante', 'motivo', 'creadoEn'],
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
      { model: Pedido, as: 'pedido', attributes: ['id', 'codigo'] },
    ],
    order: [
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows: rows.map(plano), count };
};
