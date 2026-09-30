import { z } from 'zod';
import { detectarMarca, largoCvv, luhnValido, soloDigitos, vencimientoValido } from './tarjeta';

// Mismas reglas que backend/src/schemas/{direccion,checkout}.schema.js. Mensajes = claves i18n.

const opcional = (max) =>
  z
    .string()
    .trim()
    .max(max, 'validacion.largo')
    .transform((v) => v || undefined);

export const direccionSchema = z.object({
  nombreDestinatario: z.string().trim().min(2, 'validacion.nombre').max(150, 'validacion.largo'),
  paisCodigo: z.string().regex(/^[A-Z]{2}$/, 'validacion.pais'),
  ciudad: z.string().trim().min(2, 'validacion.ciudad').max(100, 'validacion.largo'),
  direccion: z.string().trim().min(5, 'validacion.direccion').max(255, 'validacion.largo'),
  codigoPostal: opcional(20),
  telefono: opcional(20),
});

export const tarjetaSchema = z
  .object({
    numero: z
      .string()
      .transform(soloDigitos)
      .pipe(z.string().regex(/^\d{13,19}$/, 'validacion.tarjetaNumero'))
      .refine(luhnValido, 'validacion.tarjetaNumero'),
    titular: z.string().trim().min(2, 'validacion.titular').max(100, 'validacion.largo'),
    vencimiento: z
      .string()
      .trim()
      .refine((v) => vencimientoValido(v), 'validacion.vencimiento'),
    cvv: z.string().regex(/^\d{3,4}$/, 'validacion.cvv'),
  })
  .refine((t) => t.cvv.length === largoCvv(detectarMarca(t.numero)), {
    message: 'validacion.cvv',
    path: ['cvv'],
  });

export const paypalSchema = z.object({
  correoPaypal: z.string().trim().pipe(z.email('validacion.correo')),
});

// Celular peruano: 9 dígitos que empiezan por 9 (se aceptan espacios y el prefijo +51).
export const celularSchema = z.object({
  telefono: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?51/, ''))
    .pipe(z.string().regex(/^9\d{8}$/, 'validacion.celular')),
});

export const METODOS_PAGO = ['tarjeta', 'paypal', 'yape', 'plin'];
export const METODOS_SOLO_PEN = ['yape', 'plin'];

// Esquema y valores a validar según el método elegido.
export const validacionPago = (pago) => {
  if (pago.metodo === 'tarjeta') return [tarjetaSchema, pago.tarjeta];
  if (pago.metodo === 'paypal') return [paypalSchema, { correoPaypal: pago.correoPaypal }];
  return [celularSchema, { telefono: pago.telefono }];
};
