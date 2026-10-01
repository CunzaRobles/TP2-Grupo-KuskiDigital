import { LogOut, MapPin, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useLogout, useSesion } from '@/features/auth/api';
import { NavLink } from '@/lib/motion/enlaces';
import { useNavigate } from '@/lib/motion/use-navigate';
import { cn } from '@/lib/utils';

const SECCIONES = [
  { to: '/cuenta', end: true, icono: Package, clave: 'cuenta.nav.pedidos' },
  { to: '/cuenta/direcciones', icono: MapPin, clave: 'cuenta.nav.direcciones' },
];

// "Mi cuenta": saludo, cierre de sesión y navegación entre pedidos y direcciones.
export function CuentaLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: usuario } = useSesion();
  const logout = useLogout();

  // Primero sale de la zona privada: si se borrara antes la sesión, la ruta protegida
  // redirigiría al login.
  const salir = () => {
    navigate('/', { replace: true });
    logout.mutate();
    toast.success(t('cuenta.sesionCerrada'));
  };

  return (
    <div className="container-page grid gap-8 py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-3">
          <p className="eyebrow text-link">{t('cuenta.eyebrow')}</p>
          <h1 className="text-h1">{t('cuenta.saludo', { nombre: usuario?.nombre ?? '' })}</h1>
          <p className="text-muted-foreground">{usuario?.correo}</p>
        </div>
        <Button variant="secondary" onClick={salir} loading={logout.isPending}>
          <LogOut aria-hidden="true" />
          {t('cuenta.salir')}
        </Button>
      </header>

      <nav aria-label={t('cuenta.nav.label')}>
        <ul className="flex gap-2 overflow-x-auto border-b">
          {SECCIONES.map(({ to, end, icono: Icono, clave }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    '-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icono className="size-4" aria-hidden="true" />
                {t(clave)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Outlet />
      <AndeanDivider className="mt-6" />
    </div>
  );
}
