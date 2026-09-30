import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Token de sesión: { sub: id del usuario, rol }. Viaja en una cookie httpOnly.
export const firmarToken = ({ id, rol }) =>
  jwt.sign({ rol }, env.JWT_SECRET, { subject: String(id), expiresIn: env.JWT_EXPIRES_IN });

// Devuelve { id, rol } o null si el token no es válido o expiró.
export const verificarToken = (token) => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const id = Number(payload.sub);
    return Number.isInteger(id) ? { id, rol: payload.rol } : null;
  } catch {
    return null;
  }
};
