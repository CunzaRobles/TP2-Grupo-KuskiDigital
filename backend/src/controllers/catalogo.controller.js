import * as catalogoService from '../services/catalogo.service.js';

export const categorias = async (_req, res) => {
  res.json({ data: await catalogoService.listarCategorias() });
};

export const comunidades = async (_req, res) => {
  res.json({ data: await catalogoService.listarComunidades() });
};

export const certificaciones = async (_req, res) => {
  res.json({ data: await catalogoService.listarCertificaciones() });
};

export const trazabilidad = async (_req, res) => {
  res.json({ data: await catalogoService.obtenerTrazabilidad() });
};
