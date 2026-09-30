import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';
import { CLAVE_CARRITO } from '@/features/carrito/carrito-storage';

const imagen = (n) => ({ url: `https://img/${n}.jpg`, textoAlt: n, orden: 0, esPrincipal: true });

const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Café Geisha de Quillabamba',
    slug: 'cafe-geisha',
    precioBasePen: 65,
    precio: { moneda: 'PEN', simbolo: 'S/', monto: 65 },
    stock: 5,
    disponible: true,
    categoria: { id: 1, nombre: 'Café', slug: 'cafe' },
    comunidad: { id: 1, nombre: 'Comunidad Cafetalera de Quillabamba', altitudMsnm: 1050 },
    imagenes: [imagen('cafe-1'), { ...imagen('cafe-2'), orden: 1, esPrincipal: false }],
  },
  {
    id: 2,
    nombre: 'Chal de alpaca',
    slug: 'chal-alpaca',
    precioBasePen: 180,
    precio: { moneda: 'PEN', simbolo: 'S/', monto: 180 },
    stock: 0,
    disponible: false,
    categoria: { id: 3, nombre: 'Textiles', slug: 'textiles' },
    comunidad: { id: 2, nombre: 'Comunidad Tejedora de Chinchero', altitudMsnm: 3760 },
    imagenes: [imagen('chal')],
  },
];

const CATEGORIAS = ['cafe', 'superalimentos', 'textiles', 'artesania'].map((slug, i) => ({
  id: i + 1,
  nombre: slug,
  slug,
  descripcion: '',
  imagenUrl: `https://img/${slug}.jpg`,
  totalProductos: 11,
}));

const RESPUESTAS = {
  '/api/v1/productos/destacados': PRODUCTOS,
  '/api/v1/categorias': CATEGORIAS,
  '/api/v1/comunidades': [],
  '/api/v1/estadisticas/trazabilidad': {
    comunidades: 8,
    familias: 450,
    productos: 44,
    paises: 31,
    altitudMinima: 1050,
    altitudMaxima: 3760,
  },
};

const json = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const stubApi = (fallos = []) => {
  const fetchMock = vi.fn(async (url) => {
    const ruta = String(url).split('?')[0];
    if (fallos.includes(ruta)) return json(404, { error: { code: 'X', message: 'x' } });
    return json(200, { data: RESPUESTAS[ruta] ?? null });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderHome = () =>
  render(
    <Providers>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
    </Providers>,
  );

beforeAll(() => {
  window.matchMedia ??= vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  window.scrollTo = vi.fn();
});

beforeEach(() => {
  stubApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('sigue la estructura del wireframe con un solo CTA en el hero', async () => {
    renderHome();

    const hero = screen.getByRole('region', { name: /Lo mejor de los Andes/ });
    expect(within(hero).getAllByRole('link')).toHaveLength(1);
    expect(within(hero).getByRole('link', { name: /Explorar catálogo/ })).toHaveAttribute(
      'href',
      '/catalogo',
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Explora por categoría' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Destacados de nuestras comunidades' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Cada producto tiene un lugar en el mapa' }),
    ).toBeVisible();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Pago 100 % seguro');
  });

  it('enlaza las 4 categorías al catálogo filtrado', async () => {
    renderHome();

    const seccion = screen.getByRole('region', { name: 'Explora por categoría' });
    expect(await within(seccion).findAllByText('11 productos')).toHaveLength(4);
    expect(within(seccion).getAllByRole('link')).toHaveLength(4);
    expect(within(seccion).getByRole('link', { name: /Café/ })).toHaveAttribute(
      'href',
      '/catalogo?categoria=cafe',
    );
    expect(within(seccion).getByRole('link', { name: /Artesanía/ })).toHaveAttribute(
      'href',
      '/catalogo?categoria=artesania',
    );
  });

  it('muestra los destacados con comunidad, altitud y estado de stock', async () => {
    renderHome();

    expect(await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' })).toHaveAttribute(
      'href',
      '/producto/cafe-geisha',
    );
    expect(screen.getAllByText('Comunidad Cafetalera de Quillabamba')[0]).toBeInTheDocument();
    expect(screen.getAllByText('1,050 msnm')[0]).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Agregar Chal de alpaca al carrito' }),
    ).toBeDisabled();
  });

  it('agrega al carrito de invitado sin salir de la página', async () => {
    const user = userEvent.setup();
    renderHome();

    const agregar = await screen.findByRole('button', {
      name: 'Agregar Café Geisha de Quillabamba al carrito',
    });
    await user.click(agregar);
    await user.click(agregar);

    expect(screen.getByRole('button', { name: 'Abrir carrito, 2 productos' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(CLAVE_CARRITO))).toMatchObject([
      { productoId: 1, cantidad: 2 },
    ]);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('pide los destacados en la moneda elegida', async () => {
    window.localStorage.setItem('kuski.moneda', 'EUR');
    const fetchMock = stubApi();
    renderHome();

    await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toContain('/api/v1/productos/destacados?moneda=EUR&limit=8');
  });

  it('muestra las cifras de trazabilidad para lectores de pantalla', async () => {
    renderHome();

    expect(await screen.findByText('31')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText(/entre 1,050 y 3,760 metros/)).toBeInTheDocument();
  });

  it('muestra un error recuperable si falla una sección', async () => {
    stubApi(['/api/v1/categorias']);
    renderHome();

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' }),
    ).toBeInTheDocument();
  });
});
