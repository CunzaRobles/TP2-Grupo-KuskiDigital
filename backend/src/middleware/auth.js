import { COOKIE_SESION } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';
import { verificarToken } from '../utils/jwt.js';

const leerSesion = (req) => {
  const token = req.cookies?.[COOKIE_SESION];
  return token ? verificarToken(token) : null;
};

// Exige una sesión válida (cookie httpOnly con JWT). Deja { id, rol } en req.usuario.
export const requireAuth = (req, _res, next) => {
  const usuario = leerSesion(req);
  if (!usuario) {
    return next(new AppError(401, 'NO_AUTENTICADO', 'Inicia sesión para continuar'));
  }
  req.usuario = usuario;
  next();
};

// Si hay sesión válida la deja en req.usuario; si no, sigue como invitado.
export const optionalAuth = (req, _res, next) => {
  req.usuario = leerSesion(req);
  next();
};

// Uso: router.get('/admin/...', requireAuth, requireRol('admin_gerente', 'admin_ventas'), ...)
export const requireRol =
  (...roles) =>
  (req, _res, next) => {
    if (!req.usuario) {
      return next(new AppError(401, 'NO_AUTENTICADO', 'Inicia sesión para continuar'));
    }
    if (!roles.includes(req.usuario.rol)) {
      return next(new AppError(403, 'SIN_PERMISO', 'No tienes permiso para esta acción'));
    }
    next();
  };

// Panel admin: vuelve a leer el rol y el estado de la cuenta en la base en cada petición.
// Así un cambio de rol o una cuenta desactivada surten efecto al instante, sin esperar a que
// caduque el JWT. Va después de requireAuth.
export const requireSesionVigente = async (req, _res, next) => {
  const { id, rol } = await authService.perfil(req.usuario.id);
  req.usuario = { id, rol };
  next();
};
