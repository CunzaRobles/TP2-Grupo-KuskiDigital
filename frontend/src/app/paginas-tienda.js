// Páginas de la tienda, cada una en su propio chunk: el bundle inicial lleva solo el layout.
// La Home trae GSAP (hero y recorrido de categorías); ninguna otra página lo descarga.
// index.html precarga el chunk de la Home cuando se entra por "/" (ver vite.config.js).
export const cargarHome = () => import('@/features/home/home-page');
export const cargarCatalogo = () => import('@/features/catalogo/catalogo-page');
export const cargarProducto = () => import('@/features/producto/producto-page');
export const cargarCarrito = () => import('@/features/carrito/carrito-page');
export const cargarLogin = () => import('@/features/auth/login-page');
export const cargarRegistro = () => import('@/features/auth/registro-page');

// Tras la carga, con el navegador en reposo, se adelantan las páginas a las que más se va
// (catálogo y ficha) para que la navegación no espere su descarga.
export function precargarPaginasFrecuentes() {
  if (typeof window === 'undefined' || !('requestIdleCallback' in window)) return () => {};
  let id;
  const programar = () => {
    id = window.requestIdleCallback(
      () => {
        cargarCatalogo();
        cargarProducto();
      },
      { timeout: 5000 },
    );
  };
  if (document.readyState === 'complete') programar();
  else window.addEventListener('load', programar, { once: true });
  return () => {
    window.removeEventListener('load', programar);
    if (id) window.cancelIdleCallback(id);
  };
}
