import { sequelize } from '../models/index.js';

// Ejecuta fn(tx) dentro de una transacción de base de datos: commit si fn termina bien,
// rollback si lanza. Los servicios reciben `tx` como un valor opaco y solo lo reenvían
// a los repositorios, así que nunca importan Sequelize.
export const withTransaction = (fn) => sequelize.transaction((tx) => fn(tx));
