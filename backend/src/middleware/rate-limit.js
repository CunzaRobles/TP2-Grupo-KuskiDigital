import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const limitador = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message } }),
  });

// Límite general de la API: 300 peticiones cada 15 minutos por IP.
export const apiLimiter = limitador({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Demasiadas peticiones, inténtalo más tarde',
});

// Login y registro: más estricto para frenar ataques de fuerza bruta (desactivado en pruebas).
const authLimiterBase = limitador({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Demasiados intentos de acceso, espera unos minutos',
});
export const authLimiter = (req, res, next) =>
  env.NODE_ENV === 'test' ? next() : authLimiterBase(req, res, next);
