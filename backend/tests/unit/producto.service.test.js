import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieRol, registrarCuentas } from '../helpers/admin.js';

// Repositorios y transacción simulados (tests/setup/mock-repositories.js): sin Supabase.
const productoRepository = await import('../../src/repositories/producto.repository.js');
const catalogoRepository = await import('../../src/repositories/catalogo.repository.js');
const { withTransaction } = await import('../../src/repositories/transaction.repository.js');
const { crearProducto } = await import('../../src/services/admin-producto.service.js');
const { actualizarProductoBody } = await import('../../src/schemas/admin.schema.js');
const { default: app } = await import('../../src/app.js');

const ADMIN = { id: 1, rol: 'admin_gerente' };
let nuevo;

beforeEach(() => {
  vi.clearAllMocks();
  registrarCuentas();
  nuevo = {
    sku: 'CAF-001',
    nombre: 'Café Geisha de Quillabamba',
    precioBasePen: 89.9,
    stockMinimo: 5,
    pesoG: 250,
    destacado: false,
    activo: true,
    categoriaId: 1,
    comunidadId: 1,
    certificacionIds: [],
    stockInicial: 10,
  };
  catalogoRepository.findReferencias.mockResolvedValue({
    categoria: { id: 1 },
    comunidad: { id: 1 },
    certificacionIds: [],
  });
});

describe('ProductoService (admin-producto.service)', () => {
  it('UT-17: crear con SKU existente → error SKU_EN_USO', async () => {
    productoRepository.findConflictos.mockResolvedValue({ sku: true, slug: false });

    await expect(crearProducto(ADMIN, nuevo)).rejects.toMatchObject({
      status: 409,
      code: 'SKU_EN_USO',
    });
    expect(productoRepository.findConflictos).toHaveBeenCalledWith(
      { sku: 'CAF-001', slug: 'cafe-geisha-de-quillabamba' },
      undefined,
    );
    expect(withTransaction).not.toHaveBeenCalled();
    expect(productoRepository.create).not.toHaveBeenCalled();
  });

  it('UT-18: actualizar con stock -5 → error de validación y no guarda', async () => {
    // El stock no se edita en la ficha (solo con movimientos de inventario): el esquema lo rechaza
    expect(actualizarProductoBody.safeParse({ stock: -5 }).success).toBe(false);

    const res = await request(app)
      .put('/api/v1/admin/productos/50')
      .set('Cookie', cookieRol('admin_gerente'))
      .send({ stock: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(productoRepository.findAdminById).not.toHaveBeenCalled();
    expect(productoRepository.update).not.toHaveBeenCalled();
    expect(withTransaction).not.toHaveBeenCalled();
  });
});
