import * as inventarioRepository from '../repositories/inventario.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import { AppError } from '../utils/app-error.js';
import { listarProductos } from './admin-producto.service.js';

const MOTIVOS = {
  entrada: 'Ingreso de mercadería',
  salida: 'Salida manual',
  ajuste: 'Ajuste de inventario',
};

// Inventario: la misma lista de productos del panel (con filtro de stock bajo).
export const listarInventario = (filtros) => listarProductos({ orden: 'stock_asc', ...filtros });

const toMovimientoDTO = (m) => ({
  id: m.id,
  tipo: m.tipo,
  cantidad: m.cantidad,
  stockResultante: m.stockResultante,
  motivo: m.motivo,
  creadoEn: m.creadoEn,
  usuario: m.usuario
    ? { id: m.usuario.id, nombre: `${m.usuario.nombre} ${m.usuario.apellido}` }
    : null,
  pedidoCodigo: m.pedido?.codigo ?? null,
});

export const listarMovimientos = async (productoId, { page, limit }) => {
  const producto = await productoRepository.findAdminById(productoId);
  if (!producto) throw new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'No encontramos ese producto');
  const { rows, count } = await inventarioRepository.findMovimientos(productoId, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    producto: {
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
    },
    items: rows.map(toMovimientoDTO),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

// Cambio de stock que produce cada tipo de movimiento. En un ajuste se indica el stock contado
// (edición en línea) y el movimiento guarda la diferencia con signo.
const calcularDelta = (tipo, stockActual, { cantidad, stockNuevo }) => {
  if (tipo === 'entrada') return cantidad;
  if (tipo === 'salida') return -cantidad;
  return stockNuevo - stockActual;
};

/**
 * Registra un movimiento de inventario en una transacción: bloquea el producto, valida que el
 * stock no quede negativo, actualiza el stock y guarda el movimiento en el kardex con el admin.
 */
export const registrarMovimiento = async (
  admin,
  { productoId, tipo, cantidad, stockNuevo, motivo },
) =>
  withTransaction(async (tx) => {
    const producto = await productoRepository.findParaMovimiento(productoId, tx);
    if (!producto) throw new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'No encontramos ese producto');

    const delta = calcularDelta(tipo, producto.stock, { cantidad, stockNuevo });
    if (delta === 0) {
      throw new AppError(422, 'SIN_CAMBIOS', 'El stock indicado es igual al actual');
    }
    const stockResultante = producto.stock + delta;
    if (stockResultante < 0) {
      throw new AppError(
        409,
        'STOCK_INSUFICIENTE',
        `Solo hay ${producto.stock} unidades de ${producto.nombre}`,
        {
          productoId,
          stock: producto.stock,
          solicitado: -delta,
        },
      );
    }

    await productoRepository.setStock(productoId, stockResultante, tx);
    const movimiento = await inventarioRepository.createMovimiento(
      {
        productoId,
        tipo,
        cantidad: delta,
        stockResultante,
        motivo: motivo || MOTIVOS[tipo],
        usuarioId: admin.id,
      },
      tx,
    );

    return {
      producto: {
        id: producto.id,
        stock: stockResultante,
        stockMinimo: producto.stockMinimo,
        stockBajo: stockResultante <= producto.stockMinimo,
      },
      movimiento: {
        id: movimiento.id,
        tipo,
        cantidad: delta,
        stockResultante,
        motivo: movimiento.motivo,
        creadoEn: movimiento.creadoEn,
      },
    };
  });
