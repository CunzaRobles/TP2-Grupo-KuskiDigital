// Configuración de conexión compartida por sequelize-cli (migraciones y seeders)
// y por la instancia de Sequelize de la API (src/config/database.js).
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    // Supabase exige SSL; su certificado no está en la cadena de confianza de Node.
    ssl: { require: true, rejectUnauthorized: false },
  },
  define: {
    underscored: true,
    freezeTableName: true,
  },
  migrationStorageTableName: 'sequelize_meta',
  logging: false,
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
