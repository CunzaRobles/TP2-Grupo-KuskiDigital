import * as healthRepository from '../repositories/health.repository.js';
import { AppError } from '../utils/app-error.js';

export const obtenerEstado = async () => {
  try {
    await healthRepository.ping();
  } catch (error) {
    console.error('Health check: la base de datos no responde:', error.message);
    throw new AppError(503, 'DB_UNAVAILABLE', 'La base de datos no está disponible');
  }
  return { status: 'ok', db: 'ok' };
};
