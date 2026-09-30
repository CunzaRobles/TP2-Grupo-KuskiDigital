import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

// Especificación OpenAPI en docs/openapi.yaml (raíz del monorepo), servida con Swagger UI.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RUTA_OPENAPI = path.resolve(__dirname, '../../../docs/openapi.yaml');

const router = Router();

let especificacion = null;
try {
  especificacion = YAML.parse(fs.readFileSync(RUTA_OPENAPI, 'utf8'));
} catch (error) {
  console.warn(`Swagger UI desactivado: no se pudo leer ${RUTA_OPENAPI} (${error.message})`);
}

if (especificacion) {
  // Swagger UI no usa scripts inline, así que la CSP de helmet le sirve; solo se quita
  // upgrade-insecure-requests para que funcione por HTTP en desarrollo (localhost o IP de red).
  router.use(helmet.contentSecurityPolicy({ directives: { upgradeInsecureRequests: null } }));
  router.get('/openapi.json', (_req, res) => res.json(especificacion));
  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(especificacion, {
      customSiteTitle: 'Kuski Digital · API v1',
      swaggerOptions: { withCredentials: true, persistAuthorization: true },
    }),
  );
}

export default router;
