import { describe, expect, it, vi } from 'vitest';
import { ConsoleEmailSender } from '../src/adapters/email/console-email-sender.js';
import { EmailSender } from '../src/adapters/email/email-sender.js';
import { ExchangeRateProvider } from '../src/adapters/exchange/exchange-rate-provider.js';
import { TablaExchangeRateProvider } from '../src/adapters/exchange/tabla-exchange-rate-provider.js';
import { MockPaymentGateway } from '../src/adapters/payments/mock-payment-gateway.js';
import { PaymentGateway } from '../src/adapters/payments/payment-gateway.js';
import { MockShippingProvider } from '../src/adapters/shipping/mock-shipping-provider.js';
import { ShippingProvider } from '../src/adapters/shipping/shipping-provider.js';
import { zonaDePais } from '../src/adapters/shipping/zonas.js';

describe('MockPaymentGateway', () => {
  const pasarela = new MockPaymentGateway({ latenciaMinMs: 0, latenciaMaxMs: 0 });
  const base = { monto: 102.07, moneda: 'PEN', referencia: 'KD-000001' };

  it('implementa la interfaz PaymentGateway', () => {
    expect(pasarela).toBeInstanceOf(PaymentGateway);
  });

  it('aprueba una tarjeta por defecto y devuelve solo los 4 últimos dígitos', async () => {
    const r = await pasarela.procesarPago({
      ...base,
      metodo: 'tarjeta',
      tarjeta: { numero: '4111111111111111' },
    });
    expect(r).toMatchObject({ aprobado: true, estado: 'aprobado', tarjetaUltimos4: '1111' });
    expect(r.numeroOperacion).toMatch(/^SIM-\d{12}$/);
  });

  it('rechaza las tarjetas terminadas en 0002', async () => {
    const r = await pasarela.procesarPago({
      ...base,
      metodo: 'tarjeta',
      tarjeta: { numero: '4000000000000002' },
    });
    expect(r).toMatchObject({ aprobado: false, estado: 'rechazado', tarjetaUltimos4: '0002' });
    expect(r.mensaje).toMatch(/rechazada/i);
  });

  it.each(['yape', 'plin'])('%s devuelve un código de aprobación de 6 dígitos', async (metodo) => {
    const r = await pasarela.procesarPago({ ...base, metodo, telefono: '987654321' });
    expect(r.aprobado).toBe(true);
    expect(r.codigoAprobacion).toMatch(/^\d{6}$/);
    expect(r.mensaje).toContain('***321');
  });

  it('simula una latencia entre el mínimo y el máximo configurados', async () => {
    vi.useFakeTimers();
    try {
      const lenta = new MockPaymentGateway({ latenciaMinMs: 1000, latenciaMaxMs: 2000 });
      let resuelto = false;
      const promesa = lenta.procesarPago({ ...base, metodo: 'paypal' }).then((r) => {
        resuelto = true;
        return r;
      });

      await vi.advanceTimersByTimeAsync(999);
      expect(resuelto).toBe(false);
      await vi.advanceTimersByTimeAsync(1001);
      expect((await promesa).aprobado).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('MockShippingProvider', () => {
  const tarifas = [
    {
      id: 8,
      zona: 'europa',
      metodo: 'express',
      transportista: 'DHL Express',
      costoBasePen: '170.00',
      costoPorKgPen: '60.00',
      diasMin: 4,
      diasMax: 7,
    },
    {
      id: 7,
      zona: 'europa',
      metodo: 'estandar',
      transportista: 'Serpost',
      costoBasePen: '90.00',
      costoPorKgPen: '35.00',
      diasMin: 12,
      diasMax: 18,
    },
  ];
  const obtenerTarifasPorZona = vi.fn(async () => tarifas);
  const proveedor = new MockShippingProvider({
    obtenerTarifasPorZona,
    ahora: () => new Date('2026-09-29T12:00:00Z'),
  });

  it('implementa la interfaz ShippingProvider', () => {
    expect(proveedor).toBeInstanceOf(ShippingProvider);
  });

  it('cotiza por zona del país y peso (base + costo por kg), estándar primero', async () => {
    const { zona, opciones } = await proveedor.cotizar({ paisCodigo: 'DE', pesoG: 1500 });

    expect(obtenerTarifasPorZona).toHaveBeenCalledWith('europa');
    expect(zona).toBe('europa');
    expect(opciones).toEqual([
      {
        tarifaEnvioId: 7,
        metodo: 'estandar',
        transportista: 'Serpost',
        costoPen: 142.5,
        diasMin: 12,
        diasMax: 18,
      },
      {
        tarifaEnvioId: 8,
        metodo: 'express',
        transportista: 'DHL Express',
        costoPen: 260,
        diasMin: 4,
        diasMax: 7,
      },
    ]);
  });

  it('genera el envío con código de seguimiento del transportista y fecha estimada', async () => {
    const envio = await proveedor.generarEnvio({ paisCodigo: 'DE', metodo: 'express', pesoG: 500 });

    expect(envio).toMatchObject({
      tarifaEnvioId: 8,
      transportista: 'DHL Express',
      metodo: 'express',
      fechaEstimada: '2026-10-06', // + días máximos
    });
    expect(envio.codigoSeguimiento).toMatch(/^DHL\d{10}$/);
  });
});

describe('zonaDePais', () => {
  it.each([
    ['PE', 'nacional'],
    ['cl', 'latam'],
    ['US', 'norteamerica'],
    ['DE', 'europa'],
    ['JP', 'resto_mundo'],
  ])('%s → %s', (pais, zona) => {
    expect(zonaDePais(pais)).toBe(zona);
  });
});

describe('TablaExchangeRateProvider', () => {
  const proveedor = new TablaExchangeRateProvider({
    buscarPorMoneda: async (m) =>
      m === 'EUR' ? { monedaCodigo: 'EUR', simbolo: '€', valorEnPen: '4.0500' } : null,
    listar: async () => [{ monedaCodigo: 'EUR', simbolo: '€', valorEnPen: '4.0500' }],
  });

  it('implementa la interfaz y convierte NUMERIC a número', async () => {
    expect(proveedor).toBeInstanceOf(ExchangeRateProvider);
    expect(await proveedor.obtenerTasa('EUR')).toEqual({
      moneda: 'EUR',
      simbolo: '€',
      valorEnPen: 4.05,
    });
    expect(await proveedor.listarTasas()).toHaveLength(1);
  });

  it('falla con una moneda sin tipo de cambio', async () => {
    await expect(proveedor.obtenerTasa('JPY')).rejects.toThrow(/JPY/);
  });
});

describe('ConsoleEmailSender', () => {
  it('registra el correo simulado en el logger', async () => {
    const logger = { info: vi.fn() };
    const sender = new ConsoleEmailSender({ logger });

    await sender.enviar({ para: 'anna@example.com', asunto: 'Pedido KD-000001', texto: 'Hola' });

    expect(sender).toBeInstanceOf(EmailSender);
    expect(logger.info.mock.calls[0][0]).toContain('Para:   anna@example.com');
    expect(logger.info.mock.calls[0][0]).toContain('Asunto: Pedido KD-000001');
  });
});
