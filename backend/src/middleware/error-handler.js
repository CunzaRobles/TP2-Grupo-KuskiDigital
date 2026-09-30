import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

// Formato único de error de la API: { error: { code, message } }
// (los errores de validación añaden `details` con el campo que falló).
// Express reconoce el manejador de errores por sus 4 parámetros: _next debe quedarse.
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join('; '),
        details,
      },
    });
  }

  if (err instanceof AppError) {
    const error = { code: err.code, message: err.message };
    if (err.details !== undefined) error.details = err.details;
    return res.status(err.status).json({ error });
  }

  // Errores de express.json() (JSON mal formado, cuerpo demasiado grande, etc.)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es JSON válido' },
    });
  }
  if (err.status >= 400 && err.status < 500 && err.expose) {
    return res.status(err.status).json({ error: { code: 'BAD_REQUEST', message: err.message } });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
};
