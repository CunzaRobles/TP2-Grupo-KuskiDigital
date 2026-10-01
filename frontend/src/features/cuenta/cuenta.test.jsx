import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { USUARIO, carritoApi, llamadas, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const pasos = (completados) =>
  ['confirmado', 'preparando', 'en_transito', 'entregado'].map((clave, i) => ({
    clave,
    completado: i < completados,
    fecha: null,
  }));

const PEDIDOS = {
  items: [
    {
      codigo: 'KD-000002',
      estado: 'en_transito',
      creadoEn: '2026-09-28T10:00:00.000Z',
      moneda: 'EUR',
      totalMoneda: 58.4,
      paisCodigo: 'DE',
      totalUnidades: 1,
      productos: ['Poncho Chinchero de Alpaca'],
      envio: { transportista: 'DHL Express', fechaEstimada: '2026-10-04' },
      tracking: { estadoActual: 'en_transito', cancelado: false, pasos: pasos(3) },
    },
  ],
  pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
};

const DIRECCION = {
  id: 1,
  nombreDestinatario: 'María Quispe',
  paisCodigo: 'PE',
  ciudad: 'Cusco',
  direccion: 'Av. de la Cultura 1520',
  codigoPostal: null,
  telefono: null,
  esPrincipal: true,
};

const api = (rutas = {}) =>
  stubApi({
    'GET /auth/sesion': { usuario: USUARIO },
    'GET /carrito': carritoApi([]),
    'GET /pedidos': PEDIDOS,
    'GET /direcciones': [DIRECCION],
    ...rutas,
  });

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

describe('Mi cuenta', () => {
  it('lista mis pedidos con su tracking y enlace al detalle', async () => {
    api();
    await renderRuta('/cuenta');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, María' }),
    ).toBeInTheDocument();
    const pedido = await screen.findByRole('article');
    expect(within(pedido).getByText('KD-000002')).toBeInTheDocument();
    expect(
      within(pedido).getByText('En tránsito', { selector: '[data-slot=badge]' }),
    ).toBeInTheDocument();
    expect(within(pedido).getByText(/58\.40/)).toBeInTheDocument();
    const pasoActual = pedido.querySelector('[aria-current="step"]');
    expect(pasoActual).toHaveTextContent('En tránsito');
    expect(
      within(pedido).getByRole('link', { name: 'Ver detalle del pedido KD-000002' }),
    ).toHaveAttribute('href', '/pedido/KD-000002');
  });

  it('gestiona mis direcciones: agregar y eliminar', async () => {
    const user = userEvent.setup();
    const fetchMock = api({
      'POST /direcciones': (_url, body) => ({ id: 2, ...body, esPrincipal: false }),
      'DELETE /direcciones/1': [],
    });
    await renderRuta('/cuenta/direcciones');

    expect(await screen.findByText('Av. de la Cultura 1520', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agregar dirección' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Agregar dirección' });
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar dirección' }));
    expect(await within(dialogo).findByText(/Escribe la dirección completa/)).toBeInTheDocument();
    await user.type(within(dialogo).getByLabelText('Dirección'), 'Calle Plateros 334');
    await user.type(within(dialogo).getByLabelText('Ciudad'), 'Cusco');
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(llamadas(fetchMock, 'POST /direcciones')).toHaveLength(1));
    expect(llamadas(fetchMock, 'POST /direcciones')[0].body).toMatchObject({
      nombreDestinatario: 'María Quispe',
      paisCodigo: 'PE',
      direccion: 'Calle Plateros 334',
      ciudad: 'Cusco',
    });

    await user.click(
      screen.getByRole('button', { name: 'Eliminar la dirección Av. de la Cultura 1520' }),
    );
    const confirmar = await screen.findByRole('dialog', { name: '¿Eliminar esta dirección?' });
    await user.click(within(confirmar).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(llamadas(fetchMock, 'DELETE /direcciones/1')).toHaveLength(1));
    expect(await screen.findByText('No tienes direcciones guardadas')).toBeInTheDocument();
  });

  it('cierra la sesión y vuelve al inicio', async () => {
    const user = userEvent.setup();
    const fetchMock = api({ 'POST /auth/logout': { ok: true } });
    const { router } = await renderRuta('/cuenta');

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(llamadas(fetchMock, 'POST /auth/logout')).toHaveLength(1);
  });
});
