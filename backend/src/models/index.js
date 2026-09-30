// Registro de los 19 modelos y sus asociaciones (espejo de database/01_esquema_kuski_db.sql).
// El esquema lo gestionan las migraciones: aquí nunca se llama a sequelize.sync().
import { sequelize } from '../config/database.js';
import defineCarrito from './carrito.model.js';
import defineCarritoItem from './carrito-item.model.js';
import defineCategoria from './categoria.model.js';
import defineCertificacion from './certificacion.model.js';
import defineComunidad from './comunidad.model.js';
import defineDireccion from './direccion.model.js';
import defineEnvio from './envio.model.js';
import defineMovimientoInventario from './movimiento-inventario.model.js';
import definePago from './pago.model.js';
import definePedido from './pedido.model.js';
import definePedidoEstado from './pedido-estado.model.js';
import definePedidoItem from './pedido-item.model.js';
import defineProducto from './producto.model.js';
import defineProductoCertificacion from './producto-certificacion.model.js';
import defineProductoImagen from './producto-imagen.model.js';
import defineResena from './resena.model.js';
import defineTarifaEnvio from './tarifa-envio.model.js';
import defineTipoCambio from './tipo-cambio.model.js';
import defineUsuario from './usuario.model.js';

const Usuario = defineUsuario(sequelize);
const Direccion = defineDireccion(sequelize);
const Categoria = defineCategoria(sequelize);
const Comunidad = defineComunidad(sequelize);
const Producto = defineProducto(sequelize);
const ProductoImagen = defineProductoImagen(sequelize);
const Certificacion = defineCertificacion(sequelize);
const ProductoCertificacion = defineProductoCertificacion(sequelize);
const Resena = defineResena(sequelize);
const Carrito = defineCarrito(sequelize);
const CarritoItem = defineCarritoItem(sequelize);
const TipoCambio = defineTipoCambio(sequelize);
const TarifaEnvio = defineTarifaEnvio(sequelize);
const Pedido = definePedido(sequelize);
const PedidoItem = definePedidoItem(sequelize);
const PedidoEstado = definePedidoEstado(sequelize);
const Pago = definePago(sequelize);
const Envio = defineEnvio(sequelize);
const MovimientoInventario = defineMovimientoInventario(sequelize);

// --- Usuarios ---------------------------------------------------------
Usuario.hasMany(Direccion, { as: 'direcciones', foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Direccion.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

// --- Catálogo y trazabilidad -----------------------------------------
Categoria.hasMany(Producto, { as: 'productos', foreignKey: 'categoriaId', onDelete: 'RESTRICT' });
Producto.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoriaId' });

Comunidad.hasMany(Producto, { as: 'productos', foreignKey: 'comunidadId', onDelete: 'RESTRICT' });
Producto.belongsTo(Comunidad, { as: 'comunidad', foreignKey: 'comunidadId' });

Producto.hasMany(ProductoImagen, { as: 'imagenes', foreignKey: 'productoId', onDelete: 'CASCADE' });
ProductoImagen.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });

Producto.belongsToMany(Certificacion, {
  as: 'certificaciones',
  through: ProductoCertificacion,
  foreignKey: 'productoId',
  otherKey: 'certificacionId',
});
Certificacion.belongsToMany(Producto, {
  as: 'productos',
  through: ProductoCertificacion,
  foreignKey: 'certificacionId',
  otherKey: 'productoId',
});
ProductoCertificacion.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });
ProductoCertificacion.belongsTo(Certificacion, {
  as: 'certificacion',
  foreignKey: 'certificacionId',
});

Usuario.hasMany(Resena, { as: 'resenas', foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Resena.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
Producto.hasMany(Resena, { as: 'resenas', foreignKey: 'productoId', onDelete: 'CASCADE' });
Resena.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });

// --- Carrito ----------------------------------------------------------
Usuario.hasOne(Carrito, { as: 'carrito', foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Carrito.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

Carrito.hasMany(CarritoItem, { as: 'items', foreignKey: 'carritoId', onDelete: 'CASCADE' });
CarritoItem.belongsTo(Carrito, { as: 'carrito', foreignKey: 'carritoId' });
Producto.hasMany(CarritoItem, {
  as: 'carritoItems',
  foreignKey: 'productoId',
  onDelete: 'CASCADE',
});
CarritoItem.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });

// --- Pedidos, pagos y envíos ------------------------------------------
Usuario.hasMany(Pedido, { as: 'pedidos', foreignKey: 'usuarioId', onDelete: 'RESTRICT' });
Pedido.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

TipoCambio.hasMany(Pedido, { as: 'pedidos', foreignKey: 'moneda', sourceKey: 'monedaCodigo' });
Pedido.belongsTo(TipoCambio, { as: 'divisa', foreignKey: 'moneda', targetKey: 'monedaCodigo' });

Pedido.hasMany(PedidoItem, { as: 'items', foreignKey: 'pedidoId', onDelete: 'CASCADE' });
PedidoItem.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });
Producto.hasMany(PedidoItem, { as: 'pedidoItems', foreignKey: 'productoId', onDelete: 'RESTRICT' });
PedidoItem.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });

Pedido.hasMany(PedidoEstado, {
  as: 'historialEstados',
  foreignKey: 'pedidoId',
  onDelete: 'CASCADE',
});
PedidoEstado.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });
Usuario.hasMany(PedidoEstado, {
  as: 'cambiosEstado',
  foreignKey: 'usuarioId',
  onDelete: 'SET NULL',
});
PedidoEstado.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });

Pedido.hasOne(Pago, { as: 'pago', foreignKey: 'pedidoId', onDelete: 'CASCADE' });
Pago.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });
TipoCambio.hasMany(Pago, { as: 'pagos', foreignKey: 'moneda', sourceKey: 'monedaCodigo' });
Pago.belongsTo(TipoCambio, { as: 'divisa', foreignKey: 'moneda', targetKey: 'monedaCodigo' });

Pedido.hasOne(Envio, { as: 'envio', foreignKey: 'pedidoId', onDelete: 'CASCADE' });
Envio.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });
TarifaEnvio.hasMany(Envio, { as: 'envios', foreignKey: 'tarifaEnvioId', onDelete: 'RESTRICT' });
Envio.belongsTo(TarifaEnvio, { as: 'tarifa', foreignKey: 'tarifaEnvioId' });

// --- Inventario (kardex) ----------------------------------------------
Producto.hasMany(MovimientoInventario, {
  as: 'movimientos',
  foreignKey: 'productoId',
  onDelete: 'CASCADE',
});
MovimientoInventario.belongsTo(Producto, { as: 'producto', foreignKey: 'productoId' });
Usuario.hasMany(MovimientoInventario, {
  as: 'movimientosInventario',
  foreignKey: 'usuarioId',
  onDelete: 'SET NULL',
});
MovimientoInventario.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
Pedido.hasMany(MovimientoInventario, {
  as: 'movimientos',
  foreignKey: 'pedidoId',
  onDelete: 'SET NULL',
});
MovimientoInventario.belongsTo(Pedido, { as: 'pedido', foreignKey: 'pedidoId' });

export {
  sequelize,
  Usuario,
  Direccion,
  Categoria,
  Comunidad,
  Producto,
  ProductoImagen,
  Certificacion,
  ProductoCertificacion,
  Resena,
  Carrito,
  CarritoItem,
  TipoCambio,
  TarifaEnvio,
  Pedido,
  PedidoItem,
  PedidoEstado,
  Pago,
  Envio,
  MovimientoInventario,
};
