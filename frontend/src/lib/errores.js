import { ApiError } from './http';

/**
 * Mensaje traducido para un error de la API. Usa la clave `errores.<CODE>` si existe y, si
 * no, el mensaje (en español) que envía el backend. Sin conexión o con errores 5xx se muestra
 * un texto genérico en lugar de detalles técnicos.
 */
export function mensajeError(t, error) {
  if (!(error instanceof ApiError)) return t('errores.generico');
  if (error.code === 'NETWORK_ERROR') return t('errores.red');
  if (error.status >= 500) return t('errores.servidor');
  return t(`errores.${error.code}`, { defaultValue: error.message || t('errores.generico') });
}

/**
 * Errores de validación del backend ({ details: [{ path, message }] }) → { campo: mensaje }.
 * Permite marcar en el formulario lo que Zod del backend rechazó.
 */
export const erroresDeCampos = (error) =>
  error instanceof ApiError && error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)
    ? Object.fromEntries(error.details.map((d) => [d.path, d.message]))
    : {};
