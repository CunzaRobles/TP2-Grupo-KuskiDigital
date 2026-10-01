import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategorias } from '@/features/catalogo/api';
import { cn } from '@/lib/utils';
import { imagenResponsiva } from '@/lib/imagen';
import { SectionError, SectionHeading } from './section-heading';

// Grilla bento de 4 celdas de distinto tamaño (la primera categoría es la protagonista).
// Móvil: una ancha, una panorámica y dos cuadradas. Escritorio: 4×2 con la primera en 2×2.
const CELDAS = [
  'col-span-2 aspect-4/3 md:row-span-2 md:aspect-auto',
  'col-span-2 aspect-video md:aspect-auto',
  'col-span-1 aspect-square md:aspect-auto',
  'col-span-1 aspect-square md:aspect-auto',
];

const GRILLA =
  'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-[repeat(2,minmax(15rem,1fr))]';

function CategoriaCard({ categoria, indice }) {
  const { t } = useTranslation();
  const principal = indice === 0;
  const nombre = t(`catalogo.categorias.${categoria.slug}.nombre`, {
    defaultValue: categoria.nombre,
  });

  return (
    <Link
      to={`/catalogo?categoria=${categoria.slug}`}
      className={cn(
        'group relative isolate flex overflow-hidden rounded-2xl bg-cafe text-alpaca shadow-card',
        CELDAS[indice],
      )}
    >
      {categoria.imagenUrl && (
        <img
          {...imagenResponsiva(categoria.imagenUrl, '(min-width: 768px) 50vw, 100vw')}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-400 ease-andino group-hover:scale-105"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-cafe via-cafe/55 via-45% to-cafe/0 transition-opacity duration-400 ease-andino group-hover:opacity-90"
      />

      <div className="mt-auto flex w-full items-end justify-between gap-4 p-4 sm:p-6">
        <div className="grid gap-1.5">
          {categoria.totalProductos != null && (
            <p className="eyebrow text-maiz">
              {t('home.categorias.productos', { count: categoria.totalProductos })}
            </p>
          )}
          <h3
            className={cn('font-serif leading-tight', principal ? 'text-h2' : 'text-h4 sm:text-h3')}
          >
            {nombre}
          </h3>
          <p
            className={cn(
              'max-w-sm text-sm text-alpaca/80',
              indice === 0 && 'hidden sm:block',
              indice === 1 && 'hidden lg:block',
              indice > 1 && 'hidden',
            )}
          >
            {t(`catalogo.categorias.${categoria.slug}.descripcion`, {
              defaultValue: categoria.descripcion,
            })}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-alpaca/40 transition duration-300 ease-andino group-hover:border-maiz group-hover:bg-maiz group-hover:text-cafe sm:inline-flex"
        >
          <ArrowUpRight className="size-5 transition-transform duration-300 ease-andino group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function CategoriasBento() {
  const { t } = useTranslation();
  const { data: categorias, isPending, isError, refetch } = useCategorias();

  return (
    <section aria-labelledby="categorias-titulo" className="container-page grid gap-10 py-section">
      <SectionHeading
        id="categorias-titulo"
        eyebrow={t('home.categorias.eyebrow')}
        title={t('home.categorias.titulo')}
        description={t('home.categorias.descripcion')}
      />

      {isError ? (
        <SectionError onRetry={refetch} />
      ) : (
        <div className={GRILLA} aria-busy={isPending || undefined}>
          {isPending
            ? CELDAS.map((celda, i) => <Skeleton key={i} className={cn('rounded-2xl', celda)} />)
            : categorias
                .slice(0, CELDAS.length)
                .map((categoria, i) => (
                  <CategoriaCard key={categoria.id} categoria={categoria} indice={i} />
                ))}
        </div>
      )}
    </section>
  );
}
