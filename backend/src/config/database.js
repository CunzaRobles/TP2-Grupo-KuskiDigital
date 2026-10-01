import { createRequire } from 'node:module';
import { Sequelize } from 'sequelize';
import { env } from './env.js';

const require = createRequire(import.meta.url);
const config = require('./database.cjs')[env.NODE_ENV] ?? require('./database.cjs').development;

if (!env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en backend/.env (ver backend/.env.example).');
}

// Producción (Vercel): pooler de Supabase en modo transacción (puerto 6543). Cada instancia
// de la función abre pocas conexiones y las suelta rápido. Sequelize no usa prepared
// statements con nombre (pg solo los crea si la consulta lleva `name`), así que es compatible.
const esProduccion = env.NODE_ENV === 'production';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: config.dialect,
  dialectOptions: config.dialectOptions,
  define: config.define,
  logging: config.logging,
  pool: esProduccion
    ? { max: 3, min: 0, acquire: 30000, idle: 5000, evict: 5000 }
    : { max: 5, min: 0, acquire: 30000, idle: 10000 },
});
