import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// La capa de datos se simula (tests/setup/mock-repositories.js): no hace falta Supabase.
const productoRepository = await import('../src/repositories/producto.repository.js');
const { default: app } = await import('../src/app.js');

const productoDb = {
  id: 1,
  sku: 'CAF-001',
  nombre: 'Café Orgánico Kuski 250 g',
  slug: 'cafe-organico-kuski-250g',
  descripcion: 'Café arábica de altura.',
  precioBasePen: '35.00',
  stock: 42,
  stockMinimo: 5,
  pesoG: 250,
  destacado: true,
  calificacionPromedio: '4.5',
  totalResenas: 2,
  categoria: { id: 1, nombre: 'Café', slug: 'cafe' },
  comunidad: {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    altitudMsnm: 1050,
    latitud: '-12.863000',
    longitud: '-72.693000',
  },
  imagenes: [
    {
      url: 'https://images.unsplash.com/x',
      textoAlt: 'Café',
      orden: 0,
      esPrincipal: true,
      productoId: 1,
    },
  ],
  certificaciones: [{ id: 1, nombre: 'Orgánico', entidadEmisora: 'SENASA' }],
};

describe('GET /api/v1/productos', () => {
  beforeEach(() => {
    productoRepository.findCatalogo.mockResolvedValue({ rows: [productoDb], count: 44 });
  });

  it('responde 200 con { data: { items, pagination } } y precios en PEN por defecto', async () => {
    const res = await request(app).get('/api/v1/productos');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 12, total: 44, totalPages: 4 });
    expect(res.body.data.items[0]).toEqual(
      expect.objectContaining({
        id: 1,
        precioBasePen: 35, // NUMERIC llega como string y se expone como número
        precio: { moneda: 'PEN', simbolo: 'S/', monto: 35 },
        disponible: true,
        calificacionPromedio: 4.5,
        totalResenas: 2,
        categoria: expect.objectContaining({ slug: 'cafe' }),
        certificaciones: [{ id: 1, nombre: 'Orgánico' }],
      }),
    );
    expect(res.body.data.items[0].imagenes[0]).not.toHaveProperty('productoId');
    expect(productoRepository.findCatalogo).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 12, offset: 0, orden: 'destacados' }),
    );
  });

  it('convierte los precios a la moneda pedida (?moneda=usd)', async () => {
    const res = await request(app).get('/api/v1/productos?moneda=usd');

    expect(res.body.data.items[0].precio).toEqual({ moneda: 'USD', simbolo: '$', monto: 9.33 });
    expect(res.body.data.items[0].precioBasePen).toBe(35);
  });

  it('pasa todos los filtros al repositorio y convierte el rango de precio a PEN', async () => {
    await request(app).get(
      '/api/v1/productos?categoria=cafe,textiles&comunidad=1&comunidad=3&certificacion=2' +
        '&precio_min=10&precio_max=20&moneda=EUR&q=alpaca&orden=precio_desc&page=2&limit=6',
    );

    expect(productoRepository.findCatalogo).toHaveBeenCalledWith({
      categorias: ['cafe', 'textiles'],
      comunidades: [1, 3],
      certificaciones: [2],
      precioMinPen: 40.5, // 10 € × 4.05
      precioMaxPen: 81,
      q: 'alpaca',
      orden: 'precio_desc',
      limit: 6,
      offset: 6,
    });
  });

  it('responde 400 VALIDATION_ERROR con parámetros inválidos', async () => {
    const res = await request(app).get(
      '/api/v1/productos?page=0&limit=500&moneda=JPY&orden=azar&comunidad=abc',
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['page', 'limit', 'moneda', 'orden', 'comunidad.0']),
    );
    expect(productoRepository.findCatalogo).not.toHaveBeenCalled();
  });

  it('rechaza precio_min mayor que precio_max', async () => {
    const res = await request(app).get('/api/v1/productos?precio_min=50&precio_max=10');

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('precio_min');
  });

  it('responde 500 con formato de error si falla la base de datos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    productoRepository.findCatalogo.mockRejectedValue(new Error('conexión perdida'));

    const res = await request(app).get('/api/v1/productos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    });
  });
});

describe('GET /api/v1/productos/destacados', () => {
  it('devuelve los destacados en la moneda pedida (no se confunde con un slug)', async () => {
    productoRepository.findDestacados.mockResolvedValue([productoDb]);

    const res = await request(app).get('/api/v1/productos/destacados?moneda=EUR&limit=4');

    expect(res.status).toBe(200);
    expect(res.body.data[0].precio).toEqual({ moneda: 'EUR', simbolo: '€', monto: 8.64 });
    expect(productoRepository.findDestacados).toHaveBeenCalledWith({ limit: 4 });
    expect(productoRepository.findBySlug).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/productos/:slug', () => {
  beforeEach(() => {
    productoRepository.findBySlug.mockResolvedValue(productoDb);
    productoRepository.findResenas.mockResolvedValue([
      {
        id: 3,
        calificacion: 5,
        comentario: 'Aroma increíble',
        creadoEn: '2026-09-01T10:00:00.000Z',
        usuario: { nombre: 'Anna', apellido: 'Becker', paisCodigo: 'DE' },
      },
    ]);
    productoRepository.findDistribucionResenas.mockResolvedValue([
      { calificacion: 5, total: 1 },
      { calificacion: 4, total: 1 },
    ]);
  });

  it('devuelve la ficha con comunidad (coordenadas numéricas), certificaciones y reseñas', async () => {
    const res = await request(app).get('/api/v1/productos/cafe-organico-kuski-250g?moneda=USD');

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.precio.moneda).toBe('USD');
    expect(data.comunidad).toMatchObject({ latitud: -12.863, longitud: -72.693 });
    expect(data.certificaciones[0]).toEqual({
      id: 1,
      nombre: 'Orgánico',
      entidadEmisora: 'SENASA',
    });
    expect(data.resenas).toEqual({
      promedio: 4.5,
      total: 2,
      distribucion: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
      items: [
        {
          id: 3,
          calificacion: 5,
          comentario: 'Aroma increíble',
          autor: 'Anna B.', // no expone el apellido completo
          paisCodigo: 'DE',
          creadoEn: '2026-09-01T10:00:00.000Z',
        },
      ],
    });
  });

  it('responde 404 PRODUCTO_NO_ENCONTRADO si el slug no existe', async () => {
    productoRepository.findBySlug.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/productos/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCTO_NO_ENCONTRADO');
  });

  it('responde 400 con un slug con caracteres no permitidos', async () => {
    const res = await request(app).get('/api/v1/productos/Café%20Raro');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/productos/:slug/relacionados', () => {
  it('devuelve los relacionados en la moneda pedida (4 por defecto)', async () => {
    productoRepository.findRelacionados.mockResolvedValue([{ ...productoDb, id: 2, slug: 'otro' }]);

    const res = await request(app).get(
      '/api/v1/productos/cafe-organico-kuski-250g/relacionados?moneda=EUR',
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: 2,
      precio: { moneda: 'EUR', simbolo: '€', monto: 8.64 },
    });
    expect(productoRepository.findRelacionados).toHaveBeenCalledWith('cafe-organico-kuski-250g', {
      limit: 4,
    });
  });

  it('responde 404 si el producto no existe y 400 con un limit fuera de rango', async () => {
    productoRepository.findRelacionados.mockResolvedValue(null);

    const noExiste = await request(app).get('/api/v1/productos/no-existe/relacionados');
    const invalido = await request(app).get('/api/v1/productos/x/relacionados?limit=50');

    expect(noExiste.status).toBe(404);
    expect(noExiste.body.error.code).toBe('PRODUCTO_NO_ENCONTRADO');
    expect(invalido.status).toBe(400);
  });
});

describe('rutas inexistentes', () => {
  it('responde 404 NOT_FOUND (el mock antiguo /api/productos ya no existe)', async () => {
    const res = await request(app).get('/api/productos');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
