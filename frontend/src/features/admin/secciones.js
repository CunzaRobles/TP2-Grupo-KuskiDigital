import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Receipt,
  Tags,
  Truck,
  Users,
} from 'lucide-react';
import { puede } from './permisos';

// Secciones del panel: ruta, permiso (permisos.js) e icono. Las usan el menú lateral, la
// búsqueda rápida (Ctrl+K) y el router. `grupo` agrupa el menú.
export const SECCIONES = [
  {
    clave: 'dashboard',
    ruta: '/admin/dashboard',
    permiso: 'dashboard',
    Icono: LayoutDashboard,
    grupo: 'general',
  },
  {
    clave: 'estadisticas',
    ruta: '/admin/estadisticas',
    permiso: 'estadisticas',
    Icono: BarChart3,
    grupo: 'general',
  },
  { clave: 'ventas', ruta: '/admin/ventas', permiso: 'ventas', Icono: Receipt, grupo: 'operacion' },
  {
    clave: 'pedidos',
    ruta: '/admin/pedidos',
    permiso: 'pedidos',
    Icono: Truck,
    grupo: 'operacion',
  },
  {
    clave: 'inventario',
    ruta: '/admin/inventario',
    permiso: 'inventario',
    Icono: Boxes,
    grupo: 'operacion',
  },
  {
    clave: 'productos',
    ruta: '/admin/productos',
    permiso: 'productos',
    Icono: Package,
    grupo: 'catalogo',
  },
  {
    clave: 'categorias',
    ruta: '/admin/categorias',
    permiso: 'categorias',
    Icono: Tags,
    grupo: 'catalogo',
  },
  {
    clave: 'usuarios',
    ruta: '/admin/usuarios',
    permiso: 'usuarios',
    Icono: Users,
    grupo: 'equipo',
  },
];

export const GRUPOS = ['general', 'operacion', 'catalogo', 'equipo'];

export const seccionesDe = (rol) => SECCIONES.filter((s) => puede(rol, s.permiso));

// Primera sección a la que puede entrar el rol (logística no ve el dashboard).
export const inicioDe = (rol) => seccionesDe(rol)[0]?.ruta ?? '/';
