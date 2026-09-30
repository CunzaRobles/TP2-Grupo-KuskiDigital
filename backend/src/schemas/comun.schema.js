import { z } from 'zod';
import { MONEDAS } from '../models/enums.js';

// Mensajes de validación en español para toda la API.
z.config(z.locales.es());

// ?moneda=usd → 'USD'. Por defecto, soles.
export const monedaSchema = z.string().trim().toUpperCase().pipe(z.enum(MONEDAS));
export const monedaQuery = z.object({ moneda: monedaSchema.default('PEN') });

// ISO 3166-1 alfa-2 en mayúsculas (pe → PE).
export const paisCodigoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Debe ser un código de país ISO de 2 letras');

export const idSchema = z.coerce.number().int().positive();
export const idParams = z.object({ id: idSchema });

export const paginacionQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

// Acepta ?x=a,b y ?x=a&x=b; devuelve un array sin vacíos.
export const listaQuery = (item) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      (Array.isArray(v) ? v : [v])
        .flatMap((s) => s.split(','))
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(item).max(20));

export const itemCarritoSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(99),
});
