import { z } from 'zod';

// Mismas reglas que backend/src/schemas/admin.schema.js. Mensajes = claves de i18n.
const entero = (min, max) =>
  z.coerce
    .number({ message: 'admin.validacion.numero' })
    .int('admin.validacion.entero')
    .min(min, 'admin.validacion.minimo')
    .max(max, 'admin.validacion.maximo');

export const productoSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, 'admin.validacion.sku'),
  nombre: z.string().trim().min(3, 'admin.validacion.nombre').max(150, 'validacion.largo'),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9-]{1,170})?$/, 'admin.validacion.slug')
    .transform((s) => s || undefined),
  descripcion: z.string().trim().max(5000, 'validacion.largo'),
  precioBasePen: z.coerce
    .number({ message: 'admin.validacion.numero' })
    .positive('admin.validacion.precio')
    .refine((n) => Math.round(n * 100) === n * 100, 'admin.validacion.decimales'),
  pesoG: entero(1, 100_000),
  stockMinimo: entero(0, 100_000),
  stockInicial: entero(0, 100_000),
  categoriaId: z.coerce.number().int().positive('admin.validacion.categoria'),
  comunidadId: z.coerce.number().int().positive('admin.validacion.comunidad'),
  certificacionIds: z.array(z.number()),
  destacado: z.boolean(),
  activo: z.boolean(),
});
