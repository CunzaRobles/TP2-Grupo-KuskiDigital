import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Se resuelve respecto a este archivo para que funcione con cualquier directorio de trabajo
// (npm -w backend, node backend/scripts/..., Vitest).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const esProduccion = NODE_ENV === 'production';

if (esProduccion && !process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en backend/.env: es obligatorio en producción.');
}

const entero = (valor, porDefecto) => {
  const n = Number(valor);
  return Number.isFinite(n) && valor !== undefined && valor !== '' ? n : porDefecto;
};

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  // En desarrollo y pruebas hay un secreto por defecto para no bloquear el arranque.
  JWT_SECRET: process.env.JWT_SECRET ?? 'kuski-dev-secret-no-usar-en-produccion',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  // Orígenes permitidos por CORS: FRONTEND_URL (puede llevar varios separados por comas)
  // y, fuera de producción, el servidor de Vite.
  CORS_ORIGINS: [
    ...(process.env.FRONTEND_URL ?? '').split(','),
    ...(esProduccion ? [] : ['http://localhost:5173']),
  ]
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  // Latencia simulada de la pasarela de pago (0 en pruebas para no ralentizarlas).
  PAGO_LATENCIA_MIN_MS: entero(process.env.PAGO_LATENCIA_MIN_MS, NODE_ENV === 'test' ? 0 : 1000),
  PAGO_LATENCIA_MAX_MS: entero(process.env.PAGO_LATENCIA_MAX_MS, NODE_ENV === 'test' ? 0 : 2000),
  // Supabase Storage (imágenes de productos). La service_role key solo vive en backend/.env.
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'productos',
};

export const COOKIE_SESION = 'kuski_token';
