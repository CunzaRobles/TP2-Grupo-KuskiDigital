import {
  ArrowLeft,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '@/components/layout/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { ThemeScope } from '@/components/ui/theme-scope';
import { BusquedaRapida } from '@/features/admin/busqueda-rapida';
import { GRUPOS, seccionesDe } from '@/features/admin/secciones';
import { useLogout, useSesion } from '@/features/auth/api';
import { cn } from '@/lib/utils';

const CLAVE_TEMA = 'kuski.admin.tema';
const CLAVE_SIDEBAR = 'kuski.admin.sidebar';

const leer = (clave, porDefecto) => {
  try {
    return window.localStorage.getItem(clave) ?? porDefecto;
  } catch {
    return porDefecto;
  }
};

const guardar = (clave, valor) => {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // preferencia solo en memoria
  }
};

// Menú lateral agrupado. Solo muestra las secciones que el rol puede usar.
function Navegacion({ rol, colapsado = false, onNavegar }) {
  const { t } = useTranslation();
  const secciones = seccionesDe(rol);

  return (
    <nav aria-label={t('admin.menu')} className="grid gap-5">
      {GRUPOS.map((grupo) => {
        const items = secciones.filter((s) => s.grupo === grupo);
        if (!items.length) return null;
        return (
          <div key={grupo} className="grid gap-1">
            <p className={cn('eyebrow px-3 pb-1 text-muted-foreground', colapsado && 'sr-only')}>
              {t(`admin.grupos.${grupo}`)}
            </p>
            <ul className="grid gap-0.5">
              {items.map(({ clave, ruta, Icono }) => (
                <li key={clave}>
                  <NavLink
                    to={ruta}
                    onClick={onNavegar}
                    title={colapsado ? t(`admin.secciones.${clave}`) : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200',
                        colapsado && 'justify-center px-0',
                        isActive
                          ? 'bg-card text-foreground shadow-soft before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )
                    }
                  >
                    <Icono className="size-4 shrink-0" aria-hidden="true" />
                    <span className={cn(colapsado && 'sr-only')}>
                      {t(`admin.secciones.${clave}`)}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Usuario({ usuario, colapsado }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();

  const salir = () =>
    logout.mutate(undefined, { onSettled: () => navigate('/admin/login', { replace: true }) });

  return (
    <div className={cn('grid gap-2', colapsado && 'justify-items-center')}>
      {!colapsado && (
        <div className="grid gap-1 px-1">
          <p className="truncate text-sm font-semibold">
            {usuario.nombre} {usuario.apellido}
          </p>
          <Badge variant="outline">{t(`admin.roles.${usuario.rol}`)}</Badge>
        </div>
      )}
      <Button
        variant="ghost"
        size={colapsado ? 'icon-sm' : 'sm'}
        className={cn(!colapsado && 'justify-start')}
        onClick={salir}
        loading={logout.isPending}
        aria-label={colapsado ? t('admin.sesion.salir') : undefined}
        title={colapsado ? t('admin.sesion.salir') : undefined}
      >
        {!logout.isPending && <LogOut aria-hidden="true" />}
        {!colapsado && t('admin.sesion.salir')}
      </Button>
    </div>
  );
}

/**
 * Layout del panel: sidebar colapsable en escritorio (drawer en móvil), menú según el rol,
 * modo claro/oscuro y búsqueda rápida (Ctrl+K / ⌘K). Único lugar de la web con modo oscuro.
 */
export function AdminLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { data: usuario } = useSesion();
  const [tema, setTema] = useState(() => (leer(CLAVE_TEMA, 'light') === 'dark' ? 'dark' : 'light'));
  const [colapsado, setColapsado] = useState(() => leer(CLAVE_SIDEBAR, 'abierto') === 'colapsado');
  const [menuMovil, setMenuMovil] = useState(false);
  const [busqueda, setBusqueda] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBusqueda((abierta) => !abierta);
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  // Cada página empieza arriba.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);

  const alternarTema = () => {
    const nuevo = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevo);
    guardar(CLAVE_TEMA, nuevo);
  };

  const alternarSidebar = () => {
    setColapsado((c) => {
      guardar(CLAVE_SIDEBAR, c ? 'abierto' : 'colapsado');
      return !c;
    });
  };

  const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <ThemeScope theme={tema} className="flex min-h-dvh">
      <title>{`${t('admin.titulo')} · Kuski`}</title>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-surface transition-[width] duration-300 ease-andino lg:flex',
          colapsado ? 'w-18' : 'w-64',
        )}
      >
        <div className={cn('flex h-16 items-center', colapsado ? 'justify-center' : 'px-5')}>
          <Link to="/admin" className="rounded-md" aria-label={t('admin.titulo')}>
            <Logo compact className={cn(colapsado && '[&>span]:sr-only')} />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {usuario && <Navegacion rol={usuario.rol} colapsado={colapsado} />}
        </div>
        <div className="grid gap-2 border-t p-3">
          {usuario && <Usuario usuario={usuario} colapsado={colapsado} />}
          <Button
            asChild
            variant="ghost"
            size={colapsado ? 'icon-sm' : 'sm'}
            className={cn(!colapsado && 'justify-start', colapsado && 'justify-self-center')}
          >
            <Link to="/" title={colapsado ? t('admin.volverTienda') : undefined}>
              <ArrowLeft aria-hidden="true" />
              <span className={cn(colapsado && 'sr-only')}>{t('admin.volverTienda')}</span>
            </Link>
          </Button>
        </div>
      </aside>

      <Drawer open={menuMovil} onOpenChange={setMenuMovil}>
        <DrawerContent side="left" className="bg-surface">
          <DrawerTitle className="flex h-16 items-center px-5 text-base">
            <Logo compact />
          </DrawerTitle>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {usuario && <Navegacion rol={usuario.rol} onNavegar={() => setMenuMovil(false)} />}
          </div>
          <div className="grid gap-2 border-t p-3">{usuario && <Usuario usuario={usuario} />}</div>
        </DrawerContent>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMenuMovil(true)}
            aria-label={t('admin.abrirMenu')}
          >
            <Menu aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={alternarSidebar}
            aria-label={colapsado ? t('admin.expandirMenu') : t('admin.colapsarMenu')}
            aria-expanded={!colapsado}
          >
            {colapsado ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>

          <button
            type="button"
            onClick={() => setBusqueda(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-input bg-card px-3.5 text-sm text-muted-foreground shadow-soft transition-colors hover:border-foreground sm:max-w-sm"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('admin.buscar.placeholder')}</span>
            <kbd className="ml-auto hidden rounded border bg-surface px-1.5 py-0.5 font-sans text-xs sm:inline">
              {esMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={alternarTema}
            aria-label={tema === 'dark' ? t('admin.modoClaro') : t('admin.modoOscuro')}
            aria-pressed={tema === 'dark'}
          >
            {tema === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
        </header>
        {/* grid-cols-1 (minmax(0,1fr)): las tablas anchas hacen scroll dentro de su caja en
            lugar de ensanchar la página en móvil */}
        <main className="grid flex-1 grid-cols-1 content-start gap-6 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {usuario && (
        <BusquedaRapida abierta={busqueda} onCerrar={() => setBusqueda(false)} rol={usuario.rol} />
      )}
    </ThemeScope>
  );
}
