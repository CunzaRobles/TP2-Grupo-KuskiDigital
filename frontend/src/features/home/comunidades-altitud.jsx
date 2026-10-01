import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { ordenarPorAltitud, REGLA, zonaDe } from './altitud';
import { SectionError } from './section-heading';

// Las comunidades productoras, del valle a la cumbre, con su región natural. Es una lista
// estática: el recorrido animado de altitud vive en la sección de categorías.
export function ComunidadesAltitud() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { data, isPending, isError, refetch } = useComunidades();
  const comunidades = useMemo(() => ordenarPorAltitud(data ?? []), [data]);

  if (isError) return <SectionError onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-64" />;
  if (comunidades.length === 0) return null;

  return (
    <div className="grid gap-6">
      <ol
        aria-label={t('home.recorrido.lista')}
        className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {comunidades.map((comunidad) => (
          <li key={comunidad.id} className="grid content-start gap-2 border-t border-border py-6">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-display text-h3 font-medium tabular-nums">
                {formatNumber(comunidad.altitudMsnm, idioma)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {t('home.recorrido.unidad')} ·{' '}
                {t(`home.recorrido.zonas.${zonaDe(comunidad.altitudMsnm)}`)}
              </span>
            </p>
            <h3 className="text-h4">{comunidad.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              {[
                comunidad.provincia,
                comunidad.familiasBeneficiadas != null &&
                  t('home.trazabilidad.popup.familias', {
                    count: comunidad.familiasBeneficiadas,
                  }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {comunidad.descripcion && <p className="text-sm">{comunidad.descripcion}</p>}
            {comunidad.totalProductos > 0 && (
              <p>
                <Link
                  to={`/catalogo?comunidad=${comunidad.id}`}
                  className="text-sm font-semibold text-link underline underline-offset-4 hover:text-primary-hover"
                >
                  {t('home.recorrido.verProductos', { count: comunidad.totalProductos })}
                </Link>
              </p>
            )}
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">
        {t('home.recorrido.horizonte', { valor: formatNumber(REGLA.max, idioma) })}
      </p>
    </div>
  );
}
