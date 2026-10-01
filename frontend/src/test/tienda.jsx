import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';

// Utilidades para probar páginas completas de la tienda con la API simulada.

// Las páginas son rutas diferidas (`lazy`). Para las pruebas se resuelven una vez aquí: la
// página aparece en el primer render, como con un import estático. router.test.jsx prueba la
// carga diferida real con `routes`.
async function resolverDiferidas(lista) {
  return Promise.all(
    lista.map(async ({ lazy, children, ...ruta }) => ({
      ...ruta,
      ...(typeof lazy === 'function' ? await lazy() : {}),
      ...(children && { children: await resolverDiferidas(children) }),
    })),
  );
}
export const rutasResueltas = await resolverDiferidas(routes);

export const json = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// JSON → objeto; FormData (subida de imágenes) se entrega tal cual.
const leerCuerpo = (body) => (typeof body === 'string' ? JSON.parse(body) : body);

/**
 * Simula fetch. `rutas` asocia "MÉTODO /ruta" (sin /api/v1 ni query) con la respuesta:
 * un valor (se envuelve en { data }) o una función (url, cuerpo) → valor | Response.
 * Las rutas no declaradas responden { data: null } (p. ej. /auth/me → invitado).
 */
export function stubApi(rutas = {}) {
  const fetchMock = vi.fn(async (url, init = {}) => {
    const u = new URL(String(url), 'http://localhost');
    const ruta = `${init.method ?? 'GET'} ${u.pathname.replace('/api/v1', '')}`;
    const respuesta = rutas[ruta];
    if (respuesta === undefined) return json(200, { data: null });
    const valor =
      typeof respuesta === 'function' ? await respuesta(u, leerCuerpo(init.body)) : respuesta;
    return valor instanceof Response ? valor : json(200, { data: valor });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Llamadas hechas a una ruta ("GET /productos"): [{ url: URL, body }]
export const llamadas = (fetchMock, ruta) =>
  fetchMock.mock.calls
    .map(([url, init = {}]) => ({
      url: new URL(String(url), 'http://localhost'),
      metodo: init.method ?? 'GET',
      body: leerCuerpo(init.body),
    }))
    .filter(({ url, metodo }) => `${metodo} ${url.pathname.replace('/api/v1', '')}` === ruta);

export function renderRuta(ruta) {
  const router = createMemoryRouter(rutasResueltas, { initialEntries: [ruta] });
  return {
    router,
    ...render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
}

// jsdom no implementa matchMedia (Motion) ni scrollTo/scrollIntoView (router, pestañas).
export function stubNavegador() {
  window.matchMedia ??= vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView ??= vi.fn();
}

const imagen = (n, orden = 0) => ({
  url: `https://img/${n}.jpg`,
  textoAlt: n,
  orden,
  esPrincipal: orden === 0,
});

// Producto con el formato de la API (tarjeta y ficha).
export const productoApi = (datos = {}) => ({
  id: 1,
  sku: 'CAF-001',
  nombre: 'Café Geisha de Quillabamba',
  slug: 'cafe-geisha',
  descripcion: 'Café de altura con notas florales.',
  precioBasePen: 65,
  precio: { moneda: 'PEN', simbolo: 'S/', monto: 65 },
  stock: 5,
  disponible: true,
  pesoG: 250,
  destacado: true,
  calificacionPromedio: 4.5,
  totalResenas: 2,
  categoria: { id: 1, nombre: 'Café', slug: 'cafe' },
  comunidad: {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    provincia: 'La Convención',
    region: 'Cusco',
    altitudMsnm: 1050,
  },
  imagenes: [imagen('cafe-1'), imagen('cafe-2', 1)],
  certificaciones: [{ id: 1, nombre: 'Orgánico' }],
  ...datos,
});

export const USUARIO = {
  id: 10,
  nombre: 'María',
  apellido: 'Quispe',
  correo: 'maria.quispe@example.com',
  telefono: '+51 987 654 321',
  paisCodigo: 'PE',
  rol: 'cliente',
};

// Carrito del servidor (GET /carrito) con líneas { id, producto, cantidad, precio }.
export const carritoApi = (lineas = [], moneda = 'PEN') => {
  const items = lineas.map(({ id, producto, cantidad, precio }) => ({
    id,
    productoId: producto.id,
    cantidad,
    precioUnitario: precio,
    subtotal: Math.round(precio * cantidad * 100) / 100,
    aviso: null,
    producto: {
      id: producto.id,
      nombre: producto.nombre,
      slug: producto.slug,
      stock: producto.stock,
      imagen: null,
    },
  }));
  return {
    id: 5,
    moneda,
    items,
    totalUnidades: items.reduce((n, i) => n + i.cantidad, 0),
    subtotal: items.reduce((s, i) => s + i.subtotal, 0),
  };
};
