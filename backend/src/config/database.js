import { createRequire } from 'node:module';
import { Sequelize } from 'sequelize';
import { env } from './env.js';

const require = createRequire(import.meta.url);
const config = require('./database.cjs')[env.NODE_ENV] ?? require('./database.cjs').development;

if (!env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en backend/.env (ver backend/.env.example).');
}

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: config.dialect,
  dialectOptions: config.dialectOptions,
  define: config.define,
  logging: config.logging,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});
