import * as direccionService from '../services/direccion.service.js';

export const listar = async (req, res) => {
  res.json({ data: await direccionService.listar(req.usuario.id) });
};

export const crear = async (req, res) => {
  const data = await direccionService.crear(req.usuario.id, req.validated.body);
  res.status(201).json({ data });
};

export const actualizar = async (req, res) => {
  const data = await direccionService.actualizar(
    req.usuario.id,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data });
};

// Devuelve las direcciones restantes (la principal pudo cambiar).
export const eliminar = async (req, res) => {
  const data = await direccionService.eliminar(req.usuario.id, req.validated.params.id);
  res.json({ data });
};
