import * as carritoRepository from '../repositories/carrito.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import { AppError } from '../utils/app-error.js';
import { redondear } from '../utils/money.js';
import { obtenerTasa, precioEn } from './precio.service.js';

export const MAX_CANTIDAD_POR_ITEM = 99;

const itemNoEncontrado = () =>
  new AppError(404, 'ITEM_NO_ENCONTRADO', 'El ítem no está en tu carrito');

const productoNoDisponible = () =>
  new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe o no está disponible');

const stockInsuficiente = (producto, solicitado) =>
  new AppError(
    409,
    'STOCK_INSUFICIENTE',
    `Solo quedan ${producto.stock} unidades de ${producto.nombre}`,
    [{ productoId: producto.id, disponible: producto.stock, solicitado }],
  );

const toCarritoDTO = (carritoId, items, tasa) => {
  let subtotalPen = 0;
  let subtotal = 0;

  const lineas = items.map(({ id, productoId, cantidad, producto }) => {
    const precioUnitarioPen = Number(producto.precioBasePen);
    const lineaPen = redondear(precioUnitarioPen * cantidad);
    const precioUnitario = precioEn(precioUnitarioPen, tasa).monto;
    const linea = precioEn(lineaPen, tasa).monto;
    subtotalPen += lineaPen;
    subtotal += linea;

    // Avisos para que el frontend pida ajustar el carrito antes del checkout.
    let aviso = null;
    if (!producto.activo) aviso = 'NO_DISPONIBLE';
    else if (producto.stock < cantidad) aviso = 'STOCK_INSUFICIENTE';

    return {
      id,
      productoId,
      cantidad,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        slug: producto.slug,
        stock: producto.stock,
        pesoG: producto.pesoG,
        imagen: producto.imagenes?.[0] ?? null,
      },
      precioUnitarioPen,
      precioUnitario,
      subtotalPen: lineaPen,
      subtotal: linea,
      aviso,
    };
  });

  return {
    id: carritoId,
    moneda: tasa.moneda,
    simbolo: tasa.simbolo,
    items: lineas,
    totalUnidades: lineas.reduce((n, l) => n + l.cantidad, 0),
    subtotalPen: redondear(subtotalPen),
    subtotal: redondear(subtotal),
  };
};

const cargarCarrito = async (carritoId, moneda) => {
  const [items, tasa] = await Promise.all([
    carritoRepository.findItems(carritoId),
    obtenerTasa(moneda),
  ]);
  return toCarritoDTO(carritoId, items, tasa);
};

const productoVendible = async (productoId) => {
  const [producto] = await productoRepository.findByIds([productoId]);
  if (!producto || !producto.activo) throw productoNoDisponible();
  return producto;
};

export const obtenerCarrito = async (usuarioId, { moneda }) => {
  const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId);
  return cargarCarrito(carritoId, moneda);
};

// Si el producto ya está en el carrito, suma las cantidades.
export const agregarItem = async (usuarioId, { productoId, cantidad }, { moneda }) => {
  const producto = await productoVendible(productoId);
  const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId);
  const existente = await carritoRepository.findItemByProducto(carritoId, productoId);
  const nuevaCantidad = (existente?.cantidad ?? 0) + cantidad;

  if (nuevaCantidad > MAX_CANTIDAD_POR_ITEM) {
    throw new AppError(
      422,
      'CANTIDAD_MAXIMA',
      `Máximo ${MAX_CANTIDAD_POR_ITEM} unidades por producto`,
    );
  }
  if (nuevaCantidad > producto.stock) throw stockInsuficiente(producto, nuevaCantidad);

  if (existente) await carritoRepository.updateCantidad(existente.id, nuevaCantidad);
  else await carritoRepository.createItem({ carritoId, productoId, cantidad });

  return cargarCarrito(carritoId, moneda);
};

export const actualizarItem = async (usuarioId, itemId, { cantidad }, { moneda }) => {
  const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId);
  const item = await carritoRepository.findItemById(itemId, carritoId);
  if (!item) throw itemNoEncontrado();

  const producto = await productoVendible(item.productoId);
  if (cantidad > producto.stock) throw stockInsuficiente(producto, cantidad);

  await carritoRepository.updateCantidad(item.id, cantidad);
  return cargarCarrito(carritoId, moneda);
};

export const eliminarItem = async (usuarioId, itemId, { moneda }) => {
  const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId);
  const item = await carritoRepository.findItemById(itemId, carritoId);
  if (!item) throw itemNoEncontrado();

  await carritoRepository.deleteItem(item.id);
  return cargarCarrito(carritoId, moneda);
};

/**
 * Precios del carrito de invitado (localStorage) en la moneda elegida, sin guardarlo.
 * Mismo formato que el carrito con sesión, con id null: el frontend identifica cada línea
 * por productoId. Los productos que ya no existen se omiten; los inactivos o sin stock
 * suficiente llegan con su `aviso`.
 */
export const preciosInvitado = async ({ items }, { moneda }) => {
  const agrupados = new Map();
  for (const { productoId, cantidad } of items) {
    agrupados.set(
      productoId,
      Math.min((agrupados.get(productoId) ?? 0) + cantidad, MAX_CANTIDAD_POR_ITEM),
    );
  }

  const [productos, tasa] = await Promise.all([
    agrupados.size ? productoRepository.findParaCarrito([...agrupados.keys()]) : [],
    obtenerTasa(moneda),
  ]);
  const lineas = productos.map((producto) => ({
    id: null,
    productoId: producto.id,
    cantidad: agrupados.get(producto.id),
    producto,
  }));
  return toCarritoDTO(null, lineas, tasa);
};

/**
 * Une el carrito de invitado (localStorage) con el del usuario al iniciar sesión.
 * Suma cantidades y, en lugar de fallar, ajusta al stock disponible y omite los productos
 * que ya no existen. Devuelve el carrito resultante y la lista de ajustes realizados.
 */
export const fusionar = async (usuarioId, { items }, { moneda }) => {
  // Agrupa duplicados del carrito de invitado.
  const solicitados = new Map();
  for (const { productoId, cantidad } of items) {
    solicitados.set(productoId, (solicitados.get(productoId) ?? 0) + cantidad);
  }

  const ajustes = [];
  const carritoId = await withTransaction(async (tx) => {
    const id = await carritoRepository.findOrCreateIdByUsuario(usuarioId, tx);
    const productos = await productoRepository.findParaVenta([...solicitados.keys()], tx);
    const porId = new Map(productos.map((p) => [p.id, p]));

    for (const [productoId, cantidad] of solicitados) {
      const producto = porId.get(productoId);
      if (!producto || !producto.activo) {
        ajustes.push({ productoId, motivo: 'NO_DISPONIBLE', cantidadFinal: 0 });
        continue;
      }

      const existente = await carritoRepository.findItemByProducto(id, productoId, tx);
      const deseada = (existente?.cantidad ?? 0) + cantidad;
      const final = Math.min(deseada, producto.stock, MAX_CANTIDAD_POR_ITEM);

      if (final < deseada) {
        ajustes.push({
          productoId,
          motivo: producto.stock < deseada ? 'STOCK_INSUFICIENTE' : 'CANTIDAD_MAXIMA',
          cantidadFinal: final,
        });
      }

      if (final <= 0) {
        if (existente) await carritoRepository.deleteItem(existente.id, tx);
      } else if (existente) {
        await carritoRepository.updateCantidad(existente.id, final, tx);
      } else {
        await carritoRepository.createItem({ carritoId: id, productoId, cantidad: final }, tx);
      }
    }
    return id;
  });

  return { carrito: await cargarCarrito(carritoId, moneda), ajustes };
};
