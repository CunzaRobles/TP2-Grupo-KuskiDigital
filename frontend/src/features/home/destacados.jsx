import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { useDestacados } from '@/features/catalogo/api';
import { BotonAgregar } from '@/features/carrito/boton-agregar';
import { ENLACE_EXTENDIDO } from '@/features/catalogo/enlace-extendido';
import { FotosProducto } from '@/features/catalogo/fotos-producto';
import { Procedencia } from '@/features/catalogo/product-card';
import { useSegundaFoto } from '@/features/catalogo/use-segunda-foto';
import { useEnlaceProducto } from '@/features/producto/use-enlace-producto';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { nombreCorto } from './altitud';
import { SectionError, SectionHeading } from './section-heading';

const CANTIDAD = 8;

/*
 * Grilla editorial con líneas finas (sin sombras), en flujo denso para que no queden huecos:
 * 2 columnas en móvil, 3 en sm y 4 en lg.
 *   - protagonista (el primero): 2×1 en móvil y 2×2 desde sm, con la foto más grande.
 *   - ancha (la sexta): ocupa 2 columnas, con la foto a la izquierda desde sm.
 *   - normal: 1 celda.
 * El enlace al catálogo ocupa las celdas que sobran en la última fila.
 */
const VARIANTES = { 0: 'protagonista', 5: 'ancha' };
const varianteDe = (i) => VARIANTES[i] ?? 'normal';

const CELDA = {
  protagonista: 'col-span-2 sm:row-span-2',
  ancha: 'col-span-2',
  normal: '',
};
// Celdas que ocupa cada variante por punto de quiebre
const CELDAS = {
  base: { protagonista: 2, ancha: 2, normal: 1 },
  sm: { protagonista: 4, ancha: 2, normal: 1 },
  lg: { protagonista: 4, ancha: 2, normal: 1 },
};
const GRILLA = { base: 2, sm: 3, lg: 4 };
const SPAN = {
  base: ['', 'col-span-1', 'col-span-2'],
  sm: ['', 'sm:col-span-1', 'sm:col-span-2', 'sm:col-span-3'],
  lg: ['', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4'],
};

const celdasOcupadas = (n, bp) =>
  Array.from({ length: n }, (_, i) => CELDAS[bp][varianteDe(i)]).reduce((a, b) => a + b, 0);
const restoDeFila = (bp, n) => GRILLA[bp] - (celdasOcupadas(n, bp) % GRILLA[bp]) || GRILLA[bp];

const spanEnlace = (n) =>
  cn(
    SPAN.base[restoDeFila('base', n)],
    SPAN.sm[restoDeFila('sm', n)],
    SPAN.lg[restoDeFila('lg', n)],
  );

// Relación de aspecto y ancho de la foto (sizes) por variante.
const FOTO = {
  protagonista: 'aspect-4/3 sm:aspect-auto sm:min-h-80 sm:flex-1',
  ancha: 'aspect-4/3 sm:aspect-auto sm:h-full sm:min-h-56 sm:w-3/5 sm:shrink-0',
  normal: 'aspect-4/5',
};
const SIZES = {
  protagonista: '(min-width: 64rem) 36rem, (min-width: 40rem) 66vw, 100vw',
  ancha: '(min-width: 64rem) 22rem, (min-width: 40rem) 40vw, 100vw',
  normal: '(min-width: 64rem) 18rem, (min-width: 40rem) 33vw, 50vw',
};

function Destacado({ producto, variante }) {
  const imagenRef = useRef(null);
  const segunda = useSegundaFoto();
  const { enlace, nombreImagen, propsEnlace } = useEnlaceProducto(producto.slug);
  const { comunidad } = producto;
  const protagonista = variante === 'protagonista';

  return (
    <article
      onPointerEnter={segunda.onPointerEnter}
      className={cn(
        'group relative flex h-full flex-col gap-4 bg-background p-3 sm:p-4',
        protagonista && 'sm:gap-5 sm:p-6',
        variante === 'ancha' && 'sm:flex-row sm:items-stretch sm:gap-6',
      )}
    >
      {/* El hover solo cambia a la segunda foto (respuesta a la acción del usuario) */}
      <FotosProducto
        producto={producto}
        imagenRef={imagenRef}
        sizes={SIZES[variante]}
        segunda={segunda.activa}
        className={FOTO[variante]}
        style={{ viewTransitionName: nombreImagen }}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-end gap-1">
        {/* Procedencia siempre visible, en texto pequeño */}
        <Procedencia comunidad={comunidad} nombre={comunidad && nombreCorto(comunidad.nombre)} />
        <h3
          className={cn(
            'leading-snug',
            protagonista
              ? 'text-h3'
              : variante === 'ancha'
                ? 'text-lg sm:text-xl'
                : 'text-base sm:text-lg',
          )}
        >
          {/* Enlace extendido: toda la celda lleva a la ficha (y muestra el foco), salvo el "+" */}
          <Link to={enlace} {...propsEnlace} className={ENLACE_EXTENDIDO}>
            {producto.nombre}
          </Link>
        </h3>
        <div className="mt-1 flex items-center justify-between gap-3">
          <Price
            amount={producto.precio?.monto}
            currency={producto.precio?.moneda}
            size={protagonista ? 'lg' : 'md'}
          />
          <BotonAgregar producto={producto} imagenRef={imagenRef} />
        </div>
      </div>
    </article>
  );
}

function DestacadoSkeleton({ variante }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-4 bg-background p-3 sm:p-4',
        variante === 'protagonista' && 'sm:p-6',
      )}
    >
      <Skeleton className={cn('rounded-none', FOTO[variante])} />
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
          className="grid grid-flow-row-dense grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4"
          aria-busy={isPending || undefined}
        >
          {isPending
            ? Array.from({ length: CANTIDAD }, (_, i) => (
                <li key={i} className={CELDA[varianteDe(i)]}>
                  <DestacadoSkeleton variante={varianteDe(i)} />
                </li>
              ))
            : productos.map((producto, i) => (
                <li key={producto.id} className={CELDA[varianteDe(i)]}>
                  <Destacado producto={producto} variante={varianteDe(i)} />
                </li>
              ))}
          <li className={spanEnlace(total)}>
            <Link
              to="/catalogo"
              className="flex h-full min-h-16 items-center bg-background p-4 font-display text-lg font-medium tracking-tight underline-offset-4 transition-colors hover:bg-muted hover:underline focus-visible:-outline-offset-2 sm:p-6"
            >
              {t('home.destacados.verTodo')}
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}
