import { useInView } from 'motion/react';
import { lazy, Suspense, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades, useTrazabilidad } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { ComunidadesAltitud } from './comunidades-altitud';
import { SectionError, SectionHeading } from './section-heading';

const MapaComunidades = lazy(() => import('./mapa-comunidades'));

const CIFRAS = ['comunidades', 'familias', 'paises', 'productos'];

// Cifras estáticas, en una fila bajo el mapa (sin contadores animados).
function Cifras() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { data, isPending, isError, refetch } = useTrazabilidad();

  if (isError) return <SectionError onRetry={refetch} />;

  return (
    <div className="grid content-start gap-6">
      <dl
        className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4"
        aria-busy={isPending || undefined}
      >
        {CIFRAS.map((clave) => (
          <div key={clave} className="grid gap-1 border-t border-border pt-3">
            <dt className="order-2 text-sm text-muted-foreground">
              {t(`home.trazabilidad.cifras.${clave}`)}
            </dt>
            <dd className="order-1 font-display text-h2 font-medium tabular-nums">
              {isPending ? (
                <Skeleton className="h-[1em] w-20" />
              ) : (
                formatNumber(data[clave], idioma)
              )}
            </dd>
          </div>
        ))}
      </dl>
      {data?.altitudMinima != null && (
        <p className="text-sm text-muted-foreground">
          {t('home.trazabilidad.altitud', {
            min: formatNumber(data.altitudMinima, idioma),
            max: formatNumber(data.altitudMaxima, idioma),
          })}
        </p>
      )}
    </div>
  );
}

function Mapa({ activa, onActivar }) {
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
      className="relative isolate h-[24rem] overflow-hidden border border-border bg-muted sm:h-[30rem]"
    >
      {isError ? (
        <SectionError onRetry={refetch} className="h-full border-0" />
      ) : !cerca ? null : isPending ? (
        // Lejos de la pantalla basta el fondo del contenedor; el pulso solo mientras se ve
        <Skeleton className="size-full rounded-none" />
      ) : (
        <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
          <MapaComunidades comunidades={comunidades} activa={activa} onActivar={onActivar} />
        </Suspense>
      )}
    </div>
  );
}

// Trazabilidad: el mapa de Cusco con sus pines junto a la lista de comunidades, del valle a la
// cumbre. Pin y fila están enlazados: al pasar por uno se resalta el otro. Debajo, las cifras.
export function Trazabilidad() {
  const { t } = useTranslation();
  const [activa, setActiva] = useState(null);

  return (
    <section aria-labelledby="trazabilidad-titulo" className="border-t border-border bg-surface">
      <div className="container-page grid gap-12 py-section">
        <SectionHeading
          id="trazabilidad-titulo"
          title={t('home.trazabilidad.titulo')}
          description={t('home.trazabilidad.descripcion')}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-10">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header-compact)+1.5rem)] lg:self-start">
            <Mapa activa={activa} onActivar={setActiva} />
          </div>
          <ComunidadesAltitud activa={activa} onActivar={setActiva} />
        </div>
        <Cifras />
      </div>
    </section>
  );
}
