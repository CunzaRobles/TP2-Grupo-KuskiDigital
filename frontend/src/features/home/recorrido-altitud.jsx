import { motion, useInView } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useComunidades } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { transicion } from '@/lib/motion';
import { Link } from '@/lib/motion/enlaces';
import { cn } from '@/lib/utils';
import {
  MARCAS_REGLA,
  nombreCorto,
  ordenarPorAltitud,
  posicionEnRegla,
  REGLA,
  ZONAS,
  zonaDe,
} from './altitud';
import { SectionError } from './section-heading';

/*
 * El único momento animado de la tienda: al bajar por la página se sube por Cusco.
 * Las paradas (comunidades) van del valle a la cumbre; la que cruza el centro de la pantalla
 * mueve el marcador de la regla. Solo se animan transformaciones: con prefers-reduced-motion
 * (MotionConfig reducedMotion="user") el marcador salta de parada en parada sin transición.
 * La regla es decorativa (aria-hidden): toda la información está en la lista de paradas.
 */

const TRANSICION = transicion('lenta');

function Parada({ comunidad, indice, activa, onActiva }) {
  const { t, i18n } = useTranslation();
  const ref = useRef(null);
  // "Activa" cuando cruza la franja central de la pantalla
  const enCentro = useInView(ref, { margin: '-45% 0px -45% 0px' });
  const idioma = i18n.resolvedLanguage;

  useEffect(() => {
    if (enCentro) onActiva(indice);
  }, [enCentro, indice, onActiva]);

  return (
    <li
      ref={ref}
      className={cn(
        'grid content-center gap-3 border-t border-border py-8 lg:min-h-[60dvh] lg:border-l-2 lg:pl-8',
        'lg:border-l-transparent lg:transition-colors lg:duration-300',
        activa && 'lg:border-l-primary',
      )}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-h2 font-medium tabular-nums">
          {formatNumber(comunidad.altitudMsnm, idioma)}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {t('home.recorrido.unidad')} ·{' '}
          {t(`home.recorrido.zonas.${zonaDe(comunidad.altitudMsnm)}`)}
        </span>
      </p>
      <h3 className="text-h3">{comunidad.nombre}</h3>
      <p className="text-sm text-muted-foreground">
        {[
          comunidad.provincia,
          comunidad.familiasBeneficiadas != null &&
            t('home.trazabilidad.popup.familias', { count: comunidad.familiasBeneficiadas }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {comunidad.descripcion && <p className="max-w-prose">{comunidad.descripcion}</p>}
      {comunidad.totalProductos > 0 && (
        <p>
          <Link
            to={`/catalogo?comunidad=${comunidad.id}`}
            className="font-semibold text-link underline underline-offset-4 hover:text-primary-hover"
          >
            {t('home.recorrido.verProductos', { count: comunidad.totalProductos })}
          </Link>
        </p>
      )}
    </li>
  );
}

// Escritorio: regla vertical fija (sticky) con las regiones naturales y el marcador.
function ReglaVertical({ parada }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const posicion = posicionEnRegla(parada.altitudMsnm);
  const zonas = ZONAS.filter((z) => z.desde < REGLA.max);

  return (
    <div aria-hidden="true" className="hidden lg:block">
      <div className="sticky top-[calc(var(--spacing-header-compact)+3rem)] h-[min(36rem,calc(100dvh-var(--spacing-header-compact)-6rem))] py-6">
        <div className="relative ml-16 h-full">
          {/* Regiones naturales como franjas a la derecha de la regla */}
          {zonas.map((zona, i) => {
            const desde = posicionEnRegla(Math.max(zona.desde, REGLA.min));
            const hasta = posicionEnRegla(zonas[i + 1]?.desde ?? REGLA.max);
            return (
              <span
                key={zona.id}
                className="absolute left-6 flex items-center border-t border-l border-dashed border-input pl-3 text-xs font-semibold text-muted-foreground"
                style={{ bottom: `${desde * 100}%`, height: `${(hasta - desde) * 100}%` }}
              >
                {t(`home.recorrido.zonas.${zona.id}`)}
              </span>
            );
          })}
          <span className="absolute -top-6 left-6 pl-3 text-xs font-semibold text-muted-foreground">
            {t('home.perfil.puna', { valor: formatNumber(REGLA.max, idioma) })}
          </span>

          {/* Regla: eje, marcas cada 500 m y tramo recorrido */}
          <span className="absolute inset-y-0 left-0 w-px bg-input" />
          {MARCAS_REGLA.map((marca) => (
            <span
              key={marca}
              className="absolute right-full flex -translate-y-1/2 items-center gap-2 text-xs text-muted-foreground tabular-nums"
              style={{ top: `${(1 - posicionEnRegla(marca)) * 100}%` }}
            >
              {formatNumber(marca, idioma)}
              <span className="h-px w-2 bg-input" />
            </span>
          ))}
          <motion.span
            className="absolute bottom-0 left-0 h-full w-0.5 origin-bottom -translate-x-[0.5px] bg-primary"
            initial={false}
            animate={{ scaleY: posicion }}
            transition={TRANSICION}
          />

          {/* Marcador: el contenedor sube su propio alto × posición (transform, no top) */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
            initial={false}
            animate={{ y: `${-posicion * 100}%` }}
            transition={TRANSICION}
          >
            <span className="absolute bottom-0 left-0 flex translate-y-1/2 items-center gap-3">
              <span className="-ml-2 size-4 rounded-full border-4 border-surface bg-primary" />
              <span className="grid rounded-sm bg-surface py-1 pr-2 leading-tight">
                <span className="font-display text-h3 font-medium tabular-nums">
                  {formatNumber(parada.altitudMsnm, idioma)}
                </span>
                <span className="text-sm font-semibold">{nombreCorto(parada.nombre)}</span>
              </span>
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Móvil y tablet: barra fija bajo el header con la altitud actual y el avance.
function ReglaHorizontal({ parada }) {
  const { t, i18n } = useTranslation();

  return (
    <div
      aria-hidden="true"
      className="sticky top-header-compact z-10 -mx-gutter grid gap-2 border-b border-border bg-surface px-gutter py-3 lg:hidden"
    >
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-display font-medium tabular-nums">
          {t('producto.altitud', {
            valor: formatNumber(parada.altitudMsnm, i18n.resolvedLanguage),
          })}
        </span>
        <span className="truncate font-semibold">{nombreCorto(parada.nombre)}</span>
      </p>
      <span className="relative h-1 overflow-hidden bg-muted">
        <motion.span
          className="absolute inset-0 origin-left bg-primary"
          initial={false}
          animate={{ scaleX: posicionEnRegla(parada.altitudMsnm) }}
          transition={TRANSICION}
        />
      </span>
    </div>
  );
}

export function RecorridoAltitud() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, refetch } = useComunidades();
  const paradas = useMemo(() => ordenarPorAltitud(data ?? []), [data]);
  const [activa, setActiva] = useState(0);

  if (isError) return <SectionError onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-96" />;
  if (paradas.length === 0) return null;

  const parada = paradas[Math.min(activa, paradas.length - 1)];

  return (
    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <ReglaVertical parada={parada} />
      <div>
        <ReglaHorizontal parada={parada} />
        <ol aria-label={t('home.recorrido.lista')}>
          {paradas.map((comunidad, i) => (
            <Parada
              key={comunidad.id}
              comunidad={comunidad}
              indice={i}
              activa={i === activa}
              onActiva={setActiva}
            />
          ))}
        </ol>
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          {t('home.recorrido.horizonte', { valor: formatNumber(REGLA.max, i18n.resolvedLanguage) })}
        </p>
      </div>
    </div>
  );
}
