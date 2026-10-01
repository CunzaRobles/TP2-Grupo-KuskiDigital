import { useTranslation } from 'react-i18next';
import { ScrollRestoration } from 'react-router';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { CarritoDrawer } from '@/features/carrito/carrito-drawer';
import { LenisProvider } from '@/lib/motion/lenis-provider';
import { TransicionRuta } from '@/lib/motion/transicion-ruta';

// Layout de la tienda (siempre en modo claro). El header es fijo: el contenido deja su espacio
// con pt-header en todas las páginas (el hero de la home lo recupera con -mt-header). Scroll suave con Lenis (solo en la tienda: el
// admin mantiene el scroll nativo) y fundido corto entre rutas.
export function TiendaLayout() {
  const { t } = useTranslation();

  return (
    <LenisProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-button bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('nav.saltarContenido')}
        </a>
        <SiteHeader />
        <main id="contenido" className="flex-1 pt-header">
          <TransicionRuta />
        </main>
        <SiteFooter />
        <CarritoDrawer />
        <ScrollRestoration />
      </div>
    </LenisProvider>
  );
}
