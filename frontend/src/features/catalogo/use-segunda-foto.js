import { useState } from 'react';

/**
 * La segunda foto de una tarjeta (la del hover) se descarga recién cuando el puntero entra en
 * ella: en táctil nunca se pide. Se reparte en la tarjeta: { activa, onPointerEnter }.
 */
export function useSegundaFoto() {
  const [activa, setActiva] = useState(false);
  return { activa, onPointerEnter: () => setActiva(true) };
}
