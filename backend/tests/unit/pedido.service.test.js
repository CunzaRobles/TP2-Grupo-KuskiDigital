import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cafe, itemCarrito } from '../helpers/fixtures.js';

// Repositorios y transacción simulados (tests/setup/mock-repositories.js): sin Supabase.
const carritoRepository = await import('../../src/repositories/carrito.repository.js');
const pedidoRepository = await import('../../src/repositories/pedido.repository.js');
const productoRepository = await import('../../src/repositories/producto.repository.js');
const usuarioRepository = await import('../../src/repositories/usuario.repository.js');
const { withTransaction } = await import('../../src/repositories/transaction.repository.js');
const { paymentGateway } = await import('../../src/adapters/payments/index.js');
const { emailSender } = await import('../../src/adapters/email/index.js');
const { crearPedido } = await import('../../src/services/pedido.service.js');

const USUARIO_ID = 10;
const direccion = {
  nombreDestinatario: 'María Quispe',
  paisCodigo: 'PE',
  ciudad: 'Cusco',
  direccion: 'Av. de la Cultura 1520',
};
const solicitud = (pago = { metodo: 'yape', telefono: '987654321' }) => ({
  direccion,
  metodoEnvio: 'estandar',
  moneda: 'PEN',
  pago,
});

const pagoAprobado = {
  aprobado: true,
  estado: 'aprobado',
  pasarela: 'simulada',
  numeroOperacion: 'SIM-000000001234',
  codigoAprobacion: '482913',
  tarjetaUltimos4: null,
  mensaje: 'Yape aprobado. Código de aprobación 482913',
};

// Fila mínima de pedido.repository.findByCodigo para armar la respuesta final.
const pedidoDb = {
  id: 1,
  codigo: 'KD-000001',
  usuarioId: USUARIO_ID,
  estado: 'pagado',
  moneda: 'PEN',
  tipoCambio: '1.0000',
  subtotalPen: '70.00',
  costoEnvioPen: '16.50',
  igvPen: '15.57',
  totalPen: '102.07',
  totalMoneda: '102.07',
  items: [
    {
      productoId: 1,
      nombreProducto: cafe.nombre,
      cantidad: 2,
      precioUnitarioPen: '35.00',
      subtotalPen: '70.00',
    },
  ],
  pago: { metodo: 'yape', estado: 'aprobado', monto: '102.07', mensajeRespuesta: 'ok' },
  envio: { transportista: 'Olva Courier', metodo: 'estandar', codigoSeguimiento: 'OLV-1' },
  historialEstados: [],
};

// Transacción falsa con commit/rollback observables, como hace sequelize.transaction.
const simularTransaccion = () => {
  const tx = { commit: vi.fn(), rollback: vi.fn() };
  withTransaction.mockImplementation(async (fn) => {
    try {
      const resultado = await fn(tx);
      tx.commit();
      return resultado;
    } catch (error) {
      tx.rollback();
      throw error;
    }
  });
  return tx;
};

let tx;

beforeEach(() => {
  vi.clearAllMocks();
  tx = simularTransaccion();
  carritoRepository.findOrCreateIdByUsuario.mockResolvedValue(5);
  carritoRepository.findItems.mockResolvedValue([itemCarrito(1, cafe, 2)]);
  productoRepository.findParaVenta.mockResolvedValue([{ ...cafe, stock: 42 }]);
  productoRepository.descontarStock.mockResolvedValue(40);
  pedidoRepository.create.mockResolvedValue({ id: 1 });
  pedidoRepository.findByCodigo.mockResolvedValue(pedidoDb);
  usuarioRepository.findById.mockResolvedValue({ correo: 'maria@example.com', nombre: 'María' });
  vi.spyOn(paymentGateway, 'procesarPago').mockResolvedValue(pagoAprobado);
  vi.spyOn(emailSender, 'enviar').mockResolvedValue();
});

describe('PedidoService.crearPedido', () => {
  it('UT-14: con stock suficiente → crea pedido, descuenta stock y registra el kardex', async () => {
    const pedido = await crearPedido(USUARIO_ID, solicitud());

    expect(pedidoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: USUARIO_ID,
        estado: 'pendiente',
        moneda: 'PEN',
        subtotalPen: 70,
        envioPaisCodigo: 'PE',
      }),
      tx,
    );
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
      tx,
    );
    expect(productoRepository.descontarStock).toHaveBeenCalledWith(1, 2, tx);
    expect(pedidoRepository.createMovimientoInventario).toHaveBeenCalledWith(
      {
        productoId: 1,
        tipo: 'salida',
        cantidad: -2,
        stockResultante: 40,
        motivo: 'Venta KD-000001',
        pedidoId: 1,
      },
      tx,
    );
    expect(pedidoRepository.update).toHaveBeenCalledWith(1, { estado: 'pagado' }, tx);
    expect(carritoRepository.vaciar).toHaveBeenCalledWith(5, tx);
    expect(tx.commit).toHaveBeenCalledOnce();
    expect(pedido.codigo).toBe('KD-000001');
  });

  it('UT-15: cantidad mayor al stock → STOCK_INSUFICIENTE y no crea el pedido', async () => {
    carritoRepository.findItems.mockResolvedValue([itemCarrito(1, cafe, 50)]);
    productoRepository.findParaVenta.mockResolvedValue([{ ...cafe, stock: 4 }]);

    await expect(crearPedido(USUARIO_ID, solicitud())).rejects.toMatchObject({
      status: 409,
      code: 'STOCK_INSUFICIENTE',
    });
    expect(pedidoRepository.create).not.toHaveBeenCalled();
    expect(productoRepository.descontarStock).not.toHaveBeenCalled();
    expect(paymentGateway.procesarPago).not.toHaveBeenCalled();
  });

  it('UT-16: pago rechazado → se llama al rollback de la transacción', async () => {
    paymentGateway.procesarPago.mockResolvedValue({
      ...pagoAprobado,
      aprobado: false,
      estado: 'rechazado',
      codigoAprobacion: null,
      mensaje: 'Tarjeta rechazada por el banco emisor: fondos insuficientes',
    });

    await expect(
      crearPedido(USUARIO_ID, {
        ...solicitud(),
        pago: { metodo: 'tarjeta', tarjeta: { numero: '4000000000000002' } },
      }),
    ).rejects.toMatchObject({ status: 402, code: 'PAGO_RECHAZADO' });
    expect(tx.rollback).toHaveBeenCalledOnce();
    expect(tx.commit).not.toHaveBeenCalled();
    expect(pedidoRepository.createPago).not.toHaveBeenCalled();
    expect(carritoRepository.vaciar).not.toHaveBeenCalled();
  });
});
