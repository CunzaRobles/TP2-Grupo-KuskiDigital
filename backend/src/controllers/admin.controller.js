import * as busquedaService from '../services/admin-busqueda.service.js';
import * as categoriaService from '../services/admin-categoria.service.js';
import * as inventarioService from '../services/admin-inventario.service.js';
import * as pedidoService from '../services/admin-pedido.service.js';
import * as productoService from '../services/admin-producto.service.js';
import * as reporteService from '../services/admin-reporte.service.js';
import * as usuarioService from '../services/admin-usuario.service.js';

// Capa HTTP del panel admin: toma los datos validados (req.validated) y responde { data }.

// --- Dashboard y estadísticas ---
export const dashboard = async (_req, res) => {
  res.json({ data: await reporteService.obtenerDashboard() });
};

export const estadisticas = async (_req, res) => {
  res.json({ data: await reporteService.obtenerEstadisticas() });
};

// --- Ventas y pedidos ---
export const ventas = async (req, res) => {
  res.json({ data: await pedidoService.listarVentas(req.validated.query) });
};

export const pedidos = async (req, res) => {
  res.json({ data: await pedidoService.listarPedidos(req.validated.query) });
};

export const pedido = async (req, res) => {
  res.json({ data: await pedidoService.obtenerPedido(req.validated.params.codigo) });
};

export const cambiarEstadoPedido = async (req, res) => {
  const { params, body } = req.validated;
  res.json({ data: await pedidoService.cambiarEstado(req.usuario, params.codigo, body) });
};

// --- Productos ---
export const productos = async (req, res) => {
  res.json({ data: await productoService.listarProductos(req.validated.query) });
};

export const producto = async (req, res) => {
  res.json({ data: await productoService.obtenerProducto(req.validated.params.id) });
};

export const crearProducto = async (req, res) => {
  res
    .status(201)
    .json({ data: await productoService.crearProducto(req.usuario, req.validated.body) });
};

export const actualizarProducto = async (req, res) => {
  const { params, body } = req.validated;
  res.json({ data: await productoService.actualizarProducto(params.id, body) });
};

export const desactivarProducto = async (req, res) => {
  res.json({ data: await productoService.desactivarProducto(req.validated.params.id) });
};

export const subirImagen = async (req, res) => {
  const { params, body } = req.validated;
  res.status(201).json({ data: await productoService.subirImagen(params.id, req.file, body) });
};

export const actualizarImagen = async (req, res) => {
  const { params, body } = req.validated;
  res.json({ data: await productoService.actualizarImagen(params.id, params.imagenId, body) });
};

export const eliminarImagen = async (req, res) => {
  const { id, imagenId } = req.validated.params;
  res.json({ data: await productoService.eliminarImagen(id, imagenId) });
};

// --- Inventario ---
export const inventario = async (req, res) => {
  res.json({ data: await inventarioService.listarInventario(req.validated.query) });
};

export const movimientos = async (req, res) => {
  const { params, query } = req.validated;
  res.json({ data: await inventarioService.listarMovimientos(params.id, query) });
};

export const registrarMovimiento = async (req, res) => {
  res
    .status(201)
    .json({ data: await inventarioService.registrarMovimiento(req.usuario, req.validated.body) });
};

// --- Categorías ---
export const categorias = async (_req, res) => {
  res.json({ data: await categoriaService.listarCategorias() });
};

export const crearCategoria = async (req, res) => {
  res.status(201).json({ data: await categoriaService.crearCategoria(req.validated.body) });
};

export const actualizarCategoria = async (req, res) => {
  const { params, body } = req.validated;
  res.json({ data: await categoriaService.actualizarCategoria(params.id, body) });
};

export const eliminarCategoria = async (req, res) => {
  await categoriaService.eliminarCategoria(req.validated.params.id);
  res.status(204).end();
};

// --- Usuarios ---
export const usuarios = async (req, res) => {
  res.json({ data: await usuarioService.listarUsuarios(req.validated.query) });
};

export const crearUsuario = async (req, res) => {
  res.status(201).json({ data: await usuarioService.crearUsuario(req.validated.body) });
};

export const actualizarUsuario = async (req, res) => {
  const { params, body } = req.validated;
  res.json({ data: await usuarioService.actualizarUsuario(req.usuario, params.id, body) });
};

// --- Búsqueda rápida ---
export const buscar = async (req, res) => {
  res.json({ data: await busquedaService.buscar(req.usuario, req.validated.query.q) });
};
