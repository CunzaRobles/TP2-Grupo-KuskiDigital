import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useDestacados } from '@/features/catalogo/api';
import { ProductCard, ProductCardSkeleton } from '@/features/catalogo/product-card';
import { SectionError, SectionHeading } from './section-heading';

const CANTIDAD = 8;

export function Destacados() {
  const { t } = useTranslation();
  const { data: productos, isPending, isError, refetch } = useDestacados({ limit: CANTIDAD });

  if (!isPending && !isError && productos.length === 0) return null;

  return (
    <section aria-labelledby="destacados-titulo" className="container-page grid gap-10 pb-section">
      <SectionHeading
        id="destacados-titulo"
        eyebrow={t('home.destacados.eyebrow')}
        title={t('home.destacados.titulo')}
        description={t('home.destacados.descripcion')}
        action={
          <Button asChild variant="link" className="px-0">
            <Link to="/catalogo">
              {t('home.destacados.verTodo')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {isError ? (
        <SectionError onRetry={refetch} />
      ) : (
        <ul
          className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4"
          aria-busy={isPending || undefined}
        >
          {isPending
            ? Array.from({ length: CANTIDAD }, (_, i) => (
                <li key={i}>
                  <ProductCardSkeleton />
                </li>
              ))
            : productos.map((producto) => (
                <li key={producto.id}>
                  <ProductCard producto={producto} />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}
