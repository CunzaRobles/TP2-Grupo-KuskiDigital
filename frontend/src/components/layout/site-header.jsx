import { Menu, ShoppingBag, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useSesion } from '@/features/auth/api';
import { useCarrito } from '@/features/carrito/carrito-context';
import { useScrolled } from '@/lib/hooks/use-scrolled';
import { transicion } from '@/lib/motion';
import { Link, NavLink } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';
import { CurrencySelect, LanguageSelect } from './preference-selects';

const ENLACES_NAV = [
  { to: '/catalogo', clave: 'nav.catalogo' },
  { to: '/origen', clave: 'nav.origen' },
  { to: '/nosotros', clave: 'nav.nosotros' },
];

// Sobre la foto del hero el header es transparente con texto Niebla: se redefinen los tokens
// que usan sus hijos (botones ghost, enlaces, foco). Cochinilla no va sobre fondo oscuro.
const SOBRE_HERO =
  'border-transparent bg-transparent [--foreground:var(--color-niebla)] [--link:var(--color-niebla)] [--ring:var(--color-niebla)] [--muted-foreground:rgb(238_240_236/0.8)] [--secondary:rgb(238_240_236/0.14)] [--background:var(--color-puna)]';

/**
 * Header persistente (fijo). En la home, transparente sobre el hero hasta que se hace scroll;
 * en el resto, y al bajar, fondo Niebla sólido con línea inferior y versión compacta. Las
 * transiciones responden al scroll del usuario.
 */
export function SiteHeader() {
  const { t } = useTranslation();
  const scrolled = useScrolled();
  const { totalUnidades, iconoCarritoRef, abrir: abrirCarrito } = useCarrito();
  const { data: usuario } = useSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const sobreHero = pathname === '/' && !scrolled;

  return (
    <header
      data-sobre-hero={sobreHero || undefined}
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b text-foreground transition-[background-color,border-color] duration-200 ease-andino [view-transition-name:site-header]',
        sobreHero ? SOBRE_HERO : 'border-border bg-background',
      )}
    >
      <div
        className={cn(
          'container-page flex items-center gap-2 transition-[height] duration-200 ease-andino sm:gap-4',
          scrolled ? 'h-header-compact' : 'h-header',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="-ml-2 md:hidden"
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
                      'relative py-1 text-sm font-semibold transition-colors hover:text-link',
                      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-200 after:ease-andino hover:after:scale-x-100',
                      isActive && 'text-link after:scale-x-100',
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
          <LanguageSelect className="hidden sm:inline-flex" />
          <CurrencySelect />
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link
              to={usuario ? '/cuenta' : '/login'}
              aria-label={
                usuario ? t('cuenta.abrir', { nombre: usuario.nombre }) : t('auth.login.titulo')
              }
            >
              <UserRound className="size-5" aria-hidden="true" />
              {usuario && (
                <span
                  className="absolute right-2.5 bottom-2.5 size-2 rounded-full bg-musgo ring-2 ring-background"
                  aria-hidden="true"
                />
              )}
            </Link>
          </Button>
          <Button
            ref={iconoCarritoRef}
            variant="ghost"
            size="icon"
            className="relative"
            onClick={abrirCarrito}
            aria-haspopup="dialog"
            aria-label={t('carrito.abrir', { count: totalUnidades })}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {/* Aparece con el primer producto; al llegar cada producto rebota (volar-al-carrito) */}
            <AnimatePresence initial={false}>
              {totalUnidades > 0 && (
                <motion.span
                  data-slot="contador-carrito"
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
