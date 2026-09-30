import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cafe, itemCarrito, poncho } from './helpers/fixtures.js';
import { cookieDe } from './helpers/sesion.js';

const carritoRepository = await import('../src/repositories/carrito.repository.js');
const direccionRepository = await import('../src/repositories/direccion.repository.js');
const pedidoRepository = await import('../src/repositories/pedido.repository.js');
const productoRepository = await import('../src/repositories/producto.repository.js');
const usuarioRepository = await import('../src/repositories/usuario.repository.js');
const { withTransaction } = await import('../src/repositories/transaction.repository.js');
const { default: app } = await import('../src/app.js');

const TX = { tx: 'mock' };
const sesion = cookieDe({ id: 10 });

const direccion = {
  nombreDestinatario: 'María Quispe',
  paisCodigo: 'PE',
  ciudad: 'Cusco',
  direccion: 'Av. de la Cultura 1520',
};
const pagoYape = { metodo: 'yape', telefono: '987 654 321' };
const tarjeta = (numero) => ({
  metodo: 'tarjeta',
  tarjeta: { numero, titular: 'Anna Becker', vencimiento: '12/30', cvv: '123' },
});

// Fila de pedido como la devuelve pedido.repository.findByCodigo
const pedidoDb = {
  id: 1,
  codigo: 'KD-000001',
  usuarioId: 10,
  estado: 'pagado',
  moneda: 'PEN',
  tipoCambio: '1.0000',
  subtotalPen: '70.00',
  costoEnvioPen: '16.50',
  igvPen: '15.57',
  totalPen: '102.07',
  totalMoneda: '102.07',
  envioDestinatario: 'María Quispe',
  envioPaisCodigo: 'PE',
  envioCiudad: 'Cusco',
  envioDireccion: 'Av. de la Cultura 1520',
  envioCodigoPostal: null,
  envioTelefono: null,
  creadoEn: '2026-09-29T15:00:00.000Z',
  items: [
    {
      productoId: 1,
      nombreProducto: cafe.nombre,
      cantidad: 2,
      precioUnitarioPen: '35.00',
      subtotalPen: '70.00',
      producto: {
        id: 1,
        slug: cafe.slug,
        imagenes: [{ url: 'https://img/x.jpg', textoAlt: 'Café' }],
      },
    },
  ],
  historialEstados: [
    { estado: 'pendiente', comentario: 'Pedido registrado', creadoEn: '2026-09-29T15:00:00.000Z' },
    { estado: 'pagado', comentario: 'Pago aprobado', creadoEn: '2026-09-29T15:00:02.000Z' },
  ],
  pago: {
    metodo: 'yape',
    estado: 'aprobado',
    pasarela: 'simulada',
    monto: '102.07',
    moneda: 'PEN',
    numeroOperacion: 'SIM-123',
    tarjetaUltimos4: null,
    mensajeRespuesta: 'Yape aprobado',
  },
  envio: {
    transportista: 'Olva Courier',
    metodo: 'estandar',
    codigoSeguimiento: 'OLV-12345678',
    pesoTotalG: 500,
    fechaEstimada: '2026-10-04',
    fechaEntrega: null,
  },
};

beforeEach(() => {
  carritoRepository.findOrCreateIdByUsuario.mockResolvedValue(5);
  carritoRepository.findItems.mockResolvedValue([itemCarrito(1, cafe, 2)]);
  productoRepository.findParaVenta.mockResolvedValue([cafe, poncho]);
  productoRepository.descontarStock.mockImplementation(async (id, cantidad) =>
    id === 1 ? cafe.stock - cantidad : poncho.stock - cantidad,
  );
  pedidoRepository.create.mockResolvedValue({ id: 1 });
  pedidoRepository.findByCodigo.mockResolvedValue(pedidoDb);
  usuarioRepository.findById.mockResolvedValue({ id: 10, nombre: 'María', correo: 'm@x.pe' });
});

const crear = (body, cookie = sesion) =>
  request(app).post('/api/v1/pedidos').set('Cookie', cookie).send(body);

describe('POST /api/v1/pedidos', () => {
  it('crea el pedido completo en una transacción (201)', async () => {
    const res = await crear({ direccion, metodoEnvio: 'estandar', moneda: 'PEN', pago: pagoYape });

    expect(res.status).toBe(201);
    expect(withTransaction).toHaveBeenCalledTimes(1);

    // Stock bloqueado dentro de la transacción
    expect(productoRepository.findParaVenta).toHaveBeenCalledWith([1], TX);

    // Pedido con snapshot de dirección, montos y tipo de cambio
    expect(pedidoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 10,
        estado: 'pendiente',
        moneda: 'PEN',
        tipoCambio: 1,
        subtotalPen: 70,
        costoEnvioPen: 16.5,
        igvPen: 15.57,
        totalPen: 102.07,
        totalMoneda: 102.07,
        envioDestinatario: 'María Quispe',
        envioPaisCodigo: 'PE',
      }),
      TX,
    );
    expect(pedidoRepository.update).toHaveBeenCalledWith(1, { codigo: 'KD-000001' }, TX);
    expect(pedidoRepository.createItems).toHaveBeenCalledWith(
      [
        {
          pedidoId: 1,
          productoId: 1,
          nombreProducto: cafe.nombre,
          cantidad: 2,
          precioUnitarioPen: 35,
        },
      ],
      TX,
    );

    // Stock y kardex
    expect(productoRepository.descontarStock).toHaveBeenCalledWith(1, 2, TX);
    expect(pedidoRepository.createMovimientoInventario).toHaveBeenCalledWith(
      {
        productoId: 1,
        tipo: 'salida',
        cantidad: -2,
        stockResultante: 40,
        motivo: 'Venta KD-000001',
        pedidoId: 1,
      },
      TX,
    );

    // Pago, envío, historial y carrito
    expect(pedidoRepository.createPago).toHaveBeenCalledWith(
      expect.objectContaining({
        pedidoId: 1,
        metodo: 'yape',
        estado: 'aprobado',
        monto: 102.07,
        moneda: 'PEN',
        numeroOperacion: expect.stringMatching(/^SIM-\d+$/),
      }),
      TX,
    );
    expect(pedidoRepository.createEnvio).toHaveBeenCalledWith(
      expect.objectContaining({
        pedidoId: 1,
        tarifaEnvioId: 1,
        transportista: 'Olva Courier',
        metodo: 'estandar',
        codigoSeguimiento: expect.stringMatching(/^OLV-\d{8}$/),
        pesoTotalG: 500,
        fechaEstimada: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
      TX,
    );
    expect(pedidoRepository.update).toHaveBeenCalledWith(1, { estado: 'pagado' }, TX);
    expect(pedidoRepository.createEstado.mock.calls.map(([e]) => e.estado)).toEqual([
      'pendiente',
      'pagado',
    ]);
    expect(carritoRepository.vaciar).toHaveBeenCalledWith(5, TX);

    // Respuesta: detalle + código de aprobación de Yape
    expect(res.body.data.codigo).toBe('KD-000001');
    expect(res.body.data.pago.codigoAprobacion).toMatch(/^\d{6}$/);
    expect(res.body.data.tracking.pasos[0]).toMatchObject({
      clave: 'confirmado',
      completado: true,
    });
  });

  it('tarjeta terminada en 0002: 402 PAGO_RECHAZADO y no se confirma nada', async () => {
    const res = await crear({
      direccion: { ...direccion, paisCodigo: 'DE', ciudad: 'Berlin' },
      metodoEnvio: 'express',
      moneda: 'EUR',
      pago: tarjeta('4000 0000 0000 0002'),
    });

    expect(res.status).toBe(402);
    expect(res.body.error).toMatchObject({
      code: 'PAGO_RECHAZADO',
      details: { metodo: 'tarjeta', numeroOperacion: expect.stringMatching(/^SIM-/) },
    });
    // El error se lanza dentro de withTransaction → rollback del pedido, stock y kardex.
    await expect(withTransaction.mock.results[0].value).rejects.toThrow();
    expect(pedidoRepository.createPago).not.toHaveBeenCalled();
    expect(pedidoRepository.createEnvio).not.toHaveBeenCalled();
    expect(carritoRepository.vaciar).not.toHaveBeenCalled();
  });

  it('tarjeta aprobada guarda solo los 4 últimos dígitos', async () => {
    await crear({ direccion, metodoEnvio: 'estandar', pago: tarjeta('4111111111111111') });

    const pago = pedidoRepository.createPago.mock.calls[0][0];
    expect(pago.tarjetaUltimos4).toBe('1111');
    expect(JSON.stringify(pago)).not.toContain('4111111111111111');
  });

  it('responde 409 STOCK_INSUFICIENTE si otro cliente compró antes', async () => {
    productoRepository.findParaVenta.mockResolvedValue([{ ...cafe, stock: 1 }]);

    const res = await crear({ direccion, metodoEnvio: 'estandar', pago: pagoYape });

    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual([
      { productoId: 1, nombre: cafe.nombre, disponible: 1, solicitado: 2 },
    ]);
    expect(pedidoRepository.create).not.toHaveBeenCalled();
  });

  it('responde 400 CARRITO_VACIO si no hay nada que comprar', async () => {
    carritoRepository.findItems.mockResolvedValue([]);

    const res = await crear({ direccion, metodoEnvio: 'estandar', pago: pagoYape });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CARRITO_VACIO');
  });

  it('Yape/Plin solo en soles: 422 METODO_PAGO_NO_DISPONIBLE', async () => {
    const res = await crear({ direccion, metodoEnvio: 'estandar', moneda: 'USD', pago: pagoYape });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('METODO_PAGO_NO_DISPONIBLE');
    expect(withTransaction).not.toHaveBeenCalled();
  });

  it('usa una dirección guardada del usuario (direccionId)', async () => {
    direccionRepository.findByIdAndUsuario.mockResolvedValue({ ...direccion, id: 4 });

    const res = await crear({ direccionId: 4, metodoEnvio: 'estandar', pago: pagoYape });

    expect(res.status).toBe(201);
    expect(direccionRepository.findByIdAndUsuario).toHaveBeenCalledWith(4, 10);
  });

  it('guarda la dirección nueva en la cuenta solo si se pide y el pago se aprueba', async () => {
    direccionRepository.countByUsuario.mockResolvedValue(1);
    direccionRepository.create.mockImplementation(async (datos) => ({ id: 9, ...datos }));

    await crear({ direccion, metodoEnvio: 'estandar', pago: pagoYape });
    expect(direccionRepository.create).not.toHaveBeenCalled();

    const res = await crear({
      direccion,
      guardarDireccion: true,
      metodoEnvio: 'estandar',
      pago: pagoYape,
    });
    expect(res.status).toBe(201);
    expect(direccionRepository.create).toHaveBeenCalledWith(
      { ...direccion, usuarioId: 10, esPrincipal: false },
      TX,
    );

    direccionRepository.create.mockClear();
    const rechazado = await crear({
      direccion,
      guardarDireccion: true,
      metodoEnvio: 'estandar',
      pago: tarjeta('4000 0000 0000 0002'),
    });
    expect(rechazado.status).toBe(402);
    expect(direccionRepository.create).not.toHaveBeenCalled();
  });

  it('responde 404 si la dirección guardada no es del usuario', async () => {
    direccionRepository.findByIdAndUsuario.mockResolvedValue(null);

    const res = await crear({ direccionId: 4, metodoEnvio: 'estandar', pago: pagoYape });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DIRECCION_NO_ENCONTRADA');
  });

  it('valida el cuerpo: dirección, tarjeta vencida y celular de Yape', async () => {
    const r1 = await crear({ metodoEnvio: 'estandar', pago: pagoYape });
    const r2 = await crear({
      direccion,
      metodoEnvio: 'estandar',
      pago: {
        ...tarjeta('4111111111111111'),
        tarjeta: { ...tarjeta('4111111111111111').tarjeta, vencimiento: '01/20' },
      },
    });
    const r3 = await crear({
      direccion,
      metodoEnvio: 'estandar',
      pago: { metodo: 'yape', telefono: '123' },
    });

    expect([r1.status, r2.status, r3.status]).toEqual([400, 400, 400]);
    expect(r1.body.error.details[0].path).toBe('direccion');
    expect(r2.body.error.details[0].path).toBe('pago.tarjeta.vencimiento');
    expect(r3.body.error.details[0].path).toBe('pago.telefono');
  });

  it('exige sesión', async () => {
    const res = await request(app).post('/api/v1/pedidos').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/pedidos', () => {
  it('lista solo los pedidos del usuario, paginados', async () => {
    pedidoRepository.findByUsuario.mockResolvedValue({ rows: [pedidoDb], count: 1 });

    const res = await request(app).get('/api/v1/pedidos?page=1&limit=5').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(pedidoRepository.findByUsuario).toHaveBeenCalledWith(10, { limit: 5, offset: 0 });
    expect(res.body.data.items[0]).toMatchObject({
      codigo: 'KD-000001',
      estado: 'pagado',
      totalMoneda: 102.07,
      totalUnidades: 2,
      productos: [cafe.nombre],
    });
    expect(res.body.data.items[0].tracking.pasos.map((p) => p.completado)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 5, total: 1, totalPages: 1 });
  });
});

describe('GET /api/v1/pedidos/:codigo', () => {
  it('expresa los ítems en la moneda del pedido y conserva el código de Yape', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue({
      ...pedidoDb,
      moneda: 'EUR',
      tipoCambio: '4.0500',
      pago: {
        ...pedidoDb.pago,
        mensajeRespuesta:
          'Yape aprobado desde el celular ***321: PEN 102.07. Código de aprobación 482913',
      },
    });

    const res = await request(app).get('/api/v1/pedidos/KD-000001').set('Cookie', sesion);

    expect(res.body.data.items[0]).toMatchObject({ precioUnitario: 8.64, subtotal: 17.28 });
    expect(res.body.data.pago.codigoAprobacion).toBe('482913');
  });

  it('devuelve el detalle con montos, pago, envío y tracking', async () => {
    const res = await request(app).get('/api/v1/pedidos/kd-000001').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(pedidoRepository.findByCodigo).toHaveBeenCalledWith('KD-000001');
    const { data } = res.body;
    expect(data.montos).toEqual({
      subtotalPen: 70,
      envioPen: 16.5,
      igvPen: 15.57,
      totalPen: 102.07,
      subtotal: 70,
      envio: 16.5,
      igv: 15.57,
      total: 102.07,
    });
    expect(data.envio.codigoSeguimiento).toBe('OLV-12345678');
    expect(data.tracking).toMatchObject({
      estadoActual: 'pagado',
      cancelado: false,
      pasos: [
        { clave: 'confirmado', completado: true, fecha: '2026-09-29T15:00:02.000Z' },
        { clave: 'preparando', completado: false, fecha: null },
        { clave: 'en_transito', completado: false, fecha: null },
        { clave: 'entregado', completado: false, fecha: null },
      ],
    });
    expect(data.tracking.historial).toHaveLength(2);
  });

  it('responde 404 si el pedido es de otro cliente', async () => {
    const res = await request(app)
      .get('/api/v1/pedidos/KD-000001')
      .set('Cookie', cookieDe({ id: 99 }));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PEDIDO_NO_ENCONTRADO');
  });

  it('los administradores pueden ver cualquier pedido', async () => {
    const res = await request(app)
      .get('/api/v1/pedidos/KD-000001')
      .set('Cookie', cookieDe({ id: 1, rol: 'admin_logistica' }));

    expect(res.status).toBe(200);
  });

  it('valida el formato del código', async () => {
    const res = await request(app).get('/api/v1/pedidos/123').set('Cookie', sesion);
    expect(res.status).toBe(400);
  });
});
