import { useCallback, useSyncExternalStore } from 'react';

const medios = (consulta) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(consulta)
    : null;

// Una media query como estado de React: useMediaQuery('(min-width: 64rem)'). En el servidor y
// sin matchMedia devuelve false (la variante móvil, la más simple).
export function useMediaQuery(consulta) {
  const suscribir = useCallback(
    (avisar) => {
      const media = medios(consulta);
      media?.addEventListener?.('change', avisar);
      return () => media?.removeEventListener?.('change', avisar);
    },
    [consulta],
  );
  return useSyncExternalStore(
    suscribir,
    () => medios(consulta)?.matches ?? false,
    () => false,
  );
}
