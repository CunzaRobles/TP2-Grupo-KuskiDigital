import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { nombreCorto, ordenarPorAltitud, posicionEnRegla, REGLA } from './altitud';

// Perfil estático de las comunidades, de la menor a la mayor altitud, sobre la regla de
// 1,000 a 4,000 msnm. Es el "mapa" del recorrido que la sección de trazabilidad anima.
export function PerfilAltitud({ className }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { data, isPending, isError } = useComunidades();
  const paradas = useMemo(() => ordenarPorAltitud(data ?? []), [data]);

  if (isError) return null;
  if (isPending) return <Skeleton className={cn('h-44 sm:h-52', className)} />;
  if (paradas.length < 2) return null;

  const primera = paradas[0];
  const ultima = paradas.at(-1);
  const x = (i) => ((i + 0.5) / paradas.length) * 100;
  const puntos = paradas
    .map((c, i) => `${x(i)},${100 - posicionEnRegla(c.altitudMsnm) * 100}`)
    .join(' ');
  const altitud = (valor) => formatNumber(valor, idioma);

  return (
    <figure
      role="img"
      aria-label={t('home.perfil.resumen', {
        count: paradas.length,
        min: altitud(primera.altitudMsnm),
        desde: nombreCorto(primera.nombre),
        max: altitud(ultima.altitudMsnm),
        hasta: nombreCorto(ultima.nombre),
      })}
      className={cn('border-t border-border pt-4', className)}
    >
      <div aria-hidden="true" className="grid gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {t('home.perfil.puna', { valor: altitud(REGLA.max) })}
        </p>
        <div className="relative h-28 border-t border-dashed border-input sm:h-36">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <polyline
              points={puntos}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {paradas.map((c, i) => {
            const extremo = i === 0 || i === paradas.length - 1;
            return (
              <span
                key={c.id}
                className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center"
                style={{ left: `${x(i)}%`, bottom: `${posicionEnRegla(c.altitudMsnm) * 100}%` }}
              >
                <span
                  className={cn(
                    'absolute bottom-full mb-1.5 font-display text-[0.6875rem] font-medium whitespace-nowrap tabular-nums sm:text-xs',
                    !extremo && 'hidden sm:block',
                  )}
                >
                  {altitud(c.altitudMsnm)}
                </span>
                <span className="size-2.5 rounded-full border-2 border-background bg-foreground" />
              </span>
            );
          })}
        </div>
        {/* Móvil: solo los extremos; desde sm, el nombre bajo cada punto */}
        <p className="flex justify-between border-t border-border pt-2 text-xs text-muted-foreground sm:hidden">
          <span>{nombreCorto(primera.nombre)}</span>
          <span>{nombreCorto(ultima.nombre)}</span>
        </p>
        <ol className="hidden border-t border-border pt-2 text-xs text-muted-foreground sm:flex">
          {paradas.map((c) => (
            <li key={c.id} className="min-w-0 flex-1 truncate px-0.5 text-center">
              {nombreCorto(c.nombre)}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
