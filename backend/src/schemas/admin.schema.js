import { z } from 'zod';
import { ESTADOS_PEDIDO, METODOS_PAGO, ROLES_USUARIO } from '../models/enums.js';
import { correoSchema, passwordSchema } from './auth.schema.js';
import { idSchema, listaQuery, paginacionQuery, paisCodigoSchema } from './comun.schema.js';

// ?activo=true|false → boolean
const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');
const fecha = z.iso.date('Usa el formato AAAA-MM-DD');
const busqueda = z.string().trim().min(1).max(100);
const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{1,170}$/, 'Solo minúsculas, números y guiones');
const textoOpcional = (max) => z.string().trim().max(max).nullish();

const paginacionAdmin = paginacionQuery.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────── Ventas y pedidos ───────────────────────────

export const pedidosAdminQuery = paginacionAdmin
  .extend({
    desde: fecha.optional(),
    hasta: fecha.optional(),
    pais: listaQuery(paisCodigoSchema).optional(),
    estado: listaQuery(z.enum(ESTADOS_PEDIDO)).optional(),
    metodo_pago: listaQuery(z.enum(METODOS_PAGO)).optional(),
    q: busqueda.optional(),
  })
  .refine((v) => !v.desde || !v.hasta || v.desde <= v.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta"',
    path: ['desde'],
  })
  .transform(({ pais, estado, metodo_pago, ...resto }) => ({
    ...resto,
    paises: pais,
    estados: estado,
    metodosPago: metodo_pago,
  }));

export const cambiarEstadoBody = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
  comentario: z.string().trim().max(255).optional(),
});

// ─────────────────────────── Productos ───────────────────────────

export const ORDENES_ADMIN = ['recientes', 'nombre', 'stock_asc', 'precio_desc'];

export const productosAdminQuery = paginacionAdmin
  .extend({
    q: busqueda.optional(),
    categoria: idSchema.optional(),
    comunidad: idSchema.optional(),
    activo: booleanQuery.optional(),
    stock_bajo: booleanQuery.optional(),
    orden: z.enum(ORDENES_ADMIN).optional(),
  })
  .transform(({ categoria, comunidad, stock_bajo, ...resto }) => ({
    ...resto,
    categoriaId: categoria,
    comunidadId: comunidad,
    stockBajo: stock_bajo,
  }));

const precio = z
  .number()
  .positive('El precio debe ser mayor que 0')
  .max(99_999_999)
  .refine((n) => Math.round(n * 100) === n * 100, 'Usa como máximo 2 decimales');

// Campos editables del producto (sin valores por defecto: sirve para crear y para editar).
const productoCampos = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, 'El SKU admite de 3 a 30 letras, números o guiones'),
  nombre: z.string().trim().min(3).max(150),
  slug: slug.optional(),
  descripcion: textoOpcional(5000),
  precioBasePen: precio,
  stockMinimo: z.number().int().min(0).max(100_000),
  pesoG: z.number().int().positive().max(100_000),
  destacado: z.boolean(),
  activo: z.boolean(),
  categoriaId: z.number().int().positive(),
  comunidadId: z.number().int().positive(),
  certificacionIds: z
    .array(z.number().int().positive())
    .max(10)
    .transform((ids) => [...new Set(ids)]),
});

export const crearProductoBody = productoCampos.extend({
  stockMinimo: productoCampos.shape.stockMinimo.default(5),
  destacado: productoCampos.shape.destacado.default(false),
  activo: productoCampos.shape.activo.default(true),
  certificacionIds: productoCampos.shape.certificacionIds.default([]),
  stockInicial: z.number().int().min(0).max(100_000).default(0),
});

export const actualizarProductoBody = productoCampos
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Indica al menos un campo');

// Campos de texto del multipart de la imagen.
export const subirImagenBody = z.object({ textoAlt: z.string().trim().max(200).optional() });

export const imagenParams = z.object({ id: idSchema, imagenId: idSchema });

export const actualizarImagenBody = z
  .object({
    esPrincipal: z.literal(true).optional(),
    orden: z.number().int().min(0).max(99).optional(),
    textoAlt: z.string().trim().max(200).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Indica al menos un campo');

// ─────────────────────────── Inventario ───────────────────────────

const motivo = z.string().trim().max(255).optional();
const cantidadMovimiento = z.number().int().min(1).max(100_000);

// entrada/salida: unidades que entran o salen. ajuste: stock contado (edición en línea).
export const movimientoBody = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('entrada'),
    productoId: z.number().int().positive(),
    cantidad: cantidadMovimiento,
    motivo,
  }),
  z.object({
    tipo: z.literal('salida'),
    productoId: z.number().int().positive(),
    cantidad: cantidadMovimiento,
    motivo,
  }),
  z.object({
    tipo: z.literal('ajuste'),
    productoId: z.number().int().positive(),
    stockNuevo: z.number().int().min(0).max(1_000_000),
    motivo,
  }),
]);

export const kardexQuery = paginacionAdmin;

// ─────────────────────────── Categorías ───────────────────────────

const categoriaCampos = z.object({
  nombre: z.string().trim().min(2).max(100),
  slug: slug.max(120).optional(),
  descripcion: textoOpcional(1000),
  imagenUrl: z.url('URL inválida').max(500).nullish(),
  orden: z.number().int().min(0).max(999),
});

export const crearCategoriaBody = categoriaCampos.extend({
  orden: categoriaCampos.shape.orden.default(0),
});

export const actualizarCategoriaBody = categoriaCampos
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Indica al menos un campo');

// ─────────────────────────── Usuarios ───────────────────────────

export const usuariosAdminQuery = paginacionAdmin
  .extend({
    q: busqueda.optional(),
    rol: listaQuery(z.enum(ROLES_USUARIO)).optional(),
    activo: booleanQuery.optional(),
  })
  .transform(({ rol, ...resto }) => ({ ...resto, roles: rol }));

export const crearUsuarioBody = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: correoSchema,
  password: passwordSchema,
  telefono: z.string().trim().max(20).optional(),
  paisCodigo: paisCodigoSchema.default('PE'),
  rol: z.enum(ROLES_USUARIO),
});

export const actualizarUsuarioBody = z
  .object({ rol: z.enum(ROLES_USUARIO).optional(), activo: z.boolean().optional() })
  .refine((v) => v.rol !== undefined || v.activo !== undefined, 'Indica el rol o el estado');

// ─────────────────────────── Búsqueda ───────────────────────────

export const buscarQuery = z.object({ q: z.string().trim().min(2).max(100) });
