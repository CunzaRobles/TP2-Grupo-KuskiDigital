import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Integración de las capas HTTP (rutas → controlador → servicio) con el repositorio simulado
// (tests/setup/mock-repositories.js): no se conecta a Supabase ni modifica datos.
const productoRepository = await import('../../src/repositories/producto.repository.js');
const { default: app } = await import('../../src/app.js');

const producto = (id, nombre, precioBasePen) => ({
  id,
  sku: `CAF-00${id}`,
  nombre,
  slug: `producto-${id}`,
  descripcion: 'Producto de una comunidad de Cusco.',
  precioBasePen,
  stock: 10,
  stockMinimo: 5,
  pesoG: 250,
  destacado: false,
  calificacionPromedio: null,
  totalResenas: 0,
  categoria: { id: 1, nombre: 'Café', slug: 'cafe' },
  comunidad: { id: 1, nombre: 'Comunidad Cafetalera de Quillabamba', altitudMsnm: 1050 },
  imagenes: [],
  certificaciones: [],
});

let productos;

beforeEach(() => {
  vi.clearAllMocks();
  productos = [
    producto(1, 'Café Orgánico Kuski 250 g', '35.00'),
    producto(2, 'Café Geisha de Quillabamba', '89.90'),
    producto(3, 'Café Tostado Medio 500 g', '58.00'),
  ];
  productoRepository.findCatalogo.mockResolvedValue({ rows: productos, count: 3 });
});

describe('GET /api/v1/productos', () => {
  it('UT-22: con repositorio simulado de 3 productos → 200 y { data } con 3 elementos', async () => {
    const res = await request(app).get('/api/v1/productos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.items.map((p) => p.nombre)).toEqual(productos.map((p) => p.nombre));
    expect(res.body.data.pagination).toMatchObject({ total: 3, totalPages: 1 });
    expect(productoRepository.findCatalogo).toHaveBeenCalledOnce();
  });
});
