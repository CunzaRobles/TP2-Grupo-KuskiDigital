import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cookieRol, registrarCuentas } from './helpers/admin.js';

const productoRepository = await import('../src/repositories/producto.repository.js');
const inventarioRepository = await import('../src/repositories/inventario.repository.js');
const { withTransaction } = await import('../src/repositories/transaction.repository.js');
const { default: app } = await import('../src/app.js');

const TX = { tx: 'mock' };
const logistica = cookieRol('admin_logistica');
const producto = { id: 1, sku: 'CAF-001', nombre: 'Café Orgánico', stock: 10, stockMinimo: 5 };

const mover = (body) =>
  request(app).post('/api/v1/admin/inventario/movimientos').set('Cookie', logistica).send(body);

beforeEach(() => {
  registrarCuentas();
  productoRepository.findParaMovimiento.mockResolvedValue(producto);
  inventarioRepository.createMovimiento.mockImplementation(async (datos) => ({
    id: 99,
    ...datos,
    creadoEn: '2026-09-30T12:00:00.000Z',
  }));
});

describe('POST /api/v1/admin/inventario/movimientos', () => {
  it('entrada: suma stock y registra el kardex con el admin, en una transacción', async () => {
    const res = await mover({ productoId: 1, tipo: 'entrada', cantidad: 24, motivo: 'Cosecha' });

    expect(res.status).toBe(201);
    expect(withTransaction).toHaveBeenCalledOnce();
    expect(productoRepository.findParaMovimiento).toHaveBeenCalledWith(1, TX);
    expect(productoRepository.setStock).toHaveBeenCalledWith(1, 34, TX);
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledWith(
      {
        productoId: 1,
        tipo: 'entrada',
        cantidad: 24,
        stockResultante: 34,
        motivo: 'Cosecha',
        usuarioId: 3,
      },
      TX,
    );
    expect(res.body.data.producto).toEqual({ id: 1, stock: 34, stockMinimo: 5, stockBajo: false });
  });

  it('salida: resta stock (cantidad negativa en el kardex)', async () => {
    const res = await mover({ productoId: 1, tipo: 'salida', cantidad: 6 });

    expect(res.status).toBe(201);
    expect(productoRepository.setStock).toHaveBeenCalledWith(1, 4, TX);
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad: -6, stockResultante: 4, motivo: 'Salida manual' }),
      TX,
    );
    expect(res.body.data.producto.stockBajo).toBe(true);
  });

  it('salida sin stock suficiente: 409 y no toca nada', async () => {
    const res = await mover({ productoId: 1, tipo: 'salida', cantidad: 11 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('STOCK_INSUFICIENTE');
    expect(productoRepository.setStock).not.toHaveBeenCalled();
    expect(inventarioRepository.createMovimiento).not.toHaveBeenCalled();
  });

  it('ajuste (edición en línea): recibe el stock contado y guarda la diferencia', async () => {
    const res = await mover({ productoId: 1, tipo: 'ajuste', stockNuevo: 7 });

    expect(res.status).toBe(201);
    expect(productoRepository.setStock).toHaveBeenCalledWith(1, 7, TX);
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'ajuste', cantidad: -3, stockResultante: 7 }),
      TX,
    );
  });

  it('ajuste al mismo stock: 422 SIN_CAMBIOS', async () => {
    const res = await mover({ productoId: 1, tipo: 'ajuste', stockNuevo: 10 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('SIN_CAMBIOS');
  });

  it('producto inexistente: 404', async () => {
    productoRepository.findParaMovimiento.mockResolvedValue(null);
    const res = await mover({ productoId: 99, tipo: 'entrada', cantidad: 1 });
    expect(res.status).toBe(404);
  });

  it.each([
    [{ productoId: 1, tipo: 'entrada', cantidad: 0 }],
    [{ productoId: 1, tipo: 'ajuste', stockNuevo: -1 }],
    [{ productoId: 1, tipo: 'ajuste', cantidad: 5 }],
    [{ productoId: 1, tipo: 'regalo', cantidad: 5 }],
  ])('valida el cuerpo %o', async (body) => {
    const res = await mover(body);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/admin/inventario/:id/movimientos', () => {
  it('devuelve el historial kardex paginado con el admin y el pedido', async () => {
    productoRepository.findAdminById.mockResolvedValue(producto);
    inventarioRepository.findMovimientos.mockResolvedValue({
      rows: [
        {
          id: 2,
          tipo: 'salida',
          cantidad: -1,
          stockResultante: 9,
          motivo: 'Venta KD-000004',
          creadoEn: '2026-09-30T10:00:00.000Z',
          usuario: null,
          pedido: { id: 4, codigo: 'KD-000004' },
        },
        {
          id: 1,
          tipo: 'entrada',
          cantidad: 10,
          stockResultante: 10,
          motivo: 'Stock inicial',
          creadoEn: '2026-09-29T10:00:00.000Z',
          usuario: { id: 1, nombre: 'Rosa', apellido: 'Huamán' },
          pedido: null,
        },
      ],
      count: 2,
    });

    const res = await request(app)
      .get('/api/v1/admin/inventario/1/movimientos')
      .set('Cookie', logistica);

    expect(res.status).toBe(200);
    expect(inventarioRepository.findMovimientos).toHaveBeenCalledWith(1, { limit: 20, offset: 0 });
    expect(res.body.data.producto).toMatchObject({ id: 1, stock: 10 });
    expect(res.body.data.items[0]).toMatchObject({ pedidoCodigo: 'KD-000004', usuario: null });
    expect(res.body.data.items[1].usuario).toEqual({ id: 1, nombre: 'Rosa Huamán' });
  });
});

describe('GET /api/v1/admin/inventario', () => {
  it('lista por stock ascendente y filtra el stock bajo', async () => {
    productoRepository.findAdmin.mockResolvedValue({
      rows: [{ ...producto, stock: 3, precioBasePen: '35.00', imagenes: [] }],
      count: 1,
    });

    const res = await request(app)
      .get('/api/v1/admin/inventario?stock_bajo=true&activo=true')
      .set('Cookie', logistica);

    expect(res.status).toBe(200);
    expect(productoRepository.findAdmin).toHaveBeenCalledWith(
      { orden: 'stock_asc', stockBajo: true, activo: true },
      { limit: 20, offset: 0 },
    );
    expect(res.body.data.items[0]).toMatchObject({ stock: 3, stockBajo: true, precioBasePen: 35 });
  });
});
