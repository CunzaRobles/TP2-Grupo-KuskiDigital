// Valores compartidos por las páginas del panel (mismos ENUM que backend/src/models/enums.js).
export const ESTADOS = [
  'pendiente',
  'pagado',
  'preparando',
  'en_transito',
  'entregado',
  'cancelado',
];
export const METODOS_PAGO = ['tarjeta', 'paypal', 'yape', 'plin'];
export const CLAVES_FILTROS_PEDIDOS = ['q', 'desde', 'hasta', 'pais', 'estado', 'metodo_pago'];

// Orden en los selectores de rol: primero el equipo.
export const ROLES = ['admin_gerente', 'admin_ventas', 'admin_logistica', 'cliente'];

// Filtros de la URL → parámetros de la API (sin vacíos).
export const aQueryPedidos = (filtros, page) =>
  Object.fromEntries(
    Object.entries({ ...filtros, page }).filter(([, v]) => v !== '' && v !== undefined),
  );
