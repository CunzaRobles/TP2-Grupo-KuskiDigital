import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';
import { CLAVE_CARRITO } from './carrito-storage';

const CAFE = { productoId: 1, slug: 'cafe', nombre: 'Café Geisha', imagenUrl: null, stock: 5 };
const PONCHO = {
  productoId: 26,
  slug: 'poncho',
  nombre: 'Poncho de alpaca',
  imagenUrl: null,
  stock: 6,
};
const PRECIOS_USD = { 1: 17.33, 26: 93.33 };

const lineaApi = (item, cantidad, datos = {}) => ({
  id: null,
  productoId: item.productoId,
  cantidad,
  precioUnitario: PRECIOS_USD[item.productoId],
  subtotal: Math.round(PRECIOS_USD[item.productoId] * cantidad * 100) / 100,
  aviso: null,
  producto: {
    id: item.productoId,
    nombre: item.nombre,
    slug: item.slug,
    stock: item.stock,
    imagen: null,
  },
  ...datos,
});

// POST /carrito/invitado: precios en USD de lo que haya en localStorage
const preciosInvitado = (_url, { items }) => ({
  id: null,
  moneda: 'USD',
  items: items.map(({ productoId, cantidad }) =>
    lineaApi(productoId === 1 ? CAFE : PONCHO, cantidad),
  ),
});

const guardarLocal = (items) => window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

describe('carrito de invitado (localStorage)', () => {
  it('pinta /carrito con precios en la moneda elegida y permite editar y quitar', async () => {
    window.localStorage.setItem('kuski.moneda', 'USD');
    guardarLocal([
      { ...CAFE, cantidad: 2 },
      { ...PONCHO, cantidad: 1 },
    ]);
    const user = userEvent.setup();
    const fetchMock = stubApi({ 'POST /carrito/invitado': preciosInvitado });
    renderRuta('/carrito');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tu carrito' }),
    ).toBeInTheDocument();
    const resumen = screen.getByRole('complementary', { name: 'Resumen' });
    await waitFor(() => expect(resumen).toHaveTextContent('$ 127.99')); // 34.66 + 93.33
    expect(resumen).toHaveTextContent('Se calcula en el checkout');
    expect(llamadas(fetchMock, 'POST /carrito/invitado')[0].url.searchParams.get('moneda')).toBe(
      'USD',
    );

    await user.click(screen.getAllByRole('button', { name: 'Aumentar cantidad' })[0]);
    expect(JSON.parse(window.localStorage.getItem(CLAVE_CARRITO))[0].cantidad).toBe(3);
    await waitFor(() => expect(resumen).toHaveTextContent('$ 145.32'));

    await user.click(screen.getByRole('button', { name: 'Quitar Poncho de alpaca del carrito' }));
    await waitFor(() => expect(screen.queryByText('Poncho de alpaca')).not.toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(CLAVE_CARRITO))).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Abrir carrito, 3 productos' })).toBeInTheDocument();
  });

  it('avisa del stock insuficiente y bloquea el checkout', async () => {
    guardarLocal([{ ...PONCHO, cantidad: 4 }]);
    stubApi({
      'POST /carrito/invitado': {
        id: null,
        moneda: 'USD',
        items: [lineaApi({ ...PONCHO, stock: 2 }, 4, { aviso: 'STOCK_INSUFICIENTE' })],
      },
    });
    renderRuta('/carrito');

    expect(await screen.findByText('Solo quedan 2 unidades')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continuar con la compra/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('muestra un estado vacío con salida al catálogo', async () => {
    stubApi();
    renderRuta('/carrito');
    expect(
      await screen.findByRole('heading', { name: 'Tu carrito está vacío' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar catálogo/ })).toHaveAttribute(
      'href',
      '/catalogo',
    );
  });

  it('el header abre el drawer con el subtotal y el enlace al resumen', async () => {
    guardarLocal([{ ...CAFE, cantidad: 1 }]);
    const user = userEvent.setup();
    stubApi({ 'POST /carrito/invitado': preciosInvitado });
    renderRuta('/catalogo');

    await user.click(screen.getByRole('button', { name: 'Abrir carrito, 1 producto' }));
    const drawer = await screen.findByRole('dialog', { name: 'Tu carrito' });
    expect(await within(drawer).findAllByText('$ 17.33')).not.toHaveLength(0);
    expect(within(drawer).getByRole('link', { name: 'Ver resumen del carrito' })).toHaveAttribute(
      'href',
      '/carrito',
    );
  });
});

describe('carrito con sesión (API)', () => {
  const usuario = { id: 10, nombre: 'María', rol: 'cliente' };
  const carritoApi = (items) => ({
    id: 5,
    moneda: 'PEN',
    items,
    totalUnidades: items.reduce((n, l) => n + l.cantidad, 0),
    subtotal: items.reduce((s, l) => s + l.subtotal, 0),
  });
  const lineaPen = (id, item, cantidad) => ({
    ...lineaApi(item, cantidad),
    id,
    precioUnitario: 65,
    subtotal: 65 * cantidad,
  });

  it('fusiona el carrito de invitado al detectar la sesión y lo borra de localStorage', async () => {
    guardarLocal([{ ...CAFE, cantidad: 2 }]);
    const fetchMock = stubApi({
      'GET /auth/me': { usuario },
      'GET /carrito': carritoApi([]),
      'POST /carrito/fusionar': {
        carrito: carritoApi([lineaPen(7, CAFE, 2)]),
        ajustes: [],
      },
    });
    renderRuta('/carrito');

    await waitFor(() => expect(llamadas(fetchMock, 'POST /carrito/fusionar')).toHaveLength(1));
    expect(llamadas(fetchMock, 'POST /carrito/fusionar')[0].body).toEqual({
      items: [{ productoId: 1, cantidad: 2 }],
    });
    await waitFor(() => expect(window.localStorage.getItem(CLAVE_CARRITO)).toBe('[]'));
    expect(screen.getByRole('link', { name: 'Café Geisha' })).toBeInTheDocument();
    expect(
      await screen.findByText('Sumamos a tu cuenta los productos que agregaste como invitado'),
    ).toBeInTheDocument();
  });

  it('edita el carrito en la API con actualización optimista', async () => {
    const user = userEvent.setup();
    let responder;
    const fetchMock = stubApi({
      'GET /auth/me': { usuario },
      'GET /carrito': carritoApi([lineaPen(7, CAFE, 1)]),
      'PATCH /carrito/items/7': () =>
        new Promise((resolve) => {
          responder = () => resolve(carritoApi([lineaPen(7, CAFE, 2)]));
        }),
    });
    renderRuta('/carrito');

    await user.click(await screen.findByRole('button', { name: 'Aumentar cantidad' }));
    // Antes de la respuesta la cantidad y el subtotal ya cambiaron
    expect(screen.getByRole('textbox', { name: 'Cantidad de Café Geisha' })).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Abrir carrito, 2 productos' })).toBeInTheDocument();
    expect(llamadas(fetchMock, 'PATCH /carrito/items/7')[0].body).toEqual({ cantidad: 2 });

    responder();
    await waitFor(() =>
      expect(screen.getByRole('complementary', { name: 'Resumen' })).toHaveTextContent('130.00'),
    );
    expect(window.localStorage.getItem(CLAVE_CARRITO)).toBeNull();
  });
});
