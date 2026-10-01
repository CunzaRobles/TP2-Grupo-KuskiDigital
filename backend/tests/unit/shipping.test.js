import { describe, expect, it } from 'vitest';
import { calcularCostoEnvio } from '../../src/adapters/shipping/mock-shipping-provider.js';
import { zonaDePais } from '../../src/adapters/shipping/zonas.js';

describe('zonaDePais', () => {
  it('UT-05: asigna la zona de envío según el país (PE, BR, US, DE, JP)', () => {
    // Arrange
    const esperado = {
      PE: 'nacional',
      BR: 'latam',
      US: 'norteamerica',
      DE: 'europa',
      JP: 'resto_mundo',
    };
    // Act
    const obtenido = Object.fromEntries(Object.keys(esperado).map((p) => [p, zonaDePais(p)]));
    // Assert
    expect(obtenido).toEqual(esperado);
  });
});

describe('calcularCostoEnvio', () => {
  it('UT-06: express a Europa de 550 g cuesta 203.00 (170 + 60/kg)', () => {
    // Arrange: NUMERIC llega como string desde PostgreSQL
    const tarifa = {
      zona: 'europa',
      metodo: 'express',
      costoBasePen: '170.00',
      costoPorKgPen: '60.00',
    };
    // Act
    const costo = calcularCostoEnvio(tarifa, 550);
    // Assert
    expect(costo).toBe(203.0);
  });
});
