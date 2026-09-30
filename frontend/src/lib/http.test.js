import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, http, toQueryString } from './http';
import { debeReintentar } from './query-client';

const respuesta = (status, cuerpo) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('envía la cookie de sesión y devuelve data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(200, { data: { id: 1 } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(http.get('/productos', { params: { moneda: 'USD' } })).resolves.toEqual({ id: 1 });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/productos?moneda=USD');
    expect(opciones.credentials).toBe('include');
    expect(opciones.method).toBe('GET');
  });

  it('serializa el cuerpo JSON en POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(201, { data: { ok: true } }));
    vi.stubGlobal('fetch', fetchMock);

    await http.post('/carrito/items', { productoId: 3, cantidad: 2 });

    const [, opciones] = fetchMock.mock.calls[0];
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body)).toEqual({ productoId: 3, cantidad: 2 });
  });

  it('convierte { error } en ApiError con status, code y details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta(409, {
          error: { code: 'STOCK_INSUFICIENTE', message: 'Sin stock', details: { disponible: 1 } },
        }),
      ),
    );

    const error = await http.post('/checkout', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'STOCK_INSUFICIENTE',
      message: 'Sin stock',
      details: { disponible: 1 },
    });
  });

  it('responde null en 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(http.delete('/carrito/items/1')).resolves.toBeNull();
  });

  it('marca los fallos de red como NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(http.get('/health')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});

describe('toQueryString', () => {
  it('omite vacíos y repite los arreglos', () => {
    expect(
      toQueryString({ categoria: ['cafe', 'textiles'], q: '', page: 2, orden: undefined }),
    ).toBe('?categoria=cafe&categoria=textiles&page=2');
    expect(toQueryString({})).toBe('');
  });
});

describe('debeReintentar', () => {
  it('no reintenta errores 4xx y reintenta hasta 2 veces los demás', () => {
    expect(debeReintentar(0, new ApiError(404, 'NOT_FOUND', 'x'))).toBe(false);
    expect(debeReintentar(0, new ApiError(500, 'INTERNAL_ERROR', 'x'))).toBe(true);
    expect(debeReintentar(2, new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(false);
  });
});
