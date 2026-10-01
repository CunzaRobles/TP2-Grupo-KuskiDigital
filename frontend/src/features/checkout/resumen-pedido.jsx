import { ImageOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Price } from '@/components/ui/price';
import { MontoCarrito } from '@/features/carrito/linea-carrito';
import { formatMoney, formatNumber } from '@/lib/format';
import { miniatura } from '@/lib/imagen';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';

function Fila({ etiqueta, detalle, children, className }) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={transicion('base')}
      className={cn('flex items-baseline justify-between gap-4', className)}
    >
      <dt className="grid">
        <span>{etiqueta}</span>
        {detalle && <span className="text-xs text-muted-foreground">{detalle}</span>}
      </dt>
      <dd className="text-right">{children}</dd>
    </motion.div>
  );
}

/**
 * Resumen del pedido: productos, subtotal, envío, IGV, tipo de cambio y total. Nunca oculta un
 * costo: lo que aún no se puede calcular se dice ("elige el país") en lugar de omitirse.
 */
export function ResumenPedido({ carrito, cotizacion, actualizando, paisCodigo, className }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const moneda = cotizacion?.moneda ?? carrito.moneda;
  const resumen = cotizacion?.resumen;
  const opcion = cotizacion?.opcionesEnvio.find((o) => o.metodo === cotizacion.metodoEnvio);

  return (
    <section
      aria-labelledby="resumen-pedido"
      className={cn('grid gap-5 rounded-2xl border bg-card p-6 shadow-card', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="resumen-pedido" className="text-h4">
          {t('checkout.resumen.titulo')}
        </h2>
        <span className="text-sm text-muted-foreground">
          {t('carrito.unidades', { count: carrito.totalUnidades })}
        </span>
      </div>

      <ul className="grid max-h-64 gap-3 overflow-y-auto pr-1">
        {carrito.lineas.map((l) => (
          <li key={l.productoId} className="flex items-center gap-3 text-sm">
            <span className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {l.imagen ? (
                <img
                  {...miniatura(l.imagen.url, 48)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff className="absolute inset-0 m-auto size-4 text-muted-foreground" />
              )}
              <span className="absolute top-0 right-0 min-w-5 rounded-bl-md bg-cafe px-1 text-center text-[0.6875rem] leading-5 font-bold text-alpaca tabular-nums">
                {l.cantidad}
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate">{l.nombre}</span>
            <MontoCarrito monto={l.subtotal} moneda={carrito.moneda} className="text-sm" />
          </li>
        ))}
      </ul>

      <dl
        className={cn(
          'grid gap-3 border-t pt-5 text-sm transition-opacity duration-300',
          actualizando && 'opacity-60',
        )}
        aria-busy={actualizando || undefined}
      >
        <AnimatePresence initial={false}>
          <Fila key="subtotal" etiqueta={t('checkout.resumen.subtotal')}>
            <MontoCarrito monto={resumen?.subtotal ?? carrito.subtotal} moneda={moneda} animate />
          </Fila>
          <Fila
            key="envio"
            etiqueta={t('checkout.resumen.envio')}
            detalle={
              opcion &&
              t('checkout.metodo.detalle', {
                transportista: opcion.transportista,
                min: opcion.diasMin,
                max: opcion.diasMax,
              })
            }
          >
            {paisCodigo ? (
              <MontoCarrito monto={resumen?.envio} moneda={moneda} animate />
            ) : (
              <span className="text-muted-foreground">{t('checkout.resumen.eligePais')}</span>
            )}
          </Fila>
          {cotizacion &&
            (cotizacion.igv.aplica ? (
              <Fila key="igv" etiqueta={t('checkout.resumen.igv')}>
                <Price amount={resumen.igv} currency={moneda} animate />
              </Fila>
            ) : (
              <Fila
                key="igv-no"
                etiqueta={t('checkout.resumen.igvNoAplica')}
                detalle={t('checkout.resumen.igvNoAplicaDetalle')}
              >
                <Price amount={0} currency={moneda} className="text-muted-foreground" />
              </Fila>
            ))}
        </AnimatePresence>
      </dl>

      <div className="grid gap-2 border-t pt-5" aria-live="polite">
        <div className="flex items-baseline justify-between gap-4">
          <span className="flex items-center gap-2 font-semibold">
            {t('checkout.resumen.total')}
            {actualizando && (
              <LoaderCircle
                className="size-4 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </span>
          {resumen ? (
            <Price amount={resumen.total} currency={moneda} size="xl" animate />
          ) : (
            <span className="text-sm text-muted-foreground">
              {t('checkout.resumen.totalPendiente')}
            </span>
          )}
        </div>
        {cotizacion && cotizacion.moneda !== 'PEN' && (
          <p className="text-right text-xs text-muted-foreground">
            {t('checkout.resumen.tipoCambio', {
              moneda: cotizacion.moneda,
              valor: formatNumber(cotizacion.tipoCambio, idioma, { minimumFractionDigits: 4 }),
              totalPen: formatMoney(resumen.totalPen, 'PEN', idioma),
            })}
          </p>
        )}
      </div>

      <p className="flex gap-2 rounded-lg bg-surface p-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-verde" aria-hidden="true" />
        {t('checkout.resumen.sinCostosOcultos')}
      </p>
    </section>
  );
}
