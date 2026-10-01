import { createContext, useContext } from 'react';

export const LenisContext = createContext(null);

// Ref a la instancia activa de Lenis: ref.current es null con movimiento reducido o fuera de la
// tienda. Para uso imperativo: useLenisRef().current?.scrollTo(0).
export const useLenisRef = () => useContext(LenisContext);

// Oyentes del scroll de Lenis. GSAP se carga solo en la Home: al importarse, ScrollTrigger se
// suscribe aquí (lib/motion/gsap.js) sin que el proveedor tenga que conocerlo.
const oyentesScroll = new Set();

export function alHacerScrollLenis(oyente) {
  oyentesScroll.add(oyente);
  return () => oyentesScroll.delete(oyente);
}

export const avisarScrollLenis = (lenis) => oyentesScroll.forEach((oyente) => oyente(lenis));
