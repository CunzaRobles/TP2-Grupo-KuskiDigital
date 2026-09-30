import { vi } from 'vitest';

// Simula TODA la capa de repositorios en las pruebas unitarias: así cargar la app nunca
// importa los modelos de Sequelize ni necesita DATABASE_URL. Cada prueba importa el
// repositorio que necesita y configura sus respuestas (mockReset las limpia entre pruebas).

vi.mock('../../src/repositories/health.repository.js', () => ({ ping: vi.fn() }));

// La transacción ejecuta el callback con un `tx` ficticio.
vi.mock('../../src/repositories/transaction.repository.js', () => ({
  withTransaction: vi.fn((fn) => fn({ tx: 'mock' })),
}));

vi.mock('../../src/repositories/usuario.repository.js', () => ({
  findByCorreoConPassword: vi.fn(),
  existsByCorreo: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findAdmin: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../../src/repositories/direccion.repository.js', () => ({
  findByIdAndUsuario: vi.fn(),
  findByUsuario: vi.fn(),
  countByUsuario: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  desmarcarPrincipal: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../src/repositories/producto.repository.js', () => ({
  findCatalogo: vi.fn(),
  findDestacados: vi.fn(),
  findBySlug: vi.fn(),
  findRelacionados: vi.fn(),
  findParaCarrito: vi.fn(),
  findResenas: vi.fn(),
  findDistribucionResenas: vi.fn(),
  findParaVenta: vi.fn(),
  findByIds: vi.fn(),
  descontarStock: vi.fn(),
  incrementarStock: vi.fn(),
  findAdmin: vi.fn(),
  findAdminById: vi.fn(),
  findConflictos: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  setCertificaciones: vi.fn(),
  findParaMovimiento: vi.fn(),
  setStock: vi.fn(),
  findImagenes: vi.fn(),
  createImagen: vi.fn(),
  updateImagen: vi.fn(),
  deleteImagen: vi.fn(),
  desmarcarImagenPrincipal: vi.fn(),
}));

vi.mock('../../src/repositories/catalogo.repository.js', () => ({
  findCategorias: vi.fn(),
  findComunidades: vi.fn(),
  findCertificaciones: vi.fn(),
  findTotalesTrazabilidad: vi.fn(),
  findReferencias: vi.fn(),
}));

vi.mock('../../src/repositories/carrito.repository.js', () => ({
  findOrCreateIdByUsuario: vi.fn(),
  findItems: vi.fn(),
  findItemById: vi.fn(),
  findItemByProducto: vi.fn(),
  createItem: vi.fn(),
  updateCantidad: vi.fn(),
  deleteItem: vi.fn(),
  vaciar: vi.fn(),
}));

vi.mock('../../src/repositories/pedido.repository.js', () => ({
  create: vi.fn(),
  update: vi.fn(),
  createItems: vi.fn(),
  createEstado: vi.fn(),
  createPago: vi.fn(),
  createEnvio: vi.fn(),
  createMovimientoInventario: vi.fn(),
  findByUsuario: vi.fn(),
  findByCodigo: vi.fn(),
  findAdmin: vi.fn(),
  resumenAdmin: vi.fn(),
  findParaCambioEstado: vi.fn(),
  updatePago: vi.fn(),
  updateEnvio: vi.fn(),
}));

vi.mock('../../src/repositories/inventario.repository.js', () => ({
  createMovimiento: vi.fn(),
  findMovimientos: vi.fn(),
}));

vi.mock('../../src/repositories/categoria.repository.js', () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  findConflictos: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../src/repositories/reporte.repository.js', () => ({
  findKpisMes: vi.fn(),
  findSerieMensual: vi.fn(),
  findSerieDiaria: vi.fn(),
  findPedidosPorEstado: vi.fn(),
  findStockBajo: vi.fn(),
  countStockBajo: vi.fn(),
  findVentasPorPais: vi.fn(),
  findTopProductos: vi.fn(),
}));

// Datos de soporte de la simulación (tipos_cambio y tarifas_envio del seed).
vi.mock('../../src/repositories/tipo-cambio.repository.js', () => {
  const tasas = {
    PEN: { monedaCodigo: 'PEN', simbolo: 'S/', valorEnPen: '1.0000' },
    USD: { monedaCodigo: 'USD', simbolo: '$', valorEnPen: '3.7500' },
    EUR: { monedaCodigo: 'EUR', simbolo: '€', valorEnPen: '4.0500' },
  };
  return {
    findByMoneda: vi.fn(async (moneda) => tasas[moneda] ?? null),
    findAll: vi.fn(async () => Object.values(tasas)),
  };
});

vi.mock('../../src/repositories/tarifa-envio.repository.js', () => {
  // prettier-ignore
  const tarifas = [
    [1, 'nacional', 'estandar', 'Olva Courier', '15.00', '3.00', 3, 5],
    [2, 'nacional', 'express', 'Olva Express', '25.00', '5.00', 1, 2],
    [3, 'latam', 'estandar', 'Serpost', '60.00', '25.00', 12, 18],
    [4, 'latam', 'express', 'DHL Express', '120.00', '45.00', 4, 7],
    [5, 'norteamerica', 'estandar', 'Serpost', '80.00', '30.00', 12, 18],
    [6, 'norteamerica', 'express', 'DHL Express', '150.00', '55.00', 4, 7],
    [7, 'europa', 'estandar', 'Serpost', '90.00', '35.00', 12, 18],
    [8, 'europa', 'express', 'DHL Express', '170.00', '60.00', 4, 7],
    [9, 'resto_mundo', 'estandar', 'Serpost', '110.00', '40.00', 15, 25],
    [10, 'resto_mundo', 'express', 'DHL Express', '200.00', '70.00', 5, 9],
  ].map(([id, zona, metodo, transportista, costoBasePen, costoPorKgPen, diasMin, diasMax]) => ({
    id, zona, metodo, transportista, costoBasePen, costoPorKgPen, diasMin, diasMax,
  }));
  return {
    findByZona: vi.fn(async (zona) => tarifas.filter((t) => t.zona === zona)),
  };
});
