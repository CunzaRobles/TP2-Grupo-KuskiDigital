import * as cotizacionService from '../services/cotizacion.service.js';

export const cotizar = async (req, res) => {
  const data = await cotizacionService.cotizar({
    ...req.validated.body,
    usuarioId: req.usuario?.id,
  });
  res.json({ data });
};
