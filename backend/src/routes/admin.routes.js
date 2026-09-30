import { Router } from 'express';
import { PERMISOS } from '../config/permisos.js';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth, requireRol, requireSesionVigente } from '../middleware/auth.js';
import { subirImagen } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { ROLES_ADMIN } from '../models/enums.js';
import {
  actualizarCategoriaBody,
  actualizarImagenBody,
  actualizarProductoBody,
  actualizarUsuarioBody,
  buscarQuery,
  cambiarEstadoBody,
  crearCategoriaBody,
  crearProductoBody,
  crearUsuarioBody,
  imagenParams,
  kardexQuery,
  movimientoBody,
  pedidosAdminQuery,
  productosAdminQuery,
  subirImagenBody,
  usuariosAdminQuery,
} from '../schemas/admin.schema.js';
import { codigoPedidoParams } from '../schemas/checkout.schema.js';
import { idParams } from '../schemas/comun.schema.js';

// Panel admin (/api/v1/admin). Toda ruta exige sesión, relee el rol en la base y comprueba
// el permiso de su sección (config/permisos.js) ANTES de validar los datos: un rol sin permiso
// recibe 403 sin revelar nada del formato esperado.
const router = Router();
const permiso = (seccion) => requireRol(...PERMISOS[seccion]);

router.use(requireAuth, requireSesionVigente, requireRol(...ROLES_ADMIN));

router.get('/buscar', validate({ query: buscarQuery }), admin.buscar);

// Dashboard, ventas y estadísticas
router.get('/dashboard', permiso('dashboard'), admin.dashboard);
router.get('/ventas', permiso('ventas'), validate({ query: pedidosAdminQuery }), admin.ventas);
router.get('/estadisticas', permiso('estadisticas'), admin.estadisticas);

// Pedidos
router.get('/pedidos', permiso('pedidos'), validate({ query: pedidosAdminQuery }), admin.pedidos);
router.get(
  '/pedidos/:codigo',
  permiso('pedidos'),
  validate({ params: codigoPedidoParams }),
  admin.pedido,
);
router.patch(
  '/pedidos/:codigo/estado',
  permiso('pedidosEstado'),
  validate({ params: codigoPedidoParams, body: cambiarEstadoBody }),
  admin.cambiarEstadoPedido,
);

// Productos e imágenes
router.get(
  '/productos',
  permiso('productos'),
  validate({ query: productosAdminQuery }),
  admin.productos,
);
router.post(
  '/productos',
  permiso('productos'),
  validate({ body: crearProductoBody }),
  admin.crearProducto,
);
router.get('/productos/:id', permiso('productos'), validate({ params: idParams }), admin.producto);
router.put(
  '/productos/:id',
  permiso('productos'),
  validate({ params: idParams, body: actualizarProductoBody }),
  admin.actualizarProducto,
);
router.delete(
  '/productos/:id',
  permiso('productos'),
  validate({ params: idParams }),
  admin.desactivarProducto,
);
router.post(
  '/productos/:id/imagenes',
  permiso('productos'),
  subirImagen('imagen'),
  validate({ params: idParams, body: subirImagenBody }),
  admin.subirImagen,
);
router.patch(
  '/productos/:id/imagenes/:imagenId',
  permiso('productos'),
  validate({ params: imagenParams, body: actualizarImagenBody }),
  admin.actualizarImagen,
);
router.delete(
  '/productos/:id/imagenes/:imagenId',
  permiso('productos'),
  validate({ params: imagenParams }),
  admin.eliminarImagen,
);

// Inventario (kardex)
router.get(
  '/inventario',
  permiso('inventario'),
  validate({ query: productosAdminQuery }),
  admin.inventario,
);
router.post(
  '/inventario/movimientos',
  permiso('inventario'),
  validate({ body: movimientoBody }),
  admin.registrarMovimiento,
);
router.get(
  '/inventario/:id/movimientos',
  permiso('inventario'),
  validate({ params: idParams, query: kardexQuery }),
  admin.movimientos,
);

// Categorías
router.get('/categorias', permiso('categorias'), admin.categorias);
router.post(
  '/categorias',
  permiso('categorias'),
  validate({ body: crearCategoriaBody }),
  admin.crearCategoria,
);
router.put(
  '/categorias/:id',
  permiso('categorias'),
  validate({ params: idParams, body: actualizarCategoriaBody }),
  admin.actualizarCategoria,
);
router.delete(
  '/categorias/:id',
  permiso('categorias'),
  validate({ params: idParams }),
  admin.eliminarCategoria,
);

// Usuarios y roles
router.get(
  '/usuarios',
  permiso('usuarios'),
  validate({ query: usuariosAdminQuery }),
  admin.usuarios,
);
router.post(
  '/usuarios',
  permiso('usuarios'),
  validate({ body: crearUsuarioBody }),
  admin.crearUsuario,
);
router.patch(
  '/usuarios/:id',
  permiso('usuarios'),
  validate({ params: idParams, body: actualizarUsuarioBody }),
  admin.actualizarUsuario,
);

export default router;
