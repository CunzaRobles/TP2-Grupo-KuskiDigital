import { emailSender } from '../adapters/email/index.js';
import { EMPRESA } from '../config/empresa.js';
import * as reclamacionRepository from '../repositories/reclamacion.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import { AppError } from '../utils/app-error.js';
import { diasHabilesEntre, hoyEnLima, sumarDiasHabiles } from '../utils/dias-habiles.js';
import { siguienteCodigoReclamacion } from '../utils/reclamaciones.js';

// Libro de Reclamaciones virtual (Ley 29571, arts. 150-151; D.S. 011-2011-PCM y modificatorias).

/** Plazo de respuesta: 15 días hábiles improrrogables (D.S. 101-2022-PCM). */
export const PLAZO_DIAS_HABILES = 15;

export const AVISO_LEGAL =
  'La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante INDECOPI.';

/** Estados a los que puede pasar una hoja desde el panel. Respondido es final. */
export const TRANSICIONES = {
  recibido: ['en_atencion', 'respondido'],
  en_atencion: ['respondido'],
  respondido: [],
};

const ETIQUETAS = {
  reclamo: 'Reclamo',
  queja: 'Queja',
  producto: 'Producto',
  servicio: 'Servicio',
  DNI: 'DNI',
  CE: 'Carné de extranjería',
  PASAPORTE: 'Pasaporte',
};

const aNumeroONull = (valor) => (valor == null ? null : Number(valor));

/** Hoja de reclamación para la API. `diasRestantes`: días hábiles hasta la fecha límite. */
export const toReclamacionDTO = (r, hoy = hoyEnLima()) => ({
  id: r.id,
  codigo: r.codigo,
  tipo: r.tipo,
  estado: r.estado,
  creadoEn: r.creadoEn,
  fechaLimite: r.fechaLimite,
  diasRestantes: r.estado === 'respondido' ? null : diasHabilesEntre(hoy, r.fechaLimite),
  consumidor: {
    nombre: r.nombre,
    tipoDocumento: r.tipoDocumento,
    numeroDocumento: r.numeroDocumento,
    domicilio: r.domicilio,
    telefono: r.telefono,
    correo: r.correo,
    menorDeEdad: r.menorDeEdad,
    apoderadoNombre: r.apoderadoNombre ?? null,
  },
  bien: {
    tipo: r.bienContratado,
    pedidoCodigo: r.pedidoCodigo ?? null,
    montoReclamado: aNumeroONull(r.montoReclamado),
    descripcion: r.descripcion,
  },
  detalle: r.detalle,
  pedidoConsumidor: r.pedidoConsumidor,
  respuesta: r.respuesta
    ? {
        texto: r.respuesta,
        fecha: r.fechaRespuesta,
        respondidoPor: r.respondidoPorUsuario
          ? `${r.respondidoPorUsuario.nombre} ${r.respondidoPorUsuario.apellido}`
          : null,
      }
    : null,
});

// Los correos simulados nunca deben romper la operación principal.
const enviarCorreo = async (correo) => {
  try {
    await emailSender.enviar(correo);
  } catch (error) {
    console.error('No se pudo enviar el correo simulado:', error.message);
  }
};

const proveedor = () =>
  [
    `Proveedor: ${EMPRESA.razonSocial}`,
    EMPRESA.ruc && `RUC: ${EMPRESA.ruc}`,
    EMPRESA.domicilio && `Domicilio: ${EMPRESA.domicilio}`,
  ].filter(Boolean);

// Constancia con la copia íntegra de la hoja (D.S. 011-2011-PCM: copia al consumidor).
const constancia = (r) => ({
  para: r.correo,
  asunto: `Constancia de tu ${ETIQUETAS[r.tipo].toLowerCase()} ${r.codigo} · Libro de Reclamaciones de Kuski`,
  texto: [
    `Hola ${r.nombre}, registramos tu hoja del Libro de Reclamaciones virtual.`,
    '',
    `Hoja N.° ${r.codigo} · ${ETIQUETAS[r.tipo]}`,
    `Fecha de registro: ${hoyEnLima(r.creadoEn ? new Date(r.creadoEn) : new Date())}`,
    `Responderemos a más tardar el ${r.fechaLimite} (${PLAZO_DIAS_HABILES} días hábiles improrrogables).`,
    ...proveedor(),
    '',
    '1. Identificación del consumidor',
    `Nombre: ${r.nombre}`,
    `${ETIQUETAS[r.tipoDocumento]}: ${r.numeroDocumento}`,
    `Domicilio: ${r.domicilio}`,
    `Teléfono: ${r.telefono} · Correo: ${r.correo}`,
    ...(r.menorDeEdad ? [`Menor de edad. Padre, madre o apoderado: ${r.apoderadoNombre}`] : []),
    '',
    '2. Identificación del bien contratado',
    `${ETIQUETAS[r.bienContratado]}: ${r.descripcion}`,
    ...(r.pedidoCodigo ? [`Pedido: ${r.pedidoCodigo}`] : []),
    ...(r.montoReclamado != null
      ? [`Monto reclamado: S/ ${Number(r.montoReclamado).toFixed(2)}`]
      : []),
    '',
    `3. Detalle de la ${ETIQUETAS[r.tipo].toLowerCase()}`,
    r.detalle,
    '',
    'Pedido del consumidor',
    r.pedidoConsumidor,
    '',
    AVISO_LEGAL,
  ].join('\n'),
});

/**
 * Registra una hoja: código correlativo del año (bajo bloqueo, dentro de la transacción) y
 * fecha límite a 15 días hábiles. Luego envía la constancia al consumidor.
 */
export const registrar = async (datos, ahora = new Date()) => {
  const hoy = hoyEnLima(ahora);
  const anio = Number(hoy.slice(0, 4));

  const reclamacion = await withTransaction(async (tx) => {
    await reclamacionRepository.bloquearCorrelativo(tx);
    const ultimo = await reclamacionRepository.findUltimoCodigo(anio, tx);
    return reclamacionRepository.create(
      {
        ...datos,
        codigo: siguienteCodigoReclamacion(anio, ultimo),
        estado: 'recibido',
        fechaLimite: sumarDiasHabiles(hoy, PLAZO_DIAS_HABILES),
      },
      tx,
    );
  });

  await enviarCorreo(constancia(reclamacion));
  return toReclamacionDTO(reclamacion, hoy);
};

export const listarAdmin = async ({ page, limit, ...filtros }, ahora = new Date()) => {
  const { rows, count } = await reclamacionRepository.findAdmin(filtros, {
    limit,
    offset: (page - 1) * limit,
  });
  const hoy = hoyEnLima(ahora);
  return {
    items: rows.map((r) => toReclamacionDTO(r, hoy)),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

/**
 * Cambia el estado de una hoja. Al responder guarda el texto, quién y cuándo, y se lo envía al
 * consumidor por correo. Una hoja respondida ya no cambia.
 */
export const responder = async (id, { estado, respuesta }, usuarioId, ahora = new Date()) => {
  const actual = await reclamacionRepository.findById(id);
  if (!actual) {
    throw new AppError(404, 'RECLAMACION_NO_ENCONTRADA', 'No encontramos esa hoja de reclamación');
  }
  if (!TRANSICIONES[actual.estado].includes(estado)) {
    throw new AppError(
      409,
      'RECLAMACION_TRANSICION_INVALIDA',
      actual.estado === 'respondido'
        ? 'Esta hoja ya fue respondida'
        : `No se puede pasar de "${actual.estado}" a "${estado}"`,
    );
  }

  const cambios =
    estado === 'respondido'
      ? { estado, respuesta, respondidoPor: usuarioId, fechaRespuesta: ahora }
      : { estado };
  await reclamacionRepository.update(id, cambios);
  const actualizada = await reclamacionRepository.findById(id);

  if (estado === 'respondido') {
    await enviarCorreo({
      para: actual.correo,
      asunto: `Respuesta a tu ${ETIQUETAS[actual.tipo].toLowerCase()} ${actual.codigo} · Kuski`,
      texto: [
        `Hola ${actual.nombre}, esta es nuestra respuesta a tu hoja N.° ${actual.codigo}:`,
        '',
        respuesta,
        '',
        ...proveedor(),
        AVISO_LEGAL,
      ].join('\n'),
    });
  }

  return toReclamacionDTO(actualizada, hoyEnLima(ahora));
};
