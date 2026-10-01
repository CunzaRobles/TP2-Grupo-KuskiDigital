import { MapPin, Mountain, Plus } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgregarProducto } from '@/features/carrito/use-agregar-producto';
import { useEnlaceProducto } from '@/features/producto/use-enlace-producto';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';

const IMAGEN = 'absolute inset-0 size-full object-cover transition duration-400 ease-andino';

/**
 * Tarjeta de producto: al pasar el cursor cambia a la segunda foto y muestra comunidad y altitud
 * (en pantallas táctiles esos datos se ven siempre). El botón "+" agrega al carrito sin salir
 * de la página y hace volar la foto hasta el icono del header.
 */
// Comunidad y altitud de origen del producto.
function Origen({ comunidad, className }) {
  const { t, i18n } = useTranslation();

  return (
    <div className={cn('grid grid-cols-1 gap-1 text-xs font-semibold', className)}>
      <span className="flex items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0 text-ichu" aria-hidden="true" />
        <span className="truncate">{comunidad.nombre}</span>
      </span>
      {comunidad.altitudMsnm != null && (
        <span className="flex items-center gap-1.5">
          <Mountain className="size-3.5 shrink-0 text-ichu" aria-hidden="true" />
          {t('producto.altitud', {
            valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
          })}
        </span>
      )}
    </div>
  );
}

// `compartirImagen`: la foto se expande hasta la ficha (false en los relacionados de una ficha).
export function ProductCard({ producto, compartirImagen = true, className }) {
  const { t } = useTranslation();
  const agregarProducto = useAgregarProducto();
  const imagenRef = useRef(null);
  const { enlace, nombreImagen, propsEnlace } = useEnlaceProducto(producto.slug, {
    compartida: compartirImagen,
  });

  const [principal, secundaria] = producto.imagenes ?? [];
  const { comunidad, categoria } = producto;

  const alAgregar = () => agregarProducto(producto, imagenRef.current);

  return (
    <article className={cn('group relative flex flex-col gap-4', className)}>
      <div
        className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted shadow-soft"
        style={{ viewTransitionName: nombreImagen }}
      >
        {principal && (
          <img
            ref={imagenRef}
            src={principal.url}
            alt={principal.textoAlt ?? producto.nombre}
            loading="lazy"
            decoding="async"
            className={cn(IMAGEN, secundaria && 'group-hover:scale-[1.03] group-hover:opacity-0')}
          />
        )}
        {secundaria && (
          <img
            src={secundaria.url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={cn(
              IMAGEN,
              'scale-[1.03] opacity-0 group-hover:scale-100 group-hover:opacity-100',
            )}
          />
        )}

        {!producto.disponible && (
          <Badge variant="neutral" className="absolute top-3 left-3">
            {t('producto.agotado')}
          </Badge>
        )}

        {/* Con cursor: la procedencia aparece al pasar sobre la foto */}
        {comunidad && (
          <Origen
            comunidad={comunidad}
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-puna/85 via-puna/50 to-transparent p-4 pt-12 pr-16 text-white',
              'translate-y-2 opacity-0 transition duration-300 ease-andino',
              'group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100',
              'pointer-coarse:hidden',
            )}
          />
        )}

        <button
          type="button"
          onClick={alAgregar}
          disabled={!producto.disponible}
          aria-label={t('carrito.agregarProducto', { nombre: producto.nombre })}
          className={cn(
            'absolute right-3 bottom-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white text-puna shadow-lift',
            'transition duration-200 ease-andino hover:bg-primary hover:text-primary-foreground active:scale-95',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {categoria && (
          <p className="eyebrow text-muted-foreground">
            {t(`catalogo.categorias.${categoria.slug}.nombre`, { defaultValue: categoria.nombre })}
          </p>
        )}
        <h3 className="text-lg leading-snug font-semibold">
          {/* Enlace extendido: toda la tarjeta lleva a la ficha, salvo el botón "+" (z-10) */}
          <Link
            to={enlace}
            {...propsEnlace}
            className="rounded-sm transition-colors after:absolute after:inset-0 after:content-[''] hover:text-link"
          >
            {producto.nombre}
          </Link>
        </h3>
        {/* En pantallas táctiles no hay hover: la procedencia va bajo el nombre */}
        {comunidad && (
          <Origen
            comunidad={comunidad}
            className="hidden text-muted-foreground pointer-coarse:grid [&_svg]:text-musgo"
          />
        )}
        <Price amount={producto.precio?.monto} currency={producto.precio?.moneda} />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-4/5 rounded-xl" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}
