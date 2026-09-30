import * as healthService from '../services/health.service.js';

export const estado = async (_req, res) => {
  const data = await healthService.obtenerEstado();
  res.json({ data });
};
