import { z } from 'zod';
import { listaQuery, monedaSchema, paginacionQuery } from './comun.schema.js';

export const ORDENES_CATALOGO = [
  'destacados',
  'precio_asc',
  'precio_desc',
  'nombre',
  'recientes',
  'valoracion',
];

const precio = z.coerce.number().min(0);

// Query del catálogo (snake_case en la URL, camelCase hacia el servicio).
export const listarProductosQuery = paginacionQuery
  .extend({
    categoria: listaQuery(
      z.string().regex(/^[a-z0-9-]+$/, 'Slug de categoría inválido'),
    ).optional(),
    comunidad: listaQuery(z.coerce.number().int().positive()).optional(),
    certificacion: listaQuery(z.coerce.number().int().positive()).optional(),
    precio_min: precio.optional(),
    precio_max: precio.optional(),
    q: z.string().trim().min(1).max(100).optional(),
    orden: z.enum(ORDENES_CATALOGO).default('destacados'),
    moneda: monedaSchema.default('PEN'),
  })
  .refine(
    (v) => v.precio_min === undefined || v.precio_max === undefined || v.precio_min <= v.precio_max,
    {
      message: 'precio_min no puede ser mayor que precio_max',
      path: ['precio_min'],
    },
  )
  .transform(({ categoria, comunidad, certificacion, precio_min, precio_max, ...resto }) => ({
    ...resto,
    categorias: categoria,
    comunidades: comunidad,
    certificaciones: certificacion,
    precioMin: precio_min,
    precioMax: precio_max,
  }));

export const destacadosQuery = z.object({
  moneda: monedaSchema.default('PEN'),
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

export const relacionadosQuery = z.object({
  moneda: monedaSchema.default('PEN'),
  limit: z.coerce.number().int().min(1).max(12).default(4),
});

export const slugParams = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,170}$/, 'Slug inválido'),
});
