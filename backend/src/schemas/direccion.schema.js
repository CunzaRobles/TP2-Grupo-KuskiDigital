import { z } from 'zod';
import { paisCodigoSchema } from './comun.schema.js';

// Dirección de envío (checkout y "Mi cuenta").
export const direccionSchema = z.object({
  nombreDestinatario: z.string().trim().min(2).max(150),
  paisCodigo: paisCodigoSchema,
  ciudad: z.string().trim().min(2).max(100),
  direccion: z.string().trim().min(5).max(255),
  codigoPostal: z.string().trim().max(20).optional(),
  telefono: z.string().trim().max(20).optional(),
});

export const crearDireccionBody = direccionSchema.extend({
  esPrincipal: z.boolean().optional(),
});

// Siempre queda una principal: solo se admite marcar (true), no desmarcar.
export const actualizarDireccionBody = direccionSchema
  .partial()
  .extend({ esPrincipal: z.literal(true).optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Envía al menos un campo' });
