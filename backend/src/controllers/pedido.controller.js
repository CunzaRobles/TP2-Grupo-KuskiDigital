import * as pedidoService from '../services/pedido.service.js';

export const crear = async (req, res) => {
  const data = await pedidoService.crearPedido(req.usuario.id, req.validated.body);
  res.status(201).json({ data });
};

export const listar = async (req, res) => {
  const data = await pedidoService.listarMisPedidos(req.usuario.id, req.validated.query);
  res.json({ data });
};

export const detalle = async (req, res) => {
  const data = await pedidoService.obtenerPedido(req.usuario, req.validated.params.codigo);
  res.json({ data });
};
