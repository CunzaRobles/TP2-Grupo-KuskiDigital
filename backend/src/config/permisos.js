// Matriz de permisos del panel admin: qué roles pueden usar cada sección.
// Se aplica en las rutas (requireRol) y se replica en frontend/src/features/admin/permisos.js
// para mostrar el menú y proteger las páginas. Si cambias una, cambia la otra.
const GERENTE = 'admin_gerente';
const VENTAS = 'admin_ventas';
const LOGISTICA = 'admin_logistica';

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
