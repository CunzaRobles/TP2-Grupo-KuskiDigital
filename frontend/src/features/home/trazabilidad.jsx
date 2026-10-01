import { useInView } from 'motion/react';
import { lazy, Suspense, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades, useTrazabilidad } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { ContadorAnimado } from './contador-animado';
import { SectionError, SectionHeading } from './section-heading';

const MapaComunidades = lazy(() => import('./mapa-comunidades'));

const CIFRAS = ['comunidades', 'familias', 'paises', 'productos'];

function Cifras() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, refetch } = useTrazabilidad();

  if (isError) return <SectionError onRetry={refetch} />;

  return (
    <div className="grid gap-8">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8" aria-busy={isPending || undefined}>
        {CIFRAS.map((clave) => (
          <div key={clave} className="grid gap-2 border-t border-foreground/15 pt-4">
            <dt className="order-2 text-sm font-semibold text-muted-foreground">
              {t(`home.trazabilidad.cifras.${clave}`)}
            </dt>
            <dd className="order-1 font-serif text-h1 text-terracota-700">
              {isPending ? (
                <Skeleton className="h-[1em] w-24" />
              ) : (
                <ContadorAnimado valor={data[clave]} />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {data?.altitudMinima != null && (
        <p className="text-sm text-muted-foreground">
          {t('home.trazabilidad.altitud', {
            min: formatNumber(data.altitudMinima, i18n.resolvedLanguage),
            max: formatNumber(data.altitudMaxima, i18n.resolvedLanguage),
          })}
        </p>
      )}
    </div>
  );
}

function Mapa() {
  const { t } = useTranslation();
  const ref = useRef(null);
  // Leaflet y los tiles solo se descargan cuando el mapa está por entrar en pantalla
  const cerca = useInView(ref, { once: true, margin: '300px 0px' });
  const { data: comunidades, isPending, isError, refetch } = useComunidades();

  return (
    <div
      ref={ref}
      role="region"
      aria-label={t('home.trazabilidad.mapa')}
      className="relative isolate h-[26rem] overflow-hidden rounded-2xl border bg-muted shadow-card sm:h-[32rem] lg:h-full lg:min-h-[34rem]"
    >
      {/* Lejos de la pantalla basta el fondo liso del contenedor: un skeleton animado fuera de
          vista repintaría sin parar y ocuparía el hilo principal */}
      {!cerca ? null : isError ? (
        <SectionError onRetry={refetch} className="h-full border-0" />
      ) : isPending ? (
        <Skeleton className="size-full rounded-none" />
      ) : (
        <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
          <MapaComunidades comunidades={comunidades} />
        </Suspense>
      )}
    </div>
  );
}

// Bloque de trazabilidad: cifras de impacto + mapa interactivo de las comunidades de Cusco.
export function Trazabilidad() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="trazabilidad-titulo" className="bg-surface">
      <AndeanDivider />
      <div className="container-page grid gap-12 py-section lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="grid content-start gap-12">
          <SectionHeading
            id="trazabilidad-titulo"
            eyebrow={t('home.trazabilidad.eyebrow')}
            title={t('home.trazabilidad.titulo')}
            description={t('home.trazabilidad.descripcion')}
          />
          <Cifras />
        </div>
        <Mapa />
      </div>
      <AndeanDivider />
    </section>
  );
}
