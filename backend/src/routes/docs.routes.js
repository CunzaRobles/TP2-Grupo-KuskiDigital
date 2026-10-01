import fs from 'node:fs';
import { Router } from 'express';
import helmet from 'helmet';
import YAML from 'yaml';

// Especificación OpenAPI en docs/openapi.yaml (raíz del monorepo). Se lee con
// `new URL(..., import.meta.url)` para que el empaquetador de Vercel incluya el archivo.
const RUTA_OPENAPI = new URL('../../../docs/openapi.yaml', import.meta.url);

// Swagger UI se carga desde el paquete npm `swagger-ui-dist` vía jsDelivr: en Vercel,
// express.static no sirve archivos de node_modules. Versión fijada para que no cambie sola.
const SWAGGER_UI_VERSION = '5.33.0';
const CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;
const BASE = '/api/v1/docs';

const router = Router();

let especificacion = null;
try {
  especificacion = YAML.parse(fs.readFileSync(RUTA_OPENAPI, 'utf8'));
} catch (error) {
  console.warn(`Swagger UI desactivado: no se pudo leer docs/openapi.yaml (${error.message})`);
}

const pagina = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kuski Digital · API v1</title>
    <link rel="stylesheet" href="${CDN}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${CDN}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
    <script src="${BASE}/swagger-init.js"></script>
  </body>
</html>`;

const init = `window.ui = SwaggerUIBundle({
  url: '${BASE}/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  withCredentials: true,
  persistAuthorization: true,
});`;

if (especificacion) {
  // CSP de helmet + el CDN de Swagger UI (sin scripts inline). Sin upgrade-insecure-requests
  // para que funcione por HTTP en desarrollo (localhost o IP de red).
  router.use(
    helmet.contentSecurityPolicy({
      directives: {
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        upgradeInsecureRequests: null,
      },
    }),
  );
  router.get('/openapi.json', (_req, res) => res.json(especificacion));
  router.get('/swagger-init.js', (_req, res) => res.type('application/javascript').send(init));
  router.get('/', (_req, res) => res.type('html').send(pagina));
}

export default router;
