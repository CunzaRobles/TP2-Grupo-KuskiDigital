import { useSyncExternalStore } from 'react';

// prefers-reduced-motion como estado de React (se actualiza si el usuario cambia la preferencia).
// Con movimiento reducido se desactiva todo lo no esencial: el scroll suave de Lenis, las
// View Transitions entre rutas, el elemento compartido y las animaciones decorativas. Lo
// esencial (que el cambio de estado se vea) se mantiene, pero sin transición.
const CONSULTA = '(prefers-reduced-motion: reduce)';

const consulta = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(CONSULTA)
    : null;

function suscribir(avisar) {
  const media = consulta();
  media?.addEventListener?.('change', avisar);
  return () => media?.removeEventListener?.('change', avisar);
}

export const prefiereMovimientoReducido = () => consulta()?.matches ?? false;

export function useReducedMotion() {
  return useSyncExternalStore(suscribir, prefiereMovimientoReducido, () => false);
}
