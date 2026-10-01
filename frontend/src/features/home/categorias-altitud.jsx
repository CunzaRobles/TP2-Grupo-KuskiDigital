import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategorias } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { altitudMedia, posicionEnRegla } from './altitud';
import { SectionError, SectionHeading } from './section-heading';

// Desde md, cada tarjeta baja según su altitud: la categoría más alta queda arriba (escalera
// del valle a la cumbre). La cifra de altitud va sobre la imagen para que sean las cifras las
// que suben; las proporciones de imagen varían para que no sean todas iguales.
const DESNIVEL_REM = 12;
const PROPORCIONES = ['md:aspect-4/5', 'md:aspect-3/4', 'md:aspect-square', 'md:aspect-2/3'];

const desnivelDe = (categoria) => {
  const media = altitudMedia(categoria);
  return media == null ? 0 : (1 - posicionEnRegla(media)) * DESNIVEL_REM;
};

function RangoAltitud({ categoria }) {
  const { t, i18n } = useTranslation();
  const { altitudMin, altitudMax } = categoria;
  if (altitudMin == null) return null;

  const idioma = i18n.resolvedLanguage;
  const valor =
    altitudMin === altitudMax
      ? formatNumber(altitudMin, idioma)
      : `${formatNumber(altitudMin, idioma)}–${formatNumber(altitudMax, idioma)}`;

  return (
    <p className="font-display text-xl font-medium tracking-tight tabular-nums sm:text-2xl">
      {t('producto.altitud', { valor })}
    </p>
  );
}

function CategoriaCard({ categoria, indice }) {
  const { t } = useTranslation();
  const nombre = t(`catalogo.categorias.${categoria.slug}.nombre`, {
    defaultValue: categoria.nombre,
  });

  return (
    <Link
      to={`/catalogo?categoria=${categoria.slug}`}
      className="group grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-5 border-t border-border py-5 md:grid-cols-1 md:items-start md:gap-4 md:border-t-2 md:border-foreground md:pt-3 md:pb-0"
    >
      <div
        className={cn(
          'relative order-2 aspect-square overflow-hidden bg-muted',
          PROPORCIONES[indice % PROPORCIONES.length],
        )}
      >
        {categoria.imagenUrl && (
          <img
            src={categoria.imagenUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 ease-andino group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="grid gap-1.5">
        <RangoAltitud categoria={categoria} />
        <h3 className="text-h4 transition-colors group-hover:text-link">{nombre}</h3>
        {categoria.totalProductos != null && (
          <p className="text-sm text-muted-foreground">
            {t('home.categorias.productos', { count: categoria.totalProductos })}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CategoriasAltitud() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useCategorias();

  // Del valle a la cumbre: por altitud media; las categorías sin productos activos, al final
  const categorias = useMemo(
    () =>
      (data ?? []).toSorted(
        (a, b) => (altitudMedia(a) ?? Infinity) - (altitudMedia(b) ?? Infinity),
      ),
    [data],
  );

  return (
    <section aria-labelledby="categorias-titulo" className="container-page grid gap-10 pb-section">
      <SectionHeading
        id="categorias-titulo"
        title={t('home.categorias.titulo')}
        description={t('home.categorias.descripcion')}
      />

      {isError ? (
        <SectionError onRetry={refetch} />
      ) : (
        <ul
          className="grid border-b border-border md:grid-cols-4 md:items-start md:gap-6 md:border-b-0 lg:gap-10"
          aria-busy={isPending || undefined}
        >
          {isPending
            ? PROPORCIONES.map((proporcion) => (
                <li key={proporcion}>
                  <Skeleton className={cn('h-28 md:h-auto', proporcion)} />
                </li>
              ))
            : categorias.slice(0, 4).map((categoria, i) => (
                <li
                  key={categoria.id}
                  className="md:mt-(--desnivel)"
                  style={{ '--desnivel': `${desnivelDe(categoria)}rem` }}
                >
                  <CategoriaCard categoria={categoria} indice={i} />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
