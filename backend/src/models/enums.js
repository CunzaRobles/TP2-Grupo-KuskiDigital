// Valores idénticos a los tipos ENUM de database/01_esquema_kuski_db.sql.
// Se reutilizan en los modelos y en los esquemas Zod.
export const ROLES_USUARIO = ['cliente', 'admin_gerente', 'admin_ventas', 'admin_logistica'];
export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste'];
export const ESTADOS_PEDIDO = [
  'pendiente',
  'pagado',
  'preparando',
  'en_transito',
  'entregado',
  'cancelado',
];
export const METODOS_PAGO = ['tarjeta', 'paypal', 'yape', 'plin'];
export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'];
export const METODOS_ENVIO = ['estandar', 'express'];
export const ZONAS_ENVIO = ['nacional', 'latam', 'norteamerica', 'europa', 'resto_mundo'];

// Monedas soportadas por la tienda (filas de tipos_cambio).
export const MONEDAS = ['PEN', 'USD', 'EUR'];

// Roles con acceso al panel de administración.
export const ROLES_ADMIN = ROLES_USUARIO.filter((rol) => rol !== 'cliente');
