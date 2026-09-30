import L from 'leaflet';
import { ArrowRight, Mountain, Package, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router';
import { formatNumber } from '@/lib/format';
import { ATRIBUCION, PIN, TILES } from '@/lib/mapa';

// Mapa de comunidades productoras. Se carga en diferido (Leaflet pesa ~150 kB) cuando el
// bloque de trazabilidad se acerca a la pantalla.

const CENTRO_CUSCO = [-13.35, -72.0];

export default function MapaComunidades({ comunidades }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;

  const conCoordenadas = useMemo(
    () => comunidades.filter((c) => c.latitud != null && c.longitud != null),
    [comunidades],
  );
  const limites = useMemo(
    () =>
      conCoordenadas.length > 1
        ? L.latLngBounds(conCoordenadas.map((c) => [c.latitud, c.longitud]))
        : undefined,
    [conCoordenadas],
  );

  return (
    <MapContainer
      center={CENTRO_CUSCO}
      zoom={8}
      bounds={limites}
      boundsOptions={{ padding: [48, 48] }}
      scrollWheelZoom={false}
      className="kuski-mapa size-full"
    >
      <TileLayer url={TILES} attribution={ATRIBUCION} />
      {conCoordenadas.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitud, c.longitud]}
          icon={PIN}
          title={c.nombre}
          alt={c.nombre}
        >
          <Popup>
            <div className="grid gap-3 font-sans text-foreground">
              <div className="grid gap-0.5">
                <p className="eyebrow text-link">
                  {[c.provincia, c.region].filter(Boolean).join(' · ')}
                </p>
                <p className="font-serif text-lg leading-tight">{c.nombre}</p>
              </div>
              <ul className="grid gap-1.5 text-sm text-muted-foreground">
                {c.altitudMsnm != null && (
                  <li className="flex items-center gap-2">
                    <Mountain className="size-4 text-verde" aria-hidden="true" />
                    {t('producto.altitud', { valor: formatNumber(c.altitudMsnm, idioma) })}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Package className="size-4 text-verde" aria-hidden="true" />
                  {t('home.trazabilidad.popup.productos', { count: c.totalProductos ?? 0 })}
                </li>
                {c.familiasBeneficiadas != null && (
                  <li className="flex items-center gap-2">
                    <Users className="size-4 text-verde" aria-hidden="true" />
                    {t('home.trazabilidad.popup.familias', { count: c.familiasBeneficiadas })}
                  </li>
                )}
              </ul>
              {c.totalProductos > 0 && (
                <Link
                  to={`/catalogo?comunidad=${c.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
                >
                  {t('home.trazabilidad.popup.verProductos')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
