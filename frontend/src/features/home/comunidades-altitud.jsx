import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import { ordenarPorAltitud, REGLA, zonaDe } from './altitud';
import { SectionError } from './section-heading';

/**
 * Lista lateral del mapa: las comunidades productoras, del valle a la cumbre, con su altitud,
 * región natural y productos. Está enlazada con los pines: al pasar (o enfocar) una comunidad
 * se resalta su pin, y al pasar por un pin se resalta aquí (`activa`). Sin animaciones: el
 * resaltado es un cambio de estado inmediato.
 */
export function ComunidadesAltitud({ activa = null, onActivar = () => {}, className }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { data, isPending, isError, refetch } = useComunidades();
  const comunidades = useMemo(() => ordenarPorAltitud(data ?? []), [data]);

  if (isError) return <SectionError onRetry={refetch} />;
  if (isPending) return <Skeleton className={cn('h-96', className)} />;
  if (comunidades.length === 0) return null;

  return (
    <div className={cn('grid content-start gap-4', className)}>
      <ol aria-label={t('home.recorrido.lista')} className="grid border-b border-border">
        {comunidades.map((comunidad) => {
          const resaltada = activa === comunidad.id;
          return (
            <li
              key={comunidad.id}
              data-activa={resaltada || undefined}
              onMouseEnter={() => onActivar(comunidad.id)}
              onMouseLeave={() => onActivar(null)}
              onFocus={() => onActivar(comunidad.id)}
              onBlur={() => onActivar(null)}
              className="relative grid gap-0.5 border-t border-border py-3 pr-2 pl-4 transition-colors duration-200 data-activa:bg-background"
            >
              {/* Marcador de la comunidad resaltada (el mismo acento que su pin) */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-y-0 left-0 w-0.5',
                  resaltada ? 'bg-primary' : 'bg-transparent',
                )}
              />
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-lg font-medium tabular-nums">
                  {formatNumber(comunidad.altitudMsnm, idioma)}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('home.recorrido.unidad')} ·{' '}
                  {t(`home.recorrido.zonas.${zonaDe(comunidad.altitudMsnm)}`)}
                </span>
              </p>
              <h3 className="text-base leading-snug font-semibold">{comunidad.nombre}</h3>
              {comunidad.provincia && (
                <p className="text-xs text-muted-foreground">{comunidad.provincia}</p>
              )}
              {comunidad.totalProductos > 0 && (
                <p>
                  <Link
                    to={`/catalogo?comunidad=${comunidad.id}`}
                    className="text-sm font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {t('home.recorrido.verProductos', { count: comunidad.totalProductos })}
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted-foreground">
        {t('home.recorrido.horizonte', { valor: formatNumber(REGLA.max, idioma) })}
      </p>
    </div>
  );
}
