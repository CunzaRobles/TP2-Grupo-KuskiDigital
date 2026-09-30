import request from 'supertest';
import { describe, expect, it } from 'vitest';

const catalogoRepository = await import('../src/repositories/catalogo.repository.js');
const { PAISES_EXPORTACION_HISTORICOS } = await import('../src/services/catalogo.service.js');
const { default: app } = await import('../src/app.js');

describe('GET /api/v1/categorias', () => {
  it('lista las categorías con su número de productos', async () => {
    const categorias = [{ id: 1, nombre: 'Café', slug: 'cafe', orden: 1, totalProductos: 11 }];
    catalogoRepository.findCategorias.mockResolvedValue(categorias);

    const res = await request(app).get('/api/v1/categorias');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: categorias });
  });
});

describe('GET /api/v1/comunidades', () => {
  it('devuelve las coordenadas como números para el mapa', async () => {
    catalogoRepository.findComunidades.mockResolvedValue([
      {
        id: 1,
        nombre: 'Comunidad Cafetalera de Quillabamba',
        altitudMsnm: 1050,
        latitud: '-12.863000',
        longitud: '-72.693000',
        totalProductos: 6,
      },
    ]);

    const res = await request(app).get('/api/v1/comunidades');

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ latitud: -12.863, longitud: -72.693 });
  });
});

describe('GET /api/v1/certificaciones', () => {
  it('lista las certificaciones (para el filtro del catálogo)', async () => {
    catalogoRepository.findCertificaciones.mockResolvedValue([{ id: 1, nombre: 'Orgánico' }]);

    const res = await request(app).get('/api/v1/certificaciones');

    expect(res.body.data).toEqual([{ id: 1, nombre: 'Orgánico' }]);
  });
});

describe('GET /api/v1/estadisticas/trazabilidad', () => {
  it('suma a los países históricos los nuevos países con pedidos (sin contar Perú)', async () => {
    catalogoRepository.findTotalesTrazabilidad.mockResolvedValue({
      comunidades: 8,
      familias: 450,
      productos: 44,
      altitudMinima: 1050,
      altitudMaxima: 3760,
      paisesConPedidos: ['PE', 'DE', 'ZA'], // DE ya estaba; ZA es nuevo
    });

    const res = await request(app).get('/api/v1/estadisticas/trazabilidad');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      comunidades: 8,
      familias: 450,
      productos: 44,
      paises: PAISES_EXPORTACION_HISTORICOS.length + 1,
      altitudMinima: 1050,
      altitudMaxima: 3760,
    });
  });
});
