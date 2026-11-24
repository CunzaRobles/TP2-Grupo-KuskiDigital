import * as reclamacionService from '../services/reclamacion.service.js';

// Libro de Reclamaciones: registro público y gestión desde el panel.

export const registrar = async (req, res) => {
  const reclamacion = await reclamacionService.registrar(req.validated.body);
  res.status(201).json({ data: reclamacion });
};

export const listarAdmin = async (req, res) => {
  res.json({ data: await reclamacionService.listarAdmin(req.validated.query) });
};

export const responder = async (req, res) => {
  const reclamacion = await reclamacionService.responder(
    req.validated.params.id,
    req.validated.body,
    req.usuario.id,
  );
  res.json({ data: reclamacion });
};
