import { createBrowserRouter } from 'react-router';
import { LoginPage } from '@/features/auth/login-page';
import { RegistroPage } from '@/features/auth/registro-page';
import { RequireAuth } from '@/features/auth/require-auth';
import { CarritoPage } from '@/features/carrito/carrito-page';
import { CatalogoPage } from '@/features/catalogo/catalogo-page';
import { HomePage } from '@/features/home/home-page';
import { ProductoRuta } from '@/features/producto/producto-page';
import { TiendaLayout } from './layouts/tienda-layout';
import { CargaInicial } from './pages/carga-inicial';
import { NotFoundPage } from './pages/not-found-page';

// El panel admin se carga en diferido: el visitante de la tienda no descarga su código.
const guardiasAdmin = () => import('@/features/admin/require-admin');
const pagina = (cargar, nombre) => async () => ({ Component: (await cargar())[nombre] });

// Ruta sin path que exige un permiso de la matriz (features/admin/permisos.js) a sus hijas.
const conPermiso = (permiso, children) => ({
  lazy: async () => {
    const { RequirePermiso } = await guardiasAdmin();
    return { Component: () => <RequirePermiso permiso={permiso} /> };
  },
  children,
});

const rutasAdmin = [
  {
    path: '/admin/login',
    HydrateFallback: CargaInicial,
    lazy: pagina(() => import('@/features/admin/admin-login-page'), 'AdminLoginPage'),
  },
  {
    path: '/admin',
    HydrateFallback: CargaInicial,
    lazy: pagina(guardiasAdmin, 'RequireAdmin'),
    children: [
      {
        lazy: pagina(() => import('./layouts/admin-layout'), 'AdminLayout'),
        children: [
          { index: true, lazy: pagina(guardiasAdmin, 'AdminInicio') },
          conPermiso('dashboard', [
            {
              path: 'dashboard',
              lazy: pagina(() => import('@/features/admin/dashboard-page'), 'DashboardPage'),
            },
          ]),
          conPermiso('ventas', [
            {
              path: 'ventas',
              lazy: pagina(() => import('@/features/admin/ventas-page'), 'VentasPage'),
            },
          ]),
          conPermiso('estadisticas', [
            {
              path: 'estadisticas',
              lazy: pagina(() => import('@/features/admin/estadisticas-page'), 'EstadisticasPage'),
            },
          ]),
          conPermiso('pedidos', [
            {
              path: 'pedidos',
              lazy: pagina(() => import('@/features/admin/pedidos-page'), 'PedidosPage'),
            },
          ]),
          conPermiso('inventario', [
            {
              path: 'inventario',
              lazy: pagina(() => import('@/features/admin/inventario-page'), 'InventarioPage'),
            },
          ]),
          conPermiso('productos', [
            {
              path: 'productos',
              lazy: pagina(() => import('@/features/admin/productos-page'), 'ProductosPage'),
            },
            {
              path: 'productos/:id',
              lazy: pagina(() => import('@/features/admin/producto-form-page'), 'ProductoFormPage'),
            },
          ]),
          conPermiso('categorias', [
            {
              path: 'categorias',
              lazy: pagina(() => import('@/features/admin/categorias-page'), 'CategoriasPage'),
            },
          ]),
          conPermiso('usuarios', [
            {
              path: 'usuarios',
              lazy: pagina(() => import('@/features/admin/usuarios-page'), 'UsuariosPage'),
            },
          ]),
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
];

// Páginas con sesión: se descargan al entrar en ellas.
const checkoutLazy = async () => ({
  Component: (await import('@/features/checkout/checkout-page')).CheckoutPage,
});
const confirmacionLazy = async () => ({
  Component: (await import('@/features/pedidos/confirmacion-page')).ConfirmacionPage,
});
const cuentaLazy = async () => ({
  Component: (await import('@/features/cuenta/cuenta-layout')).CuentaLayout,
});
const pedidosLazy = async () => ({
  Component: (await import('@/features/cuenta/pedidos-page')).PedidosPage,
});
const direccionesLazy = async () => ({
  Component: (await import('@/features/cuenta/direcciones-page')).DireccionesPage,
});

// /design (catálogo del design system) solo existe en desarrollo: no entra al build de producción.
const rutasDesarrollo = import.meta.env.DEV
  ? [
      {
        path: '/design',
        HydrateFallback: CargaInicial,
        lazy: async () => ({
          Component: (await import('@/features/design-system/design-system-page')).DesignSystemPage,
        }),
      },
    ]
  : [];

export const routes = [
  {
    path: '/',
    Component: TiendaLayout,
    HydrateFallback: CargaInicial,
    children: [
      { index: true, Component: HomePage },
      { path: 'catalogo', Component: CatalogoPage },
      { path: 'producto/:slug', Component: ProductoRuta },
      { path: 'carrito', Component: CarritoPage },
      { path: 'login', Component: LoginPage },
      { path: 'registro', Component: RegistroPage },
      {
        Component: RequireAuth,
        children: [
          { path: 'checkout', lazy: checkoutLazy },
          { path: 'pedido/:codigo', lazy: confirmacionLazy },
          {
            path: 'cuenta',
            lazy: cuentaLazy,
            children: [
              { index: true, lazy: pedidosLazy },
              { path: 'direcciones', lazy: direccionesLazy },
            ],
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
  ...rutasAdmin,
  ...rutasDesarrollo,
];

export const createRouter = () => createBrowserRouter(routes);
