import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

// Intl usa espacios duros (U+00A0 / U+202F): se normalizan para comparar.
const plano = (texto) => texto.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('UT-10: formatea 1234.5 PEN como "S/ 1,234.50" y EUR con € y 2 decimales', () => {
    // Arrange
    const monto = 1234.5;
    // Act
    const enSoles = plano(formatMoney(monto, 'PEN', 'es'));
    const enEuros = plano(formatMoney(monto, 'EUR', 'es'));
    // Assert
    expect(enSoles).toBe('S/ 1,234.50');
    expect(enEuros).toContain('€');
    expect(enEuros).toMatch(/1,?234\.50/);
  });
});
