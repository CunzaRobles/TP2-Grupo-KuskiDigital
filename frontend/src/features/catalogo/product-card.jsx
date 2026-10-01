import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAgregar } from '@/features/carrito/boton-agregar';
import { useEnlaceProducto } from '@/features/producto/use-enlace-producto';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { ENLACE_EXTENDIDO } from './enlace-extendido';

const IMAGEN =
  'absolute inset-0 size-full object-cover transition-opacity duration-300 ease-andino';

/**
 * Tarjeta de producto: el hover solo cambia a la segunda foto; la altitud y la comunidad de
 * origen se ven siempre en texto pequeño. El botón "+" agrega al carrito sin salir de la página,
 * hace volar la foto hasta el icono del header y confirma con "Agregado".
 * `compartirImagen`: la foto se expande hasta la ficha (false en los relacionados de una ficha).
 */
export function ProductCard({ producto, compartirImagen = true, className }) {
  const { t, i18n } = useTranslation();
  const imagenRef = useRef(null);
  const { enlace, nombreImagen, propsEnlace } = useEnlaceProducto(producto.slug, {
    compartida: compartirImagen,
  });

  const [principal, secundaria] = producto.imagenes ?? [];
  const { comunidad, categoria } = producto;

  return (
    <article className={cn('group relative flex flex-col gap-4', className)}>
      <div
        className="relative aspect-4/5 overflow-hidden bg-muted"
        style={{ viewTransitionName: nombreImagen }}
      >
        {principal && (
          <img
            ref={imagenRef}
            src={principal.url}
            alt={principal.textoAlt ?? producto.nombre}
            loading="lazy"
            decoding="async"
            className={cn(IMAGEN, secundaria && 'group-hover:opacity-0')}
          />
        )}
        {secundaria && (
          <img
            src={secundaria.url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={cn(IMAGEN, 'opacity-0 group-hover:opacity-100')}
          />
        )}

        {!producto.disponible && (
          <Badge variant="neutral" className="absolute top-3 left-3">
            {t('producto.agotado')}
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          {categoria && (
            <p className="text-xs text-muted-foreground">
              {t(`catalogo.categorias.${categoria.slug}.nombre`, {
                defaultValue: categoria.nombre,
              })}
            </p>
          )}
          <h3 className="text-lg leading-snug font-semibold">
            {/* Enlace extendido: toda la tarjeta lleva a la ficha, salvo el botón "+" (z-10) */}
            <Link to={enlace} {...propsEnlace} className={ENLACE_EXTENDIDO}>
              {producto.nombre}
            </Link>
          </h3>
          {/* Procedencia siempre visible, en texto pequeño */}
          {comunidad && (
            <p className="flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
              {comunidad.altitudMsnm != null && (
                <span className="font-semibold text-foreground tabular-nums">
                  {t('producto.altitud', {
                    valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
                  })}
                </span>
              )}
              <span className="truncate">{comunidad.nombre}</span>
            </p>
          )}
          <Price amount={producto.precio?.monto} currency={producto.precio?.moneda} />
        </div>
        <BotonAgregar producto={producto} imagenRef={imagenRef} />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-4/5 rounded-none" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}
