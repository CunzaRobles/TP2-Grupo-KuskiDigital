import { Link as RouterLink, NavLink as RouterNavLink } from 'react-router';
import { useViewTransitionsActivas } from './view-transitions';

// Link y NavLink de React Router con View Transitions activadas por defecto en la tienda
// (fundido corto entre rutas). Se desactivan sin soporte o con movimiento reducido. Un
// `viewTransition` explícito siempre gana. useNavigate equivalente en ./use-navigate.

export function Link({ viewTransition, ...props }) {
  const activas = useViewTransitionsActivas();
  return <RouterLink viewTransition={viewTransition ?? activas} {...props} />;
}

export function NavLink({ viewTransition, ...props }) {
  const activas = useViewTransitionsActivas();
  return <RouterNavLink viewTransition={viewTransition ?? activas} {...props} />;
}
