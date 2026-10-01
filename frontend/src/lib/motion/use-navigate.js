import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router';
import { useViewTransitionsActivas } from './view-transitions';

// useNavigate de React Router con View Transitions por defecto (como Link en ./enlaces).
// navigate(-1) y demás saltos del historial pasan sin opciones.
export function useNavigate() {
  const navigate = useRouterNavigate();
  const activas = useViewTransitionsActivas();

  return useCallback(
    (destino, opciones) =>
      typeof destino === 'number'
        ? navigate(destino)
        : navigate(destino, { viewTransition: activas, ...opciones }),
    [navigate, activas],
  );
}
