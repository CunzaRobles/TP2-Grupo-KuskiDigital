import { ArrowRight, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard, ProductCardSkeleton } from '@/features/catalogo/product-card';
import { useNombres } from '@/features/catalogo/use-nombres';
import { SectionError, SectionHeading } from '@/features/home/section-heading';
import { Link } from '@/lib/motion/enlaces';
import { useProducto, useRelacionados } from './api';
import { Galeria } from './galeria';
import { PanelCompra } from './panel-compra';
import { ProductoTabs } from './producto-tabs';
import { TrayectoOrigen } from './trayecto-origen';

function Migas({ producto }) {
  const { t } = useTranslation();
  const nombres = useNombres();
  const migas = [
    { to: '/', texto: t('nav.inicio') },
    { to: '/catalogo', texto: t('nav.catalogo') },
    producto.categoria && {
      to: `/catalogo?categoria=${producto.categoria.slug}`,
      texto: nombres.categoria(producto.categoria),
    },
  ].filter(Boolean);

  return (
    <nav aria-label={t('producto.migas')}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {migas.map(({ to, texto }) => (
          <li key={to} className="flex items-center gap-1.5">
            <Link to={to} className="hover:text-link hover:underline">
              {texto}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </li>
        ))}
        <li aria-current="page" className="truncate font-semibold text-foreground">
          {producto.nombre}
        </li>
      </ol>
    </nav>
  );
}

function Relacionados({ slug }) {
  const { t } = useTranslation();
  const { data: productos, isPending, isError } = useRelacionados(slug);
  if (isError || (!isPending && productos.length === 0)) return null;

  return (
    <section aria-labelledby="relacionados-titulo" className="grid gap-10">
      <SectionHeading
        id="relacionados-titulo"
        eyebrow={t('producto.relacionados.eyebrow')}
        title={t('producto.relacionados.titulo')}
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))
          : productos.map((producto) => (
              <li key={producto.id}>
                <ProductCard producto={producto} compartirImagen={false} />
              </li>
            ))}
      </ul>
    </section>
  );
}

function FichaSkeleton() {
  return (
    <div
      className="container-page grid gap-10 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16"
      aria-hidden="true"
    >
      <Skeleton className="aspect-4/5 rounded-2xl" />
      <div className="grid content-start gap-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}

// Ruta /producto/:slug. `key={slug}` reinicia pestañas, galería y cantidad al navegar a un
// producto relacionado.
export function ProductoRuta() {
  const { slug } = useParams();
  return <ProductoPage key={slug} slug={slug} />;
}

export function ProductoPage({ slug }) {
  const { t } = useTranslation();
  const { data: producto, isPending, isError, error, refetch } = useProducto(slug);
  const [tab, setTab] = useState('descripcion');
  const tabsRef = useRef(null);

  const verTab = (valor) => {
    setTab(valor);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isPending) return <FichaSkeleton />;

  if (isError) {
    return (
      <div className="container-page py-section">
        {error?.status === 404 ? (
          <EmptyState
            objeto="busqueda"
            headingLevel={1}
            titulo={t('producto.noEncontrado.titulo')}
            descripcion={t('producto.noEncontrado.descripcion')}
            accion={
              <Button asChild>
                <Link to="/catalogo">
                  {t('producto.noEncontrado.accion')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        ) : (
          <SectionError onRetry={refetch} />
        )}
      </div>
    );
  }

  return (
    <article className="grid gap-section pb-section">
      <title>{`${producto.nombre} · Kuski`}</title>
      {producto.descripcion && (
        <meta name="description" content={producto.descripcion.slice(0, 160)} />
      )}

      <div className="container-page grid gap-8 pt-8">
        <Migas producto={producto} />
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Galeria
            imagenes={producto.imagenes}
            nombre={producto.nombre}
            agotado={!producto.disponible}
          />
          <PanelCompra
            producto={producto}
            onVerTab={verTab}
            className="lg:sticky lg:top-[calc(var(--spacing-header-compact)+1.5rem)]"
          />
        </div>
      </div>

      <div
        ref={tabsRef}
        className="container-page scroll-mt-[calc(var(--spacing-header-compact)+1rem)]"
      >
        <ProductoTabs producto={producto} tab={tab} onTab={setTab} />
      </div>

      <div className="container-page grid gap-section">
        <AndeanDivider />
        <TrayectoOrigen producto={producto} />
        <Relacionados slug={slug} />
      </div>
    </article>
  );
}
