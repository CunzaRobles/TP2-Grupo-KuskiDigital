import { ArrowRight, Building2, MapPin, Mountain, Users } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Rating } from '@/components/ui/rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNombres } from '@/features/catalogo/use-nombres';
import { formatDate, formatNumber, localeDe } from '@/lib/format';

const MapaOrigen = lazy(() => import('./mapa-origen'));

function Dato({ icono: Icono, etiqueta, children }) {
  return (
    <div className="flex gap-3">
      <Icono className="mt-0.5 size-4 shrink-0 text-verde" aria-hidden="true" />
      <div className="grid gap-0.5">
        <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {etiqueta}
        </dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

function Descripcion({ producto }) {
  const { t, i18n } = useTranslation();
  const nombres = useNombres();
  const parrafos = (producto.descripcion ?? '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="grid max-w-prose content-start gap-4 text-lg leading-relaxed">
        {parrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="grid content-start gap-4 rounded-2xl bg-surface p-6 text-sm">
        <h3 className="text-h4">{t('producto.ficha.titulo')}</h3>
        <dl className="grid gap-4">
          {[
            [t('producto.ficha.sku'), producto.sku],
            [
              t('producto.ficha.peso'),
              producto.pesoG >= 1000
                ? `${formatNumber(producto.pesoG / 1000, i18n.resolvedLanguage)} kg`
                : `${formatNumber(producto.pesoG, i18n.resolvedLanguage)} g`,
            ],
            [
              t('producto.ficha.categoria'),
              producto.categoria && nombres.categoria(producto.categoria),
            ],
          ]
            .filter(([, valor]) => valor)
            .map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex justify-between gap-4 border-b pb-3">
                <dt className="text-muted-foreground">{etiqueta}</dt>
                <dd className="text-right font-semibold">{valor}</dd>
              </div>
            ))}
          {producto.certificaciones.length > 0 && (
            <div className="grid gap-2">
              <dt className="text-muted-foreground">{t('producto.ficha.certificaciones')}</dt>
              {producto.certificaciones.map((c) => (
                <dd key={c.id}>
                  <span className="font-semibold">{nombres.certificacion(c)}</span>
                  {c.entidadEmisora && (
                    <span className="block text-xs text-muted-foreground">
                      {t('producto.ficha.emitidaPor', { entidad: c.entidadEmisora })}
                    </span>
                  )}
                </dd>
              ))}
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function Origen({ comunidad }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const conMapa = comunidad.latitud != null && comunidad.longitud != null;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="grid content-start gap-6">
        <div className="grid gap-2">
          <p className="eyebrow text-link">{t('producto.origen.eyebrow')}</p>
          <h3 className="text-h3">{comunidad.nombre}</h3>
        </div>
        {comunidad.descripcion && (
          <p className="text-lg leading-relaxed text-muted-foreground">{comunidad.descripcion}</p>
        )}
        <dl className="grid gap-5 sm:grid-cols-2">
          <Dato icono={MapPin} etiqueta={t('producto.origen.ubicacion')}>
            {[comunidad.provincia, comunidad.region].filter(Boolean).join(', ')}
          </Dato>
          {comunidad.altitudMsnm != null && (
            <Dato icono={Mountain} etiqueta={t('producto.origen.altitud')}>
              {t('producto.altitud', { valor: formatNumber(comunidad.altitudMsnm, idioma) })}
            </Dato>
          )}
          {comunidad.familiasBeneficiadas != null && (
            <Dato icono={Users} etiqueta={t('producto.origen.familias')}>
              {formatNumber(comunidad.familiasBeneficiadas, idioma)}
            </Dato>
          )}
          {comunidad.razonSocial && (
            <Dato icono={Building2} etiqueta={t('producto.origen.razonSocial')}>
              {comunidad.razonSocial}
            </Dato>
          )}
        </dl>
        <Link
          to={`/catalogo?comunidad=${comunidad.id}`}
          className="inline-flex w-fit items-center gap-1.5 font-semibold text-link hover:underline"
        >
          {t('producto.origen.verProductos')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {conMapa ? (
        <div
          className="aspect-4/3 overflow-hidden rounded-2xl border shadow-card"
          role="img"
          aria-label={t('producto.origen.mapa', { comunidad: comunidad.nombre })}
        >
          <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
            <MapaOrigen comunidad={comunidad} />
          </Suspense>
        </div>
      ) : (
        comunidad.imagenUrl && (
          <img
            src={comunidad.imagenUrl}
            alt=""
            loading="lazy"
            className="aspect-4/3 w-full rounded-2xl object-cover shadow-card"
          />
        )
      )}
    </div>
  );
}

function Resenas({ resenas }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const paises = new Intl.DisplayNames([localeDe(idioma)], { type: 'region' });

  if (resenas.total === 0) {
    return (
      <div className="grid max-w-md gap-2 rounded-2xl border border-dashed p-8">
        <p className="font-serif text-h4">{t('producto.resenas.vacio')}</p>
        <p className="text-muted-foreground">{t('producto.resenas.vacioDetalle')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-14">
      <div className="grid content-start gap-4">
        <p className="font-serif text-display leading-none">
          {formatNumber(resenas.promedio, idioma, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </p>
        <Rating value={resenas.promedio} size="lg" />
        <p className="text-sm text-muted-foreground">
          {t('producto.resenas.basadoEn', { count: resenas.total })}
        </p>
        <ul className="grid gap-2 pt-2" aria-label={t('producto.resenas.distribucion')}>
          {[5, 4, 3, 2, 1].map((estrellas) => {
            const cantidad = resenas.distribucion[estrellas] ?? 0;
            const porcentaje = resenas.total ? (cantidad / resenas.total) * 100 : 0;
            return (
              <li key={estrellas} className="flex items-center gap-3 text-sm">
                <span className="sr-only">
                  {t('producto.resenas.barra', { estrellas, count: cantidad })}
                </span>
                <span className="w-3 font-semibold tabular-nums" aria-hidden="true">
                  {estrellas}
                </span>
                <span
                  className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full rounded-full bg-maiz"
                    style={{ width: `${porcentaje}%` }}
                  />
                </span>
                <span
                  className="w-6 text-right text-muted-foreground tabular-nums"
                  aria-hidden="true"
                >
                  {cantidad}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="grid content-start divide-y">
        {resenas.items.map((r) => (
          <li key={r.id} className="grid gap-3 py-6 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Rating value={r.calificacion} size="sm" />
              <time dateTime={r.creadoEn} className="text-sm text-muted-foreground">
                {formatDate(r.creadoEn, idioma, { dateStyle: 'long' })}
              </time>
            </div>
            {r.comentario && <p className="text-lg leading-relaxed">{r.comentario}</p>}
            <p className="text-sm font-semibold">
              {r.autor}
              {r.paisCodigo && (
                <span className="font-normal text-muted-foreground">
                  {' · '}
                  {paises.of(r.paisCodigo)}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pestañas de la ficha. El valor lo controla la página para poder saltar a "Reseñas". */
export function ProductoTabs({ producto, tab, onTab }) {
  const { t } = useTranslation();

  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList>
        <TabsTrigger value="descripcion">{t('producto.tabs.descripcion')}</TabsTrigger>
        {producto.comunidad && (
          <TabsTrigger value="origen">{t('producto.tabs.origen')}</TabsTrigger>
        )}
        <TabsTrigger value="resenas">
          {t('producto.tabs.resenas', { count: producto.resenas.total })}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="descripcion" className="pt-8">
        <Descripcion producto={producto} />
      </TabsContent>
      {producto.comunidad && (
        <TabsContent value="origen" className="pt-8">
          <Origen comunidad={producto.comunidad} />
        </TabsContent>
      )}
      <TabsContent value="resenas" className="pt-8">
        <Resenas resenas={producto.resenas} />
      </TabsContent>
    </Tabs>
  );
}
