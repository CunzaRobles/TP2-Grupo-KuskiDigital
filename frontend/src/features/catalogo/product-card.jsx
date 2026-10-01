import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAgregar } from '@/features/carrito/boton-agregar';
import { useEnlaceProducto } from '@/features/producto/use-enlace-producto';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { ENLACE_EXTENDIDO } from './enlace-extendido';
import { FotosProducto } from './fotos-producto';
import { useSegundaFoto } from './use-segunda-foto';

// Ancho de la foto en la grilla del catálogo (2 columnas; 3 desde lg con la barra de filtros).
const SIZES = '(min-width: 64rem) 22rem, 50vw';

/**
 * Procedencia en texto pequeño, siempre visible: altitud y comunidad en una línea (la
 * comunidad se recorta con puntos suspensivos si no cabe).
 */
export function Procedencia({ comunidad, nombre = comunidad?.nombre, className }) {
  const { t, i18n } = useTranslation();
  if (!comunidad) return null;
  return (
    <p className={cn('flex min-w-0 gap-x-1.5 text-xs text-muted-foreground', className)}>
      {comunidad.altitudMsnm != null && (
        <span className="shrink-0 font-semibold text-foreground tabular-nums">
          {t('producto.altitud', {
            valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
          })}
        </span>
      )}
      <span className="min-w-0 truncate" title={comunidad.nombre}>
        {nombre}
      </span>
    </p>
  );
}

/**
 * Tarjeta de producto: el hover solo cambia a la segunda foto; la altitud y la comunidad de
 * origen se ven siempre en texto pequeño. El nombre ocupa todo el ancho y debajo van el precio
 * y el botón "+", que agrega al carrito sin salir de la página, hace volar la foto hasta el
 * icono del header y confirma con "Agregado".
 * `compartirImagen`: la foto se expande hasta la ficha (false en los relacionados de una ficha).
 */
export function ProductCard({ producto, compartirImagen = true, className }) {
  const { t } = useTranslation();
  const imagenRef = useRef(null);
  const segunda = useSegundaFoto();
  const { enlace, nombreImagen, propsEnlace } = useEnlaceProducto(producto.slug, {
    compartida: compartirImagen,
  });
  const { categoria } = producto;

  return (
    <article
      className={cn('group relative flex h-full flex-col gap-4', className)}
      onPointerEnter={segunda.onPointerEnter}
    >
      <FotosProducto
        producto={producto}
        imagenRef={imagenRef}
        sizes={SIZES}
        segunda={segunda.activa}
        className="aspect-4/5"
        style={{ viewTransitionName: nombreImagen }}
      />

      {/* El precio y el "+" van al pie: alineados entre tarjetas aunque un nombre ocupe 2 líneas */}
      <div className="flex flex-1 flex-col gap-1">
        {categoria && (
          <p className="text-xs text-muted-foreground">
            {t(`catalogo.categorias.${categoria.slug}.nombre`, {
              defaultValue: categoria.nombre,
            })}
          </p>
        )}
        <h3 className="text-base leading-snug font-semibold sm:text-lg">
          {/* Enlace extendido: toda la tarjeta lleva a la ficha, salvo el botón "+" (z-10) */}
          <Link to={enlace} {...propsEnlace} className={ENLACE_EXTENDIDO}>
            {producto.nombre}
          </Link>
        </h3>
        <Procedencia comunidad={producto.comunidad} />
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <Price amount={producto.precio?.monto} currency={producto.precio?.moneda} />
          <BotonAgregar producto={producto} imagenRef={imagenRef} />
        </div>
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
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-11 w-1/3" />
      </div>
    </div>
  );
}
