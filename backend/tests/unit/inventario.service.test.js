import { beforeEach, describe, expect, it, vi } from 'vitest';

// Repositorios y transacción simulados (tests/setup/mock-repositories.js): sin Supabase.
const productoRepository = await import('../../src/repositories/producto.repository.js');
const inventarioRepository = await import('../../src/repositories/inventario.repository.js');
const { registrarMovimiento } = await import('../../src/services/admin-inventario.service.js');

const ADMIN = { id: 3, rol: 'admin_logistica' };
let producto;

beforeEach(() => {
  vi.clearAllMocks();
  producto = { id: 26, nombre: 'Poncho Chinchero de Alpaca', stock: 4, stockMinimo: 2 };
  productoRepository.findParaMovimiento.mockResolvedValue(producto);
});

describe('InventarioService.registrarMovimiento (admin-inventario.service)', () => {
  it('UT-19: salida de 10 con stock 4 → STOCK_INSUFICIENTE y stock sin cambios', async () => {
    await expect(
      registrarMovimiento(ADMIN, { productoId: 26, tipo: 'salida', cantidad: 10 }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'STOCK_INSUFICIENTE',
      details: { productoId: 26, stock: 4, solicitado: 10 },
    });
    expect(productoRepository.setStock).not.toHaveBeenCalled();
    expect(inventarioRepository.createMovimiento).not.toHaveBeenCalled();
    expect(producto.stock).toBe(4);
  });
});
