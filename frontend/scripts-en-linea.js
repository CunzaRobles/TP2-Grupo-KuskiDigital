import { createHash } from 'node:crypto';

/*
 * Scripts en línea de index.html. La Content-Security-Policy de vercel.json no permite
 * 'unsafe-inline' en script-src: cada uno se autoriza por su hash SHA-256. Por eso su código es
 * estático (los datos que cambian en cada build, como los nombres de los chunks, van en un
 * <script type="application/json">, que no se ejecuta). Si cambias uno, actualiza su hash en
 * vercel.json: src/test/cabeceras-seguridad.test.js lo comprueba.
 */

// Hojas de estilo de Google Fonts sin bloquear el primer pintado: index.html las precarga
// (<link rel="preload" as="style" data-fuentes>) y este script las aplica. Sustituye al antiguo
// onload="…" en línea, que la CSP bloquearía.
export const CARGAR_FUENTES = [
  '(function(){',
  "var p=document.querySelector('link[data-fuentes]');",
  "if(p){var l=document.createElement('link');l.rel='stylesheet';l.href=p.href;document.head.appendChild(l)}",
  '})()',
].join('');

export const ID_DATOS_PRECARGA = 'kuski-precarga';

// Precarga de la Home (ver precargarHome en vite.config.js). Lee de #kuski-precarga:
// { idiomas: { en: '/assets/en-….js' }, modulos: ['/assets/home-page-….js'], foto: { srcset, sizes } }
export const PRECARGAR_HOME = [
  '(function(){var h=document.head,l,d;',
  `try{d=JSON.parse(document.getElementById('${ID_DATOS_PRECARGA}').textContent)}catch(e){return}`,
  "function pre(m){l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=m;h.appendChild(l)}",
  'var t=d.idiomas,i;',
  "try{i=localStorage.getItem('kuski.idioma')}catch(e){}",
  "i=(i||(navigator.languages||[navigator.language]).map(function(x){return String(x).slice(0,2)}).filter(function(x){return x==='es'||x in t})[0]||'').slice(0,2);",
  'if(t[i])pre(t[i]);',
  "if(location.pathname==='/'){d.modulos.forEach(pre);",
  "l=document.createElement('link');l.rel='preload';l.as='image';l.setAttribute('imagesrcset',d.foto.srcset);l.setAttribute('imagesizes',d.foto.sizes);l.fetchPriority='low';h.appendChild(l)}})()",
].join('');

/** Fuente CSP de un script en línea: 'sha256-…' (base64 del contenido exacto). */
export const hashCsp = (codigo) =>
  `'sha256-${createHash('sha256').update(codigo, 'utf8').digest('base64')}'`;

/** JSON seguro dentro de <script>: sin "</script>" ni comentarios HTML. */
export const jsonEnHtml = (valor) => JSON.stringify(valor).replace(/</g, '\\u003c');
