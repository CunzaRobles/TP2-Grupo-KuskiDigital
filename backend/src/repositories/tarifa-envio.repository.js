import { TarifaEnvio } from '../models/index.js';

export const findByZona = async (zona) => {
  const filas = await TarifaEnvio.findAll({ where: { zona }, order: [['id', 'ASC']] });
  return filas.map((f) => f.get({ plain: true }));
};
