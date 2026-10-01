import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '@/features/auth/require-auth';
import { HomePage } from '@/features/home/home-page';
import { TiendaLayout } from './layouts/tienda-layout';
import { NotFoundPage } from './pages/not-found-page';

// Code splitting por ruta: solo el home (la entrada más común) va en el bundle inicial; el
// resto de páginas de la tienda y todo el panel admin se descargan al entrar en ellas.
const pagina = (cargar, nombre) => async () => ({ Component: (await cargar())[nombre] });
// Primera carga directa en una ruta diferida: nada que mostrar hasta tener su código.
const sinContenido = () => null;
const guardiasAdmin = () => import('@/features/admin/require-admin');

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
    HydrateFallback: sinContenido,
    lazy: pagina(() => import('@/features/admin/admin-login-page'), 'AdminLoginPage'),
  },
  {
    path: '/admin',
    HydrateFallback: sinContenido,
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

// /design (catálogo del design system) solo existe en desarrollo: no entra al build de producción.
const rutasDesarrollo = import.meta.env.DEV
  ? [
      {
        path: '/design',
        HydrateFallback: sinContenido,
        lazy: pagina(
          () => import('@/features/design-system/design-system-page'),
          'DesignSystemPage',
        ),
      },
    ]
  : [];

export const routes = [
  {
    path: '/',
    Component: TiendaLayout,
    HydrateFallback: sinContenido,
    children: [
      { index: true, Component: HomePage },
      {
        path: 'catalogo',
        lazy: pagina(() => import('@/features/catalogo/catalogo-page'), 'CatalogoPage'),
      },
      {
        path: 'producto/:slug',
        lazy: pagina(() => import('@/features/producto/producto-page'), 'ProductoRuta'),
      },
      {
        path: 'carrito',
        lazy: pagina(() => import('@/features/carrito/carrito-page'), 'CarritoPage'),
      },
      { path: 'login', lazy: pagina(() => import('@/features/auth/login-page'), 'LoginPage') },
      {
        path: 'registro',
        lazy: pagina(() => import('@/features/auth/registro-page'), 'RegistroPage'),
      },
      {
        Component: RequireAuth,
        children: [
          {
            path: 'checkout',
            lazy: pagina(() => import('@/features/checkout/checkout-page'), 'CheckoutPage'),
          },
          {
            path: 'pedido/:codigo',
            lazy: pagina(() => import('@/features/pedidos/confirmacion-page'), 'ConfirmacionPage'),
          },
          {
            path: 'cuenta',
            lazy: pagina(() => import('@/features/cuenta/cuenta-layout'), 'CuentaLayout'),
            children: [
              {
                index: true,
                lazy: pagina(() => import('@/features/cuenta/pedidos-page'), 'PedidosPage'),
              },
              {
                path: 'direcciones',
                lazy: pagina(() => import('@/features/cuenta/direcciones-page'), 'DireccionesPage'),
              },
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
