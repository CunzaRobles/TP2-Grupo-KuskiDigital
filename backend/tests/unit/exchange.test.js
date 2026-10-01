import { describe, expect, it } from 'vitest';
import { TablaExchangeRateProvider } from '../../src/adapters/exchange/tabla-exchange-rate-provider.js';
import { convertirDesdePen } from '../../src/utils/money.js';

// Tabla fija en memoria (sin base de datos): 1 unidad de la moneda = valorEnPen soles.
const TABLA = {
  PEN: { monedaCodigo: 'PEN', simbolo: 'S/', valorEnPen: '1.0000' },
  USD: { monedaCodigo: 'USD', simbolo: '$', valorEnPen: '3.7500' },
};
const proveedor = new TablaExchangeRateProvider({
  buscarPorMoneda: async (moneda) => TABLA[moneda] ?? null,
  listar: async () => Object.values(TABLA),
});

describe('conversión de moneda (convertirDesdePen + tipo de cambio)', () => {
  it('UT-03: convierte 100.00 PEN a USD con 1 USD = 3.75 PEN (26.67)', async () => {
    // Arrange
    const { valorEnPen } = await proveedor.obtenerTasa('USD');
    // Act
    const monto = convertirDesdePen(100.0, valorEnPen);
    // Assert
    expect(valorEnPen).toBe(3.75);
    expect(monto).toBe(26.67);
  });

  it('UT-04: convertir 100.00 PEN a PEN devuelve el mismo monto', async () => {
    // Arrange
    const { valorEnPen } = await proveedor.obtenerTasa('PEN');
    // Act
    const monto = convertirDesdePen(100.0, valorEnPen);
    // Assert
    expect(monto).toBe(100.0);
  });
});
