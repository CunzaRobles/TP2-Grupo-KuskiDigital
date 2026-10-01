// Movimiento de la tienda. Este índice es liviano (tokens y hooks): GSAP, Lenis y SplitText se
// importan desde sus propios módulos para no sumarlos donde no hacen falta.
//   - ./gsap          gsap, useGSAP, conMovimiento
//   - ./scroll-trigger ScrollTrigger (registrado y sincronizado con Lenis)
//   - ./split-text    SplitText
//   - ./lenis-provider LenisProvider (y ./lenis-context: useLenisRef)
//   - ./enlaces       Link, NavLink, useNavigate con View Transitions
//   - ./transicion-ruta TransicionRuta (fallback con Motion)
export { CURVA, cubicBezier, DURACION, EASE_ANDINO, milisegundos, transicion } from './tokens';
export { prefiereMovimientoReducido, useReducedMotion } from './use-reduced-motion';
export {
  NOMBRE_IMAGEN_PRODUCTO,
  soportaViewTransitions,
  useViewTransitionsActivas,
} from './view-transitions';
