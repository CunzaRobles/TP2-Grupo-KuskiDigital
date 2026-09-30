import { ArrowLeft, ArrowRight, ListChecks, ShieldCheck, Truck } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCarrito } from './carrito-context';
import { LineaCarrito, MontoCarrito } from './linea-carrito';
import { RUTA_CHECKOUT } from './rutas';

const GARANTIAS = [
  { icono: Truck, clave: 'carrito.garantias.envio' },
  { icono: ListChecks, clave: 'carrito.garantias.pasos' },
  { icono: ShieldCheck, clave: 'carrito.garantias.pago' },
];

// Página /carrito: resumen completo antes del checkout. Nunca oculta costos: el envío y el
// IGV se anuncian como "se calculan en el siguiente paso" en lugar de omitirse.
export function CarritoPage() {
  const { t } = useTranslation();
  const { carrito, cargando, actualizando } = useCarrito();
  const vacio = carrito.lineas.length === 0;
  const hayAvisos = carrito.lineas.some((l) => l.aviso);

  return (
    <div className="container-page grid gap-8 py-10 sm:py-14">
      <title>{`${t('carrito.titulo')} · Kuski`}</title>
      <header className="grid gap-3">
        <p className="eyebrow text-link">{t('carrito.pagina.eyebrow')}</p>
        <h1 className="text-h1">{t('carrito.titulo')}</h1>
        {!vacio && (
          <p className="text-lead text-muted-foreground">
            {t('carrito.unidades', { count: carrito.totalUnidades })}
          </p>
        )}
      </header>
      <AndeanDivider />

      {vacio && !cargando ? (
        <EmptyState
          objeto="canasta"
          titulo={t('carrito.vacio')}
          descripcion={t('carrito.vacioDescripcion')}
          accion={
            <Button asChild>
              <Link to="/catalogo">
                {t('carrito.explorar')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
          <section aria-labelledby="carrito-productos">
            <h2 id="carrito-productos" className="sr-only">
              {t('carrito.productos')}
            </h2>
            {cargando && vacio ? (
              <div className="grid gap-4" aria-hidden="true">
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
              </div>
            ) : (
              <ul className="divide-y border-y">
                <AnimatePresence initial={false}>
                  {carrito.lineas.map((linea) => (
                    <LineaCarrito
                      key={linea.productoId}
                      linea={linea}
                      moneda={carrito.moneda}
                      variante="pagina"
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <Button asChild variant="link" className="mt-6 px-0">
              <Link to="/catalogo">
                <ArrowLeft aria-hidden="true" />
                {t('carrito.seguirComprando')}
              </Link>
            </Button>
          </section>

          <aside
            aria-labelledby="carrito-resumen"
            className="grid gap-5 rounded-2xl border bg-card p-6 shadow-card lg:sticky lg:top-[calc(var(--spacing-header-compact)+1.5rem)] sm:p-8"
          >
            <h2 id="carrito-resumen" className="text-h3">
              {t('carrito.resumen')}
            </h2>

            <dl
              className={cn('grid gap-3 text-sm transition-opacity', actualizando && 'opacity-70')}
            >
              <div className="flex items-baseline justify-between gap-4">
                <dt>{t('carrito.subtotalProductos', { count: carrito.totalUnidades })}</dt>
                <dd>
                  <MontoCarrito monto={carrito.subtotal} moneda={carrito.moneda} animate />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
                <dt>{t('carrito.envio')}</dt>
                <dd>{t('carrito.enCheckout')}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
                <dt>{t('carrito.igv')}</dt>
                <dd>{t('carrito.enCheckout')}</dd>
              </div>
            </dl>

            <div
              className="flex items-baseline justify-between gap-4 border-t pt-5"
              aria-live="polite"
            >
              <span className="font-semibold">{t('carrito.totalProvisional')}</span>
              <MontoCarrito monto={carrito.subtotal} moneda={carrito.moneda} animate size="xl" />
            </div>
            <p className="text-sm text-muted-foreground">{t('carrito.notaEnvio')}</p>

            <Button asChild size="lg">
              <Link
                to={RUTA_CHECKOUT}
                aria-disabled={hayAvisos || undefined}
                className={cn(hayAvisos && 'pointer-events-none opacity-50')}
              >
                {t('carrito.irCheckout')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {hayAvisos && (
              <p className="text-center text-sm text-terracota-700">{t('carrito.ajustaAvisos')}</p>
            )}

            <ul className="grid gap-3 border-t pt-5 text-sm text-muted-foreground">
              {GARANTIAS.map(({ icono: Icono, clave }) => (
                <li key={clave} className="flex items-center gap-3">
                  <Icono className="size-4 shrink-0 text-verde" aria-hidden="true" />
                  {t(clave)}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
