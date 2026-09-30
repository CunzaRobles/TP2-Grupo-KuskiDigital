import { sequelize } from '../models/index.js';

// Consulta mínima para comprobar que la base de datos responde.
export const ping = async () => {
  await sequelize.query('SELECT 1');
};
