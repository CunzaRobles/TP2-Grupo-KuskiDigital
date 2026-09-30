import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cafe, itemCarrito, poncho } from './helpers/fixtures.js';
import { cookieDe } from './helpers/sesion.js';

const carritoRepository = await import('../src/repositories/carrito.repository.js');
const productoRepository = await import('../src/repositories/producto.repository.js');
const { default: app } = await import('../src/app.js');

const cotizar = (body, cookie) => {
  const req = request(app).post('/api/v1/checkout/cotizar');
  if (cookie) req.set('Cookie', cookie);
  return req.send(body);
};

beforeEach(() => {
  productoRepository.findByIds.mockImplementation(async (ids) =>
    [cafe, poncho].filter((p) => ids.includes(p.id)),
  );
});

describe('POST /api/v1/checkout/cotizar', () => {
  it('Perú (María): aplica IGV 18 % sobre productos + envío y ofrece estándar y express', async () => {
    // 2 cafés = S/ 70, 500 g → estándar: 15 + 3 × 0.5 = 16.50
    const res = await cotizar({ paisCodigo: 'pe', items: [{ productoId: 1, cantidad: 2 }] });

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data).toMatchObject({
      paisCodigo: 'PE',
      zona: 'nacional',
      moneda: 'PEN',
      tipoCambio: 1,
      pesoTotalG: 500,
      igv: { aplica: true, tasa: 0.18 },
      metodoEnvio: 'estandar',
    });
    expect(data.opcionesEnvio.map((o) => [o.metodo, o.transportista, o.costoPen])).toEqual([
      ['estandar', 'Olva Courier', 16.5],
      ['express', 'Olva Express', 27.5],
    ]);
    expect(data.resumen).toEqual({
      subtotal: 70,
      envio: 16.5,
      igv: 15.57, // (70 + 16.5) × 0.18
      total: 102.07,
      subtotalPen: 70,
      envioPen: 16.5,
      igvPen: 15.57,
      totalPen: 102.07,
    });
  });

  it('Alemania en EUR (Anna): sin IGV, zona europa, días 12–18 / 4–7 y total que cuadra', async () => {
    const res = await cotizar({
      paisCodigo: 'DE',
      moneda: 'EUR',
      metodoEnvio: 'express',
      items: [
        { productoId: 26, cantidad: 1 },
        { productoId: 1, cantidad: 2 },
      ],
    });

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.zona).toBe('europa');
    expect(data.igv).toEqual({ aplica: false, tasa: 0 });
    expect(data.tipoCambio).toBe(4.05);
    expect(data.opcionesEnvio.map((o) => [o.metodo, o.diasMin, o.diasMax])).toEqual([
      ['estandar', 12, 18],
      ['express', 4, 7],
    ]);
    // Peso 1.4 kg → express: 170 + 60 × 1.4 = S/ 254
    const { resumen } = data;
    expect(resumen.envioPen).toBe(254);
    expect(resumen.igvPen).toBe(0);
    expect(resumen.totalPen).toBe(674); // 420 + 254
    expect(resumen.subtotal).toBe(103.7); // 86.42 + 17.28
    expect(resumen.envio).toBe(62.72);
    expect(resumen.total).toBe(166.42);
    expect(resumen.total).toBeCloseTo(resumen.subtotal + resumen.envio + resumen.igv, 2);
  });

  it('agrupa productos repetidos antes de validar el stock', async () => {
    const res = await cotizar({
      paisCodigo: 'PE',
      items: [
        { productoId: 26, cantidad: 4 },
        { productoId: 26, cantidad: 3 },
      ],
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'STOCK_INSUFICIENTE',
      details: [{ productoId: 26, disponible: 6, solicitado: 7 }],
    });
  });

  it('responde 404 si algún producto no existe', async () => {
    const res = await cotizar({ paisCodigo: 'PE', items: [{ productoId: 999, cantidad: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body.error.details).toEqual([{ productoId: 999 }]);
  });

  it('sin ítems usa el carrito del usuario autenticado', async () => {
    carritoRepository.findOrCreateIdByUsuario.mockResolvedValue(5);
    carritoRepository.findItems.mockResolvedValue([itemCarrito(1, cafe, 1)]);

    const res = await cotizar({ paisCodigo: 'US', moneda: 'USD' }, cookieDe({ id: 10 }));

    expect(res.status).toBe(200);
    expect(carritoRepository.findOrCreateIdByUsuario).toHaveBeenCalledWith(10);
    expect(res.body.data.zona).toBe('norteamerica');
    expect(res.body.data.items).toHaveLength(1);
  });

  it('sin ítems y sin sesión responde 400 CARRITO_VACIO', async () => {
    const res = await cotizar({ paisCodigo: 'PE' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CARRITO_VACIO');
  });

  it('valida país, moneda y método de envío', async () => {
    const res = await cotizar({
      paisCodigo: 'PER',
      moneda: 'GBP',
      metodoEnvio: 'dron',
      items: [{ productoId: 1, cantidad: 1 }],
    });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual([
      'paisCodigo',
      'moneda',
      'metodoEnvio',
    ]);
  });
});
