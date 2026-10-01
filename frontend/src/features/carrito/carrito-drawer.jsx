import { ArrowRight, Truck } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { RUTA_CHECKOUT } from './rutas';
import { useCarrito } from './carrito-context';
import { LineaCarrito, MontoCarrito } from './linea-carrito';

function LineasSkeleton() {
  return (
    <div className="grid gap-5 py-5" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="aspect-4/5 w-20 rounded-lg" />
          <div className="grid flex-1 content-start gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-9 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Drawer lateral del carrito. Se abre desde el header y al agregar desde la ficha del producto.
export function CarritoDrawer() {
  const { t } = useTranslation();
  const { carrito, abierto, setAbierto, cargando, actualizando } = useCarrito();
  const cerrar = () => setAbierto(false);
  const vacio = carrito.lineas.length === 0;
  const hayAvisos = carrito.lineas.some((l) => l.aviso);

  return (
    <Drawer open={abierto} onOpenChange={setAbierto}>
      <DrawerContent side="right" className="text-foreground">
        <DrawerHeader>
          <DrawerTitle>{t('carrito.titulo')}</DrawerTitle>
          <DrawerDescription>
            {vacio ? t('carrito.vacio') : t('carrito.unidades', { count: carrito.totalUnidades })}
          </DrawerDescription>
        </DrawerHeader>

        {vacio && !cargando ? (
          <DrawerBody className="flex items-center">
            <EmptyState
              objeto="canasta"
              headingLevel={3}
              titulo={t('carrito.vacio')}
              descripcion={t('carrito.vacioDescripcion')}
              className="w-full border-0 bg-transparent"
              accion={
                <Button asChild onClick={cerrar}>
                  <Link to="/catalogo">
                    {t('carrito.explorar')}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          </DrawerBody>
        ) : (
          <>
            <DrawerBody className="py-0">
              {cargando && vacio ? (
                <LineasSkeleton />
              ) : (
                <ul className="divide-y">
                  <AnimatePresence initial={false}>
                    {carrito.lineas.map((linea) => (
                      <LineaCarrito
                        key={linea.productoId}
                        linea={linea}
                        moneda={carrito.moneda}
                        onNavegar={cerrar}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </DrawerBody>

            <DrawerFooter>
              <div
                className={cn(
                  'flex items-baseline justify-between gap-4 transition-opacity',
                  actualizando && 'opacity-70',
                )}
                aria-live="polite"
              >
                <span className="font-semibold">{t('carrito.subtotal')}</span>
                <MontoCarrito monto={carrito.subtotal} moneda={carrito.moneda} animate size="lg" />
              </div>
              <p className="flex gap-2 text-sm text-muted-foreground">
                <Truck className="mt-0.5 size-4 shrink-0 text-musgo" aria-hidden="true" />
                {t('carrito.notaEnvio')}
              </p>
              <Button asChild size="lg" onClick={cerrar} disabled={hayAvisos}>
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
                <p className="text-center text-sm text-error">{t('carrito.ajustaAvisos')}</p>
              )}
              <Button asChild variant="secondary" onClick={cerrar}>
                <Link to="/carrito">{t('carrito.verResumen')}</Link>
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
