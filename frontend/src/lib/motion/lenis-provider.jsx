import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from './gsap';
import { LenisContext } from './lenis-context';
import { useReducedMotion } from './use-reduced-motion';

// Lenis no intercepta la rueda dentro de capas con scroll propio: diálogos y drawers de Radix
// y listas de Select (allowNestedScroll cubre el resto de contenedores con overflow).
const CAPAS_CON_SCROLL = '[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]';

/**
 * Scroll suave de la tienda con Lenis, movido por el ticker de GSAP y sincronizado con
 * ScrollTrigger (cada frame de Lenis actualiza los triggers). Con movimiento reducido no se
 * crea: el scroll es el nativo. Se detiene mientras Radix bloquea el scroll del body (modales).
 */
export function LenisProvider({ children }) {
  const reducido = useReducedMotion();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (reducido) return undefined;

    const instancia = new Lenis({
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      prevent: (nodo) => nodo.closest?.(CAPAS_CON_SCROLL) != null,
    });

    instancia.on('scroll', ScrollTrigger.update);
    const avanzar = (segundos) => instancia.raf(segundos * 1000);
    gsap.ticker.add(avanzar);
    gsap.ticker.lagSmoothing(0);

    // react-remove-scroll (Radix) marca el body con data-scroll-locked mientras hay un modal
    const sincronizarBloqueo = () =>
      document.body.hasAttribute('data-scroll-locked') ? instancia.stop() : instancia.start();
    const observador = new MutationObserver(sincronizarBloqueo);
    observador.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked'],
    });

    lenisRef.current = instancia;
    return () => {
      observador.disconnect();
      gsap.ticker.remove(avanzar);
      gsap.ticker.lagSmoothing(500, 33);
      instancia.destroy();
      lenisRef.current = null;
    };
  }, [reducido]);

  return <LenisContext value={lenisRef}>{children}</LenisContext>;
}
