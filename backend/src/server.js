import { env } from './config/env.js';
import app from './app.js';
import { sequelize } from './models/index.js';

try {
  await sequelize.authenticate();
  console.log('Conexión con PostgreSQL (Supabase) establecida');
} catch (error) {
  // La API arranca igual: /api/v1/health responderá 503 hasta que la base vuelva.
  console.error(`No se pudo conectar con la base de datos: ${error.message}`);
}

const server = app.listen(env.PORT, () =>
  console.log(`Servidor Kuski Digital activo en http://localhost:${env.PORT}`),
);

const cerrar = () => {
  server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
};
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
