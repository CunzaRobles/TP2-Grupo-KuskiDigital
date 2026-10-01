import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';

// Configuración común de los mapas (Leaflet). Solo la importan componentes cargados en
// diferido: Leaflet pesa ~150 kB y no debe entrar en el bundle inicial de la tienda.

// Tiles sobrios en gris cálido que no compiten con la paleta. CARTO Positron ya exige API key,
// así que por defecto se usa Stadia "Alidade Smooth" (mismo estilo; en localhost no pide clave,
// en producción hay que registrar el dominio gratis). VITE_MAP_TILES_URL permite cambiarlo.
export const TILES =
  import.meta.env.VITE_MAP_TILES_URL ??
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
export const ATRIBUCION =
  import.meta.env.VITE_MAP_TILES_ATTRIBUTION ??
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Pin propio: gota Puna con el punto Cochinilla del isotipo (marcador de altitud).
export const PIN = L.divIcon({
  className: 'kuski-pin',
  html: `<svg viewBox="0 0 32 42" aria-hidden="true">
    <path d="M16 41s13-13.3 13-24A13 13 0 0 0 3 17c0 10.7 13 24 13 24z" fill="#1b2440" stroke="#ffffff" stroke-width="2"/>
    <circle cx="16" cy="16.5" r="5" fill="#a3123a" stroke="#ffffff" stroke-width="1.5"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  popupAnchor: [0, -36],
});
