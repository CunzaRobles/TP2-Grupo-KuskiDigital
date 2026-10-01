import { ImageOff, Trash2, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Price } from '@/components/ui/price';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { transicion } from '@/lib/motion';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { useCarrito } from './carrito-context';
import { MAX_POR_PRODUCTO } from './carrito-storage';

// Monto de una línea o skeleton mientras llega el precio en la moneda elegida.
export function MontoCarrito({ monto, moneda, className, ...props }) {
  if (monto === null || monto === undefined || !moneda) {
    return <Skeleton className={cn('inline-block h-5 w-16 align-middle', className)} />;
  }
  return <Price amount={monto} currency={moneda} className={className} {...props} />;
}

/**
 * Línea del carrito: foto, nombre, precio unitario, cantidad editable, quitar y subtotal.
 * `variante="pagina"` usa fotos más grandes (página /carrito); `onNavegar` cierra el drawer
 * al ir a la ficha del producto.
 */
export function LineaCarrito({ linea, moneda, variante = 'drawer', onNavegar }) {
  const { t } = useTranslation();
  const { cambiarCantidad, quitar } = useCarrito();
  const grande = variante === 'pagina';
  const maximo = Math.max(1, Math.min(linea.stock, MAX_POR_PRODUCTO));
  const noDisponible = linea.aviso === 'NO_DISPONIBLE';

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={transicion('base')}
      className={cn('flex gap-4 py-5', grande && 'sm:gap-6')}
    >
      <Link
        to={`/producto/${linea.slug}`}
        onClick={onNavegar}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          'relative shrink-0 overflow-hidden rounded-lg bg-muted',
          grande ? 'aspect-4/5 w-24 sm:w-32' : 'aspect-4/5 w-20',
        )}
      >
        {linea.imagen ? (
          <img
            src={linea.imagen.url}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn('size-full object-cover', noDisponible && 'opacity-50 grayscale')}
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-6 text-muted-foreground" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <h3
              className={cn(
                'font-semibold leading-snug',
                grande ? 'text-lg sm:text-xl' : 'text-base',
              )}
            >
              <Link
                to={`/producto/${linea.slug}`}
                onClick={onNavegar}
                className="rounded-sm transition-colors hover:text-link"
              >
                {linea.nombre}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('carrito.precioUnitario')}{' '}
              <MontoCarrito monto={linea.precioUnitario} moneda={moneda} className="font-medium" />
            </p>
          </div>
          <MontoCarrito
            monto={linea.subtotal}
            moneda={moneda}
            animate
            className={cn('shrink-0', grande && 'text-lg')}
          />
        </div>

        {linea.aviso && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-error" role="status">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {noDisponible
              ? t('carrito.aviso.NO_DISPONIBLE')
              : t('carrito.aviso.STOCK_INSUFICIENTE', { count: linea.stock })}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <QuantitySelector
            size="sm"
            value={linea.cantidad}
            max={maximo}
            onChange={(cantidad) => cambiarCantidad(linea.productoId, cantidad)}
            disabled={linea.pendiente || noDisponible}
            label={t('carrito.cantidadDe', { nombre: linea.nombre })}
          />
          <button
            type="button"
            onClick={() => quitar(linea.productoId)}
            disabled={linea.pendiente}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            aria-label={t('carrito.quitar', { nombre: linea.nombre })}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className={cn(!grande && 'sr-only sm:not-sr-only')}>
              {t('carrito.quitarCorto')}
            </span>
          </button>
        </div>
      </div>
    </motion.li>
  );
}
