import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Providers } from '@/app/providers';
import { CLAVE_CARRITO } from '@/features/carrito/carrito-storage';
import { rutasResueltas } from '@/test/tienda';

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

// [slug, altitudMin, altitudMax, comunidad principal] (datos reales de Supabase), en el orden
// de la API
const CATEGORIAS = [
  ['cafe', 1050, 1050, 'Comunidad Cafetalera de Quillabamba', 1050],
  ['superalimentos', 2792, 3345, 'Comunidad de Ollantaytambo', 2792],
  ['textiles', 3200, 3760, 'Comunidad Alpaquera de Lares', 3200],
  ['artesania', 3122, 3122, 'Comunidad Artesana de Andahuaylillas', 3122],
].map(([slug, altitudMin, altitudMax, comunidad, altitudMsnm], i) => ({
  id: i + 1,
  nombre: slug,
  slug,
  descripcion: '',
  imagenUrl: `https://img/${slug}.jpg`,
  totalProductos: 11,
  altitudMin,
  altitudMax,
  comunidadPrincipal: { id: i + 10, nombre: comunidad, altitudMsnm },
}));

// Simula la pantalla: escritorio (min-width) y/o movimiento reducido
const simularPantalla = ({ escritorio = false, reducido = false }) =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches:
      (escritorio && query.includes('min-width')) ||
      (reducido && query.includes('prefers-reduced-motion: reduce')),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));

const COMUNIDADES = [
  {
    id: 2,
    nombre: 'Comunidad Tejedora de Chinchero',
    provincia: 'Urubamba',
    altitudMsnm: 3760,
    familiasBeneficiadas: 60,
    totalProductos: 5,
  },
  {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    provincia: 'La Convención',
    altitudMsnm: 1050,
    familiasBeneficiadas: 85,
    totalProductos: 11,
  },
  { id: 3, nombre: 'Comunidad Agrícola de Pisac', altitudMsnm: 2970, totalProductos: 0 },
];

const RESPUESTAS = {
  '/api/v1/productos/destacados': PRODUCTOS,
  '/api/v1/categorias': CATEGORIAS,
  '/api/v1/comunidades': COMUNIDADES,
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
      <RouterProvider router={createMemoryRouter(rutasResueltas, { initialEntries: ['/'] })} />
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
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('sigue la estructura del wireframe con un solo CTA en el hero', async () => {
    renderHome();

    const hero = screen.getByRole('region', { name: 'Del valle a la puna' });
    expect(within(hero).getAllByRole('link')).toHaveLength(1);
    expect(within(hero).getByRole('link', { name: /Explorar catálogo/ })).toHaveAttribute(
      'href',
      '/catalogo',
    );

    // El recorrido de categorías se carga en diferido (no retrasa el primer pintado del hero)
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Cuatro líneas, cuatro alturas' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Destacados de nuestras comunidades' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sube por Cusco, comunidad por comunidad' }),
    ).toBeVisible();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Pago 100 % seguro');
  });

  it('muestra el perfil de altitud de las comunidades en el hero, sin enlaces extra', async () => {
    renderHome();

    expect(
      await screen.findByRole('img', {
        name: 'Altitud de las 3 comunidades productoras: de 1,050 msnm en Quillabamba a 3,760 msnm en Chinchero.',
      }),
    ).toBeInTheDocument();
    const hero = screen.getByRole('region', { name: 'Del valle a la puna' });
    expect(within(hero).getAllByRole('link')).toHaveLength(1);
  });

  it('indica el inicio del altímetro con la comunidad más baja', async () => {
    renderHome();

    const hero = screen.getByRole('region', { name: 'Del valle a la puna' });
    expect(within(hero).getByText('Baja para subir')).toBeInTheDocument();
    expect(await within(hero).findByText('1,050 msnm')).toBeInTheDocument();
    expect(within(hero).getByText('Quillabamba · baja para subir')).toBeInTheDocument();
    expect(within(hero).getByRole('img', { name: /valle del Urubamba/ })).toBeInTheDocument();
  });

  it('el header es transparente sobre el hero y sólido al hacer scroll', async () => {
    renderHome();

    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-sobre-hero');

    window.scrollY = 200;
    fireEvent.scroll(window);
    await waitFor(() => expect(header).not.toHaveAttribute('data-sobre-hero'));
    expect(header).toHaveClass('bg-background');
    window.scrollY = 0;
  });

  it('ordena las categorías por la altitud de su comunidad principal (móvil)', async () => {
    renderHome();

    const lista = await screen.findByRole('list', {
      name: 'Categorías, de menor a mayor altitud',
    });
    const pisos = within(lista).getAllByRole('listitem');
    expect(pisos.map((p) => within(p).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Café',
      'Superalimentos',
      'Artesanía',
      'Textiles',
    ]);
    expect(pisos[0]).toHaveTextContent('1,050 msnm');
    expect(pisos[0]).toHaveTextContent('Origen: Comunidad Cafetalera de Quillabamba');
    expect(pisos[3]).toHaveTextContent('3,200 msnm');
    expect(pisos[3]).toHaveTextContent('De 3,200 a 3,760 msnm · 11 productos');
    expect(screen.queryByTestId('recorrido-categorias')).not.toBeInTheDocument();
  });

  it('enlaza las 4 categorías al catálogo filtrado', async () => {
    renderHome();

    const seccion = screen.getByRole('region', { name: 'Cuatro líneas, cuatro alturas' });
    expect(await within(seccion).findAllByText(/11 productos/)).toHaveLength(4);
    expect(
      within(seccion)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Ver café', 'Ver superalimentos', 'Ver artesanía', 'Ver textiles']);
    expect(within(seccion).getByRole('link', { name: 'Ver café' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=cafe',
    );
    expect(within(seccion).getByRole('link', { name: 'Ver artesanía' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=artesania',
    );
  });

  it('en escritorio muestra el recorrido con altímetro, fondos por piso y montañas', async () => {
    simularPantalla({ escritorio: true });
    renderHome();

    const recorrido = await screen.findByTestId('recorrido-categorias');
    const seccion = screen.getByRole('region', { name: 'Cuatro líneas, cuatro alturas' });
    expect(seccion).toContainElement(recorrido);
    expect(
      within(seccion)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/catalogo?categoria=cafe',
      '/catalogo?categoria=superalimentos',
      '/catalogo?categoria=artesania',
      '/catalogo?categoria=textiles',
    ]);
    // Fondos de ladera (Ichu) y altura (Puna) y tres planos de montaña, todos decorativos
    expect(recorrido.querySelectorAll('[data-fondo]')).toHaveLength(2);
    expect(recorrido.querySelectorAll('[data-plano]')).toHaveLength(3);
    // El altímetro parte en la comunidad más baja; solo el primer panel es visible al inicio
    const altimetro = recorrido.querySelector('[data-cinta]').closest('[aria-hidden]');
    expect(altimetro).toHaveTextContent('1,050');
    const paneles = recorrido.querySelectorAll('[data-panel]');
    expect(paneles[0]).not.toHaveClass('opacity-0');
    expect([...paneles].slice(1).every((p) => p.classList.contains('opacity-0'))).toBe(true);
  });

  it('con movimiento reducido no hay recorrido: versión estática con las 4 categorías', async () => {
    simularPantalla({ escritorio: true, reducido: true });
    renderHome();

    const lista = await screen.findByRole('list', {
      name: 'Categorías, de menor a mayor altitud',
    });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(4);
    expect(within(lista).getByText('3,122')).toBeInTheDocument();
    expect(screen.queryByTestId('recorrido-categorias')).not.toBeInTheDocument();
  });

  it('muestra los destacados con comunidad, altitud y estado de stock', async () => {
    renderHome();

    expect(await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' })).toHaveAttribute(
      'href',
      '/producto/cafe-geisha',
    );
    const seccion = screen.getByRole('region', { name: 'Destacados de nuestras comunidades' });
    expect(within(seccion).getByTitle('Comunidad Cafetalera de Quillabamba')).toHaveTextContent(
      'Quillabamba',
    );
    expect(within(seccion).getByText('1,050 msnm')).toBeInTheDocument();
    expect(within(seccion).getByRole('link', { name: 'Ver todo el catálogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
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

  it('el botón "+" confirma con "Agregado" y lo anuncia', async () => {
    const user = userEvent.setup();
    renderHome();

    const agregar = await screen.findByRole('button', {
      name: 'Agregar Café Geisha de Quillabamba al carrito',
    });
    await user.click(agregar);

    expect(agregar).toHaveTextContent('Agregado');
    expect(screen.getByText('Café Geisha de Quillabamba agregado al carrito')).toBeInTheDocument();
  });

  it('precarga la ficha al pasar el cursor por un destacado (para el elemento compartido)', async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi();
    renderHome();

    await user.hover(await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' }));

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toContain('/api/v1/productos/cafe-geisha?moneda=PEN');
  });

  it('pide los destacados en la moneda elegida', async () => {
    window.localStorage.setItem('kuski.moneda', 'EUR');
    const fetchMock = stubApi();
    renderHome();

    await screen.findByRole('link', { name: 'Café Geisha de Quillabamba' });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toContain('/api/v1/productos/destacados?moneda=EUR&limit=8');
  });

  it('recorre las comunidades del valle a la cumbre con su región natural', async () => {
    renderHome();

    const lista = await screen.findByRole('list', {
      name: 'Comunidades productoras, de menor a mayor altitud',
    });
    const paradas = within(lista).getAllByRole('listitem');
    expect(paradas.map((p) => within(p).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Comunidad Cafetalera de Quillabamba',
      'Comunidad Agrícola de Pisac',
      'Comunidad Tejedora de Chinchero',
    ]);
    expect(paradas[0]).toHaveTextContent('msnm · Yunga');
    expect(paradas[2]).toHaveTextContent('msnm · Suni');
    expect(within(paradas[0]).getByRole('link', { name: 'Ver sus 11 productos' })).toHaveAttribute(
      'href',
      '/catalogo?comunidad=1',
    );
    expect(within(paradas[1]).queryByRole('link')).not.toBeInTheDocument();
  });

  it('resalta la comunidad de la lista al pasar el cursor o el foco (enlazada con su pin)', async () => {
    const user = userEvent.setup();
    renderHome();

    const lista = await screen.findByRole('list', {
      name: 'Comunidades productoras, de menor a mayor altitud',
    });
    const [primera, segunda] = within(lista).getAllByRole('listitem');

    await user.hover(segunda);
    expect(segunda).toHaveAttribute('data-activa');
    expect(primera).not.toHaveAttribute('data-activa');
    await user.unhover(segunda);
    expect(segunda).not.toHaveAttribute('data-activa');

    within(primera).getByRole('link').focus();
    await waitFor(() => expect(primera).toHaveAttribute('data-activa'));
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
