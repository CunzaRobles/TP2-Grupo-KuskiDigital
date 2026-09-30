// Matriz de permisos del panel admin: copia de backend/src/config/permisos.js (una prueba del
// backend comprueba que ambas coincidan). El frontend la usa para el menú y las rutas
// protegidas; la API la vuelve a aplicar en cada endpoint.
const GERENTE = 'admin_gerente';
const VENTAS = 'admin_ventas';
const LOGISTICA = 'admin_logistica';

export const ROLES_ADMIN = [GERENTE, VENTAS, LOGISTICA];

export const PERMISOS = {
  dashboard: [GERENTE, VENTAS],
  ventas: [GERENTE, VENTAS],
  estadisticas: [GERENTE, VENTAS],
  pedidos: [GERENTE, VENTAS, LOGISTICA],
  pedidosEstado: [GERENTE, LOGISTICA],
  inventario: [GERENTE, LOGISTICA],
  productos: [GERENTE],
  categorias: [GERENTE],
  usuarios: [GERENTE],
};

export const puede = (rol, permiso) => PERMISOS[permiso]?.includes(rol) ?? false;

export const esAdmin = (rol) => ROLES_ADMIN.includes(rol);
