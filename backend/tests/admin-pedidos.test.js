import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieRol, registrarCuentas } from './helpers/admin.js';

const pedidoRepository = await import('../src/repositories/pedido.repository.js');
const productoRepository = await import('../src/repositories/producto.repository.js');
const inventarioRepository = await import('../src/repositories/inventario.repository.js');
const { withTransaction } = await import('../src/repositories/transaction.repository.js');
const { emailSender } = await import('../src/adapters/email/index.js');
const { default: app } = await import('../src/app.js');

const TX = { tx: 'mock' };
const gerente = cookieRol('admin_gerente');
const logistica = cookieRol('admin_logistica');

// Fila de pedido.repository.findAdmin
const filaAdmin = {
  id: 7,
  codigo: 'KD-000007',
  estado: 'pagado',
  moneda: 'EUR',
  tipoCambio: '4.0500',
  totalPen: '405.00',
  totalMoneda: '100.00',
  envioPaisCodigo: 'DE',
  envioCiudad: 'Berlín',
  envioDestinatario: 'Anna Becker',
  creadoEn: '2026-09-29T15:00:00.000Z',
  items: [{ cantidad: 2 }, { cantidad: 1 }],
  usuario: { id: 5, nombre: 'Anna', apellido: 'Becker', correo: 'anna.becker@example.com' },
  pago: { metodo: 'tarjeta', estado: 'aprobado', numeroOperacion: 'SIM-1' },
  envio: { transportista: 'DHL Express', metodo: 'express', codigoSeguimiento: 'DHL-1' },
};

// Fila de pedido.repository.findByCodigo (detalle)
const detalleDb = (estado) => ({
  ...filaAdmin,
  estado,
  usuarioId: 10,
  subtotalPen: '300.00',
  costoEnvioPen: '105.00',
  igvPen: '0.00',
  envioDireccion: 'Torstraße 1',
  envioCodigoPostal: '10119',
  envioTelefono: null,
  items: [
    {
      productoId: 1,
      nombreProducto: 'Café Orgánico Kuski 250 g',
      cantidad: 2,
      precioUnitarioPen: '150.00',
      subtotalPen: '300.00',
      producto: { id: 1, slug: 'cafe', imagenes: [] },
    },
  ],
  historialEstados: [],
  pago: { ...filaAdmin.pago, monto: '100.00', moneda: 'EUR', mensajeRespuesta: 'Aprobado' },
  envio: { ...filaAdmin.envio, pesoTotalG: 500, fechaEstimada: '2026-10-05', fechaEntrega: null },
});

const paraCambio = (estado) => ({
  id: 7,
  codigo: 'KD-000007',
  estado,
  usuarioId: 10,
  items: [
    { productoId: 1, nombreProducto: 'Café', cantidad: 2 },
    { productoId: 26, nombreProducto: 'Poncho', cantidad: 1 },
  ],
  pago: { id: 3, estado: 'aprobado' },
});

beforeEach(() => {
  registrarCuentas();
  vi.spyOn(emailSender, 'enviar').mockResolvedValue();
});

describe('GET /api/v1/admin/ventas', () => {
  it('lista con filtros, paginación y resumen de ingresos', async () => {
    pedidoRepository.findAdmin.mockResolvedValue({ rows: [filaAdmin], count: 41 });
    pedidoRepository.resumenAdmin.mockResolvedValue({
      pedidos: '41',
      ventas: '40',
      ingresosPen: '12000.50',
    });

    const res = await request(app)
      .get('/api/v1/admin/ventas')
      .query({
        desde: '2026-09-01',
        hasta: '2026-09-30',
        pais: 'de,pe',
        metodo_pago: 'tarjeta',
        estado: ['pagado', 'entregado'],
        page: 2,
      })
      .set('Cookie', gerente);

    expect(res.status).toBe(200);
    expect(pedidoRepository.findAdmin).toHaveBeenCalledWith(
      {
        desde: '2026-09-01',
        hasta: '2026-09-30',
        paises: ['DE', 'PE'],
        estados: ['pagado', 'entregado'],
        metodosPago: ['tarjeta'],
      },
      { limit: 20, offset: 20 },
    );
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
    expect(res.body.data.resumen).toEqual({
      pedidos: 41,
      ventas: 40,
      ingresosPen: 12000.5,
      ticketPromedioPen: 300.01,
    });
    expect(res.body.data.items[0]).toMatchObject({
      codigo: 'KD-000007',
      totalPen: 405,
      totalMoneda: 100,
      unidades: 3,
      cliente: { id: 5, nombre: 'Anna Becker', correo: 'anna.becker@example.com' },
      pago: { metodo: 'tarjeta' },
      transicionesPermitidas: ['preparando', 'cancelado'],
    });
  });

  it('valida el rango de fechas', async () => {
    const res = await request(app)
      .get('/api/v1/admin/ventas?desde=2026-10-01&hasta=2026-09-01')
      .set('Cookie', gerente);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/admin/pedidos/:codigo', () => {
  it('devuelve el detalle con el cliente y las transiciones posibles', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue(detalleDb('en_transito'));

    const res = await request(app).get('/api/v1/admin/pedidos/kd-000007').set('Cookie', logistica);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      codigo: 'KD-000007',
      cliente: { id: 10, nombre: 'María Quispe', correo: 'maria.quispe@example.com' },
      transicionesPermitidas: ['entregado'],
    });
  });

  it('404 si el pedido no existe', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/admin/pedidos/KD-999999').set('Cookie', gerente);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/admin/pedidos/:codigo/estado', () => {
  const cambiar = (estado, cookie = logistica, extra = {}) =>
    request(app)
      .patch('/api/v1/admin/pedidos/KD-000007/estado')
      .set('Cookie', cookie)
      .send({ estado, ...extra });

  it('avanza el tracking: registra pedido_estados con el admin y avisa al cliente', async () => {
    pedidoRepository.findParaCambioEstado.mockResolvedValue(paraCambio('pagado'));
    pedidoRepository.findByCodigo.mockResolvedValue(detalleDb('preparando'));

    const res = await cambiar('preparando', logistica, { comentario: 'Empacado con cuidado' });

    expect(res.status).toBe(200);
    expect(withTransaction).toHaveBeenCalledOnce();
    expect(pedidoRepository.findParaCambioEstado).toHaveBeenCalledWith('KD-000007', TX);
    expect(pedidoRepository.update).toHaveBeenCalledWith(7, { estado: 'preparando' }, TX);
    expect(pedidoRepository.createEstado).toHaveBeenCalledWith(
      { pedidoId: 7, estado: 'preparando', comentario: 'Empacado con cuidado', usuarioId: 3 },
      TX,
    );
    expect(productoRepository.incrementarStock).not.toHaveBeenCalled();
    expect(emailSender.enviar).toHaveBeenCalledWith(
      expect.objectContaining({ para: 'maria.quispe@example.com' }),
    );
    expect(res.body.data.estado).toBe('preparando');
  });

  it('entregado guarda la fecha de entrega del envío', async () => {
    pedidoRepository.findParaCambioEstado.mockResolvedValue(paraCambio('en_transito'));
    pedidoRepository.findByCodigo.mockResolvedValue(detalleDb('entregado'));

    const res = await cambiar('entregado');

    expect(res.status).toBe(200);
    expect(pedidoRepository.updateEnvio).toHaveBeenCalledWith(
      7,
      { fechaEntrega: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
      TX,
    );
  });

  it('cancelar devuelve el stock (entrada en el kardex) y reembolsa el pago', async () => {
    pedidoRepository.findParaCambioEstado.mockResolvedValue(paraCambio('preparando'));
    pedidoRepository.findByCodigo.mockResolvedValue(detalleDb('cancelado'));
    productoRepository.incrementarStock.mockResolvedValueOnce(42).mockResolvedValueOnce(7);

    const res = await cambiar('cancelado', gerente);

    expect(res.status).toBe(200);
    expect(productoRepository.incrementarStock).toHaveBeenCalledWith(1, 2, TX);
    expect(productoRepository.incrementarStock).toHaveBeenCalledWith(26, 1, TX);
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledWith(
      {
        productoId: 1,
        tipo: 'entrada',
        cantidad: 2,
        stockResultante: 42,
        motivo: 'Cancelación KD-000007',
        usuarioId: 1,
        pedidoId: 7,
      },
      TX,
    );
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledTimes(2);
    expect(pedidoRepository.updatePago).toHaveBeenCalledWith(7, { estado: 'reembolsado' }, TX);
  });

  it.each([
    ['pagado', 'entregado'],
    ['en_transito', 'cancelado'],
    ['entregado', 'en_transito'],
    ['cancelado', 'pagado'],
  ])('rechaza la transición %s → %s (409)', async (actual, nuevo) => {
    pedidoRepository.findParaCambioEstado.mockResolvedValue(paraCambio(actual));

    const res = await cambiar(nuevo, gerente);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TRANSICION_INVALIDA');
    expect(res.body.error.details.estadoActual).toBe(actual);
    expect(pedidoRepository.update).not.toHaveBeenCalled();
    expect(emailSender.enviar).not.toHaveBeenCalled();
  });

  it('un fallo del correo simulado no deshace el cambio', async () => {
    pedidoRepository.findParaCambioEstado.mockResolvedValue(paraCambio('pagado'));
    pedidoRepository.findByCodigo.mockResolvedValue(detalleDb('preparando'));
    emailSender.enviar.mockRejectedValue(new Error('SMTP caído'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await cambiar('preparando');
    expect(res.status).toBe(200);
  });

  it('valida el estado', async () => {
    const res = await cambiar('perdido');
    expect(res.status).toBe(400);
  });
});
