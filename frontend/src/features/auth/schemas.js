import { z } from 'zod';

// Mismas reglas que backend/src/schemas/auth.schema.js. Los mensajes son claves de i18n.

const correo = z
  .string()
  .trim()
  .min(1, 'validacion.correoRequerido')
  .toLowerCase()
  .pipe(z.email('validacion.correo').max(150, 'validacion.correo'));

export const loginSchema = z.object({
  correo,
  password: z.string().min(1, 'validacion.passwordRequerida').max(72, 'validacion.passwordMax'),
});

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, 'validacion.requerido').max(100, 'validacion.largo'),
    apellido: z.string().trim().min(1, 'validacion.requerido').max(100, 'validacion.largo'),
    correo,
    password: z
      .string()
      .min(8, 'validacion.passwordMin')
      .max(72, 'validacion.passwordMax')
      .regex(/[A-Za-z]/, 'validacion.passwordLetra')
      .regex(/\d/, 'validacion.passwordNumero'),
    confirmacion: z.string(),
    paisCodigo: z.string().regex(/^[A-Z]{2}$/, 'validacion.pais'),
  })
  .refine((v) => v.password === v.confirmacion, {
    message: 'validacion.passwordNoCoincide',
    path: ['confirmacion'],
  });

// Requisitos de la contraseña que se muestran mientras se escribe.
export const REQUISITOS_PASSWORD = [
  { clave: 'auth.requisitos.largo', cumple: (p) => p.length >= 8 },
  { clave: 'auth.requisitos.letra', cumple: (p) => /[A-Za-z]/.test(p) },
  { clave: 'auth.requisitos.numero', cumple: (p) => /\d/.test(p) },
];

/**
 * Destino tras iniciar sesión (?redirect=). Solo rutas internas: evita redirecciones abiertas
 * como ?redirect=//sitio-malicioso.com o https://…
 */
export const destinoSeguro = (redirect, porDefecto = '/cuenta') =>
  typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : porDefecto;
