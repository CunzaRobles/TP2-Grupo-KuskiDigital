import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import {
  CARGAR_FUENTES,
  ID_DATOS_PRECARGA,
  jsonEnHtml,
  PRECARGAR_HOME,
} from './scripts-en-linea.js';
import { SIZES_HERO, srcSetHero } from './src/features/home/hero-foto.js';

const PAGINA_HOME = '/src/features/home/home-page.jsx';

/**
 * La Home es una ruta diferida (lleva GSAP, que el resto de la tienda no descarga). Para que
 * entrar por "/" no espere a main.js antes de pedirla, el <head> precarga su chunk y la foto del
 * hero, solo en esa ruta, en paralelo con el bundle principal. También precarga la traducción
 * del idioma detectado si no es el español.
 */
function precargarHome() {
  return {
    name: 'kuski:precargar-home',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const chunks = Object.values(bundle ?? {}).filter((c) => c.type === 'chunk');
        const entrada = chunks.find((c) => c.isEntry);
        const home = chunks.find((c) =>
          c.facadeModuleId?.replaceAll('\\', '/').endsWith(PAGINA_HOME),
        );
        if (!entrada || !home) return undefined;

        // El chunk de la Home y sus dependencias estáticas que no estén ya en el inicial
        const yaCargados = new Set([entrada.fileName, ...entrada.imports]);
        const porCargar = new Set();
        const visitar = (nombre) => {
          if (yaCargados.has(nombre) || porCargar.has(nombre)) return;
          porCargar.add(nombre);
          bundle[nombre]?.imports?.forEach(visitar);
        };
        visitar(home.fileName);

        // Traducciones diferidas (lib/i18n.js): la del idioma que se va a detectar
        // (localStorage o navegador) se precarga para no pedirla en serie tras main.js.
        const idiomas = {};
        for (const c of chunks) {
          const id = c.facadeModuleId?.replaceAll('\\', '/').match(/\/src\/locales\/(\w+)\.json$/);
          if (id) idiomas[id[1]] = `/${c.fileName}`;
        }

        // Los datos que cambian en cada build van en JSON (no se ejecuta); el script es estático
        // para que la CSP lo autorice por su hash (scripts-en-linea.js). Sin href en la foto: el
        // navegador elige el ancho con imagesrcset/imagesizes, igual que el <img> del hero, y no
        // descarga dos versiones.
        const datos = jsonEnHtml({
          idiomas,
          modulos: [...porCargar].map((f) => `/${f}`),
          foto: { srcset: srcSetHero, sizes: SIZES_HERO },
        });
        const etiquetas = [
          `<script type="application/json" id="${ID_DATOS_PRECARGA}">${datos}</script>`,
          `<script>${PRECARGAR_HOME}</script>`,
        ].join('\n    ');
        // Justo después de <meta name="viewport"> (sin ella, imagesizes se calcularía con el
        // viewport de 980 px por defecto y bajaría la foto más grande) y antes de las hojas de
        // estilo (un script en línea después de una hoja de estilos espera a que esta cargue).
        const viewport = html.match(/<meta\s+name="viewport"[^>]*>/);
        if (!viewport) throw new Error('index.html necesita <meta name="viewport">');
        return html.replace(viewport[0], () => `${viewport[0]}\n    ${etiquetas}`);
      },
    },
  };
}

/**
 * Aplica las hojas de Google Fonts precargadas en index.html (<link rel="preload" data-fuentes>)
 * con un script en línea estático justo después del enlace, en desarrollo y en build.
 */
function cargarFuentes() {
  return {
    name: 'kuski:cargar-fuentes',
    transformIndexHtml(html) {
      const enlace = html.match(/<link\b[^>]*\bdata-fuentes\b[^>]*>/);
      if (!enlace) throw new Error('index.html necesita el <link rel="preload" data-fuentes>');
      return html.replace(enlace[0], () => `${enlace[0]}\n    <script>${CARGAR_FUENTES}</script>`);
    },
  };
}

// Cabeceras de vercel.json para las páginas de la tienda (todo menos /api, que lleva las de helmet
// desde el backend): `npm run preview` sirve el build con la misma Content-Security-Policy que
// producción, así sus violaciones se ven antes de desplegar.
const REGLA_PAGINAS = '/((?!api/).*)';
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
const CABECERAS_PRODUCCION = Object.fromEntries(
  (vercel.headers ?? [])
    .filter((regla) => regla.source === REGLA_PAGINAS)
    .flatMap((regla) => regla.headers.map(({ key, value }) => [key, value])),
);

// Sin agrupar, Rolldown parte el código compartido en decenas de chunks diminutos (un ícono por
// archivo) y el arranque hace ~50 peticiones. Se agrupan en pocos chunks estables. GSAP, Leaflet
// y Recharts quedan fuera (van con la Home, los mapas y el admin), y también Motion y Lenis,
// que se cargan en diferido después del primer pintado.
const LIBS_DE_ARRANQUE =
  /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack|i18next|i18next-browser-languagedetector|react-i18next|radix-ui|@radix-ui|@floating-ui|sonner|clsx|tailwind-merge|class-variance-authority|aria-hidden|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|get-nonce|tslib)[\\/]/;
const CODIGO_COMUN = /[\\/]src[\\/](components|lib)[\\/]/;
const FUERA_DEL_COMUN = /[\\/]lib[\\/](motion[\\/](gsap|split-text)|mapa)/;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cargarFuentes(), precargarHome()],
  build: {
    // Mapas de código en producción: errores legibles y Lighthouse los exige en los JS grandes.
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'iconos', test: /node_modules[\\/]lucide-react[\\/]/, priority: 3 },
            { name: 'vendor', test: LIBS_DE_ARRANQUE, priority: 2 },
            {
              name: 'comun',
              test: (id) => CODIGO_COMUN.test(id) && !FUERA_DEL_COMUN.test(id),
              minShareCount: 2,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  // `npm run preview`: mismo proxy de /api (hereda server.proxy) y cabeceras de vercel.json.
  preview: {
    headers: CABECERAS_PRODUCCION,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // La primera ruta /admin carga en frío todo su grafo lazy (layout, guardias, Recharts):
    // tras reinstalar node_modules o en CI eso puede pasar de los 5 s por defecto.
    testTimeout: 15000,
    pool: 'vmThreads',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
    },
  },
});
