import { describe, expect, it } from 'vitest';
import { formatearCodigo } from '../../src/utils/pedidos.js';

describe('formatearCodigo', () => {
  it('UT-08: genera el código KD-000001 para el pedido 1', () => {
    // Arrange
    const pedidoId = 1;
    // Act
    const codigo = formatearCodigo(pedidoId);
    // Assert
    expect(codigo).toBe('KD-000001');
  });
});
