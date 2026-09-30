import { useEffect, useState } from 'react';

// true cuando la página se desplazó más de `umbral` px (header compacto).
export function useScrolled(umbral = 24) {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > umbral,
  );

  useEffect(() => {
    const actualizar = () => setScrolled(window.scrollY > umbral);
    actualizar();
    window.addEventListener('scroll', actualizar, { passive: true });
    return () => window.removeEventListener('scroll', actualizar);
  }, [umbral]);

  return scrolled;
}
