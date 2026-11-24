import { z } from 'zod';

// Mismas reglas que backend/src/schemas/reclamacion.schema.js. Los mensajes son claves de i18n.
// Los campos son strings del formulario; los enums se validan con refine para que un error no
// impida revisar el resto (documento y apoderado se comprueban siempre).

export const TIPOS = ['reclamo', 'queja'];
export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'PASAPORTE'];
export const BIENES = ['producto', 'servicio'];

const FORMATOS_DOCUMENTO = {
  DNI: /^\d{8}$/,
  CE: /^[A-Z0-9]{8,12}$/,
  PASAPORTE: /^[A-Z0-9]{6,12}$/,
};

const E = (clave) => `reclamaciones.errores.${clave}`;
const texto = (min, max, clave) => z.string().trim().min(min, E(clave)).max(max, E('largo'));

const opcional = (schema) =>
  z
    .string()
    .trim()
    .transform((v) => v || undefined)
    .pipe(schema.optional());

export const reclamacionSchema = z
  .object({
    tipo: z.string().refine((v) => TIPOS.includes(v), E('tipo')),
    nombre: texto(3, 150, 'nombre'),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO),
    numeroDocumento: z.string().trim().toUpperCase().max(20, E('documento')),
    domicilio: texto(5, 255, 'domicilio'),
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{6,20}$/, E('telefono')),
    correo: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(E('correo')).max(150, E('correo'))),
    menorDeEdad: z.boolean(),
    apoderadoNombre: z.string().trim().max(150, E('largo')),
    bienContratado: z.enum(BIENES),
    pedidoCodigo: opcional(
      z
        .string()
        .toUpperCase()
        .regex(/^KD-\d{6}$/, E('pedidoCodigo')),
    ),
    montoReclamado: opcional(
      z
        .string()
        .regex(/^\d{1,7}(\.\d{1,2})?$/, E('monto'))
        .transform(Number)
        .refine((n) => n > 0, E('monto')),
    ),
    descripcion: texto(3, 500, 'descripcion'),
    detalle: texto(10, 3000, 'detalle'),
    pedidoConsumidor: texto(5, 2000, 'pedidoConsumidor'),
  })
  .superRefine((datos, ctx) => {
    const formato = FORMATOS_DOCUMENTO[datos.tipoDocumento];
    if (formato && !formato.test(datos.numeroDocumento)) {
      ctx.addIssue({
        code: 'custom',
        path: ['numeroDocumento'],
        message: E(datos.tipoDocumento === 'DNI' ? 'dni' : 'documento'),
      });
    }
    if (datos.menorDeEdad && datos.apoderadoNombre.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['apoderadoNombre'], message: E('apoderado') });
    }
  })
  // La API recibe el apoderado solo si es menor de edad
  .transform(({ apoderadoNombre, ...datos }) =>
    datos.menorDeEdad ? { ...datos, apoderadoNombre } : datos,
  );

export const HOJA_VACIA = {
  tipo: '',
  nombre: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  domicilio: '',
  telefono: '',
  correo: '',
  menorDeEdad: false,
  apoderadoNombre: '',
  bienContratado: 'producto',
  pedidoCodigo: '',
  montoReclamado: '',
  descripcion: '',
  detalle: '',
  pedidoConsumidor: '',
};
