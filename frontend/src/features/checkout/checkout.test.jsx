import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  USUARIO,
  carritoApi,
  json,
  llamadas,
  productoApi,
  renderRuta,
  stubApi,
  stubNavegador,
} from '@/test/tienda';

const CAFE = productoApi();
const DIRECCIONES = [
  {
    id: 1,
    nombreDestinatario: 'María Quispe',
    paisCodigo: 'PE',
    ciudad: 'Cusco',
    direccion: 'Av. de la Cultura 1520',
    codigoPostal: '08002',
    telefono: null,
    esPrincipal: true,
  },
  {
    id: 2,
    nombreDestinatario: 'Anna Becker',
    paisCodigo: 'DE',
    ciudad: 'Berlin',
    direccion: 'Kastanienallee 12',
    codigoPostal: '10435',
    telefono: null,
    esPrincipal: false,
  },
];

const r2 = (n) => Math.round(n * 100) / 100;

// Cotización simplificada: Perú (con IGV) o Alemania (sin IGV), 2 cafés de S/ 65.
const cotizar = (_url, { paisCodigo, metodoEnvio }) => {
  const peru = paisCodigo === 'PE';
  const opciones = peru
    ? [
        ['estandar', 'Olva Courier', 16.5, 3, 5],
        ['express', 'Olva Express', 27.5, 1, 2],
      ]
    : [
        ['estandar', 'Serpost', 107.5, 12, 18],
        ['express', 'DHL Express', 200, 4, 7],
      ];
  const opcionesEnvio = opciones.map(([metodo, transportista, costo, diasMin, diasMax]) => {
    const igv = peru ? r2((130 + costo) * 0.18) : 0;
    return { metodo, transportista, costo, diasMin, diasMax, igv, total: r2(130 + costo + igv) };
  });
  const elegida = opcionesEnvio.find((o) => o.metodo === metodoEnvio);
  return {
    paisCodigo,
    moneda: 'PEN',
    tipoCambio: 1,
    metodoEnvio,
    igv: { aplica: peru, tasa: peru ? 0.18 : 0 },
    opcionesEnvio,
    resumen: {
      subtotal: 130,
      envio: elegida.costo,
      igv: elegida.igv,
      total: elegida.total,
      totalPen: elegida.total,
    },
  };
};

const pedidoCreado = (pago) => ({
  codigo: 'KD-000123',
  estado: 'pagado',
  creadoEn: '2026-09-30T15:00:00.000Z',
  moneda: 'PEN',
  tipoCambio: 1,
  montos: { subtotal: 130, envio: 27.5, igv: 28.35, total: 185.85, totalPen: 185.85 },
  direccion: { ...DIRECCIONES[0] },
  items: [
    {
      productoId: 1,
      nombreProducto: CAFE.nombre,
      slug: CAFE.slug,
      imagen: null,
      cantidad: 2,
      precioUnitario: 65,
      subtotal: 130,
    },
  ],
  pago: {
    metodo: pago.metodo,
    estado: 'aprobado',
    numeroOperacion: 'SIM-12345678',
    tarjetaUltimos4: null,
    codigoAprobacion: '482913',
  },
  envio: {
    transportista: 'Olva Express',
    metodo: 'express',
    codigoSeguimiento: 'OLV-000123',
    fechaEstimada: '2026-10-02',
  },
  tracking: {
    estadoActual: 'pagado',
    cancelado: false,
    pasos: [
      { clave: 'confirmado', completado: true, fecha: '2026-09-30T15:00:02.000Z' },
      { clave: 'preparando', completado: false, fecha: null },
      { clave: 'en_transito', completado: false, fecha: null },
      { clave: 'entregado', completado: false, fecha: null },
    ],
  },
});

const api = (rutas = {}) =>
  stubApi({
    'GET /auth/sesion': { usuario: USUARIO },
    'GET /carrito': carritoApi([{ id: 7, producto: CAFE, cantidad: 2, precio: 65 }]),
    'GET /direcciones': DIRECCIONES,
    'POST /checkout/cotizar': cotizar,
    ...rutas,
  });

const resumen = () => screen.getByRole('region', { name: 'Tu pedido' });

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

describe('checkout', () => {
  it(
    'flujo completo con Yape: cotiza por país, elige envío, paga y confirma',
    { timeout: 20_000 },
    async () => {
      const user = userEvent.setup();
      let aprobar;
      const fetchMock = api({
        'POST /pedidos': (_url, body) =>
          new Promise((resolve) => {
            aprobar = () => resolve(pedidoCreado(body.pago));
          }),
      });
      const { router } = await renderRuta('/checkout');

      // Paso 1: la dirección principal (Perú) viene elegida y el total incluye IGV
      expect(
        await screen.findByRole('heading', { name: '¿A dónde enviamos tu pedido?' }),
      ).toBeInTheDocument();
      await waitFor(() => expect(resumen()).toHaveTextContent('S/ 172.87'));
      expect(resumen()).toHaveTextContent('IGV (18 %)');

      // Cambiar a la dirección de Alemania recalcula: sin IGV y envío internacional
      await user.click(screen.getByRole('radio', { name: /Anna Becker/ }));
      await waitFor(() => expect(resumen()).toHaveTextContent('S/ 237.50'));
      expect(resumen()).toHaveTextContent('No aplica a envíos fuera de Perú');
      expect(llamadas(fetchMock, 'POST /checkout/cotizar').at(-1).body).toEqual({
        paisCodigo: 'DE',
        moneda: 'PEN',
        metodoEnvio: 'estandar',
      });

      await user.click(screen.getByRole('radio', { name: /María Quispe/ }));
      await user.click(screen.getByRole('button', { name: /Continuar al método de envío/ }));

      // Paso 2: opciones con precio y días visibles
      await screen.findByRole('heading', { name: 'Elige cómo quieres recibirlo' });
      const express = await screen.findByRole('radio', { name: /Express/ });
      expect(express).toHaveTextContent('Olva Express · 1–2 días');
      expect(express).toHaveTextContent('S/ 27.50');
      await user.click(express);
      await waitFor(() => expect(resumen()).toHaveTextContent('S/ 185.85'));
      await user.click(screen.getByRole('button', { name: /^Continuar$/ }));
      await screen.findByRole('heading', { name: '¿Cómo quieres pagar?' });

      // Paso 3: Yape con celular inválido y luego válido
      await user.click(await screen.findByRole('radio', { name: /Yape/ }));
      const celular = screen.getByLabelText('Celular registrado en Yape');
      await user.type(celular, '812345678');
      await user.click(screen.getByRole('button', { name: /Revisar el pedido/ }));
      expect(await screen.findByText(/Ingresa un celular peruano/)).toBeInTheDocument();
      await user.clear(celular);
      await user.type(celular, '987 654 321');
      await user.click(screen.getByRole('button', { name: /Revisar el pedido/ }));

      // Paso 4: repaso y pago con "procesando"
      await screen.findByRole('heading', { name: 'Revisa y confirma tu pedido' });
      expect(await screen.findByText('Yape · 987 *** 321')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Pagar S\/\s185\.85/ }));
      expect(await screen.findByRole('dialog', { name: 'Procesando tu pago' })).toBeInTheDocument();
      expect(llamadas(fetchMock, 'POST /pedidos')[0].body).toEqual({
        direccionId: 1,
        metodoEnvio: 'express',
        moneda: 'PEN',
        pago: { metodo: 'yape', telefono: '987654321' },
      });

      aprobar();
      await waitFor(() => expect(router.state.location.pathname).toBe('/pedido/KD-000123'));
      expect(
        await screen.findByRole('heading', { level: 1, name: /Gracias, María/ }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('codigo-pedido')).toHaveTextContent('KD-000123');
      expect(screen.getByTestId('codigo-aprobacion')).toHaveTextContent('482913');
      const tracking = screen.getByRole('region', { name: 'Seguimiento del pedido' });
      expect(within(tracking).getByText('Confirmado')).toBeInTheDocument();
      expect(within(tracking).getByText('Entregado')).toBeInTheDocument();
    },
  );

  it(
    'tarjeta terminada en 0002: muestra el rechazo y permite reintentar sin perder datos',
    { timeout: 20_000 },
    async () => {
      const user = userEvent.setup();
      api({
        'POST /pedidos': json(402, {
          error: {
            code: 'PAGO_RECHAZADO',
            message: 'Tarjeta rechazada',
            details: { numeroOperacion: 'SIM-999', metodo: 'tarjeta' },
          },
        }),
      });
      await renderRuta('/checkout');

      await user.click(await screen.findByRole('button', { name: /Continuar al método de envío/ }));
      await screen.findByRole('heading', { name: 'Elige cómo quieres recibirlo' });
      await user.click(screen.getByRole('button', { name: /^Continuar$/ }));
      await screen.findByRole('heading', { name: '¿Cómo quieres pagar?' });
      await user.click(await screen.findByRole('radio', { name: /Tarjeta/ }));

      const numero = screen.getByLabelText('Número de tarjeta');
      await user.type(numero, '4000000000000002');
      expect(numero).toHaveValue('4000 0000 0000 0002');
      expect(screen.getByText('Tarjeta Visa')).toBeInTheDocument();
      await user.type(screen.getByLabelText('Titular'), 'María Quispe');
      const vencimiento = screen.getByLabelText('Vencimiento');
      await user.type(vencimiento, '1230');
      expect(vencimiento).toHaveValue('12/30');
      await user.type(screen.getByLabelText('CVV'), '123');
      await user.click(screen.getByRole('button', { name: /Revisar el pedido/ }));

      expect(await screen.findByText('Visa •••• •••• •••• 0002')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Pagar/ }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/El pago no se aprobó/);
      expect(screen.getByRole('alert')).toHaveTextContent('Operación SIM-999');
      expect(screen.getByRole('heading', { name: '¿Cómo quieres pagar?' })).toBeInTheDocument();
      // Se conservan los datos, salvo el CVV (como en una pasarela real)
      expect(screen.getByLabelText('Número de tarjeta')).toHaveValue('4000 0000 0000 0002');
      expect(screen.getByLabelText('CVV')).toHaveValue('');
    },
  );

  it('pide una dirección nueva si no hay guardadas y la guarda con el pedido', async () => {
    const user = userEvent.setup();
    const fetchMock = api({ 'GET /direcciones': [] });
    await renderRuta('/checkout');

    // Nombre y país vienen del perfil
    const destinatario = await screen.findByLabelText('Nombre de quien recibe');
    expect(destinatario).toHaveValue('María Quispe');
    await waitFor(() => expect(resumen()).toHaveTextContent('S/ 172.87'));

    await user.click(screen.getByRole('button', { name: /Continuar al método de envío/ }));
    expect(await screen.findByText(/Escribe la dirección completa/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Dirección')).toHaveFocus());

    await user.type(screen.getByLabelText('Dirección'), 'Calle Plateros 334');
    await user.type(screen.getByLabelText('Ciudad'), 'Cusco');
    await user.click(screen.getByRole('button', { name: /Continuar al método de envío/ }));
    expect(
      await screen.findByRole('heading', { name: 'Elige cómo quieres recibirlo' }),
    ).toBeInTheDocument();

    // Volver no pierde los datos
    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(await screen.findByLabelText('Dirección')).toHaveValue('Calle Plateros 334');
    expect(llamadas(fetchMock, 'POST /checkout/cotizar')[0].body.paisCodigo).toBe('PE');
  });

  it('con otra moneda, Yape y Plin se ofrecen deshabilitados con atajo a soles', async () => {
    window.localStorage.setItem('kuski.moneda', 'EUR');
    const user = userEvent.setup();
    api();
    await renderRuta('/checkout');

    await user.click(await screen.findByRole('button', { name: /Continuar al método de envío/ }));
    await screen.findByRole('heading', { name: 'Elige cómo quieres recibirlo' });
    await user.click(screen.getByRole('button', { name: /^Continuar$/ }));
    await screen.findByRole('heading', { name: '¿Cómo quieres pagar?' });
    expect(await screen.findByRole('radio', { name: /Yape/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Plin/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Pagar en soles (PEN)' }));
    expect(screen.getByRole('radio', { name: /Yape/ })).toBeEnabled();
  });

  it('con el carrito vacío ofrece volver al catálogo', async () => {
    api({ 'GET /carrito': carritoApi([]) });
    await renderRuta('/checkout');
    expect(
      await screen.findByRole('heading', { name: 'No hay nada que pagar todavía' }),
    ).toBeInTheDocument();
  });
});
