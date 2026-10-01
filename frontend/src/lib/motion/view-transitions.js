import { useReducedMotion } from './use-reduced-motion';

// View Transitions API (transición del documento entre rutas). Donde no existe, la tienda
// usa el fundido de Motion (TransicionRuta) y no hay elemento compartido.
export const soportaViewTransitions = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function';

// Nombre del elemento compartido: la foto de la tarjeta se expande hasta la de la ficha.
export const NOMBRE_IMAGEN_PRODUCTO = 'producto-imagen';

// true si las navegaciones deben usar View Transitions (soportadas y sin movimiento reducido).
export function useViewTransitionsActivas() {
  const reducido = useReducedMotion();
  return !reducido && soportaViewTransitions();
}
