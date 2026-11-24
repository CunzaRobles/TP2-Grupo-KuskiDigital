import { DIAS_DEVOLUCION, EMPRESA, PLAZOS_ENVIO, RUTA_LIBRO_RECLAMACIONES } from '../empresa';

/*
 * Formato del contenido de los documentos legales (uno por documento e idioma):
 *   { resumen, secciones: [{ id, titulo, bloques }] }
 * Cada bloque es un párrafo (string), { subtitulo }, { lista: [string] } o
 * { tabla: { leyenda, columnas: [string], filas: [[string]] } }.
 * En los textos, **negrita** y [enlace](/ruta-interna | mailto:…). Los `id` de las secciones
 * son los mismos en todos los idiomas (anclas estables).
 */

export { DIAS_DEVOLUCION, EMPRESA, RUTA_LIBRO_RECLAMACIONES };

export const correo = (direccion) => `[${direccion}](mailto:${direccion})`;

// Ficha de la empresa. RUC y domicilio solo aparecen cuando están definidos en empresa.js.
export const fichaEmpresa = ({ razonSocial, ruc, domicilio, ubicacion, atencion, privacidad }) =>
  [
    `**${razonSocial}:** ${EMPRESA.razonSocial}`,
    EMPRESA.ruc && `**${ruc}:** ${EMPRESA.ruc}`,
    EMPRESA.domicilio
      ? `**${domicilio}:** ${EMPRESA.domicilio}`
      : `**${ubicacion.etiqueta}:** ${ubicacion.valor}`,
    atencion && `**${atencion}:** ${correo(EMPRESA.correoAtencion)}`,
    privacidad && `**${privacidad}:** ${correo(EMPRESA.correoPrivacidad)}`,
  ].filter(Boolean);

// Filas de la tabla de plazos de envío: [zona, estándar, express].
export const filasEnvio = (zonas, rango) =>
  PLAZOS_ENVIO.map(({ zona, estandar, express }) => [
    zonas[zona],
    rango(...estandar),
    rango(...express),
  ]);
