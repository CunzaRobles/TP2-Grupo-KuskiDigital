import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cookieRol, registrarCuentas } from './helpers/admin.js';

const reporteRepository = await import('../src/repositories/reporte.repository.js');
const categoriaRepository = await import('../src/repositories/categoria.repository.js');
const usuarioRepository = await import('../src/repositories/usuario.repository.js');
const productoRepository = await import('../src/repositories/producto.repository.js');
const pedidoRepository = await import('../src/repositories/pedido.repository.js');
const { default: app } = await import('../src/app.js');

const gerente = cookieRol('admin_gerente');
const ventas = cookieRol('admin_ventas');
const logistica = cookieRol('admin_logistica');

beforeEach(() => registrarCuentas());

describe('GET /api/v1/admin/dashboard', () => {
  it('KPIs del mes con variación, sparklines, serie mensual y stock bajo', async () => {
    reporteRepository.findKpisMes.mockResolvedValue({
      ingresosPen: '1500.00',
      pedidos: 10,
      ingresosPenAnterior: '1000.00',
      pedidosAnterior: 8,
    });
    reporteRepository.findSerieMensual.mockResolvedValue([
      { mes: '2026-08', ingresosPen: '1000.00', pedidos: 8 },
      { mes: '2026-09', ingresosPen: '1500.00', pedidos: 10 },
    ]);
    reporteRepository.findSerieDiaria.mockResolvedValue([
      { dia: '2026-09-29', ingresosPen: '0', pedidos: 0 },
      { dia: '2026-09-30', ingresosPen: '300.00', pedidos: 2 },
    ]);
    reporteRepository.findPedidosPorEstado.mockResolvedValue([{ estado: 'pagado', total: 3 }]);
    reporteRepository.findStockBajo.mockResolvedValue([{ id: 35, nombre: 'Retablo', stock: 4 }]);
    reporteRepository.countStockBajo.mockResolvedValue(6);

    const res = await request(app).get('/api/v1/admin/dashboard').set('Cookie', ventas);

    expect(res.status).toBe(200);
    const { kpis, serieMensual, pedidosPorEstado } = res.body.data;
    expect(kpis.ingresosMes).toEqual({ valorPen: 1500, variacionPct: 50, serie: [0, 300] });
    expect(kpis.pedidosMes).toEqual({ valor: 10, variacionPct: 25, serie: [0, 2] });
    expect(kpis.ticketPromedio).toEqual({ valorPen: 150, variacionPct: 20, serie: [0, 150] });
    expect(kpis.stockBajo.valor).toBe(6);
    expect(serieMensual[1]).toEqual({ mes: '2026-09', ingresosPen: 1500, pedidos: 10 });
    expect(pedidosPorEstado).toMatchObject({ pagado: 3, entregado: 0 });
  });

  it('sin mes anterior no inventa variación', async () => {
    reporteRepository.findKpisMes.mockResolvedValue({
      ingresosPen: '0',
      pedidos: 0,
      ingresosPenAnterior: '0',
      pedidosAnterior: 0,
    });
    for (const fn of [
      'findSerieMensual',
      'findSerieDiaria',
      'findPedidosPorEstado',
      'findStockBajo',
    ])
      reporteRepository[fn].mockResolvedValue([]);
    reporteRepository.countStockBajo.mockResolvedValue(0);

    const res = await request(app).get('/api/v1/admin/dashboard').set('Cookie', gerente);

    expect(res.body.data.kpis.ingresosMes.variacionPct).toBeNull();
    expect(res.body.data.kpis.ticketPromedio.valorPen).toBe(0);
  });
});

describe('GET /api/v1/admin/estadisticas', () => {
  it('ventas por país y top productos con su participación', async () => {
    reporteRepository.findVentasPorPais.mockResolvedValue([
      { pais: 'DE', pedidos: 3, totalPen: '750.00' },
      { pais: 'PE', pedidos: 5, totalPen: '250.00' },
    ]);
    reporteRepository.findTopProductos.mockResolvedValue([
      {
        productoId: 1,
        nombre: 'Café',
        categoria: 'Café',
        imagen: null,
        unidades: 20,
        totalPen: '500.00',
      },
    ]);

    const res = await request(app).get('/api/v1/admin/estadisticas').set('Cookie', ventas);

    expect(res.status).toBe(200);
    expect(reporteRepository.findTopProductos).toHaveBeenCalledWith({ limit: 10 });
    expect(res.body.data.totales).toEqual({
      totalPen: 1000,
      pedidos: 8,
      paises: 2,
      ticketPromedioPen: 125,
    });
    expect(res.body.data.ventasPorPais[0]).toEqual({
      pais: 'DE',
      pedidos: 3,
      totalPen: 750,
      participacionPct: 75,
    });
    expect(res.body.data.topProductos[0]).toMatchObject({ posicion: 1, participacionPct: 50 });
  });
});

describe('Categorías', () => {
  const categoria = { id: 5, nombre: 'Textiles', slug: 'textiles', orden: 3, totalProductos: 0 };

  it('crea con slug automático', async () => {
    categoriaRepository.findConflictos.mockResolvedValue({ nombre: false, slug: false });
    categoriaRepository.create.mockResolvedValue({
      ...categoria,
      id: 6,
      nombre: 'Cerámica Andina',
    });

    const res = await request(app)
      .post('/api/v1/admin/categorias')
      .set('Cookie', gerente)
      .send({ nombre: 'Cerámica Andina' });

    expect(res.status).toBe(201);
    expect(categoriaRepository.create).toHaveBeenCalledWith({
      nombre: 'Cerámica Andina',
      slug: 'ceramica-andina',
      orden: 0,
    });
  });

  it('409 si el nombre ya existe', async () => {
    categoriaRepository.findConflictos.mockResolvedValue({ nombre: true, slug: false });
    const res = await request(app)
      .post('/api/v1/admin/categorias')
      .set('Cookie', gerente)
      .send({ nombre: 'Café' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORIA_DUPLICADA');
  });

  it('no elimina una categoría con productos (409)', async () => {
    categoriaRepository.findById.mockResolvedValue({ ...categoria, totalProductos: 11 });
    const res = await request(app).delete('/api/v1/admin/categorias/5').set('Cookie', gerente);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORIA_CON_PRODUCTOS');
    expect(categoriaRepository.remove).not.toHaveBeenCalled();
  });

  it('elimina una categoría vacía (204)', async () => {
    categoriaRepository.findById.mockResolvedValue(categoria);
    const res = await request(app).delete('/api/v1/admin/categorias/5').set('Cookie', gerente);
    expect(res.status).toBe(204);
    expect(categoriaRepository.remove).toHaveBeenCalledWith(5);
  });
});

describe('Usuarios y roles', () => {
  it('lista con filtros de rol y estado', async () => {
    usuarioRepository.findAdmin.mockResolvedValue({
      rows: [
        {
          id: 2,
          nombre: 'Luis',
          apellido: 'Mamani',
          rol: 'admin_ventas',
          activo: true,
          totalPedidos: 0,
        },
      ],
      count: 1,
    });

    const res = await request(app)
      .get('/api/v1/admin/usuarios?rol=admin_ventas,admin_logistica&activo=true&q=kuski')
      .set('Cookie', gerente);

    expect(res.status).toBe(200);
    expect(usuarioRepository.findAdmin).toHaveBeenCalledWith(
      { q: 'kuski', roles: ['admin_ventas', 'admin_logistica'], activo: true },
      { limit: 20, offset: 0 },
    );
    expect(res.body.data.items[0]).not.toHaveProperty('passwordHash');
  });

  it('crea una cuenta del equipo con contraseña cifrada', async () => {
    usuarioRepository.existsByCorreo.mockResolvedValue(false);
    usuarioRepository.create.mockImplementation(async (datos) => ({
      id: 20,
      activo: true,
      ...datos,
    }));

    const res = await request(app).post('/api/v1/admin/usuarios').set('Cookie', gerente).send({
      nombre: 'Pedro',
      apellido: 'Ccahua',
      correo: 'Pedro@Kuski.pe',
      password: 'Almacen2026',
      rol: 'admin_logistica',
    });

    expect(res.status).toBe(201);
    const datos = usuarioRepository.create.mock.calls[0][0];
    expect(datos).toMatchObject({ correo: 'pedro@kuski.pe', rol: 'admin_logistica' });
    expect(datos.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('cambia el rol de otro usuario', async () => {
    usuarioRepository.update.mockResolvedValue({ id: 2, rol: 'admin_logistica', activo: true });

    const res = await request(app)
      .patch('/api/v1/admin/usuarios/2')
      .set('Cookie', gerente)
      .send({ rol: 'admin_logistica' });

    expect(res.status).toBe(200);
    expect(usuarioRepository.update).toHaveBeenCalledWith(2, { rol: 'admin_logistica' });
  });

  it.each([[{ rol: 'admin_ventas' }], [{ activo: false }]])(
    'un gerente no puede cambiarse a sí mismo %o (422)',
    async (cambio) => {
      const res = await request(app)
        .patch('/api/v1/admin/usuarios/1')
        .set('Cookie', gerente)
        .send(cambio);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('ACCION_SOBRE_SI_MISMO');
      expect(usuarioRepository.update).not.toHaveBeenCalled();
    },
  );
});

describe('GET /api/v1/admin/buscar', () => {
  beforeEach(() => {
    productoRepository.findAdmin.mockResolvedValue({
      rows: [{ id: 1, sku: 'CAF-001', nombre: 'Café', stock: 3, activo: true }],
      count: 1,
    });
    pedidoRepository.findAdmin.mockResolvedValue({
      rows: [{ codigo: 'KD-000001', estado: 'pagado', envioDestinatario: 'María', totalPen: '10' }],
      count: 1,
    });
    usuarioRepository.findAdmin.mockResolvedValue({
      rows: [{ id: 4, nombre: 'María', apellido: 'Quispe', correo: 'm@x.pe', rol: 'cliente' }],
      count: 1,
    });
  });

  it('el gerente busca en productos, pedidos y usuarios', async () => {
    const res = await request(app).get('/api/v1/admin/buscar?q=ma').set('Cookie', gerente);
    expect(res.status).toBe(200);
    expect(res.body.data.productos).toHaveLength(1);
    expect(res.body.data.pedidos[0]).toEqual({
      codigo: 'KD-000001',
      estado: 'pagado',
      destinatario: 'María',
      totalPen: 10,
    });
    expect(res.body.data.usuarios).toHaveLength(1);
  });

  it('solo devuelve lo que el rol puede ver', async () => {
    const resVentas = await request(app).get('/api/v1/admin/buscar?q=ma').set('Cookie', ventas);
    expect(resVentas.body.data.productos).toEqual([]);
    expect(resVentas.body.data.usuarios).toEqual([]);
    expect(resVentas.body.data.pedidos).toHaveLength(1);

    const resLogistica = await request(app)
      .get('/api/v1/admin/buscar?q=ma')
      .set('Cookie', logistica);
    expect(resLogistica.body.data.productos).toHaveLength(1);
    expect(resLogistica.body.data.usuarios).toEqual([]);
  });

  it('exige al menos 2 caracteres', async () => {
    const res = await request(app).get('/api/v1/admin/buscar?q=a').set('Cookie', gerente);
    expect(res.status).toBe(400);
  });
});
