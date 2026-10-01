import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { useDestacados } from '@/features/catalogo/api';
import { useAgregarProducto } from '@/features/carrito/use-agregar-producto';
import { useEnlaceProducto } from '@/features/producto/use-enlace-producto';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { nombreCorto } from './altitud';
import { SectionError, SectionHeading } from './section-heading';

const CANTIDAD = 8;

// Grilla con líneas finas (sin sombras): 2 columnas en móvil, 3 en sm y 4 en lg. El primer
// destacado es grande (2×1 en móvil, 2×2 desde sm). El enlace al catálogo ocupa las celdas que
// sobran en la última fila, así la grilla nunca queda con huecos.
const GRILLA = { base: 2, sm: 3, lg: 4 };
const SPAN = {
  base: ['', 'col-span-1', 'col-span-2'],
  sm: ['', 'sm:col-span-1', 'sm:col-span-2', 'sm:col-span-3'],
  lg: ['', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4'],
};

// Celdas que ocupan n productos: el grande ocupa 2 en móvil y 4 desde sm
const restoDeFila = (columnas, celdas) => columnas - (celdas % columnas) || columnas;

const spanEnlace = (n) =>
  cn(
    SPAN.base[restoDeFila(GRILLA.base, n + 1)],
    SPAN.sm[restoDeFila(GRILLA.sm, n + 3)],
    SPAN.lg[restoDeFila(GRILLA.lg, n + 3)],
  );

const CELDA_GRANDE = 'col-span-2 sm:row-span-2';
const IMAGEN =
  'absolute inset-0 size-full object-cover transition-opacity duration-300 ease-andino';

function Destacado({ producto, grande }) {
  const { t, i18n } = useTranslation();
  const agregarProducto = useAgregarProducto();
  const imagenRef = useRef(null);
  const { enlace, nombreImagen, propsEnlace } = useEnlaceProducto(producto.slug);
  const [principal, secundaria] = producto.imagenes ?? [];
  const { comunidad } = producto;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col gap-4 bg-background p-3 sm:p-4',
        grande && 'sm:p-6',
      )}
    >
      <div
        className={cn(
          'relative aspect-4/5 overflow-hidden bg-muted',
          grande && 'aspect-4/3 sm:aspect-auto sm:min-h-72 sm:flex-1',
        )}
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
        {/* Al pasar el cursor se ve la segunda foto (respuesta a la acción del usuario) */}
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
          <h3 className={cn('leading-snug', grande ? 'text-h3' : 'text-base sm:text-lg')}>
            {/* Enlace extendido: toda la celda lleva a la ficha, salvo el botón "+" (z-10) */}
            <Link
              to={enlace}
              {...propsEnlace}
              className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-link"
            >
              {producto.nombre}
            </Link>
          </h3>
          {comunidad && (
            <p className="flex flex-wrap gap-x-1.5 text-sm text-muted-foreground">
              {comunidad.altitudMsnm != null && (
                <span className="font-semibold text-foreground tabular-nums">
                  {t('producto.altitud', {
                    valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
                  })}
                </span>
              )}
              <span title={comunidad.nombre}>{nombreCorto(comunidad.nombre)}</span>
            </p>
          )}
          <Price
            amount={producto.precio?.monto}
            currency={producto.precio?.moneda}
            size={grande ? 'lg' : 'md'}
          />
        </div>
        <button
          type="button"
          onClick={() => agregarProducto(producto, imagenRef.current)}
          disabled={!producto.disponible}
          aria-label={t('carrito.agregarProducto', { nombre: producto.nombre })}
          className={cn(
            'relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground',
            'transition-[background-color,transform] duration-200 ease-andino hover:bg-primary-hover active:scale-95',
            'disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground',
          )}
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function DestacadoSkeleton({ grande }) {
  return (
    <div className={cn('flex h-full flex-col gap-4 bg-background p-3 sm:p-4', grande && 'sm:p-6')}>
      <Skeleton className={cn('aspect-4/5', grande && 'aspect-4/3 sm:aspect-auto sm:flex-1')} />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function Destacados() {
  const { t } = useTranslation();
  const { data: productos, isPending, isError, refetch } = useDestacados({ limit: CANTIDAD });

  if (!isPending && !isError && productos.length === 0) return null;

  const total = isPending ? CANTIDAD : (productos?.length ?? 0);

  return (
    <section aria-labelledby="destacados-titulo" className="container-page grid gap-10 pb-section">
      <SectionHeading
        id="destacados-titulo"
        title={t('home.destacados.titulo')}
        description={t('home.destacados.descripcion')}
      />

      {isError ? (
        <SectionError onRetry={refetch} />
      ) : (
        <ul
          className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4"
          aria-busy={isPending || undefined}
        >
          {isPending
            ? Array.from({ length: CANTIDAD }, (_, i) => (
                <li key={i} className={cn(i === 0 && CELDA_GRANDE)}>
                  <DestacadoSkeleton grande={i === 0} />
                </li>
              ))
            : productos.map((producto, i) => (
                <li key={producto.id} className={cn(i === 0 && CELDA_GRANDE)}>
                  <Destacado producto={producto} grande={i === 0} />
                </li>
              ))}
          <li className={spanEnlace(total)}>
            <Link
              to="/catalogo"
              className="flex h-full min-h-32 items-end bg-background p-4 font-display text-lg font-medium tracking-tight underline-offset-4 transition-colors hover:bg-muted hover:underline sm:p-6"
            >
              {t('home.destacados.verTodo')}
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}
