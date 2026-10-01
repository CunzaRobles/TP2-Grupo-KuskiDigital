import 'lenis/dist/lenis.css';
import { useEffect, useRef } from 'react';
import { avisarScrollLenis, LenisContext } from './lenis-context';
import { useReducedMotion } from './use-reduced-motion';

// Lenis no intercepta la rueda dentro de capas con scroll propio: diálogos y drawers de Radix
// y listas de Select (allowNestedScroll cubre el resto de contenedores con overflow).
const CAPAS_CON_SCROLL = '[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]';

/**
 * Scroll suave de la tienda con Lenis (con su propio requestAnimationFrame: no depende de GSAP,
 * que solo se descarga en la Home). Cada frame de Lenis avisa a los oyentes de
 * alHacerScrollLenis, como ScrollTrigger. Con movimiento reducido no se crea: el scroll es el
 * nativo. Se detiene mientras Radix bloquea el scroll del body (modales).
 */
export function LenisProvider({ children }) {
  const reducido = useReducedMotion();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (reducido) return undefined;

    // Lenis se descarga después del primer pintado: hasta entonces el scroll es el nativo
    let cancelado = false;
    let limpiar;
    import('lenis').then(({ default: Lenis }) => {
      if (cancelado) return;
      const instancia = new Lenis({
        autoRaf: true,
        anchors: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (nodo) => nodo.closest?.(CAPAS_CON_SCROLL) != null,
      });

      instancia.on('scroll', avisarScrollLenis);

      // react-remove-scroll (Radix) marca el body con data-scroll-locked mientras hay un modal
      const sincronizarBloqueo = () =>
        document.body.hasAttribute('data-scroll-locked') ? instancia.stop() : instancia.start();
      const observador = new MutationObserver(sincronizarBloqueo);
      observador.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-scroll-locked'],
      });

      lenisRef.current = instancia;
      limpiar = () => {
        observador.disconnect();
        instancia.destroy();
        lenisRef.current = null;
      };
    });

    return () => {
      cancelado = true;
      limpiar?.();
    };
  }, [reducido]);

  return <LenisContext value={lenisRef}>{children}</LenisContext>;
}
