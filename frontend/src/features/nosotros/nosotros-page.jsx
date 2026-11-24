import { BadgeCheck, Handshake, Route, Sprout } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MarcasRegla } from '@/components/ui/marcas-regla';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrazabilidad } from '@/features/catalogo/api';
import { ComunidadesAltitud } from '@/features/home/comunidades-altitud';
import { PerfilAltitud } from '@/features/home/perfil-altitud';
import { SectionError, SectionHeading } from '@/features/home/section-heading';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';

const VALORES = [
  { clave: 'comercioJusto', Icono: Handshake },
  { clave: 'trazabilidad', Icono: Route },
  { clave: 'sostenibilidad', Icono: Sprout },
  { clave: 'calidad', Icono: BadgeCheck },
];

// Hero corto: la empresa y su trayectoria. Sin foto ni animación de entrada (la única es la de
// la Home); la regla de altitud cierra el bloque como borde.
function Presentacion() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="nosotros-titulo">
      <div className="container-page grid gap-6 pt-12 pb-10 sm:pt-16 sm:pb-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16 lg:pt-20">
        <h1 id="nosotros-titulo" className="max-w-[16ch] text-h1">
          {t('nosotros.hero.titulo')}
        </h1>
        <div className="grid max-w-xl gap-3">
          <p className="text-lead font-semibold">{t('nosotros.hero.descripcion')}</p>
          <p className="text-muted-foreground">{t('nosotros.hero.detalle')}</p>
        </div>
      </div>
      <MarcasRegla className="text-niebla-borde" />
    </section>
  );
}

// Misión y visión, con el texto institucional exacto. Dos columnas desde md, separadas por una
// línea fina (no tarjetas).
function MisionVision() {
  const { t } = useTranslation();

  return (
    <div className="container-page grid gap-10 py-section md:grid-cols-2 md:gap-0">
      {['mision', 'vision'].map((clave) => (
        <section
          key={clave}
          aria-labelledby={`nosotros-${clave}`}
          className="grid content-start gap-4 border-t border-border pt-6 md:border-t-0 md:pt-0 md:first:pr-12 md:last:border-l md:last:pl-12"
        >
          <h2 id={`nosotros-${clave}`} className="text-h2">
            {t(`nosotros.${clave}.titulo`)}
          </h2>
          <p className="text-lead">{t(`nosotros.${clave}.texto`)}</p>
        </section>
      ))}
    </div>
  );
}

// Cifras estáticas de /estadisticas/trazabilidad (sin contadores animados).
function CifrasComunidades() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { data, isPending, isError, refetch } = useTrazabilidad();

  if (isError) return <SectionError onRetry={refetch} />;

  const valor = (contenido, ancho = 'w-20') =>
    isPending ? <Skeleton className={`h-[1em] ${ancho}`} /> : contenido;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8" aria-busy={isPending || undefined}>
      {['comunidades', 'familias'].map((clave) => (
        <div key={clave} className="grid gap-1 border-t border-border pt-3">
          <dt className="order-2 text-sm text-muted-foreground">
            {t(`nosotros.comunidades.cifras.${clave}`)}
          </dt>
          <dd className="order-1 font-display text-h2 font-medium tabular-nums">
            {valor(formatNumber(data?.[clave], idioma))}
          </dd>
        </div>
      ))}
      <div className="col-span-2 grid gap-1 border-t border-border pt-3">
        <dt className="order-2 text-sm text-muted-foreground">
          {t('nosotros.comunidades.cifras.altitud')}
        </dt>
        <dd className="order-1 flex flex-wrap items-baseline gap-x-2 font-display text-h2 font-medium tabular-nums">
          {valor(
            <>
              {t('nosotros.comunidades.rango', {
                min: formatNumber(data?.altitudMinima, idioma),
                max: formatNumber(data?.altitudMaxima, idioma),
              })}
              <span className="font-sans text-base font-semibold text-muted-foreground">
                {t('nosotros.comunidades.unidad')}
              </span>
            </>,
            'w-56',
          )}
        </dd>
      </div>
    </dl>
  );
}

// Nuestras comunidades: cifras reales y el perfil de altitud a un lado; la lista de comunidades
// del valle a la cumbre (la misma de la Home, con su carga y su error) al otro.
function Comunidades() {
  const { t } = useTranslation();
  const [activa, setActiva] = useState(null);

  return (
    <section aria-labelledby="nosotros-comunidades" className="border-y border-border bg-surface">
      <div className="container-page grid gap-12 py-section">
        <SectionHeading
          id="nosotros-comunidades"
          title={t('nosotros.comunidades.titulo')}
          description={t('nosotros.comunidades.descripcion')}
        />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <div className="grid content-start gap-12">
            <CifrasComunidades />
            <PerfilAltitud />
          </div>
          <ComunidadesAltitud activa={activa} onActivar={setActiva} />
        </div>
      </div>
    </section>
  );
}

function Valores() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="nosotros-valores" className="container-page grid gap-12 py-section">
      <SectionHeading
        id="nosotros-valores"
        title={t('nosotros.valores.titulo')}
        description={t('nosotros.valores.descripcion')}
      />
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {VALORES.map(({ clave, Icono }) => (
          <li key={clave} className="grid content-start gap-3 border-t border-border pt-6">
            <span className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface">
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-h4 font-semibold">{t(`nosotros.valores.${clave}.titulo`)}</h3>
            <p className="text-muted-foreground">{t(`nosotros.valores.${clave}.texto`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Cierre: un único CTA primario (Cochinilla) hacia el catálogo.
function Cierre() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="nosotros-cta" className="container-page pb-section">
      <div className="grid gap-6 rounded-surface border border-border bg-surface p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12 lg:p-14">
        <div className="grid max-w-2xl gap-3">
          <h2 id="nosotros-cta" className="text-h2">
            {t('nosotros.cta.titulo')}
          </h2>
          <p className="text-muted-foreground">{t('nosotros.cta.descripcion')}</p>
        </div>
        <Button asChild size="lg" className="justify-self-start">
          <Link to="/catalogo">{t('nosotros.cta.boton')}</Link>
        </Button>
      </div>
    </section>
  );
}

// Acerca de nosotros (/nosotros): quiénes somos, misión y visión, comunidades con datos reales,
// valores y cierre hacia el catálogo. Sin animaciones de aparición por sección.
export function NosotrosPage() {
  const { t } = useTranslation();

  return (
    <>
      <title>{`${t('nosotros.meta')} · Kuski`}</title>
      <Presentacion />
      <MisionVision />
      <Comunidades />
      <Valores />
      <Cierre />
    </>
  );
}
