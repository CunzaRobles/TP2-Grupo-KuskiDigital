import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';

// Pruebas contra la base real de Supabase. Se omiten si no hay DATABASE_URL (por ejemplo, en CI).
// Solo hacen lecturas: no modifican los datos compartidos.
// Los imports son condicionales: sin DATABASE_URL, cargar los modelos lanzaría un error.
const conDb = Boolean(env.DATABASE_URL);
const app = conDb ? (await import('../../src/app.js')).default : null;
const sequelize = conDb ? (await import('../../src/models/index.js')).sequelize : null;

describe.runIf(conDb)('API contra Supabase', () => {
  afterAll(() => sequelize.close());

  it('GET /api/v1/health responde db ok', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok', db: 'ok' } });
  });

  it('GET /api/v1/productos devuelve el catálogo sembrado (40+) con relaciones', async () => {
    const res = await request(app).get('/api/v1/productos?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(40);
    expect(res.body.data.items).toHaveLength(5);

    const [producto] = res.body.data.items;
    expect(typeof producto.precioBasePen).toBe('number');
    expect(producto.precio.moneda).toBe('PEN');
    expect(producto.categoria).toHaveProperty('slug');
    expect(producto.comunidad).toHaveProperty('altitudMsnm');
    expect(producto.imagenes).toHaveLength(2);
    expect(producto.imagenes[0].esPrincipal).toBe(true);
    expect(producto.certificaciones.length).toBeGreaterThan(0);
  });

  it('filtra por categoría, certificación y búsqueda, y ordena por precio', async () => {
    const res = await request(app).get(
      '/api/v1/productos?categoria=cafe&certificacion=1&orden=precio_asc&limit=100&moneda=USD',
    );

    expect(res.status).toBe(200);
    const { items } = res.body.data;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.categoria.slug === 'cafe')).toBe(true);
    expect(items.every((p) => p.certificaciones.some((c) => c.id === 1))).toBe(true);
    const precios = items.map((p) => p.precioBasePen);
    expect(precios).toEqual([...precios].sort((a, b) => a - b));
    expect(items[0].precio.moneda).toBe('USD');
  });

  it('GET /api/v1/productos/:slug devuelve la ficha con comunidad y reseñas', async () => {
    const res = await request(app).get('/api/v1/productos/cafe-organico-kuski-250g?moneda=EUR');

    expect(res.status).toBe(200);
    expect(res.body.data.comunidad.latitud).toEqual(expect.any(Number));
    expect(res.body.data.resenas).toHaveProperty('distribucion');
  });

  it('GET /api/v1/categorias calcula el rango de altitud y la comunidad principal', async () => {
    const res = await request(app).get('/api/v1/categorias');

    expect(res.status).toBe(200);
    const cafe = res.body.data.find((c) => c.slug === 'cafe');
    expect(cafe.altitudMin).toEqual(expect.any(Number));
    for (const c of res.body.data.filter((c) => c.totalProductos > 0)) {
      expect(c.altitudMin).toBeLessThanOrEqual(c.altitudMax);
      expect(c.comunidadPrincipal.altitudMsnm).toBeGreaterThanOrEqual(c.altitudMin);
      expect(c.comunidadPrincipal.altitudMsnm).toBeLessThanOrEqual(c.altitudMax);
    }
  });

  it('GET /api/v1/comunidades y /estadisticas/trazabilidad', async () => {
    const [comunidades, traza] = await Promise.all([
      request(app).get('/api/v1/comunidades'),
      request(app).get('/api/v1/estadisticas/trazabilidad'),
    ]);

    expect(comunidades.body.data.length).toBeGreaterThanOrEqual(8);
    expect(comunidades.body.data[0].latitud).toEqual(expect.any(Number));
    expect(traza.body.data.comunidades).toBe(comunidades.body.data.length);
    expect(traza.body.data.paises).toBeGreaterThanOrEqual(31);
  });

  it('POST /api/v1/checkout/cotizar usa tarifas_envio y tipos_cambio reales', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/cotizar')
      .send({ paisCodigo: 'DE', moneda: 'EUR', items: [{ productoId: 1, cantidad: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.zona).toBe('europa');
    expect(res.body.data.tipoCambio).toBeGreaterThan(1);
    expect(res.body.data.opcionesEnvio.map((o) => o.metodo)).toEqual(['estandar', 'express']);
  });
});
