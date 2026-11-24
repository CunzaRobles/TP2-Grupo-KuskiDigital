import { env } from './env.js';

// Datos del proveedor que figuran en la constancia del Libro de Reclamaciones (D.S. 011-2011-PCM:
// razón social, RUC y domicilio). RUC y domicilio se configuran en backend/.env (EMPRESA_RUC,
// EMPRESA_DOMICILIO); mientras no existan, la constancia no los muestra.
// Espejo de frontend/src/features/legal/empresa.js.
export const EMPRESA = {
  razonSocial: 'Kuski Agroindustria S.A.',
  ruc: env.EMPRESA_RUC,
  domicilio: env.EMPRESA_DOMICILIO,
  correoAtencion: 'contacto@kuski.pe',
};
