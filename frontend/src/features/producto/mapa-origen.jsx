import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { ATRIBUCION, PIN, TILES } from '@/lib/mapa';

// Mini mapa con la ubicación de la comunidad productora. Se carga en diferido (React.lazy)
// solo cuando se abre la pestaña "Origen". Es decorativo: los datos están en el texto.
export default function MapaOrigen({ comunidad }) {
  const posicion = [comunidad.latitud, comunidad.longitud];

  return (
    <MapContainer
      center={posicion}
      zoom={9}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      className="kuski-mapa size-full"
    >
      <TileLayer url={TILES} attribution={ATRIBUCION} />
      <Marker position={posicion} icon={PIN} title={comunidad.nombre} alt={comunidad.nombre} />
    </MapContainer>
  );
}
