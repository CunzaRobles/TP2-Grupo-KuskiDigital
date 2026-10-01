import { useTranslation } from 'react-i18next';
import { Outlet, ScrollRestoration, useMatch } from 'react-router';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { CarritoDrawer } from '@/features/carrito/carrito-drawer';
import { cn } from '@/lib/utils';

// Layout de la tienda (siempre en modo claro). El header es fijo: en el home queda transparente
// sobre el hero; en el resto de páginas el contenido deja su espacio con pt-header.
export function TiendaLayout() {
  const { t } = useTranslation();
  const esHome = useMatch('/') !== null;

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('nav.saltarContenido')}
      </a>
      <SiteHeader transparente={esHome} />
      {/* min-h-dvh: el footer siempre empieza bajo el pliegue, así no salta (CLS) mientras
          la página carga sus datos y crece */}
      <main id="contenido" className={cn('min-h-dvh flex-1', !esHome && 'pt-header')}>
        <Outlet />
      </main>
      <SiteFooter />
      <CarritoDrawer />
      <ScrollRestoration />
    </div>
  );
}
