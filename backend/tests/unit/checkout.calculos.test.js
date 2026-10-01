import { describe, expect, it } from 'vitest';
import { calcularIGV, calcularTotales } from '../../src/utils/checkout-calculos.js';

describe('calcularIGV', () => {
  it('UT-01: calcula IGV del 18% para Perú', () => {
    // Arrange
    const baseImponiblePen = 100.0;
    // Act
    const igv = calcularIGV(baseImponiblePen, 'PE');
    // Assert
    expect(igv).toBe(18.0);
  });

  it('UT-02: no cobra IGV a un envío a Alemania', () => {
    // Arrange
    const baseImponiblePen = 100.0;
    // Act
    const igv = calcularIGV(baseImponiblePen, 'DE');
    // Assert
    expect(igv).toBe(0);
  });
});

describe('calcularTotales', () => {
  it('UT-07: suma subtotal y envío sin IGV para Alemania (total 458.00)', () => {
    // Arrange
    const subtotalPen = 255.0;
    const envioPen = 203.0;
    // Act
    const totales = calcularTotales(subtotalPen, envioPen, 'DE');
    // Assert
    expect(totales.igvPen).toBe(0);
    expect(totales.totalPen).toBe(458.0);
  });
});
