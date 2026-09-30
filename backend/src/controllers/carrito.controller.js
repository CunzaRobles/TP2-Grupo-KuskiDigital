import * as carritoService from '../services/carrito.service.js';

export const obtener = async (req, res) => {
  const data = await carritoService.obtenerCarrito(req.usuario.id, req.validated.query);
  res.json({ data });
};

export const agregarItem = async (req, res) => {
  const data = await carritoService.agregarItem(
    req.usuario.id,
    req.validated.body,
    req.validated.query,
  );
  res.status(201).json({ data });
};

export const actualizarItem = async (req, res) => {
  const data = await carritoService.actualizarItem(
    req.usuario.id,
    req.validated.params.id,
    req.validated.body,
    req.validated.query,
  );
  res.json({ data });
};

export const eliminarItem = async (req, res) => {
  const data = await carritoService.eliminarItem(
    req.usuario.id,
    req.validated.params.id,
    req.validated.query,
  );
  res.json({ data });
};

export const preciosInvitado = async (req, res) => {
  const data = await carritoService.preciosInvitado(req.validated.body, req.validated.query);
  res.json({ data });
};

export const fusionar = async (req, res) => {
  const data = await carritoService.fusionar(
    req.usuario.id,
    req.validated.body,
    req.validated.query,
  );
  res.json({ data });
};
