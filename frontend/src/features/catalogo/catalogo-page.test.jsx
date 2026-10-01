import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { llamadas, productoApi, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const CATEGORIAS = [
  { id: 1, nombre: 'Café', slug: 'cafe', totalProductos: 11 },
  { id: 3, nombre: 'Textiles', slug: 'textiles', totalProductos: 12 },
];
const COMUNIDADES = [
  {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    provincia: 'La Convención',
    region: 'Cusco',
    totalProductos: 6,
  },
  { id: 2, nombre: 'Comunidad sin productos', totalProductos: 0 },
];
const CERTIFICACIONES = [{ id: 2, nombre: 'Comercio Justo', entidadEmisora: 'Fairtrade' }];

const pagina = (items, total = items.length, page = 1) => ({
  items,
  pagination: { page, limit: 12, total, totalPages: Math.ceil(total / 12) },
});

const api = (
  productos = (url) => pagina([productoApi()], 30, Number(url.searchParams.get('page'))),
) =>
  stubApi({
    'GET /productos': productos,
    'GET /categorias': CATEGORIAS,
    'GET /comunidades': COMUNIDADES,
    'GET /certificaciones': CERTIFICACIONES,
  });

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

describe('CatalogoPage', () => {
  it('lee los filtros de la URL y los envía a la API en la moneda elegida', async () => {
    window.localStorage.setItem('kuski.moneda', 'USD');
    const fetchMock = api();
    await renderRuta('/catalogo?categoria=cafe&comunidad=1&orden=precio_asc&page=2');

    // Con dos filtros combinados el título es el genérico
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Todo el catálogo' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Mostrando 13–24 de 30 productos')).toBeInTheDocument();
    const [{ url }] = llamadas(fetchMock, 'GET /productos');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      categoria: 'cafe',
      comunidad: '1',
      orden: 'precio_asc',
      page: '2',
      limit: '12',
      moneda: 'USD',
    });
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Página 3' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=cafe&comunidad=1&orden=precio_asc&page=3',
    );
  });

  it('sincroniza los filtros con la URL y vuelve a la página 1', async () => {
    const user = userEvent.setup();
    const fetchMock = api();
    const { router } = await renderRuta('/catalogo?page=2');

    const barra = screen.getByRole('complementary', { name: 'Filtros' });
    await user.click(await within(barra).findByRole('checkbox', { name: /Textiles/ }));
    expect(router.state.location.search).toBe('?categoria=textiles');

    await user.click(within(barra).getByRole('checkbox', { name: /Comercio justo/ }));
    expect(router.state.location.search).toBe('?categoria=textiles&certificacion=2');
    // Solo se listan comunidades con productos
    expect(within(barra).queryByText('Comunidad sin productos')).not.toBeInTheDocument();

    await user.type(within(barra).getByLabelText('Máximo'), '80');
    await user.click(within(barra).getByRole('button', { name: 'Aplicar rango en PEN' }));
    expect(router.state.location.search).toBe('?categoria=textiles&certificacion=2&precio_max=80');

    await waitFor(() =>
      expect(llamadas(fetchMock, 'GET /productos').at(-1).url.searchParams.get('precio_max')).toBe(
        '80',
      ),
    );

    // Chips de filtros activos
    await user.click(screen.getByRole('button', { name: 'Quitar filtro Textiles' }));
    expect(router.state.location.search).toBe('?certificacion=2&precio_max=80');
    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);
    expect(router.state.location.search).toBe('');
  });

  it('ordena y busca desde la barra de herramientas', async () => {
    const user = userEvent.setup();
    api();
    const { router } = await renderRuta('/catalogo');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar productos' }), 'alpaca{Enter}');
    expect(router.state.location.search).toBe('?q=alpaca');
    expect(
      await screen.findByRole('button', { name: 'Quitar filtro “alpaca”' }),
    ).toBeInTheDocument();
  });

  it('muestra skeletons mientras carga y un estado vacío con salida', async () => {
    const user = userEvent.setup();
    api(() => new Promise(() => {}));
    const { unmount } = await renderRuta('/catalogo');
    expect(screen.getByRole('list', { busy: true })).toBeInTheDocument();
    unmount();

    api(() => pagina([], 0));
    const { router } = await renderRuta('/catalogo?categoria=cafe&q=nada');
    expect(
      await screen.findByRole('heading', { name: 'No encontramos productos con estos filtros' }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' }).at(-1));
    expect(router.state.location.search).toBe('');
  });

  it('en móvil abre los filtros en un drawer', async () => {
    const user = userEvent.setup();
    api();
    await renderRuta('/catalogo?categoria=cafe');

    await user.click(screen.getByRole('button', { name: /^Filtros/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Filtros' });
    expect(within(drawer).getByRole('checkbox', { name: /Café/ })).toBeChecked();
    await user.click(await within(drawer).findByRole('button', { name: 'Ver 30 productos' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

it('toma el nombre de la categoría como título si es el único filtro', async () => {
  api();
  await renderRuta('/catalogo?categoria=cafe');
  expect(await screen.findByRole('heading', { level: 1, name: 'Café' })).toBeInTheDocument();
  expect(screen.getByText(/Cafés de altura/)).toBeInTheDocument();
});
