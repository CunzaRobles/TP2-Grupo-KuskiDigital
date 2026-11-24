import { TarifaEnvio } from '../models/index.js';

export const findByZona = async (zona) => {
  const filas = await TarifaEnvio.findAll({ where: { zona }, order: [['id', 'ASC']] });
  return filas.map((f) => f.get({ plain: true }));
};

// Todas las tarifas (para el asistente virtual), por zona y método.
export const findAll = async () => {
  const filas = await TarifaEnvio.findAll({ order: [['id', 'ASC']] });
  return filas.map((f) => f.get({ plain: true }));
};
