import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLogout, useSesion } from '@/features/auth/api';
import { esAdmin, puede } from './permisos';
import { inicioDe } from './secciones';

function Cargando() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-dvh place-content-center bg-background" role="status">
      <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{t('ui.cargando')}</span>
    </div>
  );
}

// Aviso de acceso denegado. `pantallaCompleta` para cuentas de cliente (fuera del layout).
export function SinPermiso({ pantallaCompleta = false }) {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <div
      className={
        pantallaCompleta
          ? 'grid min-h-dvh place-content-center bg-background p-6'
          : 'grid place-content-center py-20'
      }
    >
      <title>{`${t('admin.sinPermiso.titulo')} · Kuski`}</title>
      <div className="grid max-w-md justify-items-center gap-4 text-center">
        <span className="grid size-14 place-content-center rounded-full bg-secondary text-primary">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-h3">{t('admin.sinPermiso.titulo')}</h1>
        <p className="text-muted-foreground">
          {pantallaCompleta ? t('admin.sinPermiso.cliente') : t('admin.sinPermiso.descripcion')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary">
            <Link to={pantallaCompleta ? '/' : '/admin'}>
              {pantallaCompleta ? t('admin.volverTienda') : t('admin.sinPermiso.volver')}
            </Link>
          </Button>
          {pantallaCompleta && (
            <Button variant="ghost" onClick={() => logout.mutate()} loading={logout.isPending}>
              {t('admin.sesion.cambiarCuenta')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Protege todo /admin: sin sesión lleva al login del panel (y vuelve después) y una cuenta de
 * cliente ve un aviso. La API aplica los mismos permisos en cada endpoint: esto solo evita
 * mostrar pantallas que no podrían cargar.
 */
export function RequireAdmin() {
  const location = useLocation();
  const { data: usuario, isPending } = useSesion();

  if (isPending) return <Cargando />;
  if (!usuario) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  if (!esAdmin(usuario.rol)) return <SinPermiso pantallaCompleta />;
  return <Outlet />;
}

// Protege una sección del panel según la matriz de permisos.
export function RequirePermiso({ permiso }) {
  const { data: usuario } = useSesion();
  return puede(usuario?.rol, permiso) ? <Outlet /> : <SinPermiso />;
}

// /admin → primera sección que el rol puede usar.
export function AdminInicio() {
  const { data: usuario } = useSesion();
  return <Navigate to={inicioDe(usuario?.rol)} replace />;
}
