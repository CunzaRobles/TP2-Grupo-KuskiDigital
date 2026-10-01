import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockPaymentGateway } from '../../src/adapters/payments/mock-payment-gateway.js';

// Sin latencia: la espera simulada solo sirve para la interfaz.
let pasarela;
const solicitud = { monto: 102.07, moneda: 'PEN', referencia: 'KD-000001' };
const tarjeta = (numero) => ({ numero, titular: 'Anna Becker', vencimiento: '12/30', cvv: '123' });

describe('MockPaymentGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pasarela = new MockPaymentGateway({ latenciaMinMs: 0, latenciaMaxMs: 0 });
  });

  it('UT-11: tarjeta terminada en 4242 → aprobado con número de operación', async () => {
    const r = await pasarela.procesarPago({
      ...solicitud,
      metodo: 'tarjeta',
      tarjeta: tarjeta('4242 4242 4242 4242'),
    });

    expect(r.aprobado).toBe(true);
    expect(r.estado).toBe('aprobado');
    expect(r.numeroOperacion).toMatch(/^SIM-\d{12}$/);
    expect(r.tarjetaUltimos4).toBe('4242');
  });

  it('UT-12: tarjeta terminada en 0002 → rechazado con mensaje', async () => {
    const r = await pasarela.procesarPago({
      ...solicitud,
      metodo: 'tarjeta',
      tarjeta: tarjeta('4000 0000 0000 0002'),
    });

    expect(r.aprobado).toBe(false);
    expect(r.estado).toBe('rechazado');
    expect(r.mensaje).toMatch(/rechazada/i);
    expect(r.tarjetaUltimos4).toBe('0002');
  });

  it('UT-13: Yape → aprobado con código de 6 dígitos', async () => {
    const r = await pasarela.procesarPago({ ...solicitud, metodo: 'yape', telefono: '987654321' });

    expect(r.aprobado).toBe(true);
    expect(r.codigoAprobacion).toMatch(/^\d{6}$/);
    expect(r.mensaje).toContain(r.codigoAprobacion);
  });
});
