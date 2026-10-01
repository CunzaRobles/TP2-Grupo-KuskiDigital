import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
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

        const modulos = JSON.stringify([...porCargar].map((f) => `/${f}`));
        // Sin href: el navegador elige el ancho con imagesrcset/imagesizes, igual que el <img>
        // del hero, y no descarga dos versiones de la foto.
        const foto = JSON.stringify({ srcset: srcSetHero, sizes: SIZES_HERO });
        const codigo = [
          `(function(){var h=document.head,l;`,
          `function pre(m){l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=m;h.appendChild(l)}`,
          `var t=${JSON.stringify(idiomas)},i;`,
          `try{i=localStorage.getItem('kuski.idioma')}catch(e){}`,
          `i=(i||(navigator.languages||[navigator.language]).map(function(x){return String(x).slice(0,2)}).filter(function(x){return x==='es'||x in t})[0]||'').slice(0,2);`,
          `if(t[i])pre(t[i]);`,
          `if(location.pathname==='/'){${modulos}.forEach(pre);var f=${foto};`,
          `l=document.createElement('link');l.rel='preload';l.as='image';l.setAttribute('imagesrcset',f.srcset);l.setAttribute('imagesizes',f.sizes);l.fetchPriority='low';h.appendChild(l)}})()`,
        ].join('');
        // Justo después de <meta name="viewport"> (sin ella, imagesizes se calcularía con el
        // viewport de 980 px por defecto y bajaría la foto más grande) y antes de las hojas de
        // estilo (un script en línea después de una hoja de estilos espera a que esta cargue).
        const viewport = html.match(/<meta\s+name="viewport"[^>]*>/);
        if (!viewport) return [{ tag: 'script', children: codigo, injectTo: 'head-prepend' }];
        return html.replace(viewport[0], `${viewport[0]}\n    <script>${codigo}</script>`);
      },
    },
  };
}

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
  plugins: [react(), tailwindcss(), precargarHome()],
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
