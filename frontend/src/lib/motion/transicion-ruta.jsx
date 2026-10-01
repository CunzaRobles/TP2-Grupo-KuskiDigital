import { motion } from 'motion/react';
import { useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { transicion } from './tokens';
import { useReducedMotion } from './use-reduced-motion';
import { soportaViewTransitions } from './view-transitions';

/**
 * Contenido de la ruta con el fundido corto entre páginas. Con View Transitions lo hace el
 * navegador (::view-transition-*(root) en globals.css) y aquí solo se pinta el Outlet; sin
 * soporte, Motion funde la página entrante. Solo hay fundido de entrada: con una salida animada
 * la página que se va seguiría montada y reaccionando (p. ej. RequireAuth redirigiendo tras
 * cerrar sesión). Cambia con el pathname: los filtros del catálogo (?categoria=…) no funden.
 */
export function TransicionRuta() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reducido = useReducedMotion();
  const [nativas] = useState(soportaViewTransitions);
  // La primera página se pinta sin fundido; solo las navegaciones posteriores lo tienen
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  const [navego, setNavego] = useState(false);
  if (pathname !== rutaAnterior) {
    setRutaAnterior(pathname);
    setNavego(true);
  }

  if (nativas || reducido) return outlet;

  return (
    <motion.div
      key={pathname}
      initial={navego ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={transicion('ruta', 'suave')}
    >
      {outlet}
    </motion.div>
  );
}
