import { z } from 'zod';
import { METODOS_ENVIO } from '../models/enums.js';
import { itemCarritoSchema, monedaSchema, paisCodigoSchema } from './comun.schema.js';
import { direccionSchema } from './direccion.schema.js';

export const cotizarBody = z.object({
  paisCodigo: paisCodigoSchema,
  moneda: monedaSchema.default('PEN'),
  metodoEnvio: z.enum(METODOS_ENVIO).default('estandar'),
  // Opcional: sin ítems se cotiza el carrito del usuario autenticado.
  items: z.array(itemCarritoSchema).min(1).max(50).optional(),
});

// MM/AA sin caducar (la tarjeta vale hasta el último día del mes).
const vencimiento = z
  .string()
  .trim()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA')
  .refine((v) => {
    const [mes, anio] = v.split('/').map(Number);
    return new Date(Date.UTC(2000 + anio, mes, 1)) > new Date();
  }, 'La tarjeta está vencida');

const tarjetaSchema = z.object({
  numero: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{13,19}$/, 'Número de tarjeta inválido')),
  titular: z.string().trim().min(2).max(100),
  vencimiento,
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
});

// Celular peruano: 9 dígitos que empiezan por 9.
const celular = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?51/, ''))
  .pipe(z.string().regex(/^9\d{8}$/, 'Celular peruano inválido (9 dígitos)'));

export const pagoSchema = z.discriminatedUnion('metodo', [
  z.object({ metodo: z.literal('tarjeta'), tarjeta: tarjetaSchema }),
  z.object({ metodo: z.literal('paypal'), correoPaypal: z.email() }),
  z.object({ metodo: z.literal('yape'), telefono: celular }),
  z.object({ metodo: z.literal('plin'), telefono: celular }),
]);

export const crearPedidoBody = z
  .object({
    direccionId: z.number().int().positive().optional(),
    direccion: direccionSchema.optional(),
    // Con una dirección nueva: guardarla en la cuenta junto con el pedido.
    guardarDireccion: z.boolean().default(false),
    metodoEnvio: z.enum(METODOS_ENVIO),
    moneda: monedaSchema.default('PEN'),
    pago: pagoSchema,
  })
  .refine((v) => Boolean(v.direccionId) !== Boolean(v.direccion), {
    message: 'Envía direccionId (dirección guardada) o direccion (nueva), no ambas',
    path: ['direccion'],
  });

export const codigoPedidoParams = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^KD-\d{6,}$/, 'Código de pedido inválido'),
});
