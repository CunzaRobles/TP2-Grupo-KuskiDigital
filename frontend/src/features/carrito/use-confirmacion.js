import { useCallback, useEffect, useRef, useState } from 'react';

export const DURACION_CONFIRMACION_MS = 1500;

// Estado breve de confirmación ("Agregado") tras una acción: `confirmar()` lo activa y vuelve
// solo a su estado normal después de `duracion` ms (cada nueva confirmación reinicia la espera).
export function useConfirmacion(duracion = DURACION_CONFIRMACION_MS) {
  const [activa, setActiva] = useState(false);
  const temporizador = useRef(null);

  const confirmar = useCallback(() => {
    clearTimeout(temporizador.current);
    setActiva(true);
    temporizador.current = setTimeout(() => setActiva(false), duracion);
  }, [duracion]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return [activa, confirmar];
}
