import { AppError } from '../utils/app-error.js';

export const notFound = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};
