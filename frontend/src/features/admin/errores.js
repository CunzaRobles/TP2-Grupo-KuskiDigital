import { ApiError } from '@/lib/http';
import { mensajeError } from '@/lib/errores';

// Errores del panel: primero el texto propio del panel (admin.errores.<CODE>), si existe;
// si no, el mensaje general de la tienda (errores.<CODE> o el del backend).
export function mensajeErrorAdmin(t, error) {
  if (error instanceof ApiError && error.status < 500) {
    const propio = t(`admin.errores.${error.code}`, { defaultValue: '' });
    if (propio) return propio;
  }
  return mensajeError(t, error);
}
