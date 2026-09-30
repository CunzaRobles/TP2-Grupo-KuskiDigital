import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSesion } from './api';

/**
 * Ruta protegida (checkout, confirmación, mi cuenta). Sin sesión, lleva al login y vuelve
 * después a la misma página (?redirect=). La API también exige la sesión: esto solo evita
 * mostrar una pantalla que no podría cargar.
 */
export function RequireAuth() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: usuario, isPending } = useSesion();

  if (isPending) {
    return (
      <div className="grid min-h-[50dvh] place-content-center" role="status">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">{t('ui.cargando')}</span>
      </div>
    );
  }

  if (!usuario) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}
