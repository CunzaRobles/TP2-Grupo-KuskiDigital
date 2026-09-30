import { COOKIE_SESION } from '../../src/config/env.js';
import { firmarToken } from '../../src/utils/jwt.js';

// Cabecera Cookie con una sesión válida, para llamar rutas protegidas con Supertest.
export const cookieDe = ({ id = 10, rol = 'cliente' } = {}) =>
  `${COOKIE_SESION}=${firmarToken({ id, rol })}`;

// Extrae el valor de la cookie de sesión de una respuesta (o undefined).
export const cookieSesion = (res) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${COOKIE_SESION}=`));
