import { z } from 'zod';
import { MONEDAS } from '../models/enums.js';
import { paisCodigoSchema } from './comun.schema.js';

const correo = z.string().trim().toLowerCase().pipe(z.email('Correo inválido').max(150));

// bcrypt solo usa los primeros 72 bytes: se limita para que no haya contraseñas "truncadas".
const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña admite como máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/\d/, 'La contraseña debe incluir al menos un número');

export const registroBody = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo,
  password,
  telefono: z.string().trim().max(20).optional(),
  paisCodigo: paisCodigoSchema.default('PE'),
  idiomaPreferido: z.enum(['es', 'en', 'de']).default('es'),
  monedaPreferida: z.enum(MONEDAS).default('PEN'),
});

export const loginBody = z.object({
  correo,
  password: z.string().min(1, 'Ingresa tu contraseña').max(72),
});

// Reutilizados por el alta de usuarios del panel admin.
export { correo as correoSchema, password as passwordSchema };
