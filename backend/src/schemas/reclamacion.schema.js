import { z } from 'zod';
import {
  BIENES_CONTRATADOS,
  ESTADOS_RECLAMACION,
  TIPOS_DOCUMENTO,
  TIPOS_RECLAMACION,
} from '../models/enums.js';
import { correoSchema } from './auth.schema.js';
import { listaQuery, paginacionQuery } from './comun.schema.js';

// Mismas reglas que frontend/src/features/reclamaciones/schemas.js.

const texto = (min, max) => z.string().trim().min(min).max(max);
// '' o null del formulario → sin valor
const vacioANulo = (valor) => (valor === '' || valor === null ? undefined : valor);

// Formato del número según el documento: DNI de 8 dígitos; CE y pasaporte alfanuméricos.
export const FORMATOS_DOCUMENTO = {
  DNI: /^\d{8}$/,
  CE: /^[A-Z0-9]{8,12}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
};

export const reclamacionBody = z
  .object({
    tipo: z.enum(TIPOS_RECLAMACION),
    // Consumidor
    nombre: texto(3, 150),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO),
    numeroDocumento: z.string().trim().toUpperCase().max(20),
    domicilio: texto(5, 255),
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{6,20}$/, 'Teléfono inválido'),
    correo: correoSchema,
    menorDeEdad: z.boolean().default(false),
    apoderadoNombre: z.preprocess(vacioANulo, texto(3, 150).optional()),
    // Bien contratado
    bienContratado: z.enum(BIENES_CONTRATADOS),
    pedidoCodigo: z.preprocess(
      vacioANulo,
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^KD-\d{6}$/, 'El código de pedido tiene el formato KD-000123')
        .optional(),
    ),
    montoReclamado: z.preprocess(
      vacioANulo,
      z
        .number()
        .positive('El monto debe ser mayor que 0')
        .max(1_000_000)
        .refine(
          (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6,
          'Usa como máximo 2 decimales',
        )
        .optional(),
    ),
    descripcion: texto(3, 500),
    // Detalle de la reclamación y pedido del consumidor
    detalle: texto(10, 3000),
    pedidoConsumidor: texto(5, 2000),
  })
  .superRefine((datos, ctx) => {
    const formato = FORMATOS_DOCUMENTO[datos.tipoDocumento];
    if (formato && !formato.test(datos.numeroDocumento ?? '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['numeroDocumento'],
        message:
          datos.tipoDocumento === 'DNI' ? 'El DNI tiene 8 dígitos' : 'Número de documento inválido',
      });
    }
    if (datos.menorDeEdad && !datos.apoderadoNombre) {
      ctx.addIssue({
        code: 'custom',
        path: ['apoderadoNombre'],
        message: 'Si eres menor de edad, indica el nombre de tu padre, madre o apoderado',
      });
    }
  })
  // Sin menor de edad no se guarda un apoderado
  .transform((datos) => (datos.menorDeEdad ? datos : { ...datos, apoderadoNombre: undefined }));

const fecha = z.iso.date('Usa el formato AAAA-MM-DD');

export const reclamacionesAdminQuery = paginacionQuery
  .extend({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    estado: listaQuery(z.enum(ESTADOS_RECLAMACION)).optional(),
    desde: fecha.optional(),
    hasta: fecha.optional(),
  })
  .refine((v) => !v.desde || !v.hasta || v.desde <= v.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta"',
    path: ['desde'],
  })
  .transform(({ estado, ...resto }) => ({ ...resto, estados: estado }));

// Respuesta del proveedor: pasar a "en atención" o registrar la respuesta (obligatoria).
export const responderReclamacionBody = z
  .object({
    estado: z.enum(['en_atencion', 'respondido']),
    respuesta: z.preprocess(vacioANulo, texto(20, 5000).optional()),
  })
  .refine((v) => v.estado !== 'respondido' || v.respuesta, {
    message: 'Escribe la respuesta al consumidor',
    path: ['respuesta'],
  });
