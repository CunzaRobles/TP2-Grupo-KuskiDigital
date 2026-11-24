// Datos de la empresa que citan los documentos legales: se cambian solo aquí.
// `ruc` y `domicilio` están pendientes: mientras sean null, los Términos no los muestran.
export const EMPRESA = {
  razonSocial: 'Kuski Agroindustria S.A.',
  ciudad: 'Cusco',
  pais: 'Perú',
  ruc: null,
  domicilio: null,
  // Derechos ARCO y consultas de privacidad
  correoPrivacidad: 'privacidad@kuski.pe',
  // Pedidos, cambios y devoluciones
  correoAtencion: 'contacto@kuski.pe',
  sitio: 'Kuski Digital',
};

// Documentos legales de la tienda. `actualizado`: fecha de la versión vigente (AAAA-MM-DD).
export const DOCUMENTOS = {
  terminos: { ruta: '/terminos', actualizado: '2026-11-24' },
  privacidad: { ruta: '/privacidad', actualizado: '2026-11-24' },
};

export const RUTA_LIBRO_RECLAMACIONES = '/libro-reclamaciones';

// Plazos de entrega por zona (días), los mismos de backend/database/seed-data/catalogo.cjs
// (tarifas_envio). El costo exacto lo calcula el checkout según país, peso y método.
export const PLAZOS_ENVIO = [
  { zona: 'nacional', estandar: [3, 5], express: [1, 2] },
  { zona: 'latam', estandar: [12, 18], express: [4, 7] },
  { zona: 'norteamerica', estandar: [12, 18], express: [4, 7] },
  { zona: 'europa', estandar: [12, 18], express: [4, 7] },
  { zona: 'resto_mundo', estandar: [15, 25], express: [5, 9] },
];

export const DIAS_DEVOLUCION = 14;
