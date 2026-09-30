import { Carrito, CarritoItem, Producto, ProductoImagen } from '../models/index.js';

// Devuelve el id del carrito del usuario, creándolo si aún no tiene (uno por usuario).
export const findOrCreateIdByUsuario = async (usuarioId, tx) => {
  const [carrito] = await Carrito.findOrCreate({
    where: { usuarioId },
    defaults: { usuarioId },
    transaction: tx,
  });
  return carrito.id;
};

// Ítems con los datos del producto necesarios para mostrar y cotizar el carrito.
export const findItems = async (carritoId, tx) => {
  const filas = await CarritoItem.findAll({
    where: { carritoId },
    attributes: ['id', 'productoId', 'cantidad'],
    include: [
      {
        model: Producto,
        as: 'producto',
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
      },
    ],
    order: [['id', 'ASC']],
    transaction: tx,
  });
  return filas.map((f) => f.get({ plain: true }));
};

export const findItemById = async (id, carritoId, tx) => {
  const fila = await CarritoItem.findOne({ where: { id, carritoId }, transaction: tx });
  return fila?.get({ plain: true }) ?? null;
};

export const findItemByProducto = async (carritoId, productoId, tx) => {
  const fila = await CarritoItem.findOne({ where: { carritoId, productoId }, transaction: tx });
  return fila?.get({ plain: true }) ?? null;
};

export const createItem = async ({ carritoId, productoId, cantidad }, tx) => {
  const fila = await CarritoItem.create({ carritoId, productoId, cantidad }, { transaction: tx });
  return fila.get({ plain: true });
};

export const updateCantidad = async (id, cantidad, tx) => {
  await CarritoItem.update({ cantidad }, { where: { id }, transaction: tx });
};

export const deleteItem = async (id, tx) => {
  await CarritoItem.destroy({ where: { id }, transaction: tx });
};

export const vaciar = async (carritoId, tx) => {
  await CarritoItem.destroy({ where: { carritoId }, transaction: tx });
};
