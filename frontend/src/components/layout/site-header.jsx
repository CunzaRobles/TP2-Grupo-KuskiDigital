import { Menu, ShoppingBag, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { esAdmin } from '@/features/admin/permisos';
import { useSesion } from '@/features/auth/api';
import { useCarrito } from '@/features/carrito/carrito-context';
import { useScrolled } from '@/lib/hooks/use-scrolled';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';
import { CurrencySelect, LanguageSelect } from './preference-selects';

const ENLACES_NAV = [
  { to: '/catalogo', clave: 'nav.catalogo' },
  { to: '/origen', clave: 'nav.origen' },
  { to: '/nosotros', clave: 'nav.nosotros' },
];

/**
 * Header persistente (fijo). Con `transparente` (home) arranca sin fondo y con texto claro
 * sobre el hero; al hacer scroll se compacta y gana fondo con desenfoque.
 */
export function SiteHeader({ transparente = false }) {
  const { t } = useTranslation();
  const scrolled = useScrolled();
  const { totalUnidades, iconoCarritoRef, abrir: abrirCarrito } = useCarrito();
  const { data: usuario } = useSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const sobreHero = transparente && !scrolled;

  const control = sobreHero ? 'text-alpaca hover:bg-alpaca/15' : undefined;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,box-shadow,color] duration-300 ease-andino',
        sobreHero && 'border-transparent bg-transparent text-alpaca',
        !sobreHero && scrolled && 'border-border bg-background/90 shadow-soft backdrop-blur-md',
        !sobreHero && !scrolled && 'border-transparent bg-background',
      )}
    >
      <div
        className={cn(
          'container-page flex items-center gap-2 transition-[height] duration-300 ease-andino sm:gap-4',
          scrolled ? 'h-header-compact' : 'h-header',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('-ml-2 md:hidden', control)}
          aria-label={t('nav.abrirMenu')}
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <Link to="/" className="rounded-md" aria-label="Kuski Digital">
          <Logo compact={scrolled} tone={sobreHero ? 'light' : 'dark'} />
        </Link>

        <nav aria-label={t('nav.principal')} className="ml-8 hidden md:block">
          <ul className="flex items-center gap-7">
            {ENLACES_NAV.map(({ to, clave }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'relative py-1 text-sm font-semibold transition-colors',
                      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-current after:transition-transform after:duration-300 after:ease-andino hover:after:scale-x-100',
                      sobreHero ? 'hover:text-maiz' : 'hover:text-link',
                      isActive &&
                        (sobreHero ? 'text-maiz after:scale-x-100' : 'text-link after:scale-x-100'),
                    )
                  }
                >
                  {t(clave)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <LanguageSelect className={cn('hidden sm:inline-flex', control)} />
          <CurrencySelect className={control} />
          <Button asChild variant="ghost" size="icon" className={cn('relative', control)}>
            <Link
              to={!usuario ? '/login' : esAdmin(usuario.rol) ? '/admin' : '/cuenta'}
              aria-label={
                !usuario
                  ? t('auth.login.titulo')
                  : esAdmin(usuario.rol)
                    ? t('admin.titulo')
                    : t('cuenta.abrir', { nombre: usuario.nombre })
              }
            >
              <UserRound className="size-5" aria-hidden="true" />
              {usuario && (
                <span
                  className="absolute right-2.5 bottom-2.5 size-2 rounded-full bg-verde ring-2 ring-background"
                  aria-hidden="true"
                />
              )}
            </Link>
          </Button>
          <Button
            ref={iconoCarritoRef}
            variant="ghost"
            size="icon"
            className={cn('relative', control)}
            onClick={abrirCarrito}
            aria-haspopup="dialog"
            aria-label={t('carrito.abrir', { count: totalUnidades })}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            <AnimatePresence initial={false}>
              {totalUnidades > 0 && (
                <motion.span
                  key={totalUnidades}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={transicion('rapida')}
                  className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] leading-5 font-bold text-primary-foreground tabular-nums"
                  aria-hidden="true"
                >
                  {totalUnidades > 99 ? '99+' : totalUnidades}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      <MobileMenu open={menuAbierto} onOpenChange={setMenuAbierto} enlaces={ENLACES_NAV} />
    </header>
  );
}
