import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARGAR_FUENTES, hashCsp, PRECARGAR_HOME } from '../../scripts-en-linea.js';

// Cabeceras de seguridad de frontend/vercel.json. Si una prueba falla tras cambiar un script en
// línea (scripts-en-linea.js) o un origen externo, actualiza la Content-Security-Policy.

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const vercel = JSON.parse(leer('../../vercel.json'));
const reglas = Object.fromEntries(
  vercel.headers.map(({ source, headers }) => [
    source,
    Object.fromEntries(headers.map(({ key, value }) => [key, value])),
  ]),
);
// Todas las rutas menos /api/*: la API (rewrite a kuski-api) ya envía las cabeceras de helmet, y
// sumarle esta CSP rompería Swagger UI (/api/v1/docs carga swagger-ui desde jsDelivr).
const REGLA_PAGINAS = '/((?!api/).*)';
const todas = reglas[REGLA_PAGINAS];

it('la regla cubre todas las páginas y deja fuera /api', () => {
  const patron = new RegExp(`^${REGLA_PAGINAS}$`);
  for (const ruta of ['/', '/catalogo', '/producto/cafe', '/admin/dashboard', '/assets/x.js']) {
    expect(patron.test(ruta)).toBe(true);
  }
  for (const ruta of ['/api/v1/docs', '/api/v1/productos']) expect(patron.test(ruta)).toBe(false);
});
const directivas = Object.fromEntries(
  todas['Content-Security-Policy']
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .map(([nombre, ...fuentes]) => [nombre, fuentes]),
);
const host = (url) => `https://${new URL(url.replace(/\{[^}]+\}/g, 'x')).host}`;

describe('Content-Security-Policy', () => {
  it('parte de default-src self y cierra objetos, base y marcos', () => {
    expect(directivas['default-src']).toEqual(["'self'"]);
    expect(directivas['object-src']).toEqual(["'none'"]);
    expect(directivas['base-uri']).toEqual(["'self'"]);
    expect(directivas['frame-ancestors']).toEqual(["'none'"]);
  });

  it('autoriza los scripts en línea solo por su hash (sin unsafe-inline ni unsafe-eval)', () => {
    expect(directivas['script-src']).toEqual([
      "'self'",
      hashCsp(CARGAR_FUENTES),
      hashCsp(PRECARGAR_HOME),
    ]);
  });

  it('index.html no tiene manejadores de eventos en línea (onload="…")', () => {
    const html = leer('../../index.html').replace(/<!--[\s\S]*?-->/g, '');
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).toMatch(/<link[^>]*data-fuentes/);
  });

  it('permite los orígenes que la tienda carga de verdad', () => {
    expect(directivas['style-src']).toContain('https://fonts.googleapis.com');
    expect(directivas['font-src']).toContain('https://fonts.gstatic.com');
    // Fotos (Unsplash y Supabase Storage), vistas previas del admin (blob:) y teselas del mapa
    const mapa = leer('../lib/mapa.js').match(/'(https:\/\/[^']+\{z\}[^']*)'/)[1];
    for (const origen of [
      'https://images.unsplash.com',
      'https://sqybztskwpdiojmupajd.supabase.co',
      'blob:',
      host(mapa),
    ]) {
      expect(directivas['img-src']).toContain(origen);
    }
    // La API va por el rewrite /api (mismo origen) o directa
    expect(directivas['connect-src']).toEqual(["'self'", 'https://kuski-api.vercel.app']);
  });
});

describe('Otras cabeceras', () => {
  it('protege contra sniffing, framing, fugas de referrer y APIs del dispositivo', () => {
    expect(todas).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
  });

  it('cachea un año los assets con hash de Vite', () => {
    expect(reglas['/assets/(.*)']).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });

  it('conserva los rewrites de la API y de la SPA', () => {
    expect(vercel.rewrites).toEqual([
      { source: '/api/(.*)', destination: 'https://kuski-api.vercel.app/api/$1' },
      { source: '/(.*)', destination: '/index.html' },
    ]);
  });
});
