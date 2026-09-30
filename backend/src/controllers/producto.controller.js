import * as productoService from '../services/producto.service.js';

export const listar = async (req, res) => {
  const data = await productoService.listarProductos(req.validated.query);
  res.json({ data });
};

export const destacados = async (req, res) => {
  const data = await productoService.listarDestacados(req.validated.query);
  res.json({ data });
};

export const relacionados = async (req, res) => {
  const data = await productoService.listarRelacionados(
    req.validated.params.slug,
    req.validated.query,
  );
  res.json({ data });
};

export const detalle = async (req, res) => {
  const data = await productoService.obtenerPorSlug(req.validated.params.slug, req.validated.query);
  res.json({ data });
};
