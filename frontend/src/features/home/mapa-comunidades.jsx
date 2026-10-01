import L from 'leaflet';
import { Mountain, Package, Users } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { formatNumber } from '@/lib/format';
import { ATRIBUCION, PIN, TILES } from '@/lib/mapa';
import { Link } from '@/lib/motion/enlaces';

// Mapa de comunidades productoras. Se carga en diferido (Leaflet pesa ~150 kB) cuando el
// bloque de trazabilidad se acerca a la pantalla. Está enlazado con la lista lateral: pasar el
// cursor (o el foco) por un pin activa su comunidad (`onActivar`), y la comunidad `activa`
// resalta su pin. El resaltado cambia una clase del pin ya dibujado: reemplazar el icono
// recrearía el elemento y se perdería el foco del teclado.

const CENTRO_CUSCO = [-13.35, -72.0];

const Z_RESALTADO = 1000;

export default function MapaComunidades({ comunidades, activa = null, onActivar = () => {} }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const marcadores = useRef(new Map());

  useEffect(() => {
    for (const [id, marcador] of marcadores.current) {
      const resaltado = id === activa;
      marcador.getElement()?.classList.toggle('is-activo', resaltado);
      marcador.setZIndexOffset(resaltado ? Z_RESALTADO : 0);
    }
  }, [activa]);

  // Eventos de cada pin: cursor, toque (abre el popup) y foco con teclado
  const eventosDe = (id) => ({
    add: (e) => {
      marcadores.current.set(id, e.target);
      const elemento = e.target.getElement();
      elemento?.addEventListener('focus', () => onActivar(id));
      elemento?.addEventListener('blur', () => onActivar(null));
    },
    remove: () => marcadores.current.delete(id),
    mouseover: () => onActivar(id),
    mouseout: () => onActivar(null),
    popupopen: () => onActivar(id),
  });

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
          eventHandlers={eventosDe(c.id)}
        >
          <Popup>
            <div className="grid gap-3 font-sans text-foreground">
              <div className="grid gap-0.5">
                <p className="text-lg leading-tight font-semibold">{c.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {[c.provincia, c.region].filter(Boolean).join(' · ')}
                </p>
              </div>
              <ul className="grid gap-1.5 text-sm text-muted-foreground">
                {c.altitudMsnm != null && (
                  <li className="flex items-center gap-2">
                    <Mountain className="size-4 text-musgo" aria-hidden="true" />
                    {t('producto.altitud', { valor: formatNumber(c.altitudMsnm, idioma) })}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Package className="size-4 text-musgo" aria-hidden="true" />
                  {t('home.trazabilidad.popup.productos', { count: c.totalProductos ?? 0 })}
                </li>
                {c.familiasBeneficiadas != null && (
                  <li className="flex items-center gap-2">
                    <Users className="size-4 text-musgo" aria-hidden="true" />
                    {t('home.trazabilidad.popup.familias', { count: c.familiasBeneficiadas })}
                  </li>
                )}
              </ul>
              {c.totalProductos > 0 && (
                <Link
                  to={`/catalogo?comunidad=${c.id}`}
                  className="text-sm font-semibold text-link underline underline-offset-4"
                >
                  {t('home.trazabilidad.popup.verProductos')}
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
