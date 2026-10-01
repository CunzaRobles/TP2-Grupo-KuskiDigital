import { MapPin, Mountain, Plus } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useCarrito } from '@/features/carrito/carrito-context';
import { volarAlCarrito } from '@/features/carrito/volar-al-carrito';
import { formatNumber } from '@/lib/format';
import { imagenResponsiva } from '@/lib/imagen';
import { cn } from '@/lib/utils';

const IMAGEN = 'absolute inset-0 size-full object-cover transition duration-400 ease-andino';
// Ancho de la tarjeta: 2 columnas en móvil; 3 (catálogo) o 4 (home) en escritorio
const TAMANO = '(min-width: 1280px) 24vw, (min-width: 1024px) 33vw, 50vw';

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
        <MapPin className="size-3.5 shrink-0 text-maiz" aria-hidden="true" />
        <span className="truncate">{comunidad.nombre}</span>
      </span>
      {comunidad.altitudMsnm != null && (
        <span className="flex items-center gap-1.5">
          <Mountain className="size-3.5 shrink-0 text-maiz" aria-hidden="true" />
          {t('producto.altitud', {
            valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
          })}
        </span>
      )}
    </div>
  );
}

export function ProductCard({ producto, className }) {
  const { t } = useTranslation();
  const { agregar, iconoCarritoRef, abrir } = useCarrito();
  const imagenRef = useRef(null);

  const [principal, secundaria] = producto.imagenes ?? [];
  const { comunidad, categoria } = producto;
  const enlace = `/producto/${producto.slug}`;

  const alAgregar = () => {
    if (agregar(producto) > 0) {
      volarAlCarrito(imagenRef.current, iconoCarritoRef.current);
      toast.success(t('carrito.agregado'), {
        description: producto.nombre,
        action: { label: t('carrito.verCarrito'), onClick: abrir },
      });
    } else {
      toast.info(t('carrito.sinMasStock'), { description: producto.nombre });
    }
  };

  return (
    <article className={cn('group relative flex flex-col gap-4', className)}>
      <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-muted shadow-soft">
        {principal && (
          <img
            ref={imagenRef}
            {...imagenResponsiva(principal.url, TAMANO)}
            alt={principal.textoAlt ?? producto.nombre}
            loading="lazy"
            decoding="async"
            className={cn(IMAGEN, secundaria && 'group-hover:scale-[1.03] group-hover:opacity-0')}
          />
        )}
        {secundaria && (
          <img
            {...imagenResponsiva(secundaria.url, TAMANO)}
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
              'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-cafe/85 via-cafe/50 to-transparent p-4 pt-12 pr-16 text-alpaca',
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
            'absolute right-3 bottom-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-alpaca text-cafe shadow-lift',
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
        {/* Siempre dos líneas de alto: precios alineados y mismo alto que el skeleton */}
        <h3 className="min-h-[2lh] font-serif text-lg leading-snug">
          {/* Enlace extendido: toda la tarjeta lleva a la ficha, salvo el botón "+" (z-10) */}
          <Link
            to={enlace}
            className="rounded-sm transition-colors after:absolute after:inset-0 after:content-[''] hover:text-link"
          >
            {producto.nombre}
          </Link>
        </h3>
        {/* En pantallas táctiles no hay hover: la procedencia va bajo el nombre */}
        {comunidad && (
          <Origen
            comunidad={comunidad}
            className="hidden text-muted-foreground pointer-coarse:grid [&_svg]:text-verde"
          />
        )}
        <Price amount={producto.precio?.monto} currency={producto.precio?.moneda} />
      </div>
    </article>
  );
}

// Reproduce las cajas de línea de la tarjeta real (eyebrow, nombre en 2 líneas, origen en
// pantallas táctiles y precio): al llegar los datos la grilla no salta (CLS).
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-4/5 rounded-xl" />
      <div className="grid grid-cols-1 gap-1.5">
        <div className="eyebrow flex h-lh items-center">
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid h-[2lh] content-center gap-2 font-serif text-lg leading-snug">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="hidden gap-1 text-xs pointer-coarse:grid">
          <div className="flex h-lh items-center">
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="flex h-lh items-center">
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex h-lh items-center text-base">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
